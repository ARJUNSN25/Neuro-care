import crypto from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'

type SmsProviderName = 'fast2sms' | 'twilio' | 'msg91' | 'webhook' | 'none'

interface ServerOtpChallenge {
  digest: string
  salt: string
  expiresAt: number
  attemptsLeft: number
  resendAvailableAt: number
}

const OTP_TTL_MS = 5 * 60 * 1000
const OTP_RESEND_COOLDOWN_MS = 30 * 1000
const MAX_OTP_ATTEMPTS = 5
const MAX_BODY_BYTES = 8 * 1024

const serverOtpStore = new Map<string, ServerOtpChallenge>()

function detectSmsProvider(env: Record<string, string>): SmsProviderName {
  if (env.FAST2SMS_API_KEY?.trim()) return 'fast2sms'
  if (
    env.TWILIO_ACCOUNT_SID?.trim() &&
    env.TWILIO_AUTH_TOKEN?.trim() &&
    (env.TWILIO_FROM_NUMBER?.trim() || env.TWILIO_MESSAGING_SERVICE_SID?.trim())
  ) {
    return 'twilio'
  }
  if (env.MSG91_AUTH_KEY?.trim() && env.MSG91_TEMPLATE_ID?.trim()) return 'msg91'
  if (env.OTP_SMS_WEBHOOK_URL?.trim()) return 'webhook'
  return 'none'
}

function normalizeE164(rawPhone: string): string {
  const compact = rawPhone.replace(/[^\d+]/g, '')
  if (compact.startsWith('+')) {
    return `+${compact.slice(1).replace(/\D/g, '')}`
  }
  const digits = compact.replace(/\D/g, '')
  return digits ? `+${digits}` : ''
}

function maskPhone(rawOrE164: string): string {
  const trimmed = rawOrE164.trim()
  const spaceIdx = trimmed.indexOf(' ')
  if (spaceIdx > 0) {
    const dial = trimmed.slice(0, spaceIdx)
    const restDigits = trimmed.slice(spaceIdx + 1).replace(/\D/g, '')
    if (restDigits.length >= 4) {
      return `${dial} •••••${restDigits.slice(-4)}`
    }
  }
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 4) return trimmed
  if (trimmed.startsWith('+91') && digits.length === 12) {
    return `+91 •••••${digits.slice(-4)}`
  }
  if (trimmed.startsWith('+971') && digits.length === 12) {
    return `+971 •••••${digits.slice(-4)}`
  }
  if (trimmed.startsWith('+1') && digits.length === 11) {
    return `+1 •••••${digits.slice(-4)}`
  }
  if (trimmed.startsWith('+44') && digits.length >= 12) {
    return `+44 •••••${digits.slice(-4)}`
  }
  if (trimmed.startsWith('+65') && digits.length === 10) {
    return `+65 •••••${digits.slice(-4)}`
  }
  return `+ •••••${digits.slice(-4)}`
}

function hashOtp(salt: string, normalizedE164: string, code: string): Buffer {
  return crypto
    .createHash('sha256')
    .update(`nc-otp-server::${salt}::${normalizedE164}::${code}`)
    .digest()
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buf.length
    if (total > MAX_BODY_BYTES) {
      throw new Error('Request payload too large')
    }
    chunks.push(buf)
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) return {}
  const parsed = JSON.parse(raw) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid JSON object')
  }
  return parsed as Record<string, unknown>
}

async function dispatchRealSms(
  provider: Exclude<SmsProviderName, 'none'>,
  env: Record<string, string>,
  e164: string,
  otp: string,
  lang: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const message = `Your NeuroCare verification OTP is ${otp}. Valid for 5 minutes. Never share this code with anyone.`
  const e164Digits = e164.replace(/\D/g, '')

  try {
    if (provider === 'fast2sms') {
      const apiKey = env.FAST2SMS_API_KEY.trim()
      const route = (env.FAST2SMS_ROUTE || 'q').trim()
      const nationalIndia =
        e164.startsWith('+91') && e164Digits.length === 12
          ? e164Digits.slice(2)
          : e164Digits

      const bodyPayload: Record<string, string> =
        route === 'otp'
          ? {
              route: 'otp',
              variables_values: otp,
              numbers: nationalIndia,
            }
          : {
              route,
              message,
              language: 'english',
              numbers: nationalIndia,
            }

      if (env.FAST2SMS_SENDER_ID?.trim()) {
        bodyPayload.sender_id = env.FAST2SMS_SENDER_ID.trim()
      }

      const resp = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      })
      const json = (await resp.json().catch(() => ({}))) as {
        return?: boolean
        message?: string | string[]
      }
      if (!resp.ok || json.return === false) {
        const msg = Array.isArray(json.message)
          ? json.message.join(', ')
          : json.message || `Fast2SMS HTTP ${resp.status}`
        return { ok: false, error: msg }
      }
      return { ok: true }
    }

    if (provider === 'twilio') {
      const sid = env.TWILIO_ACCOUNT_SID.trim()
      const token = env.TWILIO_AUTH_TOKEN.trim()
      const params = new URLSearchParams({
        To: e164,
        Body: message,
      })
      if (env.TWILIO_MESSAGING_SERVICE_SID?.trim()) {
        params.set('MessagingServiceSid', env.TWILIO_MESSAGING_SERVICE_SID.trim())
      } else {
        params.set('From', env.TWILIO_FROM_NUMBER.trim())
      }
      const basic = Buffer.from(`${sid}:${token}`).toString('base64')
      const resp = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      )
      const json = (await resp.json().catch(() => ({}))) as { message?: string }
      if (!resp.ok) {
        return { ok: false, error: json.message || `Twilio HTTP ${resp.status}` }
      }
      return { ok: true }
    }

    if (provider === 'msg91') {
      const authKey = env.MSG91_AUTH_KEY.trim()
      const templateId = env.MSG91_TEMPLATE_ID.trim()
      const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(
        templateId
      )}&mobile=${encodeURIComponent(e164Digits)}&otp=${encodeURIComponent(otp)}`
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ OTP: otp }),
      })
      const json = (await resp.json().catch(() => ({}))) as { type?: string; message?: string }
      if (!resp.ok || json.type === 'error') {
        return { ok: false, error: json.message || `MSG91 HTTP ${resp.status}` }
      }
      return { ok: true }
    }

    // Custom Webhook
    const webhookUrl = env.OTP_SMS_WEBHOOK_URL.trim()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (env.OTP_SMS_WEBHOOK_SECRET?.trim()) {
      headers['X-Webhook-Secret'] = env.OTP_SMS_WEBHOOK_SECRET.trim()
    }
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        app: 'NeuroCare',
        phone: e164,
        digits: e164Digits,
        otp,
        message,
        lang,
      }),
    })
    if (!resp.ok) {
      return { ok: false, error: `SMS webhook HTTP ${resp.status}` }
    }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'SMS gateway network failure',
    }
  }
}

function attachOtpMiddleware(middlewares: Connect.Server, env: Record<string, string>): void {
  const provider = detectSmsProvider(env)

  middlewares.use('/api/otp', (req, res, next) => {
    const reqPath = (req.url || '/').split('?')[0]

    if (req.method === 'GET' && reqPath === '/status') {
      sendJson(res, 200, {
        ok: true,
        configured: provider !== 'none',
        provider,
      })
      return
    }

    if (req.method === 'POST' && reqPath === '/send') {
      void (async () => {
        try {
          const body = await readJsonBody(req)
          const rawPhone = typeof body.phone === 'string' ? body.phone : ''
          const lang = typeof body.lang === 'string' ? body.lang : 'en'
          const e164 = normalizeE164(rawPhone)
          const digitsOnly = e164.replace(/\D/g, '')

          if (!e164 || digitsOnly.length < 8 || digitsOnly.length > 15) {
            sendJson(res, 400, { ok: false, reason: 'invalid_phone' })
            return
          }

          const now = Date.now()
          const existing = serverOtpStore.get(e164)
          if (existing && existing.resendAvailableAt > now) {
            const retryAfterSec = Math.max(
              1,
              Math.ceil((existing.resendAvailableAt - now) / 1000)
            )
            sendJson(res, 429, {
              ok: false,
              reason: 'cooldown',
              retryAfterSec,
            })
            return
          }

          const code = String(crypto.randomInt(100000, 1000000))
          const salt = crypto.randomBytes(16).toString('hex')
          const digest = hashOtp(salt, e164, code).toString('hex')
          const expiresAt = now + OTP_TTL_MS

          serverOtpStore.set(e164, {
            digest,
            salt,
            expiresAt,
            attemptsLeft: MAX_OTP_ATTEMPTS,
            resendAvailableAt: now + OTP_RESEND_COOLDOWN_MS,
          })

          if (provider !== 'none') {
            const smsRes = await dispatchRealSms(provider, env, e164, code, lang)
            if (!smsRes.ok) {
              serverOtpStore.delete(e164)
              sendJson(res, 502, {
                ok: false,
                reason: 'gateway_error',
                error: smsRes.error,
              })
              return
            }

            sendJson(res, 200, {
              ok: true,
              mode: 'sms-gateway',
              provider,
              e164: rawPhone.trim() || e164,
              maskedPhone: maskPhone(rawPhone.trim() || e164),
              expiresAt,
              resendSeconds: Math.round(OTP_RESEND_COOLDOWN_MS / 1000),
            })
            return
          }

          // No SMS provider configured: return transparent local-preview code
          sendJson(res, 200, {
            ok: true,
            mode: 'local-preview',
            provider: 'none',
            e164: rawPhone.trim() || e164,
            maskedPhone: maskPhone(rawPhone.trim() || e164),
            expiresAt,
            resendSeconds: Math.round(OTP_RESEND_COOLDOWN_MS / 1000),
            demoSmsCode: code,
          })
        } catch (err) {
          sendJson(res, 400, {
            ok: false,
            reason: 'bad_request',
            error: err instanceof Error ? err.message : 'Invalid request',
          })
        }
      })()
      return
    }

    if (req.method === 'POST' && reqPath === '/verify') {
      void (async () => {
        try {
          const body = await readJsonBody(req)
          const rawPhone = typeof body.phone === 'string' ? body.phone : ''
          const rawCode = typeof body.code === 'string' ? body.code : ''
          const e164 = normalizeE164(rawPhone)
          const cleanCode = rawCode.replace(/\D/g, '').trim()

          const challenge = serverOtpStore.get(e164)
          if (!challenge) {
            sendJson(res, 200, { ok: false, reason: 'missing' })
            return
          }

          if (Date.now() > challenge.expiresAt) {
            serverOtpStore.delete(e164)
            sendJson(res, 200, { ok: false, reason: 'expired' })
            return
          }

          if (challenge.attemptsLeft <= 0) {
            sendJson(res, 200, { ok: false, reason: 'locked', attemptsRemaining: 0 })
            return
          }

          const candidateBuf = hashOtp(challenge.salt, e164, cleanCode)
          const expectedBuf = Buffer.from(challenge.digest, 'hex')

          if (
            cleanCode.length === 6 &&
            candidateBuf.length === expectedBuf.length &&
            crypto.timingSafeEqual(candidateBuf, expectedBuf)
          ) {
            serverOtpStore.delete(e164)
            sendJson(res, 200, { ok: true })
            return
          }

          const nextAttempts = Math.max(0, challenge.attemptsLeft - 1)
          challenge.attemptsLeft = nextAttempts
          sendJson(res, 200, {
            ok: false,
            reason: nextAttempts === 0 ? 'locked' : 'invalid',
            attemptsRemaining: nextAttempts,
          })
        } catch (err) {
          sendJson(res, 400, {
            ok: false,
            reason: 'bad_request',
            error: err instanceof Error ? err.message : 'Invalid request',
          })
        }
      })()
      return
    }

    next()
  })
}

export function otpSmsVitePlugin(env: Record<string, string>): Plugin {
  return {
    name: 'neurocare-otp-sms-gateway',
    configureServer(server) {
      attachOtpMiddleware(server.middlewares, env)
    },
    configurePreviewServer(server) {
      attachOtpMiddleware(server.middlewares, env)
    },
  }
}

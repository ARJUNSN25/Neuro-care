import { sha256Hex } from '@/services/adminAuth'

export interface DialCodeOption {
  code: string
  label: string
}

export const COUNTRY_DIAL_CODES: DialCodeOption[] = [
  { code: '+91', label: 'India (+91)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+1', label: 'US / Canada (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+65', label: 'Singapore (+65)' },
]

export interface NormalizedPhone {
  e164: string
  masked: string
  digitsOnly: string
  isValid: boolean
}

export function normalizePhoneNumber(
  dialCode: string,
  rawDigits: string
): NormalizedPhone {
  const digitsOnly = rawDigits.replace(/\D/g, '')
  const cleanDial = dialCode.startsWith('+') ? dialCode : `+${dialCode}`
  const isValid = digitsOnly.length >= 8 && digitsOnly.length <= 15
  const tail = digitsOnly.slice(-4)
  return {
    e164: `${cleanDial} ${digitsOnly}`.trim(),
    masked: digitsOnly.length >= 4 ? `${cleanDial} •••••${tail}` : cleanDial,
    digitsOnly,
    isValid,
  }
}

interface OtpChallengeRecord {
  digest: string
  salt: string
  expiresAt: number
  attemptsLeft: number
  resendAvailableAt: number
}

const activeOtpChallenges = new Map<string, OtpChallengeRecord>()
const challengeSourceMap = new Map<string, 'server' | 'local'>()

const OTP_TTL_MS = 5 * 60 * 1000
const OTP_RESEND_COOLDOWN_MS = 30 * 1000
const MAX_OTP_ATTEMPTS = 5

function generateSecureOtpCode(): string {
  const buf = new Uint32Array(1)
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(buf)
  } else {
    buf[0] = Date.now() >>> 0
  }
  const num = 100000 + (buf[0] % 900000)
  return String(num)
}

function generateSalt(): string {
  const buf = new Uint32Array(2)
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(buf)
  } else {
    buf[0] = Date.now() >>> 0
    buf[1] = 0x9e3779b9
  }
  return `${buf[0].toString(16)}${buf[1].toString(16)}`
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export interface RequestOtpResult {
  ok: boolean
  mode: 'sms-gateway' | 'local-preview'
  provider: string
  e164: string
  maskedPhone: string
  expiresAt: number
  resendSeconds: number
  demoSmsCode?: string
  error?: string
  reason?: 'cooldown' | 'gateway_error' | 'invalid_phone'
  retryAfterSec?: number
}

function requestLocalFallbackOtp(e164Phone: string): RequestOtpResult {
  const normalizedKey = e164Phone.replace(/\s+/g, '')
  const code = generateSecureOtpCode()
  const salt = generateSalt()
  const digest = sha256Hex(`nc-otp::${salt}::${normalizedKey}::${code}`)
  const now = Date.now()
  const expiresAt = now + OTP_TTL_MS

  challengeSourceMap.set(normalizedKey, 'local')
  activeOtpChallenges.set(normalizedKey, {
    digest,
    salt,
    expiresAt,
    attemptsLeft: MAX_OTP_ATTEMPTS,
    resendAvailableAt: now + OTP_RESEND_COOLDOWN_MS,
  })

  const digits = normalizedKey.replace(/\D/g, '')
  const maskedPhone =
    digits.length >= 4
      ? `${normalizedKey.slice(0, normalizedKey.length - digits.length)}•••••${digits.slice(-4)}`
      : e164Phone

  return {
    ok: true,
    mode: 'local-preview',
    provider: 'browser-fallback',
    e164: e164Phone,
    maskedPhone,
    expiresAt,
    resendSeconds: Math.round(OTP_RESEND_COOLDOWN_MS / 1000),
    demoSmsCode: code,
  }
}

export async function requestPhoneOtp(
  e164Phone: string,
  lang = 'en'
): Promise<RequestOtpResult> {
  const normalizedKey = e164Phone.replace(/\s+/g, '')

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const resp = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: e164Phone, lang }),
      signal: controller.signal,
    })
    clearTimeout(timer)

    const ct = resp.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const data = (await resp.json()) as Partial<RequestOtpResult> & {
        error?: string
        reason?: RequestOtpResult['reason']
        retryAfterSec?: number
      }
      if (data.ok) {
        challengeSourceMap.set(normalizedKey, 'server')
        return {
          ok: true,
          mode: data.mode ?? 'local-preview',
          provider: data.provider ?? 'none',
          e164: data.e164 ?? e164Phone,
          maskedPhone: data.maskedPhone ?? e164Phone,
          expiresAt: data.expiresAt ?? Date.now() + OTP_TTL_MS,
          resendSeconds: data.resendSeconds ?? 30,
          demoSmsCode: data.demoSmsCode,
        }
      }
      return {
        ok: false,
        mode: 'sms-gateway',
        provider: 'server',
        e164: e164Phone,
        maskedPhone: '',
        expiresAt: 0,
        resendSeconds: data.retryAfterSec ?? 0,
        error: data.error,
        reason: data.reason,
        retryAfterSec: data.retryAfterSec,
      }
    }
  } catch {
    // Middleware unavailable (e.g., pure static deployment) -> fall back safely below
  }

  return requestLocalFallbackOtp(e164Phone)
}

export type VerifyOtpResult =
  | { ok: true }
  | {
      ok: false
      reason: 'missing' | 'expired' | 'locked' | 'invalid'
      attemptsRemaining?: number
    }

function verifyLocalFallbackOtp(
  normalizedKey: string,
  enteredCode: string
): VerifyOtpResult {
  const record = activeOtpChallenges.get(normalizedKey)
  if (!record) {
    return { ok: false, reason: 'missing' }
  }

  if (Date.now() > record.expiresAt) {
    activeOtpChallenges.delete(normalizedKey)
    return { ok: false, reason: 'expired' }
  }

  if (record.attemptsLeft <= 0) {
    return { ok: false, reason: 'locked', attemptsRemaining: 0 }
  }

  const cleanCode = enteredCode.replace(/\D/g, '').trim()
  const candidateDigest = sha256Hex(
    `nc-otp::${record.salt}::${normalizedKey}::${cleanCode}`
  )

  if (cleanCode.length === 6 && constantTimeEqual(candidateDigest, record.digest)) {
    activeOtpChallenges.delete(normalizedKey)
    return { ok: true }
  }

  const nextAttempts = Math.max(0, record.attemptsLeft - 1)
  record.attemptsLeft = nextAttempts
  return {
    ok: false,
    reason: nextAttempts === 0 ? 'locked' : 'invalid',
    attemptsRemaining: nextAttempts,
  }
}

export async function verifyPhoneOtp(
  e164Phone: string,
  enteredCode: string
): Promise<VerifyOtpResult> {
  const normalizedKey = e164Phone.replace(/\s+/g, '')
  const source = challengeSourceMap.get(normalizedKey)

  if (source !== 'local') {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      const resp = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedKey, code: enteredCode }),
        signal: controller.signal,
      })
      clearTimeout(timer)

      const ct = resp.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const data = (await resp.json()) as VerifyOtpResult
        return data
      }
    } catch {
      // Fall back to local verification if server endpoint unreachable
    }
  }

  return verifyLocalFallbackOtp(normalizedKey, enteredCode)
}

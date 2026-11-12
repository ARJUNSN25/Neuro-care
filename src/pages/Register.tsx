import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Siren,
  User,
  UserPlus,
} from 'lucide-react'
import { EmergencyHelpModal } from '@/components/common/EmergencyHelpModal'
import { NeuroCareLogo } from '@/components/common/NeuroCareLogo'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { LANGUAGE_OPTIONS } from '@/data/translations'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import {
  COUNTRY_DIAL_CODES,
  normalizePhoneNumber,
  requestPhoneOtp,
  verifyPhoneOtp,
} from '@/services/phoneOtp'
import type { AgeRange, LanguageCode } from '@/types/neurocare'
import { cn } from '@/utils/cn'

function formatRemainingMmSs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Register() {
  const { state, register, setLanguage } = useNeuroCare()
  const t = useTranslation()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [ageRange, setAgeRange] = useState<AgeRange>('45-54')
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>(
    state.user.preferredLanguage || 'en'
  )

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Phone + OTP Verification State
  const [dialCode, setDialCode] = useState('+91')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpDeliveryMode, setOtpDeliveryMode] = useState<'sms-gateway' | 'local-preview'>('local-preview')
  const [otpInput, setOtpInput] = useState('')
  const [demoOtpCode, setDemoOtpCode] = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null)
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [verifiedPhoneE164, setVerifiedPhoneE164] = useState('')
  const [otpError, setOtpError] = useState('')
  const [nowMs, setNowMs] = useState(() => Date.now())

  // Optional Trusted / Emergency Care Contact
  const [showEmergencyContact, setShowEmergencyContact] = useState(false)
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')

  const [consentChecked, setConsentChecked] = useState(true)
  const [error, setError] = useState('')
  const [emergencyOpen, setEmergencyOpen] = useState(false)

  useEffect(() => {
    if (!otpSent || phoneVerified) return
    const timer = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)
    return () => window.clearInterval(timer)
  }, [otpSent, phoneVerified])

  const normalizedPhone = useMemo(
    () => normalizePhoneNumber(dialCode, phoneDigits),
    [dialCode, phoneDigits]
  )

  const passwordStrength =
    password.length === 0
      ? 0
      : password.length < 6
        ? 1
        : /[A-Z]/.test(password) && /\d/.test(password) && password.length >= 8
          ? 3
          : 2

  const passwordsMatchState =
    confirmPassword.length === 0
      ? 'idle'
      : password === confirmPassword
        ? 'match'
        : 'mismatch'

  const resendRemainingSec =
    resendAvailableAt && !phoneVerified
      ? Math.max(0, Math.ceil((resendAvailableAt - nowMs) / 1000))
      : 0

  const otpExpiryRemainingMs =
    otpExpiresAt && !phoneVerified ? Math.max(0, otpExpiresAt - nowMs) : 0

  const handleLanguageSelect = (lang: LanguageCode) => {
    setPreferredLanguage(lang)
    setLanguage(lang)
  }

  const resetPhoneVerificationState = () => {
    setPhoneVerified(false)
    setVerifiedPhoneE164('')
    setOtpSent(false)
    setOtpSending(false)
    setOtpVerifying(false)
    setOtpDeliveryMode('local-preview')
    setDemoOtpCode('')
    setMaskedPhone('')
    setOtpInput('')
    setOtpExpiresAt(null)
    setResendAvailableAt(null)
    setOtpError('')
  }

  const handleDialCodeChange = (nextCode: string) => {
    setDialCode(nextCode)
    resetPhoneVerificationState()
  }

  const handlePhoneDigitsChange = (raw: string) => {
    const cleaned = raw.replace(/[^\d\s-]/g, '')
    setPhoneDigits(cleaned)
    resetPhoneVerificationState()
  }

  const handleSendOtp = async () => {
    if (otpSending) return
    setOtpError('')
    setError('')
    if (!normalizedPhone.isValid) {
      setOtpError(t.authErrors.invalidPhone)
      return
    }
    setOtpSending(true)
    try {
      const res = await requestPhoneOtp(normalizedPhone.e164, preferredLanguage)
      if (!res.ok) {
        if (res.reason === 'cooldown' && res.retryAfterSec) {
          setOtpError(`${t.authErrors.otpCooldownPrefix} ${res.retryAfterSec}s`)
        } else {
          setOtpError(res.error || t.authErrors.smsGatewayError)
        }
        return
      }
      const now = Date.now()
      setNowMs(now)
      setOtpSent(true)
      setOtpDeliveryMode(res.mode)
      setPhoneVerified(false)
      setVerifiedPhoneE164('')
      setDemoOtpCode(res.demoSmsCode ?? '')
      setMaskedPhone(res.maskedPhone || normalizedPhone.masked)
      setOtpExpiresAt(res.expiresAt)
      setResendAvailableAt(now + res.resendSeconds * 1000)
      setOtpInput('')
    } finally {
      setOtpSending(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otpVerifying) return
    setOtpError('')
    setError('')
    const cleanOtp = otpInput.replace(/\D/g, '').trim()
    if (cleanOtp.length < 6) {
      setOtpError(t.authErrors.otpRequired)
      return
    }
    setOtpVerifying(true)
    try {
      const check = await verifyPhoneOtp(normalizedPhone.e164, cleanOtp)
      if (!check.ok) {
        if (check.reason === 'expired' || check.reason === 'missing') {
          setOtpError(t.authErrors.otpExpired)
        } else if (check.reason === 'locked') {
          setOtpError(t.authErrors.otpLocked)
        } else {
          setOtpError(`${t.authErrors.otpInvalidPrefix} ${check.attemptsRemaining ?? 0}`)
        }
        return
      }
      setPhoneVerified(true)
      setVerifiedPhoneE164(normalizedPhone.e164)
      setDemoOtpCode('')
      setOtpError('')
    } finally {
      setOtpVerifying(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) {
      setError(t.authErrors.nameRequired)
      return
    }
    const cleanEmail = email.trim()
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError(t.authErrors.invalidEmail)
      return
    }
    if (!normalizedPhone.isValid) {
      setError(t.authErrors.invalidPhone)
      return
    }
    if (!phoneVerified || verifiedPhoneE164 !== normalizedPhone.e164) {
      setError(t.authErrors.phoneOtpRequired)
      return
    }
    if (password.length < 6) {
      setError(t.authErrors.passwordShort)
      return
    }
    if (password !== confirmPassword) {
      setError(t.authErrors.passwordMismatch)
      return
    }
    if (!consentChecked) {
      setError(t.authErrors.consentRequired)
      return
    }
    const res = register({
      fullName,
      email: cleanEmail,
      password,
      confirmPassword,
      phoneNumber: verifiedPhoneE164,
      phoneVerified: true,
      city,
      emergencyContactName: showEmergencyContact ? emergencyName : undefined,
      emergencyContactPhone: showEmergencyContact ? emergencyPhone : undefined,
      ageRange,
      preferredLanguage,
    })
    if (!res.ok) {
      setError(res.error ?? t.authErrors.couldNotCreate)
      return
    }
    navigate('/onboarding')
  }

  const detailsReady =
    fullName.trim().length > 0 &&
    email.includes('@') &&
    password.length >= 6 &&
    password === confirmPassword

  return (
    <div
      dir={t.dir}
      className="min-h-screen bg-[#0A0F14] bg-obsidian-grid text-[#EADCC8] flex flex-col justify-center px-4 py-8 sm:py-10"
    >
      <div className="mx-auto w-full max-w-xl space-y-5">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="cyan"
            className="whitespace-normal text-start max-w-full bg-[#0F3D3E] text-[#EADCC8] border-[#7FB388]/45"
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#7FB388]" />
            <span>{t.register.safetyBadge}</span>
          </Badge>
          <div className="relative flex items-center shrink-0">
            <Globe className="pointer-events-none absolute start-2.5 h-3.5 w-3.5 text-[#7FB388]" />
            <select
              aria-label="Language"
              value={preferredLanguage}
              onChange={(e) => handleLanguageSelect(e.target.value as LanguageCode)}
              className="h-8 rounded-xl border border-[#2E6F73]/60 bg-[#0F3D3E] ps-8 pe-3 text-xs font-medium text-[#EADCC8] focus:border-[#7FB388] focus:outline-none"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code} className="bg-[#0A0F14] text-[#EADCC8]">
                  {opt.nativeLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <Link to="/">
            <NeuroCareLogo dark />
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-[#EADCC8]">
            {t.register.title}
          </h1>
          <p className="mt-1 text-sm text-[#EADCC8]/75">
            {t.register.subtitle}
          </p>
        </div>

        {/* Compact 3-step Safety Progress Bar */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t.register.stepDetails, done: detailsReady },
            { label: t.register.stepPhoneOtp, done: phoneVerified },
            {
              label: t.register.stepSafeAccount,
              done: detailsReady && phoneVerified && consentChecked,
            },
          ].map((step, idx) => (
            <div
              key={idx}
              className={cn(
                'flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition-colors',
                step.done
                  ? 'border-[#7FB388]/60 bg-[#0F3D3E] text-[#EADCC8]'
                  : 'border-[#2E6F73]/40 bg-[#0F3D3E]/45 text-[#EADCC8]/80'
              )}
            >
              <CheckCircle2
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  step.done ? 'text-[#7FB388]' : 'text-[#EADCC8]/40'
                )}
              />
              <span className="leading-tight break-words">{step.label}</span>
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6 text-[#0A0F14]">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {error && (
                <div
                  role="alert"
                  id="reg-form-error"
                  className="flex items-start gap-2 rounded-xl border border-[#C6601F]/40 bg-[#C6601F]/12 px-3.5 py-2.5 text-xs font-medium text-[#8C3F10]"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-[#C6601F]" />
                  <span>{error}</span>
                </div>
              )}

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F3D3E]" htmlFor="reg-name">
                    {t.register.fullNameLabel}
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5D5E]" />
                    <Input
                      id="reg-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t.register.fullNamePlaceholder}
                      className="ps-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F3D3E]" htmlFor="reg-email">
                    {t.register.emailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5D5E]" />
                    <Input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.register.emailPlaceholder}
                      className="ps-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F3D3E]" htmlFor="reg-city">
                    {t.register.cityLabel}
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5D5E]" />
                    <Input
                      id="reg-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={t.register.cityPlaceholder}
                      className="ps-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F3D3E]" htmlFor="reg-age">
                    {t.register.ageRangeLabel}
                  </label>
                  <Select
                    id="reg-age"
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value as AgeRange)}
                  >
                    <option value="18-29">18–29 {t.units.yearsSuffix}</option>
                    <option value="30-44">30–44 {t.units.yearsSuffix}</option>
                    <option value="45-54">45–54 {t.units.yearsSuffix}</option>
                    <option value="55-64">55–64 {t.units.yearsSuffix}</option>
                    <option value="65+">65+ {t.units.yearsSuffix}</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F3D3E]" htmlFor="reg-lang">
                    {t.register.preferredLangLabel}
                  </label>
                  <Select
                    id="reg-lang"
                    value={preferredLanguage}
                    onChange={(e) => handleLanguageSelect(e.target.value as LanguageCode)}
                  >
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.nativeLabel} ({opt.label})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Mobile Number & OTP Verification Section */}
              <div
                className={cn(
                  'rounded-2xl border p-4 space-y-3 transition-colors',
                  phoneVerified
                    ? 'border-[#7FB388]/65 bg-[#7FB388]/18'
                    : 'border-[#2E6F73]/30 bg-[#EADCC8]/55'
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-[#2E6F73] shrink-0" />
                      <h2 className="text-xs font-bold text-[#0F3D3E]">
                        {t.register.phoneSectionTitle}
                      </h2>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#4A5D5E]">
                      {t.register.phoneSectionDesc}
                    </p>
                  </div>
                  {phoneVerified && (
                    <Badge
                      variant="success"
                      className="whitespace-normal text-start max-w-full"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span id="reg-phone-verified-badge">{t.register.phoneVerifiedBadge}</span>
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F3D3E]" htmlFor="reg-phone">
                    {t.register.phoneLabel}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      id="reg-country-code"
                      aria-label={t.register.countryCodeAria}
                      value={dialCode}
                      onChange={(e) => handleDialCodeChange(e.target.value)}
                      disabled={phoneVerified}
                      className="sm:w-44 shrink-0"
                    >
                      {COUNTRY_DIAL_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </Select>

                    <div className="relative flex-1 min-w-0">
                      <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5D5E]" />
                      <Input
                        id="reg-phone"
                        type="tel"
                        inputMode="numeric"
                        dir="ltr"
                        value={phoneDigits}
                        onChange={(e) => handlePhoneDigitsChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            void handleSendOtp()
                          }
                        }}
                        placeholder={t.register.phonePlaceholder}
                        disabled={phoneVerified}
                        className="ps-10"
                      />
                    </div>

                    {phoneVerified ? (
                      <Button
                        type="button"
                        variant="outline"
                        id="reg-change-phone"
                        onClick={resetPhoneVerificationState}
                        className="shrink-0"
                      >
                        {t.register.changePhoneBtn}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant={otpSent ? 'secondary' : 'primary'}
                        id="reg-send-otp"
                        onClick={() => void handleSendOtp()}
                        disabled={otpSending || (otpSent && resendRemainingSec > 0)}
                        className="shrink-0"
                      >
                        {otpSending
                          ? t.register.sendingOtpBtn
                          : !otpSent
                            ? t.register.sendOtpBtn
                            : resendRemainingSec > 0
                              ? `${t.register.resendInPrefix} ${resendRemainingSec}s`
                              : t.register.resendOtpBtn}
                      </Button>
                    )}
                  </div>
                </div>

                {otpError && (
                  <div
                    role="alert"
                    id="reg-otp-error"
                    className="rounded-xl border border-[#C6601F]/40 bg-[#C6601F]/12 px-3 py-2 text-xs font-medium text-[#8C3F10]"
                  >
                    {otpError}
                  </div>
                )}

                {otpSent && !phoneVerified && otpDeliveryMode === 'sms-gateway' && (
                  <div
                    role="status"
                    id="reg-sms-gateway-banner"
                    className="rounded-xl border border-[#7FB388]/60 bg-[#7FB388]/18 p-3 space-y-1.5 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0F3D3E]">
                        <MessageSquareText className="h-3.5 w-3.5 shrink-0" />
                        <span>{t.register.smsGatewaySentTitle}</span>
                      </div>
                      <span
                        dir="ltr"
                        className="text-[11px] font-mono text-[#0F3D3E]"
                      >
                        {t.register.demoSmsExpiryPrefix} {formatRemainingMmSs(otpExpiryRemainingMs)}
                      </span>
                    </div>
                    <p className="text-xs text-[#0A0F14]">
                      {t.register.demoSmsBodyPrefix}{' '}
                      <strong dir="ltr">{maskedPhone}</strong>. {t.register.smsGatewayHint}
                    </p>
                  </div>
                )}

                {otpSent && !phoneVerified && otpDeliveryMode === 'local-preview' && demoOtpCode && (
                  <div
                    role="status"
                    id="reg-demo-sms-banner"
                    className="rounded-xl border border-[#2E6F73]/35 bg-[#FBF6EE] p-3 space-y-2 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2E6F73]">
                        <MessageSquareText className="h-3.5 w-3.5 shrink-0" />
                        <span>{t.register.demoSmsTitle}</span>
                      </div>
                      <span
                        dir="ltr"
                        className="text-[11px] font-mono text-[#4A5D5E]"
                      >
                        {t.register.demoSmsExpiryPrefix} {formatRemainingMmSs(otpExpiryRemainingMs)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#263A3B]">
                      <span>
                        {t.register.demoSmsBodyPrefix}{' '}
                        <strong dir="ltr" className="text-[#0F3D3E]">
                          {maskedPhone}
                        </strong>
                      </span>
                      <span
                        id="reg-demo-otp-code"
                        data-testid="demo-otp-code"
                        dir="ltr"
                        className="inline-flex items-center rounded-lg border border-[#2E6F73]/40 bg-[#EADCC8] px-2.5 py-1 font-mono text-sm font-bold tracking-[0.2em] text-[#0F3D3E]"
                      >
                        {demoOtpCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#4A5D5E] leading-snug">
                      {t.register.localSmsConfigHint}
                    </p>
                  </div>
                )}

                {otpSent && !phoneVerified && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#0F3D3E]" htmlFor="reg-otp-input">
                      {t.register.otpInputLabel}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1 min-w-0">
                        <KeyRound className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5D5E]" />
                        <Input
                          id="reg-otp-input"
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) =>
                            setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              void handleVerifyOtp()
                            }
                          }}
                          placeholder={t.register.otpPlaceholder}
                          className="ps-10 font-mono tracking-[0.25em]"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        id="reg-verify-otp"
                        disabled={otpVerifying}
                        onClick={() => void handleVerifyOtp()}
                        className="shrink-0"
                      >
                        {otpVerifying ? t.register.verifyingOtpBtn : t.register.verifyOtpBtn}
                      </Button>
                    </div>
                  </div>
                )}

                {phoneVerified && (
                  <p className="text-xs font-medium text-[#0F3D3E] flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-[#2E6F73]" />
                    <span>{t.register.phoneVerifiedDesc}</span>
                  </p>
                )}
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F3D3E]" htmlFor="reg-pass">
                    {t.register.passwordLabel}
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5D5E]" />
                    <Input
                      id="reg-pass"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.register.passwordPlaceholder}
                      className="ps-10 pe-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={t.register.togglePwAria}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-[#4A5D5E]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex flex-1 gap-1.5">
                        {[1, 2, 3].map((lvl) => (
                          <div
                            key={lvl}
                            className={`h-1.5 flex-1 rounded-full ${
                              passwordStrength >= lvl
                                ? passwordStrength === 3
                                  ? 'bg-[#7FB388]'
                                  : passwordStrength === 2
                                    ? 'bg-[#C6601F]'
                                    : 'bg-[#B93822]'
                                : 'bg-[#D8C7AF]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-[#4A5D5E]">
                        {passwordStrength === 3
                          ? t.register.strengthStrong
                          : passwordStrength === 2
                            ? t.register.strengthFair
                            : t.register.strengthShort}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F3D3E]" htmlFor="reg-confirm-pass">
                    {t.register.confirmPasswordLabel}
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5D5E]" />
                    <Input
                      id="reg-confirm-pass"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t.register.confirmPasswordPlaceholder}
                      className="ps-10 pe-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={t.register.togglePwAria}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-[#4A5D5E]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordsMatchState !== 'idle' && (
                    <p
                      className={cn(
                        'text-[11px] font-medium pt-0.5',
                        passwordsMatchState === 'match'
                          ? 'text-[#0F3D3E]'
                          : 'text-[#8C3F10]'
                      )}
                    >
                      {passwordsMatchState === 'match'
                        ? t.register.passwordsMatch
                        : t.register.passwordsMismatch}
                    </p>
                  )}
                </div>
              </div>

              {/* Optional Emergency / Trusted Care Contact */}
              <div className="rounded-xl border border-[#2E6F73]/30 bg-[#FBF6EE] p-3 space-y-3">
                <label className="flex items-start gap-2.5 text-xs font-semibold text-[#0F3D3E] cursor-pointer">
                  <input
                    id="reg-emergency-toggle"
                    type="checkbox"
                    checked={showEmergencyContact}
                    onChange={(e) => setShowEmergencyContact(e.target.checked)}
                    className="mt-0.5 rounded border-[#2E6F73]/40 text-[#2E6F73]"
                  />
                  <span className="flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5 text-[#2E6F73] shrink-0" />
                    <span>{t.register.safetyContactToggle}</span>
                  </span>
                </label>

                {showEmergencyContact && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label
                        className="text-[11px] font-semibold text-[#263A3B]"
                        htmlFor="reg-emergency-name"
                      >
                        {t.register.emergencyNameLabel}
                      </label>
                      <Input
                        id="reg-emergency-name"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        placeholder={t.register.emergencyNamePlaceholder}
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        className="text-[11px] font-semibold text-[#263A3B]"
                        htmlFor="reg-emergency-phone"
                      >
                        {t.register.emergencyPhoneLabel}
                      </label>
                      <Input
                        id="reg-emergency-phone"
                        type="tel"
                        dir="ltr"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder={t.register.emergencyPhonePlaceholder}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Safety Protection Banner */}
              <div className="rounded-xl border border-[#7FB388]/50 bg-[#7FB388]/18 px-3.5 py-2.5 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-[#0F3D3E] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[#0F3D3E]">
                    {t.register.securityBannerTitle}
                  </p>
                  <p className="text-[11px] text-[#263A3B] leading-relaxed">
                    {t.register.securityBannerDesc}
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-2.5 rounded-xl border border-[#2E6F73]/25 bg-[#EADCC8]/65 p-3 text-xs text-[#0A0F14] cursor-pointer">
                <input
                  id="reg-consent"
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 rounded border-[#2E6F73]/40 text-[#2E6F73]"
                />
                <span>{t.register.consentLabel}</span>
              </label>

              <Button
                id="reg-submit-btn"
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
              >
                {t.register.submitBtn}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#4A5D5E]">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#2E6F73] shrink-0" />
              <span>{t.register.optionalStepNote}</span>
            </div>

            <p className="mt-4 text-center text-xs text-[#4A5D5E]">
              {t.register.alreadyHaveAcct}{' '}
              <Link to="/login" className="font-semibold text-[#2E6F73] hover:text-[#0F3D3E] hover:underline">
                {t.register.signInLink}
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-[#EADCC8]/80">{t.emergencyHelp.loginFooterPrompt}</span>
          <button
            type="button"
            onClick={() => setEmergencyOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#C6601F] bg-[#C6601F] px-3 py-1.5 text-xs font-bold text-[#FAF4EA] hover:bg-[#A84E16] transition-colors"
          >
            <Siren className="h-3.5 w-3.5 text-[#FAF4EA]" />
            <span dir="ltr" className="tabular-nums">
              112 / 108
            </span>
            <span>· {t.emergencyHelp.headerBtn}</span>
          </button>
        </div>
      </div>

      <EmergencyHelpModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </div>
  )
}

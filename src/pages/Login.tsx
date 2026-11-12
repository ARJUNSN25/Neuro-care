import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Globe, Lock, Mail, Siren, Sparkles, UserCog } from 'lucide-react'
import { EmergencyHelpModal } from '@/components/common/EmergencyHelpModal'
import { NeuroCareLogo } from '@/components/common/NeuroCareLogo'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { LANGUAGE_OPTIONS } from '@/data/translations'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import type { LanguageCode } from '@/types/neurocare'

export default function Login() {
  const { state, login, loginDemo, setLanguage } = useNeuroCare()
  const t = useTranslation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('aarav.sharma@neurocare-demo.in')
  const [password, setPassword] = useState('neurocare2026')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [emergencyOpen, setEmergencyOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = login(email, password)
    if (!res.ok) {
      setError(res.error ?? t.authErrors.unableSignIn)
      return
    }
    navigate('/dashboard')
  }

  const handleDemoLogin = () => {
    loginDemo()
    navigate('/dashboard')
  }

  return (
    <div dir={t.dir} className="min-h-screen bg-[#0A0F14] bg-obsidian-grid text-[#EADCC8] flex flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex justify-end">
          <div className="relative flex items-center">
            <Globe className="pointer-events-none absolute start-2.5 h-3.5 w-3.5 text-[#7FB388]" />
            <select
              aria-label="Language"
              value={state.user.preferredLanguage}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
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
          <h1 className="mt-5 text-2xl font-bold text-[#EADCC8]">
            {t.login.welcomeTitle}
          </h1>
          <p className="mt-1 text-sm text-[#EADCC8]/75">
            {t.login.welcomeSub}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-5 text-[#0A0F14]">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-[#C6601F]/40 bg-[#C6601F]/12 px-3.5 py-2.5 text-xs font-medium text-[#8C3F10]">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#0F3D3E]" htmlFor="login-email">
                  {t.login.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5D5E]" />
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.login.emailPlaceholder}
                    className="ps-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#0F3D3E]" htmlFor="login-password">
                  {t.login.passwordLabel}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5D5E]" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.login.passwordPlaceholder}
                    className="ps-10 pe-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? t.login.hidePasswordAria : t.login.showPasswordAria}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-[#4A5D5E] hover:text-[#0F3D3E]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full" size="lg">
                {t.login.signInBtn}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#CBB9A1]" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-[#F7EFE3] px-2 text-[#4A5D5E]">{t.login.quickAccess}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleDemoLogin}
            >
              <Sparkles className="h-4 w-4 text-[#2E6F73]" />
              {t.login.enterDemoBtn}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                loginDemo()
                navigate('/admin')
              }}
            >
              <UserCog className="h-4 w-4 text-[#2E6F73]" />
              {t.login.openAdminBtn}
            </Button>

            <p className="text-center text-xs text-[#4A5D5E]">
              {t.login.newPrompt}{' '}
              <Link to="/register" className="font-semibold text-[#2E6F73] hover:text-[#0F3D3E] hover:underline">
                {t.login.createAccountLink}
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-[#EADCC8]/70">
          {t.login.footerLocalNote}
        </p>

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

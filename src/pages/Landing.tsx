import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  FileText,
  Globe,
  HeartPulse,
  Lock,
  Moon,
  PhoneCall,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserCog,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmergencyHelpModal } from '@/components/common/EmergencyHelpModal'
import { NeuroCareLogo } from '@/components/common/NeuroCareLogo'
import { NeuralIllustration } from '@/components/common/NeuralIllustration'
import { MedicalDisclaimerBanner } from '@/components/common/MedicalDisclaimerBanner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  WEBSITE_EMERGENCY_NUMBER,
  WEBSITE_EMERGENCY_TEL,
} from '@/data/emergencyHelplines'
import { LANGUAGE_OPTIONS } from '@/data/translations'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import type { LanguageCode } from '@/types/neurocare'

const SAMPLE_PREVIEW_SERIES = [
  { week: '1', taskAccuracy: 81, sleepHrs: 6.6 },
  { week: '2', taskAccuracy: 83, sleepHrs: 7.0 },
  { week: '3', taskAccuracy: 82, sleepHrs: 6.9 },
  { week: '4', taskAccuracy: 85, sleepHrs: 7.3 },
  { week: '5', taskAccuracy: 87, sleepHrs: 7.5 },
]

const WHY_CARD_STYLES = [
  { icon: TrendingUp, color: 'bg-[#2E6F73]/15 text-[#0F3D3E] border border-[#2E6F73]/25' },
  { icon: Moon, color: 'bg-[#7FB388]/25 text-[#0F3D3E] border border-[#7FB388]/40' },
  { icon: Stethoscope, color: 'bg-[#C6601F]/15 text-[#8C3F10] border border-[#C6601F]/30' },
] as const

const PILLAR_CARD_STYLES = [
  { icon: Brain, color: 'bg-[#7FB388]/25 text-[#0F3D3E] border border-[#7FB388]/40' },
  { icon: Activity, color: 'bg-[#2E6F73]/15 text-[#0F3D3E] border border-[#2E6F73]/25' },
  { icon: FileText, color: 'bg-[#C6601F]/15 text-[#8C3F10] border border-[#C6601F]/30' },
] as const

export default function Landing() {
  const { state, loginDemo, setLanguage } = useNeuroCare()
  const navigate = useNavigate()
  const t = useTranslation()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [emergencyOpen, setEmergencyOpen] = useState(false)

  const handleStartAssessment = () => {
    if (!state.isAuthenticated) {
      loginDemo()
    }
    navigate('/assessment')
  }

  const handleDemoDashboard = () => {
    loginDemo()
    navigate('/dashboard')
  }

  const handleAdminPortal = () => {
    if (!state.isAuthenticated) {
      loginDemo()
    }
    navigate('/admin')
  }

  return (
    <div dir={t.dir} className="min-h-screen bg-[#EADCC8] text-[#0A0F14]">
      {/* Top Obsidian Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#2E6F73]/40 bg-[#0A0F14]/95 text-[#EADCC8] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="NeuroCare" className="shrink-0">
            <span className="sm:hidden">
              <NeuroCareLogo dark compact />
            </span>
            <span className="hidden sm:inline-flex">
              <NeuroCareLogo dark />
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-xs xl:text-sm font-medium text-[#EADCC8]/80 min-w-0">
            <a href="#why-matters" className="hover:text-[#7FB388] transition-colors truncate">
              {t.landing.navWhy}
            </a>
            <a href="#how-it-works" className="hover:text-[#7FB388] transition-colors truncate">
              {t.landing.navHow}
            </a>
            <a href="#features" className="hover:text-[#7FB388] transition-colors truncate">
              {t.landing.navFeatures}
            </a>
            <a href="#faq" className="hover:text-[#7FB388] transition-colors truncate">
              {t.landing.navFaq}
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setEmergencyOpen(true)}
              aria-label={t.emergencyHelp.headerAria}
              className="inline-flex h-8 items-center gap-1 rounded-xl border border-[#C6601F] bg-[#C6601F] px-2 sm:px-2.5 text-xs font-bold text-[#FAF4EA] hover:bg-[#A84E16] transition-colors shrink-0"
            >
              <Siren className="h-3.5 w-3.5 text-[#FAF4EA] shrink-0" />
              <span dir="ltr" className="tabular-nums font-extrabold sm:hidden">
                112
              </span>
              <span className="hidden sm:inline tabular-nums font-extrabold">
                {t.emergencyHelp.headerBtnShort}
              </span>
            </button>

            <div className="relative flex items-center">
              <Globe className="pointer-events-none absolute start-2 h-3.5 w-3.5 text-[#7FB388]" />
              <select
                aria-label="Language"
                value={state.user.preferredLanguage}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="h-8 w-20 sm:w-auto rounded-xl border border-[#2E6F73]/60 bg-[#0F3D3E] ps-7 pe-1 sm:pe-2 text-xs font-medium text-[#EADCC8] focus:border-[#7FB388] focus:outline-none"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code} className="bg-[#0A0F14] text-[#EADCC8]">
                    {opt.nativeLabel}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex border-[#7FB388]/40 bg-[#0F3D3E]/70 text-[#EADCC8] hover:bg-[#0F3D3E] hover:border-[#7FB388]"
              onClick={handleAdminPortal}
            >
              <UserCog className="h-3.5 w-3.5 text-[#7FB388]" />
              {t.cta.adminPortal}
            </Button>

            {state.isAuthenticated ? (
              <Button variant="copper" size="sm" onClick={() => navigate('/dashboard')}>
                <span className="sm:hidden">{t.landing.dashboardShort}</span>
                <span className="hidden sm:inline">{t.landing.openDashboard}</span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex text-[#EADCC8] hover:bg-[#0F3D3E] hover:text-[#7FB388]"
                  onClick={() => navigate('/login')}
                >
                  {t.landing.signIn}
                </Button>
                <Button
                  variant="copper"
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  {t.landing.getStarted}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Dark Obsidian Hero Section */}
      <section className="relative overflow-hidden bg-obsidian-grid text-[#EADCC8] pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-[#2E6F73]/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="lg:col-span-6 min-w-0 space-y-6"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#7FB388]/40 bg-[#0F3D3E]/80 px-3.5 py-1.5 text-xs font-semibold text-[#EADCC8] shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-[#7FB388]" />
                {t.tagline}
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-[#EADCC8] sm:text-5xl lg:text-[54px] lg:leading-[1.08]">
                {t.landing.heroHeadlinePrefix}{' '}
                <span className="bg-gradient-to-r from-[#7FB388] via-[#EADCC8] to-[#C6601F] bg-clip-text text-transparent">
                  {t.landing.heroHeadlineAccent}
                </span>
              </h1>

              <p className="max-w-xl text-base sm:text-lg leading-relaxed text-[#EADCC8]/80">
                {t.landing.heroSupportText}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button size="lg" variant="copper" onClick={handleStartAssessment}>
                  {t.cta.startAssessment}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#EADCC8]/30 bg-[#0F3D3E]/60 text-[#EADCC8] hover:bg-[#0F3D3E] hover:border-[#7FB388]"
                  onClick={() => {
                    document
                      .getElementById('features')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  {t.cta.exploreFeatures}
                </Button>
                <Button
                  size="lg"
                  variant="cyan"
                  onClick={handleDemoDashboard}
                >
                  {t.cta.launchDemo}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#7FB388]/40 bg-[#0A0F14]/70 text-[#EADCC8] hover:bg-[#0F3D3E]"
                  onClick={handleAdminPortal}
                >
                  <UserCog className="h-4 w-4 text-[#7FB388]" />
                  {t.cta.adminPortal}
                </Button>
              </div>

              {/* Trust & Privacy Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#2E6F73]/40">
                <div className="flex items-center gap-2 text-xs font-medium text-[#EADCC8]/90">
                  <Lock className="h-4 w-4 text-[#7FB388] shrink-0" />
                  {t.landing.trustPrivacy}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#EADCC8]/90">
                  <ShieldCheck className="h-4 w-4 text-[#EADCC8] shrink-0" />
                  {t.landing.trustNonDiag}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#EADCC8]/90">
                  <HeartPulse className="h-4 w-4 text-[#C6601F] shrink-0" />
                  {t.landing.trustCultural}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="lg:col-span-6 min-w-0"
            >
              <NeuralIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Brain Health Matters */}
      <section id="why-matters" className="py-16 bg-[#F5EDE0] border-b border-[#CBB9A1]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge variant="primary">{t.landing.whyBadge}</Badge>
            <h2 className="mt-3 text-3xl font-bold text-[#0F3D3E]">
              {t.landing.whyHeading}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#4A5D5E] leading-relaxed">
              {t.landing.whySubheading}
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {t.landing.whyCards.map((item, idx) => {
              const style = WHY_CARD_STYLES[idx % WHY_CARD_STYLES.length]
              const Icon = style.icon
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[#2E6F73]/25 bg-[#F7EFE3] p-6 shadow-[0_3px_16px_-6px_rgba(10,15,20,0.14),inset_0_0_0_1px_rgba(255,250,242,0.75)] transition-all hover:shadow-md"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${style.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#0F3D3E]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#4A5D5E] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How NeuroCare Works */}
      <section id="how-it-works" className="py-16 bg-[#EADCC8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="cyan">{t.landing.howBadge}</Badge>
            <h2 className="mt-3 text-3xl font-bold text-[#0F3D3E]">
              {t.landing.howHeading}
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.landing.howSteps.map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-[#2E6F73]/25 bg-[#F7EFE3] p-6 shadow-[0_3px_16px_-6px_rgba(10,15,20,0.14),inset_0_0_0_1px_rgba(255,250,242,0.75)]"
              >
                <span className="font-vintage-serif text-3xl font-extrabold text-[#C6601F]/70 tabular-nums">
                  {item.step}
                </span>
                <h3 className="mt-2 text-base font-bold text-[#0F3D3E]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-[#4A5D5E] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Platform Pillars */}
      <section id="features" className="py-16 bg-[#F5EDE0] border-y border-[#CBB9A1]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6 min-w-0 space-y-4">
              <Badge variant="primary">{t.landing.aiMonitorBadge}</Badge>
              <h2 className="text-3xl font-bold text-[#0F3D3E]">
                {t.landing.aiMonitorHeading}
              </h2>
              <p className="text-sm sm:text-base text-[#4A5D5E] leading-relaxed">
                {t.landing.aiMonitorDesc}
              </p>
              <ul className="space-y-2.5 pt-2">
                {t.landing.aiMonitorBullets.map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-sm text-[#0A0F14]">
                    <CheckCircle2 className="h-4 w-4 text-[#0F3D3E] mt-0.5 shrink-0" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <Button variant="primary" onClick={handleDemoDashboard}>
                  {t.landing.exploreLiveDashBtn}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>

            <div className="lg:col-span-6 min-w-0 rounded-2xl border border-[#2E6F73]/25 bg-[#F7EFE3] p-5 shadow-[0_3px_16px_-6px_rgba(10,15,20,0.14),inset_0_0_0_1px_rgba(255,250,242,0.75)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#0F3D3E]">
                    {t.landing.previewChartTitle}
                  </h3>
                  <p className="text-xs text-[#4A5D5E]">
                    {t.landing.previewChartSub}
                  </p>
                </div>
                <Badge variant="cyan">{t.landing.previewChartBadge}</Badge>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SAMPLE_PREVIEW_SERIES}>
                    <defs>
                      <linearGradient id="landPine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2E6F73" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#7FB388" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" stroke="#4A5D5E" fontSize={12} tickLine={false} />
                    <YAxis domain={[60, 100]} stroke="#4A5D5E" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#F7EFE3',
                        borderRadius: 12,
                        border: '1px solid #2E6F73',
                        color: '#0A0F14',
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="taskAccuracy"
                      name={t.landing.previewSeriesName}
                      stroke="#2E6F73"
                      strokeWidth={2.5}
                      fill="url(#landPine)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {t.landing.pillarCards.map((card, idx) => {
              const style = PILLAR_CARD_STYLES[idx % PILLAR_CARD_STYLES.length]
              const Icon = style.icon
              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-[#2E6F73]/25 bg-[#F7EFE3] p-6 shadow-[inset_0_0_0_1px_rgba(255,250,242,0.7)]"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#0F3D3E]">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#4A5D5E] leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-[#EADCC8]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="primary">{t.landing.faqBadge}</Badge>
            <h2 className="mt-3 text-3xl font-bold text-[#0F3D3E]">
              {t.landing.faqHeading}
            </h2>
          </div>

          <div className="space-y-3">
            {t.landing.faqs.map((item, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={item.q}
                  className="rounded-2xl border border-[#2E6F73]/25 bg-[#F7EFE3] overflow-hidden shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
                  >
                    <span className="text-sm sm:text-base font-semibold text-[#0F3D3E]">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#4A5D5E] transition-transform ${
                        isOpen ? 'rotate-180 text-[#C6601F]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-sm text-[#4A5D5E] leading-relaxed border-t border-[#CBB9A1] pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-10">
            <MedicalDisclaimerBanner />
          </div>
        </div>
      </section>

      {/* Obsidian Vintage Footer */}
      <footer className="bg-[#0A0F14] border-t border-[#2E6F73]/40 text-[#EADCC8] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2 space-y-3">
              <NeuroCareLogo dark />
              <p className="text-sm text-[#EADCC8]/75 max-w-md leading-relaxed">
                {t.landing.footerDesc}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7FB388] mb-3">
                {t.landing.footerPlatform}
              </h4>
              <ul className="space-y-2 text-sm text-[#EADCC8]/80">
                <li>
                  <button
                    type="button"
                    onClick={handleDemoDashboard}
                    className="hover:text-[#7FB388] text-start transition-colors"
                  >
                    {t.landing.footerLinks.overview}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleStartAssessment}
                    className="hover:text-[#7FB388] text-start transition-colors"
                  >
                    {t.landing.footerLinks.assessment}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleAdminPortal}
                    className="hover:text-[#7FB388] text-start transition-colors"
                  >
                    {t.landing.footerLinks.admin}
                  </button>
                </li>
                <li>
                  <Link to="/login" className="hover:text-[#7FB388] transition-colors">
                    {t.landing.footerLinks.signIn}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-[#7FB388] transition-colors">
                    {t.landing.footerLinks.createAccount}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7FB388] mb-3">
                {t.landing.footerContactTitle}
              </h4>
              <ul className="space-y-2 text-sm text-[#EADCC8]/70">
                <li>care-prototype@neurocare-demo.in</li>
                <li>{t.landing.footerCity}</li>
                <li>{t.landing.footerProtoLabel}</li>
              </ul>

              <div className="mt-5 rounded-2xl border border-[#C6601F]/55 bg-[#0F3D3E]/70 p-3.5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#EADCC8]">
                  <Siren className="h-3.5 w-3.5 text-[#C6601F] shrink-0" />
                  <span>{t.emergencyHelp.footerEmergencyTitle}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <a
                    href="tel:112"
                    dir="ltr"
                    className="inline-flex items-center gap-1 rounded-lg bg-[#C6601F] px-2.5 py-1 text-xs font-extrabold text-[#FAF4EA] tabular-nums hover:bg-[#A84E16]"
                  >
                    <PhoneCall className="h-3 w-3" />
                    112
                  </a>
                  <a
                    href="tel:108"
                    dir="ltr"
                    className="inline-flex items-center gap-1 rounded-lg border border-[#2E6F73]/60 bg-[#0A0F14]/70 px-2.5 py-1 text-xs font-bold text-[#EADCC8] tabular-nums hover:bg-[#0A0F14]"
                  >
                    108
                  </a>
                  <a
                    href="tel:14567"
                    dir="ltr"
                    className="inline-flex items-center gap-1 rounded-lg border border-[#2E6F73]/60 bg-[#0A0F14]/70 px-2.5 py-1 text-xs font-bold text-[#EADCC8] tabular-nums hover:bg-[#0A0F14]"
                  >
                    14567
                  </a>
                </div>
                <a
                  href={WEBSITE_EMERGENCY_TEL}
                  dir="ltr"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7FB388] hover:underline tabular-nums"
                >
                  <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                  <span>{WEBSITE_EMERGENCY_NUMBER}</span>
                </a>
                <p className="text-[11px] text-[#EADCC8]/75 leading-snug">
                  {t.emergencyHelp.footerEmergencyNote}
                </p>
                <button
                  type="button"
                  onClick={() => setEmergencyOpen(true)}
                  className="text-[11px] font-semibold text-[#EADCC8] underline underline-offset-2 hover:text-[#7FB388]"
                >
                  {t.emergencyHelp.openAllBtn}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-[#2E6F73]/35 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#EADCC8]/65">
            <span>{t.landing.footerCopy}</span>
            <span>{t.landing.footerEthics}</span>
          </div>
        </div>
      </footer>

      <EmergencyHelpModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </div>
  )
}

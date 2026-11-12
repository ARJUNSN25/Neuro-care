import React, { useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  Bell,
  Bot,
  Brain,
  ClipboardCheck,
  FileBarChart2,
  Gamepad2,
  Globe,
  HeartHandshake,
  History,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Moon,
  PhoneCall,
  Search,
  Settings,
  Siren,
  Sparkles,
  Stethoscope,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import { EmergencyHelpModal } from '@/components/common/EmergencyHelpModal'
import { NeuroCareLogo } from '@/components/common/NeuroCareLogo'
import { Badge } from '@/components/ui/Badge'
import {
  getLocalizedCohortPatient,
  getLocalizedDoctor,
  getLocalizedNotif,
  LANGUAGE_OPTIONS,
} from '@/data/translations'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/utils/cn'
import type { LanguageCode } from '@/types/neurocare'

interface SearchItem {
  label: string
  subtitle: string
  route: string
  category: string
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, setLanguage, logout, markNotificationRead, markAllNotificationsRead } =
    useNeuroCare()
  const t = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const unreadCount = state.notifications.filter((n) => !n.read).length

  const navGroups = useMemo(
    () => [
      {
        title: t.navGroups.coreMonitoring,
        items: [
          { label: t.nav.overview, path: '/dashboard', icon: LayoutDashboard },
          { label: t.nav.assessment, path: '/assessment', icon: ClipboardCheck },
          { label: t.nav.games, path: '/games', icon: Gamepad2 },
          { label: t.nav.analytics, path: '/analytics', icon: LineChart },
        ],
      },
      {
        title: t.navGroups.sleepLifestyle,
        items: [
          { label: t.nav.sleep, path: '/sleep', icon: Moon },
          { label: t.nav.lifestyle, path: '/lifestyle', icon: Activity },
          { label: t.nav.family, path: '/family-history', icon: Users },
        ],
      },
      {
        title: t.navGroups.insightsSupport,
        items: [
          { label: t.nav.report, path: '/report', icon: FileBarChart2 },
          { label: t.nav.recommendations, path: '/recommendations', icon: Sparkles },
          { label: t.nav.assistant, path: '/assistant', icon: Bot },
          { label: t.nav.clinical, path: '/clinical-support', icon: Stethoscope },
          { label: t.nav.history, path: '/history', icon: History },
        ],
      },
      {
        title: t.navGroups.careOperations,
        items: [
          { label: t.nav.admin, path: '/admin', icon: UserCog },
          { label: t.nav.settings, path: '/profile', icon: Settings },
        ],
      },
    ],
    [t]
  )

  const searchableItems: SearchItem[] = useMemo(
    () => [
      { label: t.nav.overview, subtitle: t.welcomeSubtitle, route: '/dashboard', category: t.searchCategories.page },
      { label: t.nav.assessment, subtitle: t.assessment.subtitle, route: '/assessment', category: t.searchCategories.assessment },
      { label: t.gamesPage.catalog['number-sequence'].title, subtitle: t.gamesPage.catalog['number-sequence'].subtitle, route: '/games?game=number-sequence', category: t.searchCategories.game },
      { label: t.gamesPage.catalog['image-recall'].title, subtitle: t.gamesPage.catalog['image-recall'].subtitle, route: '/games?game=image-recall', category: t.searchCategories.game },
      { label: t.gamesPage.catalog['pattern-recognition'].title, subtitle: t.gamesPage.catalog['pattern-recognition'].subtitle, route: '/games?game=pattern-recognition', category: t.searchCategories.game },
      { label: t.gamesPage.catalog['word-recall'].title, subtitle: t.gamesPage.catalog['word-recall'].subtitle, route: '/games?game=word-recall', category: t.searchCategories.game },
      { label: t.gamesPage.catalog['reaction-time'].title, subtitle: t.gamesPage.catalog['reaction-time'].subtitle, route: '/games?game=reaction-time', category: t.searchCategories.game },
      { label: t.gamesPage.catalog['memory-pairs'].title, subtitle: t.gamesPage.catalog['memory-pairs'].subtitle, route: '/games?game=memory-pairs', category: t.searchCategories.game },
      { label: t.gamesPage.catalog['object-location'].title, subtitle: t.gamesPage.catalog['object-location'].subtitle, route: '/games?game=object-location', category: t.searchCategories.game },
      { label: t.nav.analytics, subtitle: t.analyticsPage.subtitle, route: '/analytics', category: t.searchCategories.page },
      { label: t.nav.sleep, subtitle: t.sleepPage.subtitle, route: '/sleep', category: t.searchCategories.page },
      { label: t.nav.lifestyle, subtitle: t.lifestylePage.subtitle, route: '/lifestyle', category: t.searchCategories.page },
      { label: t.nav.family, subtitle: t.familyPage.subtitle, route: '/family-history', category: t.searchCategories.page },
      { label: t.nav.report, subtitle: t.reportPage.title, route: '/report', category: t.searchCategories.report },
      { label: t.nav.recommendations, subtitle: t.recommendationsPage.subtitle, route: '/recommendations', category: t.searchCategories.wellness },
      { label: t.nav.assistant, subtitle: t.assistantPage.subtitle, route: '/assistant', category: t.searchCategories.assistant },
      { label: t.nav.clinical, subtitle: t.clinicalPage.subtitle, route: '/clinical-support', category: t.searchCategories.care },
      { label: t.nav.admin, subtitle: t.adminPage.subtitle, route: '/admin', category: t.searchCategories.admin },
      { label: t.nav.history, subtitle: t.historyPage.subtitle, route: '/history', category: t.searchCategories.records },
      { label: t.nav.settings, subtitle: t.profilePage.subtitle, route: '/profile', category: t.searchCategories.settings },
      ...state.doctors.map((d) => {
        const loc = getLocalizedDoctor(d, t)
        return {
          label: loc.name,
          subtitle: `${loc.specialty} · ${loc.city}`,
          route: '/clinical-support',
          category: t.searchCategories.care,
        }
      }),
      ...state.adminCohort.map((p) => {
        const loc = getLocalizedCohortPatient(p, t)
        return {
          label: `${t.searchCategories.patient}: ${p.fullName}`,
          subtitle: `${loc.city} · ${p.preferredLanguage.toUpperCase()}`,
          route: '/admin',
          category: t.searchCategories.patient,
        }
      }),
    ],
    [state.adminCohort, state.doctors, t]
  )

  const filteredSearch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return searchableItems.slice(0, 6)
    return searchableItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
  }, [searchQuery, searchableItems])

  const initials = state.user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')

  const handleLogout = () => {
    setProfileMenuOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#EADCC8] text-[#0A0F14] flex">
      {/* Desktop Obsidian Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:start-0 border-e border-[#2E6F73]/35 bg-[#0A0F14] text-[#EADCC8] z-30 no-print">
        <div className="flex h-16 items-center justify-between px-5 border-b border-[#0F3D3E]">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-start focus:outline-none"
          >
            <NeuroCareLogo dark />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#7FB388]/80">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all border',
                          isActive
                            ? 'bg-[#0F3D3E] text-[#EADCC8] border-[#7FB388]/45 shadow-sm shadow-[#0A0F14]/40'
                            : 'border-transparent text-[#EADCC8]/75 hover:bg-[#0F3D3E]/45 hover:text-[#EADCC8]'
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[#7FB388]" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[#0F3D3E] space-y-2.5">
          <div className="rounded-xl bg-[#0F3D3E]/70 border border-[#C6601F]/55 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#EADCC8] min-w-0">
                <Siren className="h-4 w-4 text-[#C6601F] shrink-0" />
                <span className="truncate">{t.emergencyHelp.sidebarTitle}</span>
              </div>
              <a
                href="tel:112"
                dir="ltr"
                className="inline-flex items-center gap-1 rounded-lg bg-[#C6601F] px-2 py-0.5 text-[11px] font-extrabold text-[#FAF4EA] tabular-nums hover:bg-[#A84E16] shrink-0"
              >
                <PhoneCall className="h-3 w-3" />
                112
              </a>
            </div>
            <p className="text-[11px] leading-snug text-[#EADCC8]/80">
              {t.emergencyHelp.sidebarSub}
            </p>
            <button
              type="button"
              onClick={() => setEmergencyOpen(true)}
              className="w-full rounded-lg border border-[#EADCC8]/25 bg-[#0A0F14]/75 px-2.5 py-1.5 text-[11px] font-bold text-[#EADCC8] hover:bg-[#C6601F] hover:border-[#C6601F] transition-colors"
            >
              {t.emergencyHelp.openAllBtn}
            </button>
          </div>

          <div className="rounded-xl bg-[#0F3D3E]/35 border border-[#2E6F73]/40 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#EADCC8]">
              <HeartHandshake className="h-4 w-4 text-[#7FB388]" />
              {t.nonDiagnosticMode}
            </div>
            <p className="mt-1 text-[11px] leading-snug text-[#EADCC8]/70">
              {t.localStorageNote}
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Over Obsidian Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-[#0A0F14]/70 backdrop-blur-[2px]"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="h-full w-72 bg-[#0A0F14] text-[#EADCC8] shadow-2xl flex flex-col border-e border-[#2E6F73]/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between px-4 border-b border-[#0F3D3E]">
              <NeuroCareLogo dark />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label={t.closeMenuAria}
                className="rounded-lg p-2 text-[#EADCC8]/80 hover:bg-[#0F3D3E]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
              {navGroups.map((group) => (
                <div key={group.title}>
                  <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#7FB388]/80">
                    {group.title}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all border',
                              isActive
                                ? 'bg-[#0F3D3E] text-[#EADCC8] border-[#7FB388]/45'
                                : 'border-transparent text-[#EADCC8]/80 hover:bg-[#0F3D3E]/50'
                            )
                          }
                        >
                          <Icon className="h-4 w-4 shrink-0 text-[#7FB388]" />
                          <span>{item.label}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
            <div className="p-3 border-t border-[#0F3D3E] space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setEmergencyOpen(true)
                }}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#C6601F]/55 bg-[#0F3D3E]/80 px-3 py-2.5 text-sm font-bold text-[#EADCC8] hover:bg-[#C6601F]"
              >
                <span className="flex items-center gap-2">
                  <Siren className="h-4 w-4 text-[#C6601F] shrink-0" />
                  <span>{t.emergencyHelp.headerBtn}</span>
                </span>
                <span dir="ltr" className="text-xs font-extrabold text-[#EADCC8] tabular-nums">
                  112 / 108
                </span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[#C6601F] hover:bg-[#0F3D3E]/60"
              >
                <LogOut className="h-4 w-4" />
                {t.signOut}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:ps-64 flex flex-col min-w-0">
        {/* Deep Heritage Teal Top Header */}
        <header className="sticky top-0 z-20 h-16 border-b border-[#2E6F73]/40 bg-[#0F3D3E] text-[#EADCC8] px-4 sm:px-6 flex items-center justify-between gap-2.5 no-print shadow-sm">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={t.openMenuAria}
              className="lg:hidden rounded-xl border border-[#2E6F73]/60 bg-[#0A0F14]/70 p-2 text-[#EADCC8] hover:bg-[#0A0F14]"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="lg:hidden shrink-0"
            >
              <NeuroCareLogo dark compact />
            </button>

            {/* Global Search */}
            <div className="relative flex-1 max-w-md min-w-0">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7FB388]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                placeholder={t.cta.searchPlaceholder}
                className="h-9 w-full rounded-xl border border-[#2E6F73]/60 bg-[#0A0F14]/70 ps-9 pe-3 text-xs sm:text-sm text-[#EADCC8] placeholder:text-[#EADCC8]/55 focus:border-[#7FB388] focus:bg-[#0A0F14] focus:outline-none"
              />
              {searchFocused && (
                <div className="absolute inset-x-0 top-11 z-40 rounded-2xl border border-[#2E6F73]/35 bg-[#F7EFE3] p-2 shadow-xl shadow-[#0A0F14]/30 max-h-80 overflow-y-auto text-[#0A0F14]">
                  {filteredSearch.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-[#4A5D5E]">
                      {t.noMatchingSearch}
                    </p>
                  ) : (
                    filteredSearch.map((item) => (
                      <button
                        key={item.route + item.label}
                        type="button"
                        onMouseDown={() => {
                          navigate(item.route)
                          setSearchQuery('')
                          setSearchFocused(false)
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-start hover:bg-[#EADCC8]"
                      >
                        <div>
                          <p className="text-xs font-semibold text-[#0F3D3E]">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-[#4A5D5E]">
                            {item.subtitle}
                          </p>
                        </div>
                        <Badge variant="primary">{item.category}</Badge>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Global Critical Emergency Helplines Pill */}
            <button
              type="button"
              onClick={() => {
                setNotifOpen(false)
                setProfileMenuOpen(false)
                setEmergencyOpen(true)
              }}
              aria-label={t.emergencyHelp.headerAria}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#C6601F] bg-[#C6601F] px-2 sm:px-2.5 text-xs font-bold text-[#FAF4EA] hover:bg-[#A84E16] transition-colors shrink-0 shadow-xs"
            >
              <Siren className="h-3.5 w-3.5 text-[#FAF4EA] shrink-0" />
              <span dir="ltr" className="tabular-nums font-extrabold">
                112
              </span>
              <span className="hidden 2xl:inline">{t.emergencyHelp.headerBtn}</span>
            </button>

            {/* Language Switcher */}
            <div className="relative flex items-center">
              <Globe className="pointer-events-none absolute start-2 sm:start-2.5 h-3.5 w-3.5 text-[#7FB388]" />
              <select
                aria-label={t.profilePage.preferredLang}
                value={state.user.preferredLanguage}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="h-9 max-w-[88px] sm:max-w-none rounded-xl border border-[#2E6F73]/60 bg-[#0A0F14]/75 ps-7 sm:ps-8 pe-1.5 sm:pe-2.5 text-xs font-medium text-[#EADCC8] focus:border-[#7FB388] focus:outline-none"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code} className="bg-[#0A0F14] text-[#EADCC8]">
                    {opt.nativeLabel}
                  </option>
                ))}
              </select>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((prev) => !prev)
                  setProfileMenuOpen(false)
                }}
                aria-label={t.notificationsTitle}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#2E6F73]/60 bg-[#0A0F14]/75 text-[#EADCC8] hover:bg-[#0A0F14]"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -end-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C6601F] px-1 text-[10px] font-bold text-[#FAF4EA]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute end-0 top-11 z-40 w-80 rounded-2xl border-2 border-[#2E6F73]/35 bg-[#F7EFE3] p-3 shadow-xl shadow-[#0A0F14]/30 text-[#0A0F14]">
                  <div className="flex items-center justify-between pb-2 border-b border-[#2E6F73]/20">
                    <span className="text-xs font-bold text-[#0F3D3E]">
                      {t.notificationsTitle}
                    </span>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-semibold text-[#2E6F73] hover:underline"
                    >
                      {t.markAllRead}
                    </button>
                  </div>
                  <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
                    {state.notifications.map((n) => {
                      const loc = getLocalizedNotif(n, t)
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            markNotificationRead(n.id)
                            setNotifOpen(false)
                            navigate(n.route)
                          }}
                          className={cn(
                            'w-full rounded-xl p-2.5 text-start transition-colors',
                            n.read ? 'bg-[#FBF6EE] hover:bg-[#EADCC8]' : 'bg-[#EADCC8] hover:bg-[#E1CEB4]'
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#0F3D3E]">
                              {loc.title}
                            </span>
                            {!n.read && (
                              <span className="h-2 w-2 rounded-full bg-[#C6601F] shrink-0" />
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#263A3B] leading-snug">
                            {loc.message}
                          </p>
                          <span className="mt-1 block text-[10px] text-[#4A5D5E]">
                            {loc.timeLabel}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen((prev) => !prev)
                  setNotifOpen(false)
                }}
                className="flex items-center gap-2 rounded-xl border border-[#2E6F73]/60 bg-[#0A0F14]/75 py-1 ps-1.5 pe-2.5 hover:bg-[#0A0F14]"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2E6F73] text-xs font-bold text-[#EADCC8]">
                  {initials || 'NC'}
                </div>
                <div className="hidden sm:block text-start leading-tight">
                  <p className="text-xs font-semibold text-[#EADCC8] max-w-[100px] truncate">
                    {state.user.fullName}
                  </p>
                  <p className="text-[10px] text-[#7FB388]">
                    {t.demoProfile}
                  </p>
                </div>
              </button>

              {profileMenuOpen && (
                <div className="absolute end-0 top-11 z-40 w-56 rounded-2xl border-2 border-[#2E6F73]/35 bg-[#F7EFE3] p-2 shadow-xl shadow-[#0A0F14]/30 text-[#0A0F14]">
                  <div className="px-3 py-2 border-b border-[#2E6F73]/20">
                    <p className="text-xs font-bold text-[#0F3D3E] truncate">
                      {state.user.fullName}
                    </p>
                    <p className="text-[11px] text-[#4A5D5E] truncate">
                      {state.user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false)
                      navigate('/profile')
                    }}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#0A0F14] hover:bg-[#EADCC8]"
                  >
                    <Settings className="h-3.5 w-3.5 text-[#2E6F73]" />
                    {t.nav.settings}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false)
                      navigate('/report')
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#0A0F14] hover:bg-[#EADCC8]"
                  >
                    <FileBarChart2 className="h-3.5 w-3.5 text-[#2E6F73]" />
                    {t.nav.report}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false)
                      navigate('/')
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#0A0F14] hover:bg-[#EADCC8]"
                  >
                    <Brain className="h-3.5 w-3.5 text-[#2E6F73]" />
                    {t.viewLandingPage}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#C6601F] hover:bg-[#C6601F]/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {t.signOut}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Warm Parchment Workspace Body */}
        <main className="flex-1 bg-neural-grid px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Obsidian Bottom Navigation */}
      <nav
        aria-label={t.mobileNav.overview}
        className="fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-[#2E6F73]/40 bg-[#0A0F14]/95 backdrop-blur-md px-1 py-1.5 lg:hidden no-print"
      >
        {[
          { label: t.mobileNav.overview, path: '/dashboard', icon: LayoutDashboard },
          { label: t.mobileNav.assess, path: '/assessment', icon: ClipboardCheck },
          { label: t.mobileNav.games, path: '/games', icon: Gamepad2 },
          { label: t.mobileNav.analytics, path: '/analytics', icon: LineChart },
          { label: t.mobileNav.aiChat, path: '/assistant', icon: Bot },
        ].map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl px-2.5 py-1.5 min-w-[56px] text-[10px] font-semibold transition-colors',
                active
                  ? 'text-[#EADCC8] bg-[#0F3D3E] border border-[#7FB388]/40'
                  : 'text-[#EADCC8]/70 hover:text-[#EADCC8]'
              )}
            >
              <Icon className={cn('h-4 w-4 mb-0.5', active ? 'text-[#7FB388]' : '')} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <EmergencyHelpModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </div>
  )
}

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCircle2,
  Cloud,
  Copy,
  Database,
  Download,
  LogOut,
  RefreshCw,
  RotateCcw,
  Shield,
  Trash2,
  User,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { LANGUAGE_OPTIONS } from '@/data/translations'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import { SUPABASE_CONFIG } from '@/services/supabaseClient'
import { CLOUD_SYNC_LABELS, NEUROCARE_SCHEMA_SQL } from '@/services/supabaseSync'
import type { AgeRange, LanguageCode, UserProfile } from '@/types/neurocare'

export default function Profile() {
  const {
    state,
    updateProfile,
    setLanguage: setContextLanguage,
    exportAllDataJson,
    deleteAccount,
    resetDemoData,
    logout,
    cloudStatus,
    cloudUserEmail,
    cloudLastSyncedAt,
    cloudMessage,
    isCloudConnected,
    syncNowToCloud,
    pullFromCloud,
    testCloudConnection,
    connectCloudAccount,
    disconnectCloudAccount,
  } = useNeuroCare()
  const t = useTranslation()
  const navigate = useNavigate()
  const cs = CLOUD_SYNC_LABELS[state.user.preferredLanguage] ?? CLOUD_SYNC_LABELS.en

  const [fullName, setFullName] = useState(state.user.fullName)
  const [email, setEmail] = useState(state.user.email)
  const [phoneNumber, setPhoneNumber] = useState(state.user.phoneNumber ?? '')
  const [emergencyContactName, setEmergencyContactName] = useState(
    state.user.emergencyContactName ?? ''
  )
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    state.user.emergencyContactPhone ?? ''
  )
  const [city, setCity] = useState(state.user.city)
  const [ageRange, setAgeRange] = useState<AgeRange>(state.user.ageRange)
  const [sleepTarget, setSleepTarget] = useState(state.user.sleepHabitTargetHours)
  const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(
    state.user.activityLevel
  )
  const [conditionsText, setConditionsText] = useState(
    state.user.medicalConditions.join(', ')
  )
  const [savedBanner, setSavedBanner] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const [cloudEmail, setCloudEmail] = useState(state.user.email || '')
  const [cloudPassword, setCloudPassword] = useState('')
  const [cloudAuthFeedback, setCloudAuthFeedback] = useState('')
  const [cloudBusy, setCloudBusy] = useState(false)
  const [sqlCopied, setSqlCopied] = useState(false)

  const handleCopySql = () => {
    void navigator.clipboard?.writeText(NEUROCARE_SCHEMA_SQL).catch(() => undefined)
    setSqlCopied(true)
    setTimeout(() => setSqlCopied(false), 2500)
  }

  const handleTestCloud = async () => {
    setCloudBusy(true)
    setCloudAuthFeedback('')
    try {
      const res = await testCloudConnection()
      if (!res.gatewayOk) {
        setCloudAuthFeedback(res.error || 'Unable to reach Supabase gateway.')
      } else if (!res.schemaReady) {
        setCloudAuthFeedback(cs.statusLabels['schema-missing'])
      } else {
        setCloudAuthFeedback(cs.readyMessage)
      }
    } finally {
      setCloudBusy(false)
    }
  }

  const handleConnectCloud = async (mode: 'signin' | 'signup') => {
    if (!cloudEmail.trim() || cloudPassword.length < 6) {
      setCloudAuthFeedback(cs.passwordPlaceholder)
      return
    }
    setCloudBusy(true)
    setCloudAuthFeedback('')
    try {
      const res = await connectCloudAccount(mode, cloudEmail, cloudPassword)
      if (!res.ok) {
        setCloudAuthFeedback(res.error || 'Authentication error')
      } else if (res.needsVerification) {
        setCloudAuthFeedback(cs.statusLabels['needs-verification'])
      } else {
        setCloudPassword('')
        setCloudAuthFeedback(cs.statusLabels.synced)
      }
    } finally {
      setCloudBusy(false)
    }
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanPhone = phoneNumber.trim()
    const unchangedVerifiedPhone =
      Boolean(state.user.phoneVerified) &&
      cleanPhone.replace(/\s+/g, '') ===
        (state.user.phoneNumber ?? '').replace(/\s+/g, '')

    updateProfile({
      fullName: fullName.trim() || state.user.fullName,
      email: email.trim() || state.user.email,
      phoneNumber: cleanPhone || undefined,
      phoneVerified: cleanPhone ? unchangedVerifiedPhone : false,
      emergencyContactName: emergencyContactName.trim() || undefined,
      emergencyContactPhone: emergencyContactPhone.trim() || undefined,
      city: city.trim(),
      ageRange,
      preferredLanguage: state.user.preferredLanguage,
      sleepHabitTargetHours: sleepTarget,
      activityLevel,
      medicalConditions: conditionsText
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    })
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 3000)
  }

  const handleDeleteAccount = () => {
    deleteAccount()
    setDeleteModalOpen(false)
    navigate('/')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const wearableLabel =
    state.user.wearableProvider === 'None'
      ? t.wearableNone
      : state.user.wearableProvider

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Badge variant="primary">{t.profilePage.badge}</Badge>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0F3D3E]">
              {t.profilePage.title}
            </h1>
            <p className="text-sm text-[#4A5D5E]">
              {t.profilePage.subtitle}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 text-[#C6601F]" />
            {t.profilePage.logoutBtn}
          </Button>
        </div>

        {/* Personal & Health Profile Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#2E6F73]" />
              <CardTitle>{t.profilePage.personalCardTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {savedBanner && (
                <div className="flex items-center gap-2 rounded-xl border border-[#7FB388]/55 bg-[#7FB388]/20 px-3.5 py-2.5 text-xs font-semibold text-[#0F3D3E]">
                  <CheckCircle2 className="h-4 w-4 text-[#0F3D3E]" />
                  {t.profilePage.savedMsg}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.profilePage.fullName}
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.profilePage.email}
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="profile-phone"
                      className="text-xs font-semibold text-[#0F3D3E]"
                    >
                      {t.profilePage.phoneNumber}
                    </label>
                    {state.user.phoneVerified &&
                      phoneNumber.trim().replace(/\s+/g, '') ===
                        (state.user.phoneNumber ?? '').replace(/\s+/g, '') && (
                        <Badge
                          variant="success"
                          className="whitespace-normal text-start"
                        >
                          <CheckCircle2 className="h-3 w-3 shrink-0" />
                          <span>{t.profilePage.phoneVerifiedBadge}</span>
                        </Badge>
                      )}
                  </div>
                  <Input
                    id="profile-phone"
                    type="tel"
                    dir="ltr"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="profile-emergency-name"
                    className="text-xs font-semibold text-[#0F3D3E]"
                  >
                    {t.profilePage.emergencyContactName}
                  </label>
                  <Input
                    id="profile-emergency-name"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="profile-emergency-phone"
                    className="text-xs font-semibold text-[#0F3D3E]"
                  >
                    {t.profilePage.emergencyContactPhone}
                  </label>
                  <Input
                    id="profile-emergency-phone"
                    type="tel"
                    dir="ltr"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.profilePage.ageRange}
                  </label>
                  <Select
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value as AgeRange)}
                    className="mt-1"
                  >
                    <option value="18-29">18–29 {t.units.yearsSuffix}</option>
                    <option value="30-44">30–44 {t.units.yearsSuffix}</option>
                    <option value="45-54">45–54 {t.units.yearsSuffix}</option>
                    <option value="55-64">55–64 {t.units.yearsSuffix}</option>
                    <option value="65+">65+ {t.units.yearsSuffix}</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.profilePage.preferredLang}
                  </label>
                  <Select
                    value={state.user.preferredLanguage}
                    onChange={(e) => {
                      setContextLanguage(e.target.value as LanguageCode)
                    }}
                    className="mt-1"
                  >
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.nativeLabel} ({opt.label})
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.profilePage.cityLocation}
                  </label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.profilePage.sleepGoal}
                  </label>
                  <Input
                    type="number"
                    step={0.5}
                    min={5}
                    max={10}
                    value={sleepTarget}
                    onChange={(e) => setSleepTarget(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.profilePage.activityLevel}
                  </label>
                  <Select
                    value={activityLevel}
                    onChange={(e) =>
                      setActivityLevel(e.target.value as UserProfile['activityLevel'])
                    }
                    className="mt-1"
                  >
                    {(
                      ['Sedentary', 'Light', 'Moderate', 'Active'] as const
                    ).map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {t.activityLevels[lvl].label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.profilePage.optionalHealthNotes}
                  </label>
                  <Input
                    value={conditionsText}
                    onChange={(e) => setConditionsText(e.target.value)}
                    placeholder={t.profilePage.healthNotesPlaceholder}
                    className="mt-1"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary">
                {t.profilePage.saveChangesBtn}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Privacy & Data Consent Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#2E6F73]" />
              <CardTitle>{t.profilePage.privacyCardTitle}</CardTitle>
            </div>
            <CardDescription>{t.profilePage.privacyCardDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                key: 'wearableSyncConsent' as const,
                title: t.profilePage.privacyItems.wearableTitle,
                desc: `${t.profilePage.connectedProviderPrefix} ${wearableLabel}`,
              },
              {
                key: 'familyHistoryConsent' as const,
                title: t.profilePage.privacyItems.familyTitle,
                desc: t.profilePage.privacyItems.familyDesc,
              },
              {
                key: 'clinicianReportShareConsent' as const,
                title: t.profilePage.privacyItems.reportTitle,
                desc: t.profilePage.privacyItems.reportDesc,
              },
              {
                key: 'analyticsImprovementConsent' as const,
                title: t.profilePage.privacyItems.analyticsTitle,
                desc: t.profilePage.privacyItems.analyticsDesc,
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] px-4 py-3"
              >
                <div>
                  <p className="text-xs font-semibold text-[#0F3D3E]">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#4A5D5E]">{item.desc}</p>
                </div>
                <Switch
                  checked={state.user.consents[item.key]}
                  onCheckedChange={(val) =>
                    updateProfile({
                      wearableConnected:
                        item.key === 'wearableSyncConsent'
                          ? val
                          : state.user.wearableConnected,
                      consents: {
                        ...state.user.consents,
                        [item.key]: val,
                      },
                    })
                  }
                  aria-label={item.title}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#2E6F73]" />
              <CardTitle>{t.profilePage.notifCardTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                key: 'assessmentReminders' as const,
                title: t.profilePage.notifItems.assessmentTitle,
                desc: t.profilePage.notifItems.assessmentDesc,
              },
              {
                key: 'sleepCheckInReminders' as const,
                title: t.profilePage.notifItems.sleepTitle,
                desc: t.profilePage.notifItems.sleepDesc,
              },
              {
                key: 'dailyGoalNudges' as const,
                title: t.profilePage.notifItems.goalTitle,
                desc: t.profilePage.notifItems.goalDesc,
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] px-4 py-3"
              >
                <div>
                  <p className="text-xs font-semibold text-[#0F3D3E]">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#4A5D5E]">{item.desc}</p>
                </div>
                <Switch
                  checked={state.user.notificationPrefs[item.key]}
                  onCheckedChange={(val) =>
                    updateProfile({
                      notificationPrefs: {
                        ...state.user.notificationPrefs,
                        [item.key]: val,
                      },
                    })
                  }
                  aria-label={item.title}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Supabase Cloud Backend & Postgres Sync */}
        <Card className="border-[#2E6F73]/40">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-[#2E6F73]" />
                <CardTitle>{cs.title}</CardTitle>
              </div>
              <Badge
                variant={
                  cloudStatus === 'synced'
                    ? 'success'
                    : cloudStatus === 'schema-missing' || cloudStatus === 'needs-verification'
                      ? 'warning'
                      : cloudStatus === 'error'
                        ? 'danger'
                        : 'primary'
                }
                className="whitespace-normal text-start max-w-full"
              >
                <Cloud className="h-3 w-3 shrink-0" />
                <span>{cs.statusLabels[cloudStatus]}</span>
              </Badge>
            </div>
            <CardDescription>{cs.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-3">
                <p className="text-[11px] text-[#4A5D5E]">{cs.projectIdLabel}</p>
                <p dir="ltr" className="mt-0.5 text-xs font-mono font-bold text-[#0F3D3E]">
                  {SUPABASE_CONFIG.projectId || '—'}
                </p>
              </div>
              <div className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-3 min-w-0">
                <p className="text-[11px] text-[#4A5D5E]">{cs.endpointLabel}</p>
                <p
                  dir="ltr"
                  className="mt-0.5 text-xs font-mono font-semibold text-[#0F3D3E] truncate"
                  title={SUPABASE_CONFIG.restUrl}
                >
                  {SUPABASE_CONFIG.restUrl || cs.notConfigured}
                </p>
              </div>
            </div>

            {!SUPABASE_CONFIG.isConfigured ? (
              <div className="rounded-xl border border-[#C6601F]/40 bg-[#C6601F]/10 p-3 text-xs text-[#8C3F10]">
                {cs.notConfigured}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={cloudBusy}
                    onClick={() => void handleTestCloud()}
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-[#2E6F73]" />
                    {cs.testBtn}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopySql}
                  >
                    <Copy className="h-3.5 w-3.5 text-[#2E6F73]" />
                    {sqlCopied ? cs.copiedSqlBtn : cs.copySqlBtn}
                  </Button>
                  {isCloudConnected && (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={cloudBusy}
                        onClick={() => void syncNowToCloud()}
                      >
                        <Cloud className="h-3.5 w-3.5" />
                        {cs.syncNowBtn}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={cloudBusy}
                        onClick={() => void pullFromCloud()}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {cs.pullBtn}
                      </Button>
                    </>
                  )}
                </div>

                {isCloudConnected ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#7FB388]/55 bg-[#7FB388]/18 px-3.5 py-2.5 text-xs text-[#0F3D3E]">
                    <div className="space-y-0.5">
                      <p className="font-semibold">
                        {cs.connectedAsPrefix} <span dir="ltr">{cloudUserEmail}</span>
                      </p>
                      {cloudLastSyncedAt && (
                        <p className="text-[11px] text-[#263A3B]">
                          {cs.lastSyncedPrefix} {new Date(cloudLastSyncedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void disconnectCloudAccount()}
                    >
                      {cs.disconnectBtn}
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-3.5 space-y-3">
                    <p className="text-xs font-bold text-[#0F3D3E]">{cs.connectTitle}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        type="email"
                        value={cloudEmail}
                        onChange={(e) => setCloudEmail(e.target.value)}
                        placeholder={cs.emailPlaceholder}
                      />
                      <Input
                        type="password"
                        value={cloudPassword}
                        onChange={(e) => setCloudPassword(e.target.value)}
                        placeholder={cs.passwordPlaceholder}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={cloudBusy}
                        onClick={() => void handleConnectCloud('signin')}
                      >
                        {cs.signInBtn}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={cloudBusy}
                        onClick={() => void handleConnectCloud('signup')}
                      >
                        {cs.signUpBtn}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-[#2E6F73]/25 bg-[#EADCC8]/60 p-3 text-[11px] text-[#263A3B] space-y-1">
                  <p className="font-bold text-[#0F3D3E]">{cs.sqlGuideTitle}</p>
                  <p className="leading-relaxed">{cs.sqlGuideDesc}</p>
                </div>

                {(cloudAuthFeedback || cloudMessage) && (
                  <p
                    data-testid="supabase-feedback"
                    className="text-xs font-medium text-[#0F3D3E]"
                  >
                    {cloudAuthFeedback || cloudMessage}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Data Portability & Danger Zone */}
        <Card className="border-[#C6601F]/40">
          <CardHeader>
            <CardTitle>{t.profilePage.portabilityTitle}</CardTitle>
            <CardDescription>{t.profilePage.portabilityDesc}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={exportAllDataJson}>
              <Download className="h-4 w-4 text-[#2E6F73]" />
              {t.profilePage.downloadJsonBtn}
            </Button>
            <Button variant="secondary" onClick={resetDemoData}>
              <RotateCcw className="h-4 w-4" />
              {t.profilePage.restoreSampleBtn}
            </Button>
            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
              <Trash2 className="h-4 w-4" />
              {t.profilePage.deleteAcctBtn}
            </Button>
          </CardContent>
        </Card>

        <Modal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title={t.profilePage.deleteModalTitle}
          subtitle={t.profilePage.deleteModalSub}
        >
          <div className="space-y-4">
            <p className="text-xs text-[#263A3B] leading-relaxed">
              {t.profilePage.deleteModalBody}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                {t.cancel}
              </Button>
              <Button variant="danger" onClick={handleDeleteAccount}>
                {t.yesDeleteAll}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  )
}

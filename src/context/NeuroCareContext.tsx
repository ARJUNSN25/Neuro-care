import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createInitialDemoState } from '@/data/demoData'
import { TRANSLATIONS } from '@/data/translations'
import { DEFAULT_ML_SAMPLES } from '@/services/mlIntentEngine'
import { generateSimulatedAIResponse } from '@/services/neurocareAI'
import { SUPABASE_CONFIG, supabase } from '@/services/supabaseClient'
import {
  type CloudSyncStatus,
  getActiveSupabaseSession,
  isSyntheticDemoEmail,
  probeSupabaseBackend,
  pullCloudState,
  pushCloudState,
  signInSupabaseAccount,
  signOutSupabaseAccount,
  signUpSupabaseAccount,
} from '@/services/supabaseSync'
import type {
  AdminPatientRecord,
  AgeRange,
  ChatMessage,
  CognitiveAssessmentSession,
  ConsultationRecord,
  DoctorProfile,
  FamilyHistoryEntry,
  FamilyPrivacySettings,
  GameResult,
  LanguageCode,
  LifestyleLog,
  MLTrainingSample,
  NeuroCareState,
  PatientSetupChecklist,
  SleepLog,
  UploadedReport,
  UserProfile,
} from '@/types/neurocare'

const STORAGE_KEY = 'neurocare_state_v1'

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
  confirmPassword?: string
  phoneNumber: string
  phoneVerified: boolean
  city?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  ageRange: AgeRange
  preferredLanguage: LanguageCode
}

interface OnboardingPayload {
  city: string
  primaryGoals: string[]
  sleepHabitTargetHours: number
  activityLevel: UserProfile['activityLevel']
  mentalWellnessBaseline: string
  medicalConditions: string[]
  wearableConnected: boolean
  wearableProvider: UserProfile['wearableProvider']
  consents: UserProfile['consents']
  optionalFamilyEntry?: Omit<FamilyHistoryEntry, 'id' | 'addedAt'>
}

interface NeuroCareContextValue {
  state: NeuroCareState
  login: (email: string, password: string) => { ok: boolean; error?: string }
  loginDemo: () => void
  register: (payload: RegisterPayload) => { ok: boolean; error?: string }
  logout: () => void
  deleteAccount: () => void
  resetDemoData: () => void
  exportAllDataJson: () => void
  completeOnboarding: (payload: OnboardingPayload) => void
  updateProfile: (partial: Partial<UserProfile>) => void
  setLanguage: (lang: LanguageCode) => void
  addSleepLog: (log: Omit<SleepLog, 'id'>) => void
  addLifestyleLog: (log: Omit<LifestyleLog, 'id'>) => void
  addAssessmentSession: (session: Omit<CognitiveAssessmentSession, 'id'>) => void
  addGameResult: (result: Omit<GameResult, 'id'>) => void
  addFamilyEntry: (entry: Omit<FamilyHistoryEntry, 'id' | 'addedAt'>) => void
  removeFamilyEntry: (id: string) => void
  updateFamilyPrivacy: (partial: Partial<FamilyPrivacySettings>) => void
  toggleRecommendation: (id: string) => void
  toggleDailyGoal: (id: string) => void
  bookConsultation: (record: Omit<ConsultationRecord, 'id' | 'status'>) => string
  updateConsultationStatus: (
    consultationId: string,
    status: ConsultationRecord['status']
  ) => void
  addDoctor: (
    doctor: Omit<
      DoctorProfile,
      'id' | 'addedByAdmin' | 'isSampleProvider' | 'acceptingBookings'
    >
  ) => void
  toggleDoctorAvailability: (doctorId: string) => void
  removeDoctor: (doctorId: string) => void
  uploadClinicalReport: (report: Omit<UploadedReport, 'id' | 'uploadedAt'>) => void
  toggleReportShare: (id: string) => void
  sendChatMessage: (content: string, langOverride?: LanguageCode) => ChatMessage | null
  clearChatHistory: () => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addMLTrainingSample: (sample: Omit<MLTrainingSample, 'id'>) => void
  removeMLTrainingSample: (id: string) => void
  sendPatientNudge: (patientId: string) => void
  togglePatientSetupItem: (
    patientId: string,
    key: keyof PatientSetupChecklist
  ) => void
  addCoordinatorNote: (patientId: string, text: string) => void
  enrollDemoPatient: (payload: {
    fullName: string
    email: string
    ageRange: AgeRange
    city: string
    preferredLanguage: LanguageCode
    wearableProvider: UserProfile['wearableProvider']
  }) => void
  cloudStatus: CloudSyncStatus
  cloudUserEmail: string | null
  cloudLastSyncedAt: string | null
  cloudMessage: string | null
  isCloudConnected: boolean
  syncNowToCloud: () => Promise<{ ok: boolean; error?: string }>
  pullFromCloud: () => Promise<{ ok: boolean; error?: string }>
  testCloudConnection: () => Promise<{ gatewayOk: boolean; schemaReady: boolean; error?: string }>
  connectCloudAccount: (
    mode: 'signin' | 'signup',
    email: string,
    password: string
  ) => Promise<{ ok: boolean; needsVerification?: boolean; error?: string }>
  disconnectCloudAccount: () => Promise<void>
}

const NeuroCareContext = createContext<NeuroCareContextValue | null>(null)

function loadPersistedState(): NeuroCareState {
  const defaults = createInitialDemoState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<NeuroCareState>
    if (!parsed || !parsed.user || !Array.isArray(parsed.sleepLogs)) {
      return defaults
    }
    const validLang: LanguageCode =
      parsed.user.preferredLanguage &&
      parsed.user.preferredLanguage in TRANSLATIONS
        ? parsed.user.preferredLanguage
        : 'en'
    return {
      ...defaults,
      ...parsed,
      user: {
        ...defaults.user,
        ...parsed.user,
        preferredLanguage: validLang,
      },
      mlTrainingSamples: Array.isArray(parsed.mlTrainingSamples)
        ? [
            ...parsed.mlTrainingSamples.filter((s) => !s.isDefault),
            ...DEFAULT_ML_SAMPLES,
          ]
        : defaults.mlTrainingSamples,
      adminCohort:
        Array.isArray(parsed.adminCohort) && parsed.adminCohort.length > 0
          ? parsed.adminCohort
          : defaults.adminCohort,
      coordinatorNotes: Array.isArray(parsed.coordinatorNotes)
        ? parsed.coordinatorNotes
        : defaults.coordinatorNotes,
      doctors:
        Array.isArray(parsed.doctors) && parsed.doctors.length > 0
          ? parsed.doctors.map((d) => {
              const defMatch = defaults.doctors.find((dd) => dd.id === d.id)
              return {
                ...(defMatch ?? {}),
                ...d,
                locality: d.locality ?? defMatch?.locality ?? '',
                consultationModes:
                  d.consultationModes && d.consultationModes.length > 0
                    ? d.consultationModes
                    : defMatch?.consultationModes ?? ['online', 'offline'],
                availableSlots:
                  d.availableSlots && d.availableSlots.length > 0
                    ? d.availableSlots
                    : defMatch?.availableSlots ?? [
                        '09:30 AM',
                        '10:30 AM',
                        '04:00 PM',
                        '06:00 PM',
                      ],
                acceptingBookings: d.acceptingBookings ?? true,
              }
            })
          : defaults.doctors,
    }
  } catch {
    return defaults
  }
}

export function NeuroCareProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NeuroCareState>(() => loadPersistedState())
  const stateRef = useRef<NeuroCareState>(state)

  const [cloudUserId, setCloudUserId] = useState<string | null>(null)
  const [cloudUserEmail, setCloudUserEmail] = useState<string | null>(null)
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('local-only')
  const [cloudLastSyncedAt, setCloudLastSyncedAt] = useState<string | null>(null)
  const [cloudMessage, setCloudMessage] = useState<string | null>(null)
  const skipNextAutoSyncRef = useRef(false)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore storage quota errors in restricted browsers
    }
  }, [state])

  useEffect(() => {
    const lang = state.user.preferredLanguage
    const dir = TRANSLATIONS[lang]?.dir ?? 'ltr'
    document.documentElement.dir = dir
    document.documentElement.lang = lang
  }, [state.user.preferredLanguage])

  const syncWithUserId = useCallback(async (uid: string, snapshot: NeuroCareState) => {
    setCloudStatus('syncing')
    const res = await pushCloudState(uid, snapshot)
    if (res.ok) {
      setCloudStatus('synced')
      setCloudLastSyncedAt(res.syncedAt ?? new Date().toISOString())
      setCloudMessage(null)
      return { ok: true }
    }
    if (res.schemaMissing) {
      setCloudStatus('schema-missing')
      setCloudMessage(res.error ?? null)
      return { ok: false, error: res.error }
    }
    setCloudStatus('error')
    setCloudMessage(res.error ?? null)
    return { ok: false, error: res.error }
  }, [])

  const pullWithUserId = useCallback(async (uid: string) => {
    setCloudStatus('syncing')
    const res = await pullCloudState(uid)
    if (!res.ok) {
      if (res.schemaMissing) {
        setCloudStatus('schema-missing')
      } else {
        setCloudStatus('error')
      }
      setCloudMessage(res.error ?? null)
      return { ok: false, error: res.error }
    }
    if (res.state && res.state.user) {
      skipNextAutoSyncRef.current = true
      setState((prev) => ({
        ...prev,
        ...res.state,
        isAuthenticated: prev.isAuthenticated || Boolean(res.state?.isAuthenticated),
        user: {
          ...prev.user,
          ...res.state?.user,
        },
      }))
      setCloudLastSyncedAt(res.updatedAt ?? new Date().toISOString())
    }
    setCloudStatus('synced')
    setCloudMessage(null)
    return { ok: true }
  }, [])

  // Restore active Supabase session if present & subscribe to auth state
  useEffect(() => {
    if (!SUPABASE_CONFIG.isConfigured || !supabase) return
    let mounted = true

    void getActiveSupabaseSession().then((session) => {
      if (!mounted || !session?.user) return
      setCloudUserId(session.user.id)
      setCloudUserEmail(session.user.email ?? null)
      void pullWithUserId(session.user.id)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (session?.user) {
        setCloudUserId(session.user.id)
        setCloudUserEmail(session.user.email ?? null)
      } else {
        setCloudUserId(null)
        setCloudUserEmail(null)
        setCloudStatus((prev) => (prev === 'needs-verification' ? prev : 'local-only'))
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [pullWithUserId])

  // Debounced real-time background sync whenever authenticated state updates in Supabase mode
  useEffect(() => {
    if (!cloudUserId || !state.isAuthenticated || !SUPABASE_CONFIG.isConfigured) return
    if (skipNextAutoSyncRef.current) {
      skipNextAutoSyncRef.current = false
      return
    }
    const timer = window.setTimeout(() => {
      void syncWithUserId(cloudUserId, stateRef.current)
    }, 900)
    return () => window.clearTimeout(timer)
  }, [state, cloudUserId, syncWithUserId])

  const syncNowToCloud = useCallback(async () => {
    if (!cloudUserId) {
      return { ok: false, error: 'Not signed in to Supabase Auth session' }
    }
    return syncWithUserId(cloudUserId, stateRef.current)
  }, [cloudUserId, syncWithUserId])

  const pullFromCloud = useCallback(async () => {
    if (!cloudUserId) {
      return { ok: false, error: 'Not signed in to Supabase Auth session' }
    }
    return pullWithUserId(cloudUserId)
  }, [cloudUserId, pullWithUserId])

  const testCloudConnection = useCallback(async () => {
    const res = await probeSupabaseBackend()
    if (res.gatewayOk && !res.schemaReady) {
      setCloudStatus('schema-missing')
      setCloudMessage(res.error ?? null)
    } else if (!res.gatewayOk) {
      setCloudStatus('error')
      setCloudMessage(res.error ?? null)
    } else if (cloudUserId) {
      setCloudStatus('synced')
      setCloudMessage(null)
    } else {
      setCloudStatus('local-only')
      setCloudMessage(null)
    }
    return res
  }, [cloudUserId])

  const connectCloudAccount = useCallback(
    async (mode: 'signin' | 'signup', email: string, password: string) => {
      if (mode === 'signup') {
        const res = await signUpSupabaseAccount({
          email,
          password,
          fullName: stateRef.current.user.fullName,
          phoneNumber: stateRef.current.user.phoneNumber,
          city: stateRef.current.user.city,
          ageRange: stateRef.current.user.ageRange,
          preferredLanguage: stateRef.current.user.preferredLanguage,
        })
        if (!res.ok) {
          setCloudStatus('error')
          setCloudMessage(res.error ?? null)
          return { ok: false, error: res.error }
        }
        if (res.needsEmailConfirmation) {
          setCloudStatus('needs-verification')
          setCloudMessage('Confirmation email sent via Supabase Auth.')
          return { ok: true, needsVerification: true }
        }
        if (res.session?.user) {
          setCloudUserId(res.session.user.id)
          setCloudUserEmail(res.session.user.email ?? email.trim())
          await syncWithUserId(res.session.user.id, stateRef.current)
          return { ok: true }
        }
        return { ok: true }
      }

      const res = await signInSupabaseAccount(email, password)
      if (!res.ok || !res.session?.user) {
        setCloudStatus('error')
        setCloudMessage(res.error ?? null)
        return { ok: false, error: res.error }
      }
      setCloudUserId(res.session.user.id)
      setCloudUserEmail(res.session.user.email ?? email.trim())
      const pulled = await pullWithUserId(res.session.user.id)
      if (pulled.ok && !pulled.error) {
        await syncWithUserId(res.session.user.id, stateRef.current)
      }
      return { ok: true }
    },
    [pullWithUserId, syncWithUserId]
  )

  const disconnectCloudAccount = useCallback(async () => {
    await signOutSupabaseAccount()
    setCloudUserId(null)
    setCloudUserEmail(null)
    setCloudStatus('local-only')
    setCloudMessage(null)
  }, [])

  const login = (email: string, password: string) => {
    const err = (TRANSLATIONS[state.user.preferredLanguage] ?? TRANSLATIONS.en).authErrors
    if (!email.trim() || !email.includes('@')) {
      return { ok: false, error: err.invalidEmail }
    }
    if (password.trim().length < 6) {
      return { ok: false, error: err.passwordShort }
    }
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      user: {
        ...prev.user,
        email: email.trim(),
      },
    }))
    if (SUPABASE_CONFIG.isConfigured && !isSyntheticDemoEmail(email)) {
      void signInSupabaseAccount(email, password).then((res) => {
        if (res.ok && res.session?.user) {
          setCloudUserId(res.session.user.id)
          setCloudUserEmail(res.session.user.email ?? email.trim())
          void pullWithUserId(res.session.user.id)
        }
      })
    }
    return { ok: true }
  }

  const loginDemo = () => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
    }))
  }

  const register = (payload: RegisterPayload) => {
    const err = (
      TRANSLATIONS[payload.preferredLanguage] ??
      TRANSLATIONS[state.user.preferredLanguage] ??
      TRANSLATIONS.en
    ).authErrors
    if (!payload.fullName.trim()) {
      return { ok: false, error: err.nameRequired }
    }
    const cleanEmail = payload.email.trim()
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { ok: false, error: err.invalidEmail }
    }
    const phoneDigits = (payload.phoneNumber || '').replace(/\D/g, '')
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      return { ok: false, error: err.invalidPhone }
    }
    if (!payload.phoneVerified) {
      return { ok: false, error: err.phoneOtpRequired }
    }
    if (payload.password.length < 6) {
      return { ok: false, error: err.passwordShort }
    }
    if (
      payload.confirmPassword !== undefined &&
      payload.password !== payload.confirmPassword
    ) {
      return { ok: false, error: err.passwordMismatch }
    }
    const base = createInitialDemoState()
    const nextState: NeuroCareState = {
      ...base,
      isAuthenticated: true,
      user: {
        ...base.user,
        id: `usr-${Date.now()}`,
        fullName: payload.fullName.trim(),
        email: cleanEmail,
        phoneNumber: payload.phoneNumber.trim(),
        phoneVerified: true,
        emergencyContactName: payload.emergencyContactName?.trim() || undefined,
        emergencyContactPhone: payload.emergencyContactPhone?.trim() || undefined,
        city: payload.city?.trim() || base.user.city,
        ageRange: payload.ageRange,
        preferredLanguage: payload.preferredLanguage,
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
      },
    }
    setState(nextState)
    if (SUPABASE_CONFIG.isConfigured && !isSyntheticDemoEmail(cleanEmail)) {
      void signUpSupabaseAccount({
        email: cleanEmail,
        password: payload.password,
        fullName: payload.fullName,
        phoneNumber: payload.phoneNumber,
        city: payload.city,
        ageRange: payload.ageRange,
        preferredLanguage: payload.preferredLanguage,
      }).then((res) => {
        if (res.needsEmailConfirmation) {
          setCloudStatus('needs-verification')
        } else if (res.ok && res.session?.user) {
          setCloudUserId(res.session.user.id)
          setCloudUserEmail(res.session.user.email ?? cleanEmail)
          void syncWithUserId(res.session.user.id, nextState)
        }
      })
    }
    return { ok: true }
  }

  const logout = () => {
    void signOutSupabaseAccount()
    setCloudUserId(null)
    setCloudUserEmail(null)
    setCloudStatus('local-only')
    setState((prev) => ({
      ...prev,
      isAuthenticated: false,
    }))
  }

  const deleteAccount = () => {
    void signOutSupabaseAccount()
    setCloudUserId(null)
    setCloudUserEmail(null)
    setCloudStatus('local-only')
    localStorage.removeItem(STORAGE_KEY)
    const fresh = createInitialDemoState()
    setState({
      ...fresh,
      isAuthenticated: false,
    })
  }

  const resetDemoData = () => {
    const fresh = createInitialDemoState()
    setState({
      ...fresh,
      isAuthenticated: true,
    })
  }

  const exportAllDataJson = () => {
    const dataStr = JSON.stringify(state, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `neurocare-personal-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const completeOnboarding = (payload: OnboardingPayload) => {
    setState((prev) => {
      const nextFamily = payload.optionalFamilyEntry
        ? [
            {
              ...payload.optionalFamilyEntry,
              id: `fh-${Date.now()}`,
              addedAt: new Date().toISOString().slice(0, 10),
            },
            ...prev.familyHistory,
          ]
        : prev.familyHistory

      return {
        ...prev,
        familyHistory: nextFamily,
        user: {
          ...prev.user,
          city: payload.city || prev.user.city,
          primaryGoals: payload.primaryGoals,
          sleepHabitTargetHours: payload.sleepHabitTargetHours,
          activityLevel: payload.activityLevel,
          mentalWellnessBaseline: payload.mentalWellnessBaseline,
          medicalConditions: payload.medicalConditions,
          wearableConnected: payload.wearableConnected,
          wearableProvider: payload.wearableProvider,
          consents: payload.consents,
          onboardingCompleted: true,
        },
      }
    })
  }

  const updateProfile = (partial: Partial<UserProfile>) => {
    setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        ...partial,
      },
    }))
  }

  const setLanguage = (lang: LanguageCode) => {
    setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        preferredLanguage: lang,
      },
    }))
  }

  const addSleepLog = (log: Omit<SleepLog, 'id'>) => {
    setState((prev) => {
      const filtered = prev.sleepLogs.filter((s) => s.date !== log.date)
      return {
        ...prev,
        sleepLogs: [{ ...log, id: `sl-${Date.now()}`, isSample: false }, ...filtered].sort(
          (a, b) => a.date.localeCompare(b.date)
        ),
      }
    })
  }

  const addLifestyleLog = (log: Omit<LifestyleLog, 'id'>) => {
    setState((prev) => {
      const filtered = prev.lifestyleLogs.filter((l) => l.date !== log.date)
      return {
        ...prev,
        lifestyleLogs: [{ ...log, id: `lf-${Date.now()}`, isSample: false }, ...filtered].sort(
          (a, b) => a.date.localeCompare(b.date)
        ),
      }
    })
  }

  const addAssessmentSession = (session: Omit<CognitiveAssessmentSession, 'id'>) => {
    setState((prev) => {
      const lang = prev.user.preferredLanguage ?? 'en'
      const justNow: Record<LanguageCode, string> = {
        en: 'Just now',
        kn: 'ಈಗಷ್ಟೇ',
        hi: 'अभी',
        ar: 'الآن',
        ta: 'இப்போது',
      }
      const notifTitle: Record<LanguageCode, string> = {
        en: 'Cognitive Check-in Recorded',
        kn: 'ಅರಿವಿನ ತಪಾಸಣೆ ದಾಖಲಾಗಿದೆ',
        hi: 'संज्ञानात्मक जांच दर्ज की गई',
        ar: 'تم تسجيل الفحص الإدراكي',
        ta: 'அறிவாற்றல் சோதனை பதிவு செய்யப்பட்டது',
      }
      const notifMsg: Record<LanguageCode, string> = {
        en: `Completed 6-domain session (${session.taskPerformancePct}% task accuracy). View your updated trends.`,
        kn: `6-ಕ್ಷೇತ್ರಗಳ ಅವಧಿ ಪೂರ್ಣಗೊಂಡಿದೆ (${session.taskPerformancePct}% ಕಾರ್ಯ ನಿಖರತೆ).`,
        hi: `6-डोमेन सत्र पूरा हुआ (${session.taskPerformancePct}% कार्य सटीकता)।`,
        ar: `اكتملت جلسة المجالات الستة (${session.taskPerformancePct}% دقة المهام).`,
        ta: `6-பிரிவு அமர்வு முடிந்தது (${session.taskPerformancePct}% பணி துல்லியம்).`,
      }
      return {
        ...prev,
        assessments: [
          ...prev.assessments,
          { ...session, id: `asmt-${Date.now()}`, isSample: false },
        ],
        notifications: [
          {
            id: `not-${Date.now()}`,
            title: notifTitle[lang],
            message: notifMsg[lang],
            timeLabel: justNow[lang],
            kind: 'insight',
            read: false,
            route: '/analytics',
          },
          ...prev.notifications,
        ],
      }
    })
  }

  const addGameResult = (result: Omit<GameResult, 'id'>) => {
    setState((prev) => ({
      ...prev,
      gameResults: [
        { ...result, id: `gm-${Date.now()}`, isSample: false },
        ...prev.gameResults,
      ],
    }))
  }

  const addFamilyEntry = (entry: Omit<FamilyHistoryEntry, 'id' | 'addedAt'>) => {
    setState((prev) => ({
      ...prev,
      familyHistory: [
        {
          ...entry,
          id: `fh-${Date.now()}`,
          addedAt: new Date().toISOString().slice(0, 10),
          isSample: false,
        },
        ...prev.familyHistory,
      ],
    }))
  }

  const removeFamilyEntry = (id: string) => {
    setState((prev) => ({
      ...prev,
      familyHistory: prev.familyHistory.filter((f) => f.id !== id),
    }))
  }

  const updateFamilyPrivacy = (partial: Partial<FamilyPrivacySettings>) => {
    setState((prev) => ({
      ...prev,
      familyPrivacy: {
        ...prev.familyPrivacy,
        ...partial,
      },
    }))
  }

  const toggleRecommendation = (id: string) => {
    setState((prev) => ({
      ...prev,
      recommendations: prev.recommendations.map((rec) =>
        rec.id === id
          ? {
              ...rec,
              completed: !rec.completed,
              completedAt: !rec.completed
                ? new Date().toISOString().slice(0, 10)
                : undefined,
            }
          : rec
      ),
    }))
  }

  const toggleDailyGoal = (id: string) => {
    setState((prev) => ({
      ...prev,
      dailyGoals: prev.dailyGoals.map((g) =>
        g.id === id ? { ...g, completed: !g.completed } : g
      ),
    }))
  }

  const bookConsultation = (record: Omit<ConsultationRecord, 'id' | 'status'>) => {
    const bookingCode =
      record.bookingCode || `NC-${Math.floor(1000 + Math.random() * 8999)}`
    setState((prev) => {
      const lang = prev.user.preferredLanguage ?? 'en'
      const matchedDoc = prev.doctors.find((d) => d.id === record.doctorId)
      const justNow: Record<LanguageCode, string> = {
        en: 'Just now',
        kn: 'ಈಗಷ್ಟೇ',
        hi: 'अभी',
        ar: 'الآن',
        ta: 'இப்போது',
      }
      const notifTitle: Record<LanguageCode, string> = {
        en: 'Demo Appointment Request Logged',
        kn: 'ಡೆಮೊ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ವಿನಂತಿ ದಾಖಲಾಗಿದೆ',
        hi: 'डेमो अपॉइंटमेंट अनुरोध दर्ज हुआ',
        ar: 'تم تسجيل طلب الموعد التجريبي',
        ta: 'டெமோ சந்திப்பு கோரிக்கை பதிவு செய்யப்பட்டது',
      }
      const notifMsg: Record<LanguageCode, string> = {
        en: `Demo consultation (${bookingCode}) scheduled with ${record.doctorName} on ${record.date} at ${record.timeSlot}.`,
        kn: `${record.doctorName} ಅವರೊಂದಿಗೆ ${record.date} (${record.timeSlot}) ಡೆಮೊ ಸಮಾಲೋಚನೆ (${bookingCode}) ನಿಗದಿಯಾಗಿದೆ.`,
        hi: `${record.doctorName} के साथ ${record.date} को ${record.timeSlot} पर डेमो परामर्श (${bookingCode}) तय किया गया।`,
        ar: `تمت جدولة استشارة تجريبية (${bookingCode}) مع ${record.doctorName} بتاريخ ${record.date} الساعة ${record.timeSlot}.`,
        ta: `${record.doctorName} உடன் ${record.date} அன்று ${record.timeSlot} மணிக்கு டெமோ ஆலோசனை (${bookingCode}) திட்டமிடப்பட்டது.`,
      }
      return {
        ...prev,
        consultations: [
          {
            ...record,
            id: `cons-${Date.now()}`,
            bookingCode,
            status: 'Confirmed (Demo)',
            patientName: record.patientName || prev.user.fullName,
            patientCity: record.patientCity || prev.user.city,
            clinicCity: record.clinicCity || matchedDoc?.city,
            clinicLocality: record.clinicLocality || matchedDoc?.locality,
            hospitalOrClinic:
              record.hospitalOrClinic || matchedDoc?.hospitalOrClinic,
            isSample: false,
          },
          ...prev.consultations,
        ],
        notifications: [
          {
            id: `not-${Date.now()}`,
            title: notifTitle[lang],
            message: notifMsg[lang],
            timeLabel: justNow[lang],
            kind: 'clinical',
            read: false,
            route: '/clinical-support',
          },
          ...prev.notifications,
        ],
      }
    })
    return bookingCode
  }

  const updateConsultationStatus = (
    consultationId: string,
    status: ConsultationRecord['status']
  ) => {
    setState((prev) => ({
      ...prev,
      consultations: prev.consultations.map((c) =>
        c.id === consultationId ? { ...c, status } : c
      ),
    }))
  }

  const addDoctor = (
    doctor: Omit<
      DoctorProfile,
      'id' | 'addedByAdmin' | 'isSampleProvider' | 'acceptingBookings'
    >
  ) => {
    const newDoctor: DoctorProfile = {
      ...doctor,
      id: `doc-admin-${Date.now()}`,
      consultationModes:
        doctor.consultationModes && doctor.consultationModes.length > 0
          ? doctor.consultationModes
          : ['online', 'offline'],
      availableSlots:
        doctor.availableSlots && doctor.availableSlots.length > 0
          ? doctor.availableSlots
          : ['09:30 AM', '10:30 AM', '04:00 PM', '06:00 PM'],
      acceptingBookings: true,
      addedByAdmin: true,
      isSampleProvider: false,
    }
    setState((prev) => ({
      ...prev,
      doctors: [newDoctor, ...prev.doctors],
    }))
  }

  const toggleDoctorAvailability = (doctorId: string) => {
    setState((prev) => ({
      ...prev,
      doctors: prev.doctors.map((d) =>
        d.id === doctorId
          ? { ...d, acceptingBookings: !(d.acceptingBookings ?? true) }
          : d
      ),
    }))
  }

  const removeDoctor = (doctorId: string) => {
    setState((prev) => ({
      ...prev,
      doctors: prev.doctors.filter((d) => d.id !== doctorId),
    }))
  }

  const uploadClinicalReport = (report: Omit<UploadedReport, 'id' | 'uploadedAt'>) => {
    setState((prev) => ({
      ...prev,
      uploadedReports: [
        {
          ...report,
          id: `rep-${Date.now()}`,
          uploadedAt: new Date().toISOString().slice(0, 10),
        },
        ...prev.uploadedReports,
      ],
    }))
  }

  const toggleReportShare = (id: string) => {
    setState((prev) => ({
      ...prev,
      uploadedReports: prev.uploadedReports.map((r) =>
        r.id === id ? { ...r, sharedWithClinician: !r.sharedWithClinician } : r
      ),
    }))
  }

  const sendChatMessage = (
    content: string,
    langOverride?: LanguageCode
  ): ChatMessage | null => {
    const trimmed = content.trim()
    if (!trimmed) return null

    const nowMs = Date.now()
    const userMsg: ChatMessage = {
      id: `msg-u-${nowMs}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(nowMs).toISOString(),
    }

    const {
      reply,
      englishSummary,
      followUps,
      mlIntent,
      mlConfidence,
      language,
    } = generateSimulatedAIResponse(trimmed, stateRef.current, langOverride)

    const assistantMsg: ChatMessage = {
      id: `msg-a-${nowMs + 1}`,
      role: 'assistant',
      content: reply,
      englishSummary,
      timestamp: new Date(nowMs + 1).toISOString(),
      suggestedFollowUps: followUps,
      mlIntent,
      mlConfidence,
      language,
    }

    setState((prev) => ({
      ...prev,
      chatHistory: [...prev.chatHistory, userMsg, assistantMsg],
    }))

    return assistantMsg
  }

  const clearChatHistory = () => {
    setState((prev) => ({
      ...prev,
      chatHistory: createInitialDemoState().chatHistory,
    }))
  }

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }))
  }

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }))
  }

  const addMLTrainingSample = (sample: Omit<MLTrainingSample, 'id'>) => {
    setState((prev) => ({
      ...prev,
      mlTrainingSamples: [
        { ...sample, id: `ml-custom-${Date.now()}` },
        ...prev.mlTrainingSamples,
      ],
    }))
  }

  const removeMLTrainingSample = (id: string) => {
    setState((prev) => ({
      ...prev,
      mlTrainingSamples: prev.mlTrainingSamples.filter((m) => m.id !== id),
    }))
  }

  const sendPatientNudge = (patientId: string) => {
    setState((prev) => ({
      ...prev,
      adminCohort: prev.adminCohort.map((p) =>
        p.id === patientId
          ? {
              ...p,
              nudgeSentCount: p.nudgeSentCount + 1,
              lastActiveLabel: 'Nudge sent just now',
            }
          : p
      ),
    }))
  }

  const togglePatientSetupItem = (
    patientId: string,
    key: keyof PatientSetupChecklist
  ) => {
    setState((prev) => ({
      ...prev,
      adminCohort: prev.adminCohort.map((p) =>
        p.id === patientId
          ? {
              ...p,
              setupChecklist: {
                ...p.setupChecklist,
                [key]: !p.setupChecklist[key],
              },
            }
          : p
      ),
    }))
  }

  const addCoordinatorNote = (patientId: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setState((prev) => ({
      ...prev,
      coordinatorNotes: [
        {
          id: `cn-${Date.now()}`,
          patientId,
          author: 'Admin Care Coordinator (Demo)',
          text: trimmed,
          createdAt: new Date().toLocaleString(),
        },
        ...prev.coordinatorNotes,
      ],
    }))
  }

  const enrollDemoPatient = (payload: {
    fullName: string
    email: string
    ageRange: AgeRange
    city: string
    preferredLanguage: LanguageCode
    wearableProvider: UserProfile['wearableProvider']
  }) => {
    const newPatient: AdminPatientRecord = {
      id: `pat-${Math.floor(200 + Math.random() * 799)}`,
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      ageRange: payload.ageRange,
      city: payload.city.trim() || 'Bengaluru, India',
      preferredLanguage: payload.preferredLanguage,
      enrolledDate: new Date().toISOString().slice(0, 10),
      lastActiveLabel: 'Enrolled just now',
      status: 'Insufficient information',
      setupChecklist: {
        accountCreated: true,
        onboardingCompleted: false,
        wearableSynced: payload.wearableProvider !== 'None',
        baselineAssessmentDone: false,
        sleepTrackingActive: false,
        lifestyleTrackingActive: false,
        familyContextReviewed: false,
      },
      latestTaskAccuracyPct: null,
      latestFunctionalPct: null,
      avgSleepHours7d: 0,
      avgSteps7d: 0,
      avgStress7d: 0,
      assessmentsCount: 0,
      gamesPlayedCount: 0,
      wearableProvider: payload.wearableProvider,
      physicalFocusSuggestion: 'Pending setup: Complete onboarding activity baseline.',
      cognitiveFocusSuggestion: 'Pending setup: Schedule first morning 6-domain check-in.',
      nudgeSentCount: 0,
      isSampleCohort: false,
    }
    setState((prev) => ({
      ...prev,
      adminCohort: [newPatient, ...prev.adminCohort],
    }))
  }

  return (
    <NeuroCareContext.Provider
      value={{
        state,
        login,
        loginDemo,
        register,
        logout,
        deleteAccount,
        resetDemoData,
        exportAllDataJson,
        completeOnboarding,
        updateProfile,
        setLanguage,
        addSleepLog,
        addLifestyleLog,
        addAssessmentSession,
        addGameResult,
        addFamilyEntry,
        removeFamilyEntry,
        updateFamilyPrivacy,
        toggleRecommendation,
        toggleDailyGoal,
        bookConsultation,
        updateConsultationStatus,
        addDoctor,
        toggleDoctorAvailability,
        removeDoctor,
        uploadClinicalReport,
        toggleReportShare,
        sendChatMessage,
        clearChatHistory,
        markNotificationRead,
        markAllNotificationsRead,
        addMLTrainingSample,
        removeMLTrainingSample,
        sendPatientNudge,
        togglePatientSetupItem,
        addCoordinatorNote,
        enrollDemoPatient,
        cloudStatus,
        cloudUserEmail,
        cloudLastSyncedAt,
        cloudMessage,
        isCloudConnected: Boolean(cloudUserId),
        syncNowToCloud,
        pullFromCloud,
        testCloudConnection,
        connectCloudAccount,
        disconnectCloudAccount,
      }}
    >
      {children}
    </NeuroCareContext.Provider>
  )
}

export function useNeuroCare() {
  const ctx = useContext(NeuroCareContext)
  if (!ctx) {
    throw new Error('useNeuroCare must be used within NeuroCareProvider')
  }
  return ctx
}


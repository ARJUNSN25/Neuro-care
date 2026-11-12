import React, { useCallback, useMemo, useState } from 'react'
import {
  BarChart3,
  BellRing,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Moon,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Video,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  PatientActivityModal,
  type PatientModalTab,
} from '@/components/admin/PatientActivityModal'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Progress } from '@/components/ui/Progress'
import {
  LANGUAGE_OPTIONS,
  getLocalizedCityLabel,
  getLocalizedCohortPatient,
  getLocalizedDoctor,
} from '@/data/translations'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import {
  isAdminSessionUnlocked,
  lockAdminSession,
  unlockAdminSession,
  verifyAdminCredentials,
} from '@/services/adminAuth'
import { computeBrainHealthReport } from '@/services/neurocareAI'
import type {
  AdminPatientRecord,
  AgeRange,
  ConsultationChannel,
  ConsultationRecord,
  LanguageCode,
  PatientSetupChecklist,
  SpecialistCategory,
  UserProfile,
} from '@/types/neurocare'
import { cn } from '@/utils/cn'

const DOCTOR_SPECIALTIES: Exclude<SpecialistCategory, 'All'>[] = [
  'Neurologist',
  'Cognitive Neuropsychologist',
  'Geriatric Psychiatrist',
  'Sleep Specialist',
  'Preventive Lifestyle Physician',
]

const PRESET_TIME_SLOTS = [
  '09:30 AM',
  '10:30 AM',
  '11:15 AM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
  '06:00 PM',
  '07:30 PM',
]

const SUGGESTED_CITIES = [
  'Bengaluru',
  'Mysuru',
  'Pune',
  'Chennai',
  'Hyderabad',
  'Kolkata',
  'Mumbai',
  'Delhi',
  'Kochi',
  'Dubai',
]

const SETUP_STEP_KEYS: (keyof PatientSetupChecklist)[] = [
  'accountCreated',
  'onboardingCompleted',
  'wearableSynced',
  'baselineAssessmentDone',
  'sleepTrackingActive',
  'lifestyleTrackingActive',
  'familyContextReviewed',
]

function calcSetupPct(c: PatientSetupChecklist): number {
  const vals = Object.values(c)
  const done = vals.filter(Boolean).length
  return Math.round((done / vals.length) * 100)
}

const LIVE_FOCUS_SUGGESTIONS: Record<
  LanguageCode,
  { physicalLow: string; physicalGood: string; cognitive: string }
> = {
  en: {
    physicalLow:
      'Aim to lift walking toward 8,000 steps/day with a 30-min morning walk.',
    physicalGood:
      'Maintain brisk movement + add 15-min Surya Namaskar & stretching.',
    cognitive: 'Continue rested morning 6-domain check-ins and Memory Games.',
  },
  kn: {
    physicalLow:
      'ದೈನಂದಿನ 30-ನಿಮಿಷ ಬೆಳಗಿನ ನಡಿಗೆಯೊಂದಿಗೆ 8,000 ಹೆಜ್ಜೆಗಳ ಗುರಿ ತಲುಪಿ.',
    physicalGood:
      'ಚುರುಕಾದ ನಡಿಗೆಯನ್ನು ಮುಂದುವರಿಸಿ + 15 ನಿಮಿಷ ಸೂರ್ಯ ನಮಸ್ಕಾರ ಮತ್ತು ಸ್ಟ್ರೆಚಿಂಗ್ ಸೇರಿಸಿ.',
    cognitive:
      'ವಿಶ್ರಾಂತಿ ಪಡೆದ ಬೆಳಿಗ್ಗೆ 6-ವಿಭಾಗದ ತಪಾಸಣೆ ಮತ್ತು ಮೆಮೊರಿ ಆಟಗಳನ್ನು ಮುಂದುವರಿಸಿ.',
  },
  hi: {
    physicalLow:
      'सुबह 30 मिनट की सैर के साथ रोज़ाना 8,000 कदमों का लक्ष्य रखें।',
    physicalGood:
      'तेज़ चलना जारी रखें + 15 मिनट सूर्य नमस्कार और स्ट्रेचिंग जोड़ें।',
    cognitive: 'अच्छी नींद के बाद सुबह 6-डोमेन जांच और मेमोरी गेम्स जारी रखें।',
  },
  ar: {
    physicalLow:
      'احرص على رفع المشي نحو 8,000 خطوة يومياً مع مشي صباحي لمدة 30 دقيقة.',
    physicalGood:
      'حافظ على النشاط السريع وأضف 15 دقيقة من التمدد واليوغا التنفسية.',
    cognitive:
      'واصل الفحص الإدراكي الصباحي المكون من 6 مجالات وألعاب الذاكرة.',
  },
  ta: {
    physicalLow:
      'காலை 30 நிமிட நடைப்பயிற்சியுடன் தினமும் 8,000 படிகளை இலக்காகக் கொள்ளுங்கள்.',
    physicalGood:
      'சுறுசுறுப்பான நடையைத் தொடருங்கள் + 15 நிமிட சூரிய நமஸ்காரம் & நீட்டிப்பு சேர்க்கவும்.',
    cognitive:
      'ஓய்வெடுத்த காலை 6-பிரிவு சோதனைகள் மற்றும் நினைவாற்றல் விளையாட்டுகளைத் தொடருங்கள்.',
  },
}

export default function AdminPortal() {
  const {
    state,
    sendPatientNudge,
    togglePatientSetupItem,
    addCoordinatorNote,
    enrollDemoPatient,
    addDoctor,
    toggleDoctorAvailability,
    removeDoctor,
    updateConsultationStatus,
  } = useNeuroCare()
  const t = useTranslation()
  const lang = state.user.preferredLanguage ?? 'en'

  // Strict Admin Portal Authentication State (Zero credential exposure in UI)
  const [adminUnlocked, setAdminUnlocked] = useState<boolean>(() =>
    isAdminSessionUnlocked()
  )
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showAdminPass, setShowAdminPass] = useState(false)
  const [adminAuthError, setAdminAuthError] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'incomplete' | 'active' | 'attention'
  >('all')
  const [langFilter, setLangFilter] = useState<'all' | LanguageCode>('all')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [modalInitialTab, setModalInitialTab] =
    useState<PatientModalTab>('overview')
  const [newNoteText, setNewNoteText] = useState('')
  const [nudgeBanner, setNudgeBanner] = useState('')

  // New Patient Enrollment modal state
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newCity, setNewCity] = useState('Bengaluru, India')
  const [newAge, setNewAge] = useState<AgeRange>('45-54')
  const [newLang, setNewLang] = useState<LanguageCode>('kn')
  const [newWearable, setNewWearable] =
    useState<UserProfile['wearableProvider']>('Google Fit')

  // Admin Doctor Directory filter & Add Doctor modal state
  const [docCityFilter, setDocCityFilter] = useState<string>('all')
  const [addDoctorOpen, setAddDoctorOpen] = useState(false)
  const [docName, setDocName] = useState('')
  const [docSpecialty, setDocSpecialty] =
    useState<Exclude<SpecialistCategory, 'All'>>('Neurologist')
  const [docCredentials, setDocCredentials] = useState('')
  const [docClinic, setDocClinic] = useState('')
  const [docCity, setDocCity] = useState('Bengaluru')
  const [docLocality, setDocLocality] = useState('')
  const [docModeChoice, setDocModeChoice] = useState<
    'both' | 'online' | 'offline'
  >('both')
  const [docLanguages, setDocLanguages] = useState('English, Kannada, Hindi')
  const [docExpYears, setDocExpYears] = useState(12)
  const [docFeeInr, setDocFeeInr] = useState(1100)
  const [docNextSlot, setDocNextSlot] = useState('Tomorrow, 10:30 AM')
  const [docSlots, setDocSlots] = useState<string[]>([
    '09:30 AM',
    '10:30 AM',
    '04:00 PM',
    '06:00 PM',
  ])
  const [docBio, setDocBio] = useState('')

  const handleAdminSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setAdminAuthError('')
    if (!verifyAdminCredentials(adminEmail, adminPassword)) {
      setAdminAuthError(t.adminPage.auth.invalidError)
      return
    }
    unlockAdminSession()
    setAdminEmail('')
    setAdminPassword('')
    setShowAdminPass(false)
    setAdminUnlocked(true)
  }

  const handleAdminLock = () => {
    lockAdminSession()
    setSelectedPatientId(null)
    setAdminUnlocked(false)
  }

  const openPatientModal = (patientId: string, tab: PatientModalTab) => {
    setModalInitialTab(tab)
    setSelectedPatientId(patientId)
  }

  // Live synced active patient record from current NeuroCare user state
  const liveActivePatient: AdminPatientRecord = useMemo(() => {
    const report = computeBrainHealthReport(state)
    const locFocus = LIVE_FOCUS_SUGGESTIONS[lang] ?? LIVE_FOCUS_SUGGESTIONS.en
    return {
      id: state.user.id,
      fullName: `${state.user.fullName} ${t.adminPage.activeSelfSuffix}`,
      email: state.user.email,
      phoneNumber: state.user.phoneNumber,
      phoneVerified: state.user.phoneVerified,
      emergencyContactName: state.user.emergencyContactName,
      emergencyContactPhone: state.user.emergencyContactPhone,
      ageRange: state.user.ageRange,
      city: state.user.city || 'Bengaluru, India',
      preferredLanguage: state.user.preferredLanguage,
      enrolledDate: state.user.createdAt.slice(0, 10),
      lastActiveLabel: t.adminPage.liveSessionNow,
      status: report.taskStatus,
      setupChecklist: {
        accountCreated: true,
        onboardingCompleted: state.user.onboardingCompleted,
        wearableSynced: state.user.wearableConnected,
        baselineAssessmentDone: state.assessments.length > 0,
        sleepTrackingActive: state.sleepLogs.length > 0,
        lifestyleTrackingActive: state.lifestyleLogs.length > 0,
        familyContextReviewed: state.familyHistory.length > 0,
      },
      latestTaskAccuracyPct: report.latestTaskPct,
      latestFunctionalPct: report.latestFunctionalPct,
      avgSleepHours7d: report.avgSleepHours7d,
      avgSteps7d: report.avgSteps7d,
      avgStress7d: report.avgStress7d,
      assessmentsCount: state.assessments.length,
      gamesPlayedCount: state.gameResults.length,
      wearableProvider: state.user.wearableProvider,
      physicalFocusSuggestion:
        report.avgSteps7d < 7500 ? locFocus.physicalLow : locFocus.physicalGood,
      cognitiveFocusSuggestion: locFocus.cognitive,
      nudgeSentCount: 0,
      isSampleCohort: false,
    }
  }, [state, lang, t.adminPage.activeSelfSuffix, t.adminPage.liveSessionNow])

  const allPatients = useMemo(
    () => [liveActivePatient, ...state.adminCohort],
    [liveActivePatient, state.adminCohort]
  )

  const resolvePatientDisplay = useCallback(
    (p: AdminPatientRecord) => {
      if (p.id === state.user.id) {
        return {
          city: p.city,
          lastActive: p.lastActiveLabel,
          physicalSuggestion: p.physicalFocusSuggestion,
          cognitiveSuggestion: p.cognitiveFocusSuggestion,
        }
      }
      const loc = getLocalizedCohortPatient(p, t)
      const physicalSuggestion =
        p.physicalFocusSuggestion ===
        'Pending setup: Complete onboarding activity baseline.'
          ? (t.cohortPatientNotes['pat-105']?.physicalSuggestion ??
            loc.physicalSuggestion)
          : loc.physicalSuggestion
      const cognitiveSuggestion =
        p.cognitiveFocusSuggestion ===
        'Pending setup: Schedule first morning 6-domain check-in.'
          ? (t.cohortPatientNotes['pat-105']?.cognitiveSuggestion ??
            loc.cognitiveSuggestion)
          : loc.cognitiveSuggestion
      return {
        city: loc.city,
        lastActive: loc.lastActive,
        physicalSuggestion,
        cognitiveSuggestion,
      }
    },
    [state.user.id, t]
  )

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return allPatients.filter((p) => {
      const locCity =
        p.id === state.user.id ? p.city : getLocalizedCohortPatient(p, t).city
      const matchSearch =
        !q ||
        p.fullName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        locCity.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      const setupPct = calcSetupPct(p.setupChecklist)
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'incomplete' && setupPct < 100) ||
        (statusFilter === 'active' && setupPct === 100) ||
        (statusFilter === 'attention' &&
          (p.status === 'Needs attention' || p.status === 'Changed'))
      const matchLang =
        langFilter === 'all' || p.preferredLanguage === langFilter
      return matchSearch && matchStatus && matchLang
    })
  }, [allPatients, searchQuery, statusFilter, langFilter, state.user.id, t])

  const selectedPatient = useMemo(
    () => allPatients.find((p) => p.id === selectedPatientId) ?? null,
    [allPatients, selectedPatientId]
  )

  const selectedPatientDisplay = useMemo(
    () => (selectedPatient ? resolvePatientDisplay(selectedPatient) : null),
    [selectedPatient, resolvePatientDisplay]
  )

  const cohortKPIs = useMemo(() => {
    const total = allPatients.length
    const avgSetup = Math.round(
      allPatients.reduce((s, p) => s + calcSetupPct(p.setupChecklist), 0) /
        Math.max(1, total)
    )
    const fullyActivated = allPatients.filter(
      (p) => calcSetupPct(p.setupChecklist) === 100
    ).length
    const attentionCount = allPatients.filter(
      (p) => p.status === 'Needs attention' || p.status === 'Changed'
    ).length
    const sleepPatients = allPatients.filter((p) => p.avgSleepHours7d > 0)
    const avgSleep = sleepPatients.length
      ? Number(
          (
            sleepPatients.reduce((s, p) => s + p.avgSleepHours7d, 0) /
            sleepPatients.length
          ).toFixed(1)
        )
      : 0
    return { total, avgSetup, fullyActivated, attentionCount, avgSleep }
  }, [allPatients])

  const setupFunnelData = useMemo(() => {
    const denom = Math.max(1, allPatients.length)
    return SETUP_STEP_KEYS.map((key) => {
      const doneCount = allPatients.filter((p) => p.setupChecklist[key]).length
      return {
        shortName: t.adminPage.setupSteps[key],
        completed: Math.round((doneCount / denom) * 100),
      }
    })
  }, [allPatients, t.adminPage.setupSteps])

  const languageStatsData = useMemo(() => {
    return LANGUAGE_OPTIONS.map((opt) => ({
      language: opt.nativeLabel,
      patients: allPatients.filter((p) => p.preferredLanguage === opt.code).length,
    }))
  }, [allPatients])

  const patientComparisonData = useMemo(() => {
    return allPatients.map((p) => ({
      id: p.id,
      shortName: p.fullName.split(' ')[0] || p.fullName,
      fullName: p.fullName,
      tasksPct: p.latestTaskAccuracyPct ?? 0,
      funcPct: p.latestFunctionalPct ?? 0,
      setupPct: calcSetupPct(p.setupChecklist),
    }))
  }, [allPatients])

  const handleSendNudge = (patient: AdminPatientRecord) => {
    if (patient.id === state.user.id) {
      setNudgeBanner(t.adminPage.nudgeActiveUser)
    } else {
      sendPatientNudge(patient.id)
      const langNative =
        LANGUAGE_OPTIONS.find((o) => o.code === patient.preferredLanguage)
          ?.nativeLabel ?? patient.preferredLanguage.toUpperCase()
      setNudgeBanner(
        `${t.adminPage.nudgeSentPrefix} ${patient.fullName} (${langNative}).`
      )
    }
    setTimeout(() => setNudgeBanner(''), 3500)
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient || !newNoteText.trim()) return
    addCoordinatorNote(selectedPatient.id, newNoteText)
    setNewNoteText('')
  }

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) return
    enrollDemoPatient({
      fullName: newName,
      email: newEmail,
      ageRange: newAge,
      city: newCity,
      preferredLanguage: newLang,
      wearableProvider: newWearable,
    })
    setEnrollOpen(false)
    setNewName('')
    setNewEmail('')
  }

  const doctorCities = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    state.doctors.forEach((d) => {
      const city = d.city.trim()
      if (city && !seen.has(city.toLowerCase())) {
        seen.add(city.toLowerCase())
        list.push(city)
      }
    })
    return list
  }, [state.doctors])

  const filteredAdminDoctors = useMemo(() => {
    if (docCityFilter === 'all') return state.doctors
    return state.doctors.filter(
      (d) => d.city.trim().toLowerCase() === docCityFilter.toLowerCase()
    )
  }, [state.doctors, docCityFilter])

  const doctorOpsStats = useMemo(() => {
    const activeDocs = state.doctors.filter(
      (d) => d.acceptingBookings !== false
    ).length
    const pendingBookings = state.consultations.filter(
      (c) => c.status === 'Pending Review (Demo)'
    ).length
    return {
      activeDocs,
      citiesCount: doctorCities.length,
      totalBookings: state.consultations.length,
      pendingBookings,
    }
  }, [state.doctors, state.consultations, doctorCities.length])

  const toggleDocSlot = (slot: string) => {
    setDocSlots((prev) => {
      if (prev.includes(slot)) {
        return prev.length > 1 ? prev.filter((s) => s !== slot) : prev
      }
      return [...prev, slot]
    })
  }

  const handleAddDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!docName.trim() || !docClinic.trim() || !docCity.trim()) return
    const modes: ConsultationChannel[] =
      docModeChoice === 'both'
        ? ['online', 'offline']
        : docModeChoice === 'online'
          ? ['online']
          : ['offline']
    const langs = docLanguages
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    addDoctor({
      name: docName.trim(),
      specialty: docSpecialty,
      credentials:
        docCredentials.trim() ||
        `${t.specialistCategories[docSpecialty]} · ${docExpYears} ${t.clinicalPage.experienceSuffix}`,
      hospitalOrClinic: docClinic.trim(),
      city: docCity.trim(),
      locality: docLocality.trim() || docCity.trim(),
      languages: langs.length > 0 ? langs : ['English'],
      experienceYears: Math.max(1, Number(docExpYears) || 10),
      consultationFeeInr: Math.max(0, Number(docFeeInr) || 1000),
      nextAvailableSlot: docNextSlot.trim() || 'Tomorrow, 10:30 AM',
      bio:
        docBio.trim() ||
        'Preventive brain health, lifestyle wellness optimization, and collaborative follow-up care.',
      consultationModes: modes,
      availableSlots: docSlots,
    })
    const addedName = docName.trim()
    setAddDoctorOpen(false)
    setDocName('')
    setDocCredentials('')
    setDocClinic('')
    setDocLocality('')
    setDocBio('')
    setNudgeBanner(`${t.adminPage.doctorOps.addedBannerPrefix} ${addedName}`)
    setTimeout(() => setNudgeBanner(''), 4000)
  }

  const handleApptStatusChange = (
    c: ConsultationRecord,
    nextStatus: ConsultationRecord['status']
  ) => {
    updateConsultationStatus(c.id, nextStatus)
    setNudgeBanner(
      `${t.adminPage.doctorOps.statusUpdatedBannerPrefix} ${c.patientName || state.user.fullName} (${c.bookingCode || c.doctorName}).`
    )
    setTimeout(() => setNudgeBanner(''), 3500)
  }

  const patientNotes = useMemo(() => {
    if (!selectedPatient) return []
    return state.coordinatorNotes.filter(
      (n) => n.patientId === selectedPatient.id
    )
  }, [state.coordinatorNotes, selectedPatient])

  if (!adminUnlocked) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md py-10 sm:py-14">
          <Card className="border-[#2E6F73]/30 shadow-sm">
            <CardContent className="pt-7 pb-7 space-y-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2E6F73]/15 text-[#0F3D3E]">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <Badge variant="primary">{t.adminPage.auth.gateBadge}</Badge>
                <h1 className="text-2xl font-bold text-[#0F3D3E]">
                  {t.adminPage.auth.gateTitle}
                </h1>
                <p className="text-xs text-[#4A5D5E] leading-relaxed">
                  {t.adminPage.auth.gateSubtitle}
                </p>
              </div>

              <form onSubmit={handleAdminSignIn} className="space-y-4">
                {adminAuthError && (
                  <div className="rounded-xl border border-[#C6601F]/45 bg-[#F7E8D8] px-3.5 py-2.5 text-xs font-medium text-[#7A360D]">
                    {adminAuthError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold text-[#0F3D3E]"
                    htmlFor="admin-auth-email"
                  >
                    {t.adminPage.auth.emailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5D5E]" />
                    <Input
                      id="admin-auth-email"
                      type="email"
                      autoComplete="off"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder={t.adminPage.auth.emailPlaceholder}
                      className="ps-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold text-[#0F3D3E]"
                    htmlFor="admin-auth-password"
                  >
                    {t.adminPage.auth.passwordLabel}
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5D5E]" />
                    <Input
                      id="admin-auth-password"
                      type={showAdminPass ? 'text' : 'password'}
                      autoComplete="off"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder={t.adminPage.auth.passwordPlaceholder}
                      className="ps-10 pe-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass((prev) => !prev)}
                      aria-label={
                        showAdminPass
                          ? t.adminPage.auth.hidePasswordAria
                          : t.adminPage.auth.showPasswordAria
                      }
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-[#4A5D5E] hover:text-[#0F3D3E]"
                    >
                      {showAdminPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="primary" className="w-full" size="lg">
                  <Lock className="h-4 w-4" />
                  {t.adminPage.auth.signInBtn}
                </Button>
              </form>

              <p className="text-center text-[11px] text-[#4A5D5E]">
                {t.adminPage.auth.securityNote}
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">{t.adminPage.badgePortal}</Badge>
              <Badge variant="outline">{t.adminPage.badgeCohort}</Badge>
              <Badge variant="success">{t.adminPage.auth.verifiedBadge}</Badge>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0F3D3E]">
              {t.adminPage.title}
            </h1>
            <p className="text-sm text-[#4A5D5E]">{t.adminPage.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" onClick={() => setAddDoctorOpen(true)}>
              <Stethoscope className="h-4 w-4 text-[#2E6F73]" />
              {t.adminPage.doctorOps.addDoctorBtn}
            </Button>
            <Button variant="primary" onClick={() => setEnrollOpen(true)}>
              <UserPlus className="h-4 w-4" />
              {t.adminPage.enrollBtn}
            </Button>
            <Button variant="ghost" onClick={handleAdminLock}>
              <LogOut className="h-4 w-4 text-[#4A5D5E]" />
              {t.adminPage.auth.lockPortalBtn}
            </Button>
          </div>
        </div>

        {/* Ethics & Data Transparency Banner */}
        <div className="rounded-2xl border border-[#2E6F73]/30 bg-[#F7EFE3] p-4 flex items-start gap-3 text-xs text-[#263A3B]">
          <ShieldCheck className="h-5 w-5 text-[#2E6F73] shrink-0 mt-0.5" />
          <span>
            <strong className="text-[#0F3D3E]">{t.adminPage.ethicsBold}</strong> {t.adminPage.ethicsText}
          </span>
        </div>

        {nudgeBanner && (
          <div className="flex items-center gap-2 rounded-xl border border-[#7FB388]/55 bg-[#7FB388]/20 px-4 py-3 text-xs font-semibold text-[#0F3D3E]">
            <CheckCircle2 className="h-4 w-4" />
            {nudgeBanner}
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2E6F73]/15 text-[#0F3D3E]">
                  <Users className="h-4 w-4" />
                </span>
                <Badge variant="primary">{t.adminPage.kpi.cohortBadge}</Badge>
              </div>
              <p className="mt-3 text-xs font-medium text-[#4A5D5E]">
                {t.adminPage.kpi.trackedPatients}
              </p>
              <p className="mt-1 text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {cohortKPIs.total}
              </p>
              <p className="text-[11px] text-[#4A5D5E] mt-1">
                {cohortKPIs.fullyActivated}{' '}
                {t.adminPage.kpi.fullyActivatedSuffix}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7FB388]/28 text-[#0F3D3E]">
                  <UserCheck className="h-4 w-4" />
                </span>
                <Badge variant="cyan">{t.adminPage.kpi.setupRateBadge}</Badge>
              </div>
              <p className="mt-3 text-xs font-medium text-[#4A5D5E]">
                {t.adminPage.kpi.meanActivation}
              </p>
              <p className="mt-1 text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {cohortKPIs.avgSetup}%
              </p>
              <Progress value={cohortKPIs.avgSetup} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C6601F]/18 text-[#8C3F10]">
                  <BellRing className="h-4 w-4" />
                </span>
                <Badge variant="warning">{t.adminPage.kpi.followUpBadge}</Badge>
              </div>
              <p className="mt-3 text-xs font-medium text-[#4A5D5E]">
                {t.adminPage.kpi.needsAttentionTitle}
              </p>
              <p className="mt-1 text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {cohortKPIs.attentionCount}
              </p>
              <p className="text-[11px] text-[#4A5D5E] mt-1">
                {t.adminPage.kpi.followUpHint}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2E6F73]/18 text-[#0F3D3E]">
                  <Moon className="h-4 w-4" />
                </span>
                <Badge variant="success">
                  {t.adminPage.kpi.sleepCohortBadge}
                </Badge>
              </div>
              <p className="mt-3 text-xs font-medium text-[#4A5D5E]">
                {t.adminPage.kpi.activeSleepAvg}
              </p>
              <p className="mt-1 text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {cohortKPIs.avgSleep} {t.units.hrs}
              </p>
              <p className="text-[11px] text-[#4A5D5E] mt-1">
                {t.adminPage.kpi.sleepHint}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts: Cohort Patient Activity Comparison + Setup Activation Funnel + 5-Language Reach */}
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#2E6F73]" />
                <CardTitle>{t.adminPage.cohortGraphs.comparisonTitle}</CardTitle>
              </div>
              <Badge
                variant="outline"
                className="whitespace-normal text-start max-w-full"
              >
                {t.adminPage.cohortGraphs.tapBarHint}
              </Badge>
            </div>
            <CardDescription>
              {t.adminPage.cohortGraphs.comparisonDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={patientComparisonData}
                  margin={{ top: 8, right: 10, left: -12, bottom: 4 }}
                  onClick={(chartState) => {
                    const idx = chartState?.activeTooltipIndex
                    if (typeof idx === 'number' && patientComparisonData[idx]) {
                      openPatientModal(patientComparisonData[idx].id, 'overview')
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                  <XAxis dataKey="shortName" fontSize={11} stroke="#263A3B" />
                  <YAxis domain={[0, 100]} fontSize={11} stroke="#4A5D5E" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#F7EFE3',
                      borderRadius: '12px',
                      borderColor: '#2E6F73',
                      color: '#0A0F14',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="tasksPct"
                    name={t.adminPage.cohortGraphs.tasksBar}
                    fill="#2E6F73"
                    radius={[5, 5, 0, 0]}
                    barSize={18}
                    className="cursor-pointer"
                  />
                  <Bar
                    dataKey="funcPct"
                    name={t.adminPage.cohortGraphs.funcBar}
                    fill="#7FB388"
                    radius={[5, 5, 0, 0]}
                    barSize={18}
                    className="cursor-pointer"
                  />
                  <Bar
                    dataKey="setupPct"
                    name={t.adminPage.cohortGraphs.setupBar}
                    fill="#C6601F"
                    radius={[5, 5, 0, 0]}
                    barSize={18}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-7 min-w-0">
            <CardHeader>
              <CardTitle>{t.adminPage.funnelTitle}</CardTitle>
              <CardDescription>{t.adminPage.funnelDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-60 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={setupFunnelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                    <XAxis dataKey="shortName" fontSize={10} stroke="#4A5D5E" />
                    <YAxis domain={[0, 100]} fontSize={12} stroke="#4A5D5E" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#F7EFE3',
                        borderRadius: '12px',
                        borderColor: '#2E6F73',
                        color: '#0A0F14',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="completed"
                      name={t.adminPage.funnelSeries}
                      fill="#2E6F73"
                      radius={[6, 6, 0, 0]}
                      barSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-5 min-w-0">
            <CardHeader>
              <CardTitle>{t.adminPage.langChartTitle}</CardTitle>
              <CardDescription>{t.adminPage.langChartDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-60 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={languageStatsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                    <XAxis dataKey="language" fontSize={12} stroke="#4A5D5E" />
                    <YAxis
                      allowDecimals={false}
                      fontSize={12}
                      stroke="#4A5D5E"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#F7EFE3',
                        borderRadius: '12px',
                        borderColor: '#2E6F73',
                        color: '#0A0F14',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="patients"
                      name={t.adminPage.langSeries}
                      fill="#0F3D3E"
                      radius={[6, 6, 0, 0]}
                      barSize={26}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search, Filters & Clickable Patient Activity Directory */}
        <Card>
          <CardHeader className="border-b border-[#CBB9A1]/60 pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{t.adminPage.trackerTitle}</CardTitle>
                  <Badge
                    variant="cyan"
                    className="whitespace-normal text-start max-w-full"
                  >
                    {t.adminPage.patientTracker.tapHint}
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  {t.adminPage.trackerDesc}
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-auto sm:min-w-[220px]">
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5D5E]" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.adminPage.searchPlaceholder}
                    className="ps-9 h-9 text-xs"
                  />
                </div>

                <Select
                  aria-label={t.adminPage.statusFilters.all}
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        | 'all'
                        | 'incomplete'
                        | 'active'
                        | 'attention'
                    )
                  }
                  className="h-9 w-44 text-xs"
                >
                  <option value="all">{t.adminPage.statusFilters.all}</option>
                  <option value="incomplete">
                    {t.adminPage.statusFilters.incomplete}
                  </option>
                  <option value="active">
                    {t.adminPage.statusFilters.active}
                  </option>
                  <option value="attention">
                    {t.adminPage.statusFilters.attention}
                  </option>
                </Select>

                <Select
                  aria-label={t.adminPage.allLanguagesFilter}
                  value={langFilter}
                  onChange={(e) =>
                    setLangFilter(e.target.value as 'all' | LanguageCode)
                  }
                  className="h-9 w-40 text-xs"
                >
                  <option value="all">{t.adminPage.allLanguagesFilter}</option>
                  {LANGUAGE_OPTIONS.map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.nativeLabel}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-[#CBB9A1]/70 text-[#4A5D5E]">
                  <th className="py-2.5 pe-4 font-semibold text-start">
                    {t.adminPage.tableHeaders.patient}
                  </th>
                  <th className="py-2.5 pe-4 font-semibold text-start">
                    {t.adminPage.tableHeaders.langCity}
                  </th>
                  <th className="py-2.5 pe-4 font-semibold text-start">
                    {t.adminPage.tableHeaders.setupActivation}
                  </th>
                  <th className="py-2.5 pe-4 font-semibold text-start">
                    {t.adminPage.tableHeaders.tasksFunc}
                  </th>
                  <th className="py-2.5 pe-4 font-semibold text-start">
                    {t.adminPage.tableHeaders.sleepSteps}
                  </th>
                  <th className="py-2.5 pe-4 font-semibold text-start">
                    {t.adminPage.tableHeaders.status}
                  </th>
                  <th className="py-2.5 font-semibold text-end">
                    {t.adminPage.tableHeaders.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBB9A1]/45">
                {filteredPatients.map((p) => {
                  const setupPct = calcSetupPct(p.setupChecklist)
                  const disp = resolvePatientDisplay(p)
                  return (
                    <tr key={p.id} className="hover:bg-[#FBF6EE]">
                      <td className="py-3.5 pe-4">
                        <button
                          type="button"
                          onClick={() => openPatientModal(p.id, 'overview')}
                          className="group inline-flex items-center gap-1.5 font-bold text-[#2E6F73] hover:text-[#0F3D3E] hover:underline text-start cursor-pointer"
                        >
                          <span>{p.fullName}</span>
                          <BarChart3 className="h-3.5 w-3.5 opacity-75 group-hover:opacity-100 shrink-0" />
                        </button>
                        <div className="text-[11px] text-[#4A5D5E]">
                          {p.id} · {t.units.agePrefix} {p.ageRange} ·{' '}
                          {disp.lastActive}
                        </div>
                      </td>
                      <td className="py-3.5 pe-4">
                        <Badge variant="outline">
                          {LANGUAGE_OPTIONS.find(
                            (o) => o.code === p.preferredLanguage
                          )?.nativeLabel ?? p.preferredLanguage}
                        </Badge>
                        <div className="text-[11px] text-[#4A5D5E] mt-1">
                          {disp.city}
                        </div>
                      </td>
                      <td className="py-3.5 pe-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                          <span className="text-[#0F3D3E] tabular-nums">
                            {setupPct}%
                          </span>
                          <span className="text-[#4A5D5E]">
                            {p.wearableProvider !== 'None'
                              ? p.wearableProvider
                              : t.adminPage.noWearable}
                          </span>
                        </div>
                        <Progress value={setupPct} />
                      </td>
                      <td className="py-3.5 pe-4 tabular-nums">
                        <div className="font-semibold text-[#2E6F73]">
                          {t.analyticsPage.tasksShort}{' '}
                          {p.latestTaskAccuracyPct !== null
                            ? `${p.latestTaskAccuracyPct}%`
                            : t.pending}
                        </div>
                        <div className="text-[11px] text-[#4A5D5E]">
                          {t.analyticsPage.funcQShort}{' '}
                          {p.latestFunctionalPct !== null
                            ? `${p.latestFunctionalPct}%`
                            : t.pending}
                        </div>
                      </td>
                      <td className="py-3.5 pe-4 tabular-nums">
                        <div>
                          {p.avgSleepHours7d > 0
                            ? `${p.avgSleepHours7d}${t.adminPage.sleepShortSuffix}`
                            : t.adminPage.noSleepLog}
                        </div>
                        <div className="text-[11px] text-[#4A5D5E]">
                          {p.avgSteps7d > 0
                            ? `${p.avgSteps7d.toLocaleString()} ${t.units.steps}`
                            : t.adminPage.noSteps}
                        </div>
                      </td>
                      <td className="py-3.5 pe-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3.5 text-end whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendNudge(p)}
                          >
                            <BellRing className="h-3.5 w-3.5 text-[#C6601F]" />
                            {t.adminPage.nudgeBtn}{' '}
                            {p.nudgeSentCount > 0 ? `(${p.nudgeSentCount})` : ''}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openPatientModal(p.id, 'overview')}
                          >
                            <BarChart3 className="h-3.5 w-3.5 text-[#2E6F73]" />
                            {t.adminPage.patientTracker.viewActivityBtn}
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => openPatientModal(p.id, 'setup')}
                          >
                            {t.adminPage.inspectBtn}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Admin Doctor Directory & Near-Location Control */}
        <Card>
          <CardHeader className="border-b border-[#CBB9A1]/60 pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{t.adminPage.doctorOps.rosterTitle}</CardTitle>
                  <Badge variant="primary" className="tabular-nums">
                    {doctorOpsStats.activeDocs}{' '}
                    {t.adminPage.doctorOps.activeDoctorsLabel}
                  </Badge>
                  <Badge variant="cyan" className="tabular-nums">
                    {doctorOpsStats.citiesCount}{' '}
                    {t.adminPage.doctorOps.citiesCoveredLabel}
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  {t.adminPage.doctorOps.rosterDesc}
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  aria-label={t.adminPage.doctorOps.filterCityAll}
                  value={docCityFilter}
                  onChange={(e) => setDocCityFilter(e.target.value)}
                  className="h-9 w-40 text-xs"
                >
                  <option value="all">
                    {t.adminPage.doctorOps.filterCityAll}
                  </option>
                  {doctorCities.map((city) => (
                    <option key={city} value={city}>
                      {getLocalizedCityLabel(city, state.doctors, t)}
                    </option>
                  ))}
                </Select>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setAddDoctorOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  {t.adminPage.doctorOps.addDoctorBtn}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredAdminDoctors.map((doc) => {
                const loc = getLocalizedDoctor(doc, t)
                const isActive = doc.acceptingBookings !== false
                const modes = doc.consultationModes ?? ['online', 'offline']
                const slots = doc.availableSlots ?? [
                  '09:30 AM',
                  '10:30 AM',
                  '04:00 PM',
                ]
                return (
                  <div
                    key={doc.id}
                    className={cn(
                      'rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-colors',
                      isActive
                        ? 'border-[#2E6F73]/25 bg-[#FBF6EE]'
                        : 'border-[#C6601F]/45 bg-[#F7E8D8]/70 opacity-90'
                    )}
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <Badge variant="primary">{loc.specialty}</Badge>
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge variant={doc.addedByAdmin ? 'cyan' : 'outline'}>
                            {doc.addedByAdmin
                              ? t.adminPage.doctorOps.addedByAdminBadge
                              : t.adminPage.doctorOps.sampleDocBadge}
                          </Badge>
                          <Badge variant={isActive ? 'success' : 'warning'}>
                            {isActive
                              ? t.adminPage.doctorOps.activeStatus
                              : t.adminPage.doctorOps.pausedStatus}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-[#0F3D3E]">
                          {loc.name}
                        </h4>
                        <p className="text-[11px] font-medium text-[#2E6F73]">
                          {loc.credentials}
                        </p>
                      </div>

                      <div className="space-y-1 text-[11px] text-[#263A3B]">
                        <p className="flex items-start gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-[#2E6F73] shrink-0 mt-0.5" />
                          <span>{loc.clinic}</span>
                        </p>
                        <p className="flex items-start gap-1.5 font-medium text-[#0F3D3E]">
                          <MapPin className="h-3.5 w-3.5 text-[#2E6F73] shrink-0 mt-0.5" />
                          <span>
                            {doc.locality ? `${doc.locality} · ` : ''}
                            {loc.city}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {modes.includes('online') && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#2E6F73]/15 px-2 py-0.5 text-[10px] font-semibold text-[#0F3D3E]">
                            <Video className="h-3 w-3" />
                            {t.adminPage.doctorOps.modeOnlineTag}
                          </span>
                        )}
                        {modes.includes('offline') && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#7FB388]/25 px-2 py-0.5 text-[10px] font-semibold text-[#0F3D3E]">
                            <MapPin className="h-3 w-3" />
                            {t.adminPage.doctorOps.modeOfflineTag}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-[#4A5D5E]">
                        <span className="font-semibold text-[#0F3D3E]">
                          ₹{doc.consultationFeeInr}
                        </span>
                        {' · '}
                        {doc.experienceYears} {t.clinicalPage.experienceSuffix}
                        {' · '}
                        {loc.languages}
                      </div>

                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-[#263A3B]">
                        <span className="font-semibold">
                          {t.adminPage.doctorOps.slotsLabel}
                        </span>
                        {slots.slice(0, 4).map((slot) => (
                          <span
                            key={slot}
                            className="rounded-md border border-[#2E6F73]/25 bg-[#F7EFE3] px-1.5 py-0.5 tabular-nums"
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#CBB9A1]/60">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleDoctorAvailability(doc.id)}
                      >
                        {isActive ? (
                          <>
                            <PauseCircle className="h-3.5 w-3.5 text-[#C6601F]" />
                            {t.adminPage.doctorOps.togglePauseBtn}
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-3.5 w-3.5 text-[#0F3D3E]" />
                            {t.adminPage.doctorOps.toggleActivateBtn}
                          </>
                        )}
                      </Button>

                      {doc.addedByAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#9B2C1B] hover:bg-[#F7E8D8] hover:text-[#7A360D]"
                          onClick={() => removeDoctor(doc.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t.adminPage.doctorOps.removeDoctorBtn}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Admin Patient Appointment Bookings Queue (Online & Offline) */}
        <Card>
          <CardHeader className="border-b border-[#CBB9A1]/60 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>
                    {t.adminPage.doctorOps.appointmentsTitle}
                  </CardTitle>
                  <Badge variant="primary" className="tabular-nums">
                    {doctorOpsStats.totalBookings}{' '}
                    {t.adminPage.doctorOps.totalBookingsLabel}
                  </Badge>
                  {doctorOpsStats.pendingBookings > 0 && (
                    <Badge variant="warning" className="tabular-nums">
                      {doctorOpsStats.pendingBookings}{' '}
                      {t.adminPage.doctorOps.pendingBookingsLabel}
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-1">
                  {t.adminPage.doctorOps.appointmentsDesc}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 overflow-x-auto">
            {state.consultations.length === 0 ? (
              <p className="text-xs text-[#4A5D5E] py-4 text-center">
                {t.adminPage.doctorOps.noAppointments}
              </p>
            ) : (
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="border-b border-[#CBB9A1]/70 text-[#4A5D5E]">
                    <th className="py-2.5 pe-4 font-semibold text-start">
                      {t.adminPage.doctorOps.apptHeaders.booking}
                    </th>
                    <th className="py-2.5 pe-4 font-semibold text-start">
                      {t.adminPage.doctorOps.apptHeaders.doctor}
                    </th>
                    <th className="py-2.5 pe-4 font-semibold text-start">
                      {t.adminPage.doctorOps.apptHeaders.schedule}
                    </th>
                    <th className="py-2.5 pe-4 font-semibold text-start">
                      {t.adminPage.doctorOps.apptHeaders.mode}
                    </th>
                    <th className="py-2.5 pe-4 font-semibold text-start">
                      {t.adminPage.doctorOps.apptHeaders.report}
                    </th>
                    <th className="py-2.5 pe-4 font-semibold text-start">
                      {t.adminPage.doctorOps.apptHeaders.status}
                    </th>
                    <th className="py-2.5 font-semibold text-end">
                      {t.adminPage.doctorOps.apptHeaders.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBB9A1]/45">
                  {state.consultations.map((c) => {
                    const docMatch = state.doctors.find(
                      (d) => d.id === c.doctorId
                    )
                    const locDoc = docMatch
                      ? getLocalizedDoctor(docMatch, t)
                      : null
                    const specLabel =
                      (t.specialistCategories as Record<string, string>)[
                        c.specialty
                      ] ?? c.specialty
                    const isOnline = c.mode === 'Video Tele-consult'
                    const statusText =
                      c.status === 'Completed (Sample)'
                        ? t.clinicalPage.statusCompleted
                        : c.status === 'Pending Review (Demo)'
                          ? t.clinicalPage.statusPending
                          : t.clinicalPage.statusConfirmed
                    const statusVariant =
                      c.status === 'Completed (Sample)'
                        ? 'success'
                        : c.status === 'Pending Review (Demo)'
                          ? 'warning'
                          : 'primary'
                    return (
                      <tr key={c.id} className="hover:bg-[#FBF6EE]">
                        <td className="py-3.5 pe-4">
                          <div className="font-bold text-[#0F3D3E]">
                            {c.patientName || state.user.fullName}
                          </div>
                          <div className="text-[11px] text-[#4A5D5E]">
                            {c.bookingCode || c.id} ·{' '}
                            {t.adminPage.doctorOps.patientFromPrefix}{' '}
                            {c.patientCity || state.user.city}
                          </div>
                        </td>
                        <td className="py-3.5 pe-4">
                          <div className="font-semibold text-[#0F3D3E]">
                            {locDoc?.name ?? c.doctorName}
                          </div>
                          <div className="text-[11px] text-[#4A5D5E]">
                            {specLabel} ·{' '}
                            {c.clinicLocality
                              ? `${c.clinicLocality}, `
                              : docMatch?.locality
                                ? `${docMatch.locality}, `
                                : ''}
                            {c.clinicCity || locDoc?.city || 'India'}
                          </div>
                        </td>
                        <td className="py-3.5 pe-4 whitespace-nowrap tabular-nums">
                          <div className="flex items-center gap-1 font-medium text-[#0F3D3E]">
                            <Calendar className="h-3.5 w-3.5 text-[#2E6F73]" />
                            {c.date}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-[#4A5D5E] mt-0.5">
                            <Clock className="h-3 w-3" />
                            {c.timeSlot}
                          </div>
                        </td>
                        <td className="py-3.5 pe-4 whitespace-nowrap">
                          <Badge variant={isOnline ? 'primary' : 'cyan'}>
                            {isOnline
                              ? t.clinicalPage.modeVideo
                              : t.clinicalPage.modeInClinic}
                          </Badge>
                        </td>
                        <td className="py-3.5 pe-4 whitespace-nowrap">
                          <Badge
                            variant={
                              c.sharedAssessmentReport ? 'success' : 'outline'
                            }
                          >
                            {c.sharedAssessmentReport
                              ? t.adminPage.doctorOps.sharedYes
                              : t.adminPage.doctorOps.sharedNo}
                          </Badge>
                        </td>
                        <td className="py-3.5 pe-4 whitespace-nowrap">
                          <Badge variant={statusVariant}>{statusText}</Badge>
                        </td>
                        <td className="py-3.5 text-end whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant={
                                c.status === 'Confirmed (Demo)'
                                  ? 'primary'
                                  : 'outline'
                              }
                              onClick={() =>
                                handleApptStatusChange(c, 'Confirmed (Demo)')
                              }
                            >
                              {t.adminPage.doctorOps.confirmApptBtn}
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                c.status === 'Pending Review (Demo)'
                                  ? 'primary'
                                  : 'outline'
                              }
                              onClick={() =>
                                handleApptStatusChange(
                                  c,
                                  'Pending Review (Demo)'
                                )
                              }
                            >
                              {t.adminPage.doctorOps.pendingApptBtn}
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                c.status === 'Completed (Sample)'
                                  ? 'primary'
                                  : 'outline'
                              }
                              onClick={() =>
                                handleApptStatusChange(c, 'Completed (Sample)')
                              }
                            >
                              {t.adminPage.doctorOps.completeApptBtn}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Rich Patient Activity, Graphs & Setup Inspector Modal */}
        <PatientActivityModal
          key={`${selectedPatientId ?? 'none'}-${modalInitialTab}`}
          open={Boolean(selectedPatient)}
          onClose={() => setSelectedPatientId(null)}
          initialTab={modalInitialTab}
          patient={selectedPatient}
          patientDisplay={selectedPatientDisplay}
          state={state}
          t={t}
          patientNotes={patientNotes}
          newNoteText={newNoteText}
          onChangeNoteText={setNewNoteText}
          onAddNote={handleAddNote}
          onToggleSetupItem={togglePatientSetupItem}
        />

        {/* Enroll New Patient Modal */}
        <Modal
          open={enrollOpen}
          onClose={() => setEnrollOpen(false)}
          title={t.adminPage.enrollModal.title}
          subtitle={t.adminPage.enrollModal.subtitle}
        >
          <form onSubmit={handleEnrollSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#0F3D3E]">
                {t.adminPage.enrollModal.fullName}
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t.adminPage.enrollModal.fullNamePlaceholder}
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0F3D3E]">
                {t.adminPage.enrollModal.email}
              </label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t.adminPage.enrollModal.emailPlaceholder}
                className="mt-1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#0F3D3E]">
                  {t.adminPage.enrollModal.language}
                </label>
                <Select
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value as LanguageCode)}
                  className="mt-1"
                >
                  {LANGUAGE_OPTIONS.map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.nativeLabel} ({o.label})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0F3D3E]">
                  {t.adminPage.enrollModal.ageRange}
                </label>
                <Select
                  value={newAge}
                  onChange={(e) => setNewAge(e.target.value as AgeRange)}
                  className="mt-1"
                >
                  <option value="18-29">18–29</option>
                  <option value="30-44">30–44</option>
                  <option value="45-54">45–54</option>
                  <option value="55-64">55–64</option>
                  <option value="65+">65+</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#0F3D3E]">
                  {t.adminPage.enrollModal.city}
                </label>
                <Input
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0F3D3E]">
                  {t.adminPage.enrollModal.wearableDevice}
                </label>
                <Select
                  value={newWearable}
                  onChange={(e) =>
                    setNewWearable(
                      e.target.value as UserProfile['wearableProvider']
                    )
                  }
                  className="mt-1"
                >
                  <option value="None">
                    {t.adminPage.enrollModal.noneYet}
                  </option>
                  <option value="Google Fit">Google Fit</option>
                  <option value="Apple Health">Apple Health</option>
                  <option value="Fitbit">Fitbit</option>
                  <option value="Oura Ring">Oura Ring</option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <Button variant="outline" onClick={() => setEnrollOpen(false)}>
                {t.cancel}
              </Button>
              <Button type="submit" variant="primary">
                <Plus className="h-4 w-4" />
                {t.adminPage.enrollModal.enrollSubmitBtn}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Add Doctor Modal */}
        <Modal
          open={addDoctorOpen}
          onClose={() => setAddDoctorOpen(false)}
          title={t.adminPage.doctorOps.doctorModal.title}
          subtitle={t.adminPage.doctorOps.doctorModal.subtitle}
          maxWidthClass="max-w-2xl"
        >
          <form onSubmit={handleAddDoctorSubmit} className="space-y-3.5">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#0F3D3E]">
                  {t.adminPage.doctorOps.doctorModal.fullName}
                </label>
                <Input
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder={
                    t.adminPage.doctorOps.doctorModal.fullNamePlaceholder
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0F3D3E]">
                  {t.adminPage.doctorOps.doctorModal.specialty}
                </label>
                <Select
                  value={docSpecialty}
                  onChange={(e) =>
                    setDocSpecialty(
                      e.target.value as Exclude<SpecialistCategory, 'All'>
                    )
                  }
                  className="mt-1"
                >
                  {DOCTOR_SPECIALTIES.map((sp) => (
                    <option key={sp} value={sp}>
                      {t.specialistCategories[sp] ?? sp}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#0F3D3E]">
                  {t.adminPage.doctorOps.doctorModal.credentials}
                </label>
                <Input
                  value={docCredentials}
                  onChange={(e) => setDocCredentials(e.target.value)}
                  placeholder={
                    t.adminPage.doctorOps.doctorModal.credentialsPlaceholder
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0F3D3E]">
                  {t.adminPage.doctorOps.doctorModal.clinic}
                </label>
                <Input
                  value={docClinic}
                  onChange={(e) => setDocClinic(e.target.value)}
                  placeholder={
                    t.adminPage.doctorOps.doctorModal.clinicPlaceholder
                  }
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#0F3D3E]">
                  {t.adminPage.doctorOps.doctorModal.city}
                </label>
                <Input
                  list="admin-city-suggestions"
                  value={docCity}
                  onChange={(e) => setDocCity(e.target.value)}
                  placeholder={
                    t.adminPage.doctorOps.doctorModal.cityPlaceholder
                  }
                  className="mt-1"
                  required
                />
                <datalist id="admin-city-suggestions">
                  {SUGGESTED_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0F3D3E]">
                  {t.adminPage.doctorOps.doctorModal.locality}
                </label>
                <Input
                  value={docLocality}
                  onChange={(e) => setDocLocality(e.target.value)}
                  placeholder={
                    t.adminPage.doctorOps.doctorModal.localityPlaceholder
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0F3D3E]">
                {t.adminPage.doctorOps.doctorModal.consultModes}
              </label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(
                  [
                    {
                      value: 'both' as const,
                      label: t.adminPage.doctorOps.doctorModal.modeBoth,
                    },
                    {
                      value: 'online' as const,
                      label: t.adminPage.doctorOps.doctorModal.modeOnlineOnly,
                    },
                    {
                      value: 'offline' as const,
                      label: t.adminPage.doctorOps.doctorModal.modeOfflineOnly,
                    },
                  ]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDocModeChoice(opt.value)}
                    className={cn(
                      'rounded-xl border px-2.5 py-2 text-[11px] font-semibold text-center transition-colors',
                      docModeChoice === opt.value
                        ? 'border-[#2E6F73] bg-[#2E6F73]/15 text-[#0F3D3E]'
                        : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]/70'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#0F3D3E]">
                  {t.adminPage.doctorOps.doctorModal.languages}
                </label>
                <Input
                  value={docLanguages}
                  onChange={(e) => setDocLanguages(e.target.value)}
                  placeholder={
                    t.adminPage.doctorOps.doctorModal.languagesPlaceholder
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0F3D3E]">
                  {t.adminPage.doctorOps.doctorModal.experienceYears}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={docExpYears}
                  onChange={(e) => setDocExpYears(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0F3D3E]">
                  {t.adminPage.doctorOps.doctorModal.feeInr}
                </label>
                <Input
                  type="number"
                  min={0}
                  step={50}
                  value={docFeeInr}
                  onChange={(e) => setDocFeeInr(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0F3D3E]">
                {t.adminPage.doctorOps.doctorModal.nextSlot}
              </label>
              <Input
                value={docNextSlot}
                onChange={(e) => setDocNextSlot(e.target.value)}
                placeholder={
                  t.adminPage.doctorOps.doctorModal.nextSlotPlaceholder
                }
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0F3D3E]">
                {t.adminPage.doctorOps.doctorModal.availableSlots}
              </label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {PRESET_TIME_SLOTS.map((slot) => {
                  const selected = docSlots.includes(slot)
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleDocSlot(slot)}
                      className={cn(
                        'rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold tabular-nums transition-colors',
                        selected
                          ? 'border-[#2E6F73] bg-[#2E6F73] text-[#FAF4EA]'
                          : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]/70'
                      )}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0F3D3E]">
                {t.adminPage.doctorOps.doctorModal.bio}
              </label>
              <Textarea
                value={docBio}
                onChange={(e) => setDocBio(e.target.value)}
                placeholder={t.adminPage.doctorOps.doctorModal.bioPlaceholder}
                className="mt-1 min-h-[68px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddDoctorOpen(false)}>
                {t.cancel}
              </Button>
              <Button type="submit" variant="primary">
                <Plus className="h-4 w-4" />
                {t.adminPage.doctorOps.doctorModal.submitBtn}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  )
}

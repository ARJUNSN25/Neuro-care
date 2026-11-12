import React, { useMemo, useState } from 'react'
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileUp,
  HeartPulse,
  LocateFixed,
  MapPin,
  PhoneCall,
  Search,
  ShieldCheck,
  Siren,
  Stethoscope,
  UserCheck,
  Video,
} from 'lucide-react'
import { EmergencyHelpModal } from '@/components/common/EmergencyHelpModal'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import {
  toTelHref,
  WEBSITE_EMERGENCY_NUMBER,
  WEBSITE_EMERGENCY_TEL,
} from '@/data/emergencyHelplines'
import { getLocalizedCityLabel, getLocalizedDoctor } from '@/data/translations'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import type {
  ConsultationChannel,
  ConsultationRecord,
  DoctorProfile,
  LanguageCode,
  SpecialistCategory,
} from '@/types/neurocare'
import { cn } from '@/utils/cn'

const SPECIALTIES: SpecialistCategory[] = [
  'All',
  'Neurologist',
  'Cognitive Neuropsychologist',
  'Geriatric Psychiatrist',
  'Sleep Specialist',
  'Preventive Lifestyle Physician',
]

const SAMPLE_CONSULT_REASON: Record<LanguageCode, string> = {
  en: 'Baseline preventive vascular and sleep review.',
  kn: 'ಮೂಲಭೂತ ತಡೆಗಟ್ಟುವ ರಕ್ತನಾಳ ಮತ್ತು ನಿದ್ರೆ ಪರಿಶೀಲನೆ.',
  hi: 'आधारभूत निवारक संवहनी और नींद समीक्षा।',
  ar: 'مراجعة وقائية أساسية للأوعية الدموية والنوم.',
  ta: 'அடிப்படை தடுப்பு இரத்த நாள மற்றும் தூக்க ஆய்வு.',
}

const DEFAULT_BOOK_REASON: Record<LanguageCode, string> = {
  en: 'Preventive cognitive & sleep baseline review',
  kn: 'ತಡೆಗಟ್ಟುವ ಅರಿವು ಮತ್ತು ನಿದ್ರೆಯ ಮೂಲ ಪರಿಶೀಲನೆ',
  hi: 'निवारक संज्ञानात्मक और नींद बेसलाइन समीक्षा',
  ar: 'مراجعة وقائية للمستوى الإدراكي والنوم',
  ta: 'தடுப்பு அறிவாற்றல் & தூக்க அடிப்படை ஆய்வு',
}

const CITY_ANCHOR_COORDS: { city: string; lat: number; lng: number }[] = [
  { city: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { city: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { city: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { city: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { city: 'Pune', lat: 18.5204, lng: 73.8567 },
  { city: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { city: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { city: 'Delhi', lat: 28.6139, lng: 77.209 },
  { city: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { city: 'Dubai', lat: 25.2048, lng: 55.2708 },
]

function normalizeCityToken(raw: string): string {
  const token = raw.split(',')[0].trim().toLowerCase()
  if (token === 'bangalore') return 'bengaluru'
  if (token === 'mysore') return 'mysuru'
  if (token === 'madras') return 'chennai'
  if (token === 'calcutta') return 'kolkata'
  return token
}

function addDaysIso(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function nearestKnownCity(lat: number, lng: number): string {
  let best = CITY_ANCHOR_COORDS[0]
  let bestDist = Infinity
  for (const anchor of CITY_ANCHOR_COORDS) {
    const dist = Math.hypot(anchor.lat - lat, anchor.lng - lng)
    if (dist < bestDist) {
      bestDist = dist
      best = anchor
    }
  }
  return best.city
}

export default function ClinicalSupport() {
  const { state, bookConsultation, uploadClinicalReport, toggleReportShare } =
    useNeuroCare()
  const t = useTranslation()
  const lang = state.user.preferredLanguage ?? 'en'

  const profileBaseCity = useMemo(() => {
    const raw = (state.user.city || 'Bengaluru, India').split(',')[0].trim()
    return raw || 'Bengaluru'
  }, [state.user.city])

  const [detectedCity, setDetectedCity] = useState<string>(profileBaseCity)
  const [locationNotice, setLocationNotice] = useState<string>('')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [modeFilter, setModeFilter] = useState<'all' | ConsultationChannel>('all')
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState<SpecialistCategory>('All')

  // Guided booking modal state
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null)
  const [apptDate, setApptDate] = useState<string>(() => addDaysIso(1))
  const [apptSlot, setApptSlot] = useState<string>('10:30 AM')
  const [apptMode, setApptMode] =
    useState<'Video Tele-consult' | 'In-clinic'>('Video Tele-consult')
  const [patientAreaInput, setPatientAreaInput] = useState<string>(
    state.user.city || 'Bengaluru, India'
  )
  const [apptReason, setApptReason] = useState('')
  const [shareReportConsent, setShareReportConsent] = useState(true)
  const [bookingConfirmed, setBookingConfirmed] = useState<{
    bookingCode: string
    name: string
    date: string
    timeSlot: string
    modeLabel: string
  } | null>(null)
  const [emergencyOpen, setEmergencyOpen] = useState(false)

  const trustedName = (state.user.emergencyContactName || '').trim()
  const trustedPhone = (state.user.emergencyContactPhone || '').trim()

  const quickDates = useMemo(
    () => [
      { label: t.clinicalPage.quickDateToday, value: addDaysIso(0) },
      { label: t.clinicalPage.quickDateTomorrow, value: addDaysIso(1) },
      { label: t.clinicalPage.quickDatePlus2, value: addDaysIso(2) },
      { label: t.clinicalPage.quickDatePlus3, value: addDaysIso(3) },
    ],
    [
      t.clinicalPage.quickDateToday,
      t.clinicalPage.quickDateTomorrow,
      t.clinicalPage.quickDatePlus2,
      t.clinicalPage.quickDatePlus3,
    ]
  )

  const availableCities = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    state.doctors.forEach((doc) => {
      const c = doc.city.trim()
      if (c && !seen.has(c.toLowerCase())) {
        seen.add(c.toLowerCase())
        list.push(c)
      }
    })
    return list
  }, [state.doctors])

  const isDoctorNearUser = (doc: DoctorProfile) => {
    const activeTarget = normalizeCityToken(detectedCity)
    const docToken = normalizeCityToken(doc.city)
    if (!activeTarget || !docToken) return false
    return docToken === activeTarget || docToken.includes(activeTarget) || activeTarget.includes(docToken)
  }

  const filteredDoctors = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = state.doctors.filter((doc) => {
      const loc = getLocalizedDoctor(doc, t)
      const docModes = doc.consultationModes ?? ['online', 'offline']
      const matchSpec = specialty === 'All' || doc.specialty === specialty
      const matchMode = modeFilter === 'all' || docModes.includes(modeFilter)

      const matchCity =
        cityFilter === 'all'
          ? true
          : cityFilter === '__near__'
            ? isDoctorNearUser(doc)
            : normalizeCityToken(doc.city) === normalizeCityToken(cityFilter)

      const matchQuery =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        loc.name.toLowerCase().includes(q) ||
        doc.hospitalOrClinic.toLowerCase().includes(q) ||
        loc.clinic.toLowerCase().includes(q) ||
        doc.city.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q) ||
        (doc.locality ?? '').toLowerCase().includes(q) ||
        doc.languages.join(' ').toLowerCase().includes(q) ||
        loc.languages.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q) ||
        loc.specialty.toLowerCase().includes(q)

      return matchSpec && matchMode && matchCity && matchQuery
    })

    // Sort priority: Active Near-Location first, then Active others, then Paused
    return [...list].sort((a, b) => {
      const aActive = a.acceptingBookings !== false ? 0 : 1
      const bActive = b.acceptingBookings !== false ? 0 : 1
      if (aActive !== bActive) return aActive - bActive
      const aNear = isDoctorNearUser(a) ? 0 : 1
      const bNear = isDoctorNearUser(b) ? 0 : 1
      return aNear - bNear
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.doctors, search, specialty, modeFilter, cityFilter, detectedCity, t])

  const openBookingModal = (
    doc: DoctorProfile,
    preferredChannel?: ConsultationChannel
  ) => {
    const docModes = doc.consultationModes ?? ['online', 'offline']
    let resolvedMode: 'Video Tele-consult' | 'In-clinic' = 'Video Tele-consult'
    if (preferredChannel === 'offline' && docModes.includes('offline')) {
      resolvedMode = 'In-clinic'
    } else if (preferredChannel === 'online' && docModes.includes('online')) {
      resolvedMode = 'Video Tele-consult'
    } else if (!docModes.includes('online') && docModes.includes('offline')) {
      resolvedMode = 'In-clinic'
    }

    const slots = doc.availableSlots?.length
      ? doc.availableSlots
      : ['09:30 AM', '10:30 AM', '11:15 AM', '04:00 PM', '06:00 PM']

    setSelectedDoctor(doc)
    setApptMode(resolvedMode)
    setApptSlot(slots[0])
    setPatientAreaInput(state.user.city || detectedCity)
  }

  const handleUseMyNearLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const matchedCity = nearestKnownCity(
            pos.coords.latitude,
            pos.coords.longitude
          )
          setDetectedCity(matchedCity)
          setCityFilter('__near__')
          setLocationNotice(`${t.clinicalPage.locationDetected}: ${matchedCity}`)
        },
        () => {
          setDetectedCity(profileBaseCity)
          setCityFilter('__near__')
          setLocationNotice(`${t.clinicalPage.locationFallback}: ${profileBaseCity}`)
        },
        { timeout: 3500 }
      )
    } else {
      setDetectedCity(profileBaseCity)
      setCityFilter('__near__')
      setLocationNotice(`${t.clinicalPage.locationFallback}: ${profileBaseCity}`)
    }
  }

  const resetAllFilters = () => {
    setSearch('')
    setSpecialty('All')
    setCityFilter('all')
    setModeFilter('all')
  }

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoctor) return
    const locDoc = getLocalizedDoctor(selectedDoctor, t)
    const code = bookConsultation({
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      date: apptDate,
      timeSlot: apptSlot,
      mode: apptMode,
      sharedAssessmentReport: shareReportConsent,
      reason:
        apptReason.trim() || DEFAULT_BOOK_REASON[lang] || DEFAULT_BOOK_REASON.en,
      patientName: state.user.fullName,
      patientCity: patientAreaInput.trim() || state.user.city,
      clinicCity: selectedDoctor.city,
      clinicLocality: selectedDoctor.locality,
      hospitalOrClinic: selectedDoctor.hospitalOrClinic,
    })
    const modeLabel =
      apptMode === 'Video Tele-consult'
        ? t.clinicalPage.modeVideo
        : t.clinicalPage.modeInClinic
    setBookingConfirmed({
      bookingCode: code,
      name: locDoc.name,
      date: apptDate,
      timeSlot: apptSlot,
      modeLabel,
    })
    setSelectedDoctor(null)
    setApptReason('')
    setTimeout(() => setBookingConfirmed(null), 6500)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadClinicalReport({
      fileName: file.name,
      fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
      category: 'Uploaded Lab / Clinic Document',
      sharedWithClinician: false,
    })
    e.target.value = ''
  }

  const getLocalizedConsultation = (c: ConsultationRecord) => {
    const docMatch = state.doctors.find((d) => d.id === c.doctorId)
    const locDoc = docMatch ? getLocalizedDoctor(docMatch, t) : null

    const doctorName = locDoc?.name ?? c.doctorName
    const specLabel =
      (t.specialistCategories as Record<string, string>)[c.specialty] ??
      locDoc?.specialty ??
      c.specialty
    const modeLabel =
      c.mode === 'Video Tele-consult'
        ? t.clinicalPage.modeVideo
        : t.clinicalPage.modeInClinic

    const isCompleted = c.status === 'Completed (Sample)'
    const isPending = c.status === 'Pending Review (Demo)'
    const statusLabel = isCompleted
      ? t.clinicalPage.statusCompleted
      : isPending
        ? t.clinicalPage.statusPending
        : t.clinicalPage.statusConfirmed

    let reasonLabel = c.reason
    if (c.reason === SAMPLE_CONSULT_REASON.en) {
      reasonLabel = SAMPLE_CONSULT_REASON[lang] ?? c.reason
    } else {
      for (const defaultReason of Object.values(DEFAULT_BOOK_REASON)) {
        if (c.reason === defaultReason) {
          reasonLabel = DEFAULT_BOOK_REASON[lang] ?? c.reason
          break
        }
      }
    }

    const clinicPlace = [
      c.clinicLocality ?? docMatch?.locality,
      locDoc?.city ?? c.clinicCity,
    ]
      .filter(Boolean)
      .join(', ')

    return {
      doctorName,
      specLabel,
      modeLabel,
      isCompleted,
      isPending,
      statusLabel,
      reasonLabel,
      clinicPlace,
    }
  }

  const selectedModalModes = selectedDoctor?.consultationModes ?? ['online', 'offline']
  const selectedModalSlots =
    selectedDoctor?.availableSlots && selectedDoctor.availableSlots.length > 0
      ? selectedDoctor.availableSlots
      : ['09:30 AM', '10:30 AM', '11:15 AM', '04:00 PM', '06:00 PM']
  const selectedModalLoc = selectedDoctor
    ? getLocalizedDoctor(selectedDoctor, t)
    : null

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Badge variant="warning">{t.clinicalPage.badge}</Badge>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0F3D3E]">
            {t.clinicalPage.title}
          </h1>
          <p className="text-sm text-[#4A5D5E]">{t.clinicalPage.subtitle}</p>
        </div>

        {/* Clear distinction between Demo Providers & Admin-Managed Network */}
        <div className="rounded-2xl border border-[#C6601F]/40 bg-[#F7E8D8] p-4 flex items-start gap-3 text-xs text-[#7A360D]">
          <ShieldCheck className="h-5 w-5 text-[#C6601F] shrink-0 mt-0.5" />
          <span>
            <strong className="text-[#5C2606]">{t.clinicalPage.noticeBold}</strong> {t.clinicalPage.noticeBody1}
            <strong className="text-[#5C2606]">{t.clinicalPage.noticeSampleProfiles}</strong>
            {t.clinicalPage.noticeBody2}
          </span>
        </div>

        {/* Critical Situation & Immediate Emergency Access Card */}
        <Card className="border-2 border-[#C6601F]/55 bg-gradient-to-br from-[#FBF6EE] via-[#F7EFE3] to-[#F3E1D1]">
          <CardContent className="pt-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <Badge
                  variant="danger"
                  className="max-w-full whitespace-normal text-start leading-tight"
                >
                  <Siren className="h-3 w-3 shrink-0" />
                  <span>{t.emergencyHelp.clinicalCardBadge}</span>
                </Badge>
                <h2 className="font-vintage-serif text-base sm:text-lg font-bold text-[#8C3F10]">
                  {t.emergencyHelp.clinicalCardTitle}
                </h2>
                <p className="text-xs sm:text-sm text-[#263A3B] leading-relaxed">
                  {t.emergencyHelp.clinicalCardDesc}
                </p>
              </div>

              <Button
                type="button"
                variant="copper"
                size="sm"
                className="shrink-0 self-start md:self-center"
                onClick={() => setEmergencyOpen(true)}
              >
                <Siren className="h-3.5 w-3.5 shrink-0" />
                <span>{t.emergencyHelp.viewAllEmergencyBtn}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <a
                href="tel:112"
                className="flex items-center justify-between gap-3 rounded-xl border border-[#C6601F]/45 bg-[#FBF6EE] p-3.5 hover:border-[#C6601F] hover:bg-[#F7E8D8] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#7A360D]">
                    {t.emergencyHelp.quickCall112}
                  </p>
                  <p dir="ltr" className="text-lg font-extrabold text-[#C6601F] tabular-nums">
                    112
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C6601F] text-[#FAF4EA]">
                  <PhoneCall className="h-4 w-4" />
                </span>
              </a>

              <a
                href="tel:108"
                className="flex items-center justify-between gap-3 rounded-xl border border-[#C6601F]/35 bg-[#FBF6EE] p-3.5 hover:border-[#C6601F] hover:bg-[#F7E8D8] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#7A360D]">
                    {t.emergencyHelp.quickCall108}
                  </p>
                  <p dir="ltr" className="text-lg font-extrabold text-[#C6601F] tabular-nums">
                    108
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F7E8D8] text-[#C6601F] border border-[#C6601F]/40">
                  <HeartPulse className="h-4 w-4" />
                </span>
              </a>

              <a
                href="tel:14567"
                className="flex items-center justify-between gap-3 rounded-xl border border-[#7FB388]/55 bg-[#FBF6EE] p-3.5 hover:border-[#0F3D3E] hover:bg-[#7FB388]/18 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#0F3D3E]">
                    {t.emergencyHelp.quickCallElder}
                  </p>
                  <p dir="ltr" className="text-lg font-extrabold text-[#0F3D3E] tabular-nums">
                    14567
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7FB388]/28 text-[#0F3D3E]">
                  <PhoneCall className="h-4 w-4" />
                </span>
              </a>

              <a
                href={WEBSITE_EMERGENCY_TEL}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#2E6F73]/35 bg-[#FBF6EE] p-3.5 hover:border-[#2E6F73] hover:bg-[#EADCC8]/70 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#0F3D3E]">
                    {t.emergencyHelp.websiteDemoTag}
                  </p>
                  <p dir="ltr" className="text-sm sm:text-base font-extrabold text-[#2E6F73] tabular-nums">
                    {WEBSITE_EMERGENCY_NUMBER}
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2E6F73]/18 text-[#0F3D3E]">
                  <PhoneCall className="h-4 w-4" />
                </span>
              </a>
            </div>

            {Boolean(trustedName || trustedPhone) && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2E6F73]/30 bg-[#FBF6EE] px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs min-w-0">
                  <UserCheck className="h-4 w-4 text-[#2E6F73] shrink-0" />
                  <span className="font-bold text-[#0F3D3E]">
                    {t.emergencyHelp.trustedContactTitle}:
                  </span>
                  <span className="font-semibold text-[#263A3B]">
                    {trustedName || t.emergencyHelp.trustedContactTitle}
                  </span>
                  {trustedPhone && (
                    <span dir="ltr" className="font-bold text-[#0F3D3E] tabular-nums">
                      {trustedPhone}
                    </span>
                  )}
                </div>
                {trustedPhone && (
                  <a
                    href={toTelHref(trustedPhone)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#2E6F73] px-3 text-xs font-bold text-[#FAF4EA] hover:bg-[#0F3D3E] transition-colors"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>{t.emergencyHelp.trustedContactCallBtn}</span>
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {bookingConfirmed && (
          <div className="rounded-2xl border border-[#7FB388]/55 bg-[#7FB388]/20 px-4 py-3.5 text-xs text-[#0F3D3E] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                {t.clinicalPage.bookingConfirmedPrefix} {bookingConfirmed.name} (
                {bookingConfirmed.date} · {bookingConfirmed.timeSlot} ·{' '}
                {bookingConfirmed.modeLabel})
              </span>
            </div>
            <Badge variant="success">
              {t.clinicalPage.bookingCodePrefix} {bookingConfirmed.bookingCode}
            </Badge>
          </div>
        )}

        {/* Advanced Near-Location + Mode + Search Discovery Bar */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F3D3E]">
                  <MapPin className="h-4 w-4 text-[#2E6F73]" />
                  {t.clinicalPage.nearLocationTitle}
                </span>
                <Badge variant="cyan">
                  {t.clinicalPage.nearYouLabel}{' '}
                  {getLocalizedCityLabel(detectedCity, state.doctors, t)}
                </Badge>
                {locationNotice && (
                  <span className="text-[11px] font-medium text-[#0F3D3E]">
                    {locationNotice}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleUseMyNearLocation}
                >
                  <LocateFixed className="h-3.5 w-3.5 text-[#2E6F73]" />
                  {t.clinicalPage.useLocationBtn}
                </Button>
                <span className="text-xs font-medium text-[#4A5D5E] tabular-nums">
                  {filteredDoctors.length} {t.clinicalPage.doctorsFoundSuffix}
                </span>
              </div>
            </div>

            {/* Search + Consultation Mode Filter */}
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5D5E]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.clinicalPage.searchPlaceholder}
                  className="ps-10"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setModeFilter('all')}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
                    modeFilter === 'all'
                      ? 'border-[#0A0F14] bg-[#0A0F14] text-[#EADCC8]'
                      : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]/70'
                  )}
                >
                  {t.clinicalPage.allModes}
                </button>
                <button
                  type="button"
                  onClick={() => setModeFilter('online')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
                    modeFilter === 'online'
                      ? 'border-[#2E6F73] bg-[#2E6F73] text-[#FAF4EA]'
                      : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]/70'
                  )}
                >
                  <Video className="h-3.5 w-3.5" />
                  {t.clinicalPage.onlineFilter}
                </button>
                <button
                  type="button"
                  onClick={() => setModeFilter('offline')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
                    modeFilter === 'offline'
                      ? 'border-[#0F3D3E] bg-[#0F3D3E] text-[#FAF4EA]'
                      : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]/70'
                  )}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {t.clinicalPage.offlineFilter}
                </button>
              </div>
            </div>

            {/* City / Near-Location Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCityFilter('all')}
                className={cn(
                  'rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                  cityFilter === 'all'
                    ? 'border-[#2E6F73] bg-[#2E6F73]/18 text-[#0F3D3E]'
                    : 'border-[#2E6F73]/20 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]/70'
                )}
              >
                {t.clinicalPage.allCities}
              </button>
              <button
                type="button"
                onClick={() => setCityFilter('__near__')}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                  cityFilter === '__near__'
                    ? 'border-[#0F3D3E] bg-[#0F3D3E] text-[#FAF4EA]'
                    : 'border-[#7FB388]/65 bg-[#7FB388]/22 text-[#0F3D3E] hover:bg-[#7FB388]/35'
                )}
              >
                <MapPin className="h-3 w-3" />
                {t.clinicalPage.nearMeOnly} (
                {getLocalizedCityLabel(detectedCity, state.doctors, t)})
              </button>
              {availableCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setCityFilter(city)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                    cityFilter === city
                      ? 'border-[#2E6F73] bg-[#2E6F73] text-[#FAF4EA]'
                      : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]/70'
                  )}
                >
                  {getLocalizedCityLabel(city, state.doctors, t)}
                </button>
              ))}
            </div>

            {/* Specialty Filter Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#CBB9A1]/60">
              {SPECIALTIES.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSpecialty(sp)}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors',
                    specialty === sp
                      ? 'border-[#2E6F73] bg-[#2E6F73] text-[#FAF4EA]'
                      : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]/70'
                  )}
                >
                  {t.specialistCategories[sp] ?? sp}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Specialist Cards Grid */}
        {filteredDoctors.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center space-y-3">
              <p className="text-sm text-[#263A3B] max-w-lg mx-auto">
                {t.clinicalPage.noDoctorsMatch}
              </p>
              <Button variant="outline" size="sm" onClick={resetAllFilters}>
                {t.clinicalPage.resetFiltersBtn}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doc) => {
              const loc = getLocalizedDoctor(doc, t)
              const near = isDoctorNearUser(doc)
              const isPaused = doc.acceptingBookings === false
              const docModes = doc.consultationModes ?? ['online', 'offline']
              return (
                <Card
                  key={doc.id}
                  className={cn(
                    'flex flex-col justify-between transition-all',
                    near && !isPaused && 'border-[#7FB388] shadow-sm'
                  )}
                >
                  <CardContent className="pt-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <Badge variant="primary">{loc.specialty}</Badge>
                        <div className="flex flex-wrap items-center gap-1">
                          {near && (
                            <Badge variant="success">
                              {t.clinicalPage.nearYouBadge}
                            </Badge>
                          )}
                          <Badge variant={doc.addedByAdmin ? 'cyan' : 'outline'}>
                            {doc.addedByAdmin
                              ? t.clinicalPage.adminManagedBadge
                              : t.clinicalPage.sampleProviderBadge}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-[#0F3D3E]">
                          {loc.name}
                        </h3>
                        <p className="text-xs text-[#2E6F73] font-medium">
                          {loc.credentials}
                        </p>
                      </div>

                      <p className="text-xs text-[#263A3B] leading-relaxed">
                        {loc.bio}
                      </p>

                      {/* Mode tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {docModes.includes('online') && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#2E6F73]/15 px-2 py-0.5 text-[10px] font-semibold text-[#0F3D3E]">
                            <Video className="h-3 w-3" />
                            {t.clinicalPage.onlineFilter}
                          </span>
                        )}
                        {docModes.includes('offline') && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#7FB388]/25 px-2 py-0.5 text-[10px] font-semibold text-[#0F3D3E]">
                            <Building2 className="h-3 w-3" />
                            {t.clinicalPage.offlineFilter}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-[11px] text-[#4A5D5E]">
                        <p className="flex items-start gap-1.5 text-[#0F3D3E] font-medium">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#2E6F73] mt-0.5" />
                          <span>
                            {loc.clinic} ·{' '}
                            {doc.locality
                              ? `${t.clinicalPage.localityPinPrefix} ${doc.locality}, `
                              : ''}
                            {loc.city}
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {t.clinicalPage.nextDemoSlot} {loc.nextSlot}
                          </span>
                        </p>
                        <p>
                          {t.clinicalPage.languagesLabel} {loc.languages} ·{' '}
                          {doc.experienceYears} {t.clinicalPage.experienceSuffix}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#CBB9A1]/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#0F3D3E] tabular-nums">
                          ₹{doc.consultationFeeInr}
                        </span>
                        {isPaused ? (
                          <Badge variant="warning">
                            {t.clinicalPage.pausedBadge}
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {docModes.includes('online') && (
                              <button
                                type="button"
                                onClick={() => openBookingModal(doc, 'online')}
                                className="rounded-lg border border-[#2E6F73]/30 bg-[#2E6F73]/10 px-2 py-1 text-[10px] font-semibold text-[#0F3D3E] hover:bg-[#2E6F73]/20 transition-colors"
                              >
                                {t.clinicalPage.bookOnlineQuick}
                              </button>
                            )}
                            {docModes.includes('offline') && (
                              <button
                                type="button"
                                onClick={() => openBookingModal(doc, 'offline')}
                                className="rounded-lg border border-[#7FB388]/50 bg-[#7FB388]/20 px-2 py-1 text-[10px] font-semibold text-[#0F3D3E] hover:bg-[#7FB388]/35 transition-colors"
                              >
                                {t.clinicalPage.bookOfflineQuick}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isPaused}
                        className="w-full"
                        onClick={() => openBookingModal(doc)}
                      >
                        <Stethoscope className="h-3.5 w-3.5" />
                        {t.clinicalPage.requestApptBtn}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Lower Section: Upload Reports + Consultation History */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Upload Previous Reports */}
          <Card className="lg:col-span-6">
            <CardHeader>
              <CardTitle>{t.clinicalPage.uploadTitle}</CardTitle>
              <CardDescription>{t.clinicalPage.uploadDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#CBB9A1] bg-[#FBF6EE] px-4 py-6 text-center hover:border-[#2E6F73] transition-colors">
                <FileUp className="h-7 w-7 text-[#2E6F73] mb-2" />
                <span className="text-xs font-semibold text-[#0F3D3E]">
                  {t.clinicalPage.uploadClickPrompt}
                </span>
                <span className="text-[11px] text-[#4A5D5E] mt-0.5">
                  {t.clinicalPage.uploadLocalNote}
                </span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="space-y-2">
                {state.uploadedReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0F3D3E] truncate">
                        {rep.fileName}
                      </p>
                      <p className="text-[11px] text-[#4A5D5E]">
                        {rep.fileSizeKb} KB · {t.clinicalPage.uploadedPrefix}{' '}
                        {rep.uploadedAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[#4A5D5E]">
                        {rep.sharedWithClinician
                          ? t.clinicalPage.sharedLabel
                          : t.clinicalPage.privateLabel}
                      </span>
                      <Switch
                        checked={rep.sharedWithClinician}
                        onCheckedChange={() => toggleReportShare(rep.id)}
                        aria-label={`${t.clinicalPage.sharedLabel} - ${rep.fileName}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Consultation History */}
          <Card className="lg:col-span-6">
            <CardHeader>
              <CardTitle>{t.clinicalPage.historyTitle}</CardTitle>
              <CardDescription>{t.clinicalPage.historyDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {state.consultations.map((c) => {
                const loc = getLocalizedConsultation(c)
                const isOnline = c.mode === 'Video Tele-consult'
                return (
                  <div
                    key={c.id}
                    className="rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] p-3.5 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-[#0F3D3E]">
                          {loc.doctorName}
                        </span>
                        {c.bookingCode && (
                          <Badge variant="outline">{c.bookingCode}</Badge>
                        )}
                      </div>
                      <Badge
                        variant={
                          loc.isCompleted
                            ? 'success'
                            : loc.isPending
                              ? 'warning'
                              : 'primary'
                        }
                      >
                        {loc.statusLabel}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#263A3B]">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                          isOnline
                            ? 'bg-[#2E6F73]/15 text-[#0F3D3E]'
                            : 'bg-[#7FB388]/25 text-[#0F3D3E]'
                        )}
                      >
                        {isOnline ? (
                          <Video className="h-3 w-3" />
                        ) : (
                          <Building2 className="h-3 w-3" />
                        )}
                        {loc.modeLabel}
                      </span>
                      <span>
                        {loc.specLabel} · {c.date} · {c.timeSlot}
                      </span>
                    </div>

                    {loc.clinicPlace && (
                      <p className="text-[11px] text-[#4A5D5E] flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#2E6F73] shrink-0" />
                        <span>{loc.clinicPlace}</span>
                      </p>
                    )}

                    <p className="text-[11px] text-[#4A5D5E]">
                      {t.clinicalPage.reasonPrefix} {loc.reasonLabel}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <p className="text-[11px] font-medium text-[#0F3D3E]">
                        {c.sharedAssessmentReport
                          ? `✓ ${t.clinicalPage.consentedShareText}`
                          : t.clinicalPage.reportNotSharedText}
                      </p>
                      <span className="text-[10px] text-[#4A5D5E]">
                        {t.clinicalPage.adminStatusHint}
                      </span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Advanced User-Friendly Guided Booking Modal */}
        <Modal
          open={Boolean(selectedDoctor)}
          onClose={() => setSelectedDoctor(null)}
          title={t.clinicalPage.modalTitle}
          subtitle={
            selectedModalLoc
              ? `${selectedModalLoc.name} · ${selectedModalLoc.clinic} (${selectedModalLoc.city})`
              : undefined
          }
          maxWidthClass="max-w-xl"
        >
          <form onSubmit={handleBook} className="space-y-4">
            {/* Step 1: Online vs Offline Visual Cards */}
            <div>
              <label className="text-xs font-semibold text-[#0F3D3E]">
                {t.clinicalPage.consultMode}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1.5">
                {(
                  [
                    {
                      channel: 'online' as const,
                      value: 'Video Tele-consult' as const,
                      label: t.clinicalPage.modeVideo,
                      desc: t.clinicalPage.modeOnlineDesc,
                      icon: Video,
                    },
                    {
                      channel: 'offline' as const,
                      value: 'In-clinic' as const,
                      label: t.clinicalPage.modeInClinic,
                      desc: `${t.clinicalPage.modeOfflineDescPrefix} ${
                        selectedDoctor?.locality
                          ? `${selectedDoctor.locality}, `
                          : ''
                      }${selectedModalLoc?.city ?? ''}`,
                      icon: Building2,
                    },
                  ]
                ).map((m) => {
                  const supported = selectedModalModes.includes(m.channel)
                  const Icon = m.icon
                  const active = apptMode === m.value
                  return (
                    <button
                      key={m.value}
                      type="button"
                      disabled={!supported}
                      onClick={() => setApptMode(m.value)}
                      className={cn(
                        'flex items-start gap-2.5 rounded-xl border p-3 text-start transition-all',
                        !supported
                          ? 'border-[#CBB9A1]/60 bg-[#EADCC8]/40 opacity-50 cursor-not-allowed'
                          : active
                            ? 'border-[#2E6F73] bg-[#2E6F73]/12 ring-1 ring-[#2E6F73]/35'
                            : 'border-[#2E6F73]/25 bg-[#FBF6EE] hover:bg-[#EADCC8]/65'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                          active
                            ? 'bg-[#2E6F73] text-[#FAF4EA]'
                            : 'bg-[#EADCC8] text-[#0F3D3E]'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0F3D3E]">
                          {m.label}
                        </p>
                        <p className="text-[11px] text-[#4A5D5E] leading-snug mt-0.5">
                          {supported ? m.desc : t.clinicalPage.modeUnavailable}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Quick Date Pills + Calendar Input */}
            <div>
              <label className="text-xs font-semibold text-[#0F3D3E]">
                {t.clinicalPage.preferredDate}
              </label>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {quickDates.map((qd) => (
                  <button
                    key={qd.value}
                    type="button"
                    onClick={() => setApptDate(qd.value)}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                      apptDate === qd.value
                        ? 'border-[#2E6F73] bg-[#2E6F73] text-[#FAF4EA]'
                        : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]/70'
                    )}
                  >
                    {qd.label}
                  </button>
                ))}
                <Input
                  type="date"
                  value={apptDate}
                  onChange={(e) => setApptDate(e.target.value)}
                  className="h-8 w-auto text-xs ms-auto"
                  required
                />
              </div>
            </div>

            {/* Step 3: Interactive Time Slot Pills */}
            <div>
              <label className="text-xs font-semibold text-[#0F3D3E] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#2E6F73]" />
                {t.clinicalPage.timeSlot}
              </label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {selectedModalSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    aria-pressed={apptSlot === slot}
                    onClick={() => setApptSlot(slot)}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-xs font-semibold tabular-nums transition-colors',
                      apptSlot === slot
                        ? 'border-[#2E6F73] bg-[#2E6F73] text-[#FAF4EA] shadow-sm'
                        : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]/70'
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Patient Near Area & Discussion Goals */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#0F3D3E]">
                  {t.clinicalPage.patientCityLabel}
                </label>
                <Input
                  value={patientAreaInput}
                  onChange={(e) => setPatientAreaInput(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0F3D3E]">
                  {t.clinicalPage.discussionGoals}
                </label>
                <Textarea
                  value={apptReason}
                  onChange={(e) => setApptReason(e.target.value)}
                  placeholder={t.clinicalPage.discussionPlaceholder}
                  className="mt-1 min-h-[42px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-[#FBF6EE] p-3 border border-[#2E6F73]/25">
              <div>
                <p className="text-xs font-semibold text-[#0F3D3E]">
                  {t.clinicalPage.shareSummaryTitle}
                </p>
                <p className="text-[11px] text-[#4A5D5E]">
                  {t.clinicalPage.shareSummaryDesc}
                </p>
              </div>
              <Switch
                checked={shareReportConsent}
                onCheckedChange={setShareReportConsent}
                aria-label={t.clinicalPage.shareSummaryTitle}
              />
            </div>

            {/* Live Booking Summary Strip */}
            {selectedDoctor && (
              <div className="rounded-xl border border-[#2E6F73]/35 bg-[#EADCC8]/75 px-3.5 py-2.5 text-xs text-[#0A0F14] flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong className="text-[#0F3D3E]">{t.clinicalPage.bookingSummaryLabel}</strong>{' '}
                  {apptMode === 'Video Tele-consult'
                    ? t.clinicalPage.modeVideo
                    : t.clinicalPage.modeInClinic}{' '}
                  · {apptDate} · {apptSlot}
                </span>
                <span className="font-bold text-[#0F3D3E] tabular-nums">
                  ₹{selectedDoctor.consultationFeeInr}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setSelectedDoctor(null)}>
                {t.cancel}
              </Button>
              <Button type="submit" variant="primary">
                {t.clinicalPage.confirmDemoBtn}
              </Button>
            </div>
          </form>
        </Modal>

        <EmergencyHelpModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
      </div>
    </AppShell>
  )
}

import type { FullTranslationBundle } from '@/data/locales/types'
import {
  getLocalizedCohortPatient,
  localizeGameMetric,
} from '@/data/translations'
import type {
  AdminPatientRecord,
  AssessmentCategoryId,
  GameType,
  NeuroCareState,
} from '@/types/neurocare'

export type PatientActivityKind =
  | 'assessment'
  | 'game'
  | 'sleep'
  | 'lifestyle'
  | 'appointment'
  | 'assistant'

export interface PatientCognitivePoint {
  dateLabel: string
  fullDate: string
  tasksPct: number
  functionalPct: number
}

export interface PatientWellnessPoint {
  dateLabel: string
  fullDate: string
  sleepHours: number
  steps: number
  stressLevel: number
}

export interface PatientDomainPoint {
  categoryId: AssessmentCategoryId
  domain: string
  fullDomain: string
  scorePct: number
}

export interface PatientActivityItem {
  id: string
  kind: PatientActivityKind
  date: string
  timeLabel: string
  title: string
  detail: string
  metricText: string
  variant: 'primary' | 'success' | 'warning' | 'cyan' | 'outline'
}

export interface PatientDeepActivityProfile {
  isLiveUser: boolean
  todayCount: number
  isActiveToday: boolean
  cognitiveTrend: PatientCognitivePoint[]
  wellnessTrend: PatientWellnessPoint[]
  domainProfile: PatientDomainPoint[]
  strongestDomain: PatientDomainPoint | null
  focusDomain: PatientDomainPoint | null
  activities: PatientActivityItem[]
  countsByKind: Record<'all' | PatientActivityKind, number>
}

function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function hashSeed(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 997
  }
  return h
}

export function buildPatientActivityProfile(
  patient: AdminPatientRecord,
  state: NeuroCareState,
  t: FullTranslationBundle
): PatientDeepActivityProfile {
  const todayIso = new Date().toISOString().slice(0, 10)
  const domainShort = t.historyPage.todayHub.domainShort
  const actsText = t.adminPage.patientTracker.activityKinds
  const actTemplates = t.adminPage.patientTracker.templates

  if (patient.id === state.user.id) {
    const chronoAssessments = [...state.assessments].sort((a, b) =>
      a.completedAt.localeCompare(b.completedAt)
    )
    const cognitiveTrend: PatientCognitivePoint[] = chronoAssessments.map((s) => ({
      dateLabel: s.date.slice(5),
      fullDate: s.date,
      tasksPct: s.taskPerformancePct,
      functionalPct: s.functionalQuestionnairePct,
    }))

    const sortedSleep = [...state.sleepLogs].sort((a, b) =>
      a.date.localeCompare(b.date)
    )
    const sortedLifestyle = [...state.lifestyleLogs].sort((a, b) =>
      a.date.localeCompare(b.date)
    )
    const dateSet = new Set<string>([
      ...sortedSleep.slice(-7).map((s) => s.date),
      ...sortedLifestyle.slice(-7).map((l) => l.date),
    ])
    const wellnessDates = [...dateSet].sort().slice(-7)
    const wellnessTrend: PatientWellnessPoint[] = wellnessDates.map((d) => {
      const sl = sortedSleep.find((s) => s.date === d)
      const lf = sortedLifestyle.find((l) => l.date === d)
      return {
        dateLabel: d.slice(5),
        fullDate: d,
        sleepHours: sl?.durationHours ?? 0,
        steps: lf?.walkingSteps ?? 0,
        stressLevel: lf?.stressLevel ?? 0,
      }
    })

    const latestAsmt = chronoAssessments[chronoAssessments.length - 1]
    const domainProfile: PatientDomainPoint[] = latestAsmt
      ? latestAsmt.categories.map((cat) => ({
          categoryId: cat.categoryId,
          domain:
            domainShort[cat.categoryId] ??
            t.categoryNames[cat.categoryId] ??
            cat.label,
          fullDomain: t.categoryNames[cat.categoryId] ?? cat.label,
          scorePct: cat.accuracyPct,
        }))
      : []

    const activities: PatientActivityItem[] = []

    chronoAssessments.forEach((s) => {
      activities.push({
        id: `act-${s.id}`,
        kind: 'assessment',
        date: s.date,
        timeLabel: s.completedAt.slice(11, 16) || '09:00',
        title: actsText.assessment,
        detail: `${t.dashboard.tasksAELabel}: ${s.taskPerformancePct}% · ${t.dashboard.functionalQShort}: ${s.functionalQuestionnairePct}%`,
        metricText: `${s.taskPerformancePct}%`,
        variant: 'primary',
      })
    })

    state.gameResults.forEach((g) => {
      const gameTitle = t.gamesPage.catalog[g.gameType]?.title ?? g.gameName
      activities.push({
        id: `act-${g.id}`,
        kind: 'game',
        date: g.date,
        timeLabel: g.completedAt.slice(11, 16) || '10:30',
        title: `${actsText.game}: ${gameTitle}`,
        detail: `${localizeGameMetric(g.metricValue, t)} · ${g.durationSeconds}s`,
        metricText: `${g.accuracyPct}%`,
        variant: 'success',
      })
    })

    sortedSleep.slice(-7).forEach((sl) => {
      activities.push({
        id: `act-${sl.id}`,
        kind: 'sleep',
        date: sl.date,
        timeLabel: sl.wakeTime || '06:30',
        title: actsText.sleep,
        detail: `${sl.bedtime} → ${sl.wakeTime} · ${t.analyticsPage.avgQuality7d} ${sl.qualityRating}/5`,
        metricText: `${sl.durationHours} ${t.units.hrs}`,
        variant: sl.durationHours >= 7 ? 'cyan' : 'warning',
      })
    })

    sortedLifestyle.slice(-7).forEach((lf) => {
      activities.push({
        id: `act-${lf.id}`,
        kind: 'lifestyle',
        date: lf.date,
        timeLabel: '18:30',
        title: actsText.lifestyle,
        detail: `${lf.exerciseMinutes} ${t.units.mins} · ${lf.hydrationGlasses} ${t.units.glasses}`,
        metricText: `${lf.walkingSteps.toLocaleString()} ${t.units.steps}`,
        variant: 'success',
      })
    })

    state.consultations.forEach((c) => {
      const modeText =
        c.mode === 'Video Tele-consult'
          ? t.clinicalPage.modeVideo
          : t.clinicalPage.modeInClinic
      activities.push({
        id: `act-${c.id}`,
        kind: 'appointment',
        date: c.date,
        timeLabel: c.timeSlot,
        title: `${actsText.appointment}: ${c.doctorName}`,
        detail: `${modeText} · ${c.clinicCity || c.patientCity || ''}`,
        metricText:
          c.status === 'Completed (Sample)'
            ? t.clinicalPage.statusCompleted
            : c.status === 'Pending Review (Demo)'
              ? t.clinicalPage.statusPending
              : t.clinicalPage.statusConfirmed,
        variant: c.status === 'Completed (Sample)' ? 'success' : 'primary',
      })
    })

    state.chatHistory
      .filter((m) => m.role === 'user')
      .slice(-5)
      .forEach((msg) => {
        activities.push({
          id: `act-${msg.id}`,
          kind: 'assistant',
          date: msg.timestamp.slice(0, 10) || todayIso,
          timeLabel: msg.timestamp.slice(11, 16) || '11:00',
          title: actsText.assistant,
          detail: msg.content,
          metricText: msg.mlIntent ? msg.mlIntent.toUpperCase() : 'ML',
          variant: 'outline',
        })
      })

    activities.sort((a, b) =>
      `${b.date}T${b.timeLabel}`.localeCompare(`${a.date}T${a.timeLabel}`)
    )

    const countsByKind = buildKindCounts(activities)
    const todayCount = activities.filter((a) => a.date === todayIso).length
    const { strongestDomain, focusDomain } = pickDomainExtremes(domainProfile)

    return {
      isLiveUser: true,
      todayCount,
      isActiveToday: todayCount > 0,
      cognitiveTrend,
      wellnessTrend,
      domainProfile,
      strongestDomain,
      focusDomain,
      activities,
      countsByKind,
    }
  }

  // Deterministic individualized profile & full activity stream for cohort patients
  const seed = hashSeed(patient.id)
  const taskEnd = patient.latestTaskAccuracyPct
  const funcEnd = patient.latestFunctionalPct
  const hasAssessments = taskEnd !== null && patient.assessmentsCount > 0

  const cognitiveTrend: PatientCognitivePoint[] = hasAssessments
    ? (() => {
        const offsets =
          patient.status === 'Needs attention'
            ? [6, 4, 2, 0]
            : patient.status === 'Changed'
              ? [4, 2, 3, 0]
              : [-6, -3, -1, 0]
        const days = [28, 18, 9, patient.lastActiveLabel.toLowerCase().includes('today') ? 0 : 2]
        return offsets.slice(0, Math.max(2, Math.min(4, patient.assessmentsCount))).map((delta, i) => {
          const idx = offsets.length - Math.min(4, patient.assessmentsCount) + i
          const d = daysAgoIso(days[idx] ?? (3 - i) * 7)
          const tVal = Math.max(45, Math.min(99, taskEnd + delta))
          const fBase = funcEnd ?? Math.min(98, tVal + 8)
          const fVal = Math.max(55, Math.min(100, fBase + (delta > 0 ? 2 : delta < 0 ? -2 : 0)))
          return {
            dateLabel: d.slice(5),
            fullDate: d,
            tasksPct: tVal,
            functionalPct: fVal,
          }
        })
      })()
    : []

  const hasWellness = patient.avgSleepHours7d > 0 || patient.avgSteps7d > 0
  const wellnessTrend: PatientWellnessPoint[] = hasWellness
    ? Array.from({ length: 7 }, (_, idx) => {
        const dayOffset = 6 - idx
        const d = daysAgoIso(dayOffset)
        const wave = ((seed + idx * 3) % 5) - 2
        const sleepHours = Number(
          Math.max(4.5, Math.min(9.0, patient.avgSleepHours7d + wave * 0.25)).toFixed(1)
        )
        const steps = Math.max(
          1500,
          Math.round(patient.avgSteps7d + wave * 420)
        )
        const stressLevel = Number(
          Math.max(1, Math.min(5, patient.avgStress7d + (wave % 2) * 0.4)).toFixed(1)
        )
        return {
          dateLabel: d.slice(5),
          fullDate: d,
          sleepHours,
          steps,
          stressLevel,
        }
      })
    : []

  const domainProfile: PatientDomainPoint[] = hasAssessments
    ? (
        [
          { id: 'memory' as const, shift: seed % 2 === 0 ? 4 : -4 },
          {
            id: 'attention' as const,
            shift: patient.status === 'Needs attention' ? -8 : 1,
          },
          { id: 'processing' as const, shift: (seed % 7) - 3 },
          { id: 'language' as const, shift: 3 },
          { id: 'executive' as const, shift: -2 },
          {
            id: 'functional' as const,
            shift: (funcEnd ?? 90) - taskEnd,
          },
        ] as const
      ).map((item) => ({
        categoryId: item.id,
        domain: domainShort[item.id] ?? t.categoryNames[item.id],
        fullDomain: t.categoryNames[item.id],
        scorePct: Math.max(45, Math.min(100, taskEnd + item.shift)),
      }))
    : []

  const activities: PatientActivityItem[] = []
  const isTodayCohort =
    patient.lastActiveLabel.toLowerCase().includes('today') ||
    patient.id === 'pat-102' ||
    patient.id === 'pat-106'

  cognitiveTrend.forEach((pt, idx) => {
    activities.push({
      id: `${patient.id}-ca-${idx}`,
      kind: 'assessment',
      date: pt.fullDate,
      timeLabel: idx % 2 === 0 ? '09:15' : '08:50',
      title: actsText.assessment,
      detail: `${t.dashboard.tasksAELabel}: ${pt.tasksPct}% · ${t.dashboard.functionalQShort}: ${pt.functionalPct}%`,
      metricText: `${pt.tasksPct}%`,
      variant: pt.tasksPct >= 80 ? 'primary' : 'warning',
    })
  })

  const sampleGames: GameType[] = [
    'memory-pairs',
    'object-location',
    'word-recall',
    'number-sequence',
    'pattern-recognition',
  ]
  const gameCount = Math.min(4, Math.max(0, patient.gamesPlayedCount))
  for (let i = 0; i < gameCount; i++) {
    const gt = sampleGames[(seed + i) % sampleGames.length]
    const gTitle = t.gamesPage.catalog[gt]?.title ?? gt
    const gAcc = Math.max(
      68,
      Math.min(100, (taskEnd ?? 78) + ((i * 3 + seed) % 9) - 2)
    )
    const gDate = daysAgoIso(isTodayCohort && i === 0 ? 0 : i + 1)
    activities.push({
      id: `${patient.id}-gm-${i}`,
      kind: 'game',
      date: gDate,
      timeLabel: `1${(i % 5) + 1}:20`,
      title: `${actsText.game}: ${gTitle}`,
      detail: `${actTemplates.completedDrill} · ${42 + i * 7}s`,
      metricText: `${gAcc}%`,
      variant: 'success',
    })
  }

  wellnessTrend.slice(-4).forEach((w, i) => {
    activities.push({
      id: `${patient.id}-sl-${i}`,
      kind: 'sleep',
      date: w.fullDate,
      timeLabel: '06:45',
      title: actsText.sleep,
      detail: `${actTemplates.nightlyRest} · ${t.analyticsPage.avgStress7d} ${w.stressLevel}/5`,
      metricText: `${w.sleepHours} ${t.units.hrs}`,
      variant: w.sleepHours >= 7 ? 'cyan' : 'warning',
    })
    activities.push({
      id: `${patient.id}-lf-${i}`,
      kind: 'lifestyle',
      date: w.fullDate,
      timeLabel: '18:10',
      title: actsText.lifestyle,
      detail: `${actTemplates.dailyWalk} · ${patient.wearableProvider !== 'None' ? patient.wearableProvider : t.personalLabel}`,
      metricText: `${w.steps.toLocaleString()} ${t.units.steps}`,
      variant: 'success',
    })
  })

  if (patient.assessmentsCount > 0) {
    const localizedCohort = getLocalizedCohortPatient(patient, t)
    activities.push({
      id: `${patient.id}-ai-1`,
      kind: 'assistant',
      date: daysAgoIso(isTodayCohort ? 0 : 2),
      timeLabel: '10:05',
      title: actsText.assistant,
      detail: localizedCohort.cognitiveSuggestion,
      metricText: 'AI + ML',
      variant: 'outline',
    })
  }

  activities.sort((a, b) =>
    `${b.date}T${b.timeLabel}`.localeCompare(`${a.date}T${a.timeLabel}`)
  )

  const countsByKind = buildKindCounts(activities)
  const todayCount = activities.filter((a) => a.date === todayIso).length
  const { strongestDomain, focusDomain } = pickDomainExtremes(domainProfile)

  return {
    isLiveUser: false,
    todayCount,
    isActiveToday: todayCount > 0,
    cognitiveTrend,
    wellnessTrend,
    domainProfile,
    strongestDomain,
    focusDomain,
    activities,
    countsByKind,
  }
}

function buildKindCounts(
  items: PatientActivityItem[]
): Record<'all' | PatientActivityKind, number> {
  const counts: Record<'all' | PatientActivityKind, number> = {
    all: items.length,
    assessment: 0,
    game: 0,
    sleep: 0,
    lifestyle: 0,
    appointment: 0,
    assistant: 0,
  }
  items.forEach((it) => {
    counts[it.kind] += 1
  })
  return counts
}

function pickDomainExtremes(domainProfile: PatientDomainPoint[]) {
  if (domainProfile.length === 0) {
    return { strongestDomain: null, focusDomain: null }
  }
  const sortedDesc = [...domainProfile].sort((a, b) => b.scorePct - a.scorePct)
  const sortedAsc = [...domainProfile].sort((a, b) => {
    if (a.scorePct !== b.scorePct) return a.scorePct - b.scorePct
    return a.categoryId === 'functional' ? 1 : -1
  })
  return {
    strongestDomain: sortedDesc[0],
    focusDomain: sortedAsc[0],
  }
}

import { useMemo, useState } from 'react'
import {
  Activity,
  Award,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Footprints,
  Gamepad2,
  ListChecks,
  Moon,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
} from 'lucide-react'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import { Progress } from '@/components/ui/Progress'
import { getLocalizedCoordinatorNote } from '@/data/translations'
import type { FullTranslationBundle } from '@/data/locales/types'
import {
  buildPatientActivityProfile,
  type PatientActivityKind,
} from '@/services/patientActivityBuilder'
import type {
  AdminPatientRecord,
  CoordinatorNote,
  NeuroCareState,
  PatientSetupChecklist,
} from '@/types/neurocare'
import { cn } from '@/utils/cn'

export type PatientModalTab = 'overview' | 'timeline' | 'setup'

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

interface PatientActivityModalProps {
  open: boolean
  onClose: () => void
  initialTab: PatientModalTab
  patient: AdminPatientRecord | null
  patientDisplay: {
    city: string
    lastActive: string
    physicalSuggestion: string
    cognitiveSuggestion: string
  } | null
  state: NeuroCareState
  t: FullTranslationBundle
  patientNotes: CoordinatorNote[]
  newNoteText: string
  onChangeNoteText: (val: string) => void
  onAddNote: (e: React.FormEvent) => void
  onToggleSetupItem: (
    patientId: string,
    key: keyof PatientSetupChecklist
  ) => void
}

export function PatientActivityModal({
  open,
  onClose,
  initialTab,
  patient,
  patientDisplay,
  state,
  t,
  patientNotes,
  newNoteText,
  onChangeNoteText,
  onAddNote,
  onToggleSetupItem,
}: PatientActivityModalProps) {
  const [activeTab, setActiveTab] = useState<PatientModalTab>(initialTab)
  const [kindFilter, setKindFilter] = useState<'all' | PatientActivityKind>('all')

  const activityProfile = useMemo(() => {
    if (!patient) return null
    return buildPatientActivityProfile(patient, state, t)
  }, [patient, state, t])

  const filteredActivities = useMemo(() => {
    if (!activityProfile) return []
    if (kindFilter === 'all') return activityProfile.activities
    return activityProfile.activities.filter((a) => a.kind === kindFilter)
  }, [activityProfile, kindFilter])

  const naLabel = t.statusLabels['Insufficient information']
  const ptText = t.adminPage.patientTracker

  const renderActivityIcon = (kind: PatientActivityKind) => {
    switch (kind) {
      case 'assessment':
        return <ClipboardCheck className="h-4 w-4 text-[#2E6F73]" />
      case 'game':
        return <Gamepad2 className="h-4 w-4 text-[#0F3D3E]" />
      case 'sleep':
        return <Moon className="h-4 w-4 text-[#0F3D3E]" />
      case 'lifestyle':
        return <Footprints className="h-4 w-4 text-[#2E6F73]" />
      case 'appointment':
        return <Stethoscope className="h-4 w-4 text-[#C6601F]" />
      case 'assistant':
        return <Bot className="h-4 w-4 text-[#4A5D5E]" />
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={patient?.fullName ?? t.adminPage.inspector.defaultTitle}
      subtitle={
        patient && patientDisplay
          ? `${patient.email}${patient.phoneNumber ? ` · ${patient.phoneNumber}` : ''} · ${patientDisplay.city} · ${t.adminPage.inspector.enrolledPrefix} ${patient.enrolledDate}`
          : undefined
      }
      maxWidthClass="max-w-5xl"
    >
      {patient && patientDisplay && activityProfile && (
        <div className="space-y-5">
          {/* Status & Mode Sub-Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CBB9A1]/60 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                {
                  id: 'overview' as const,
                  label: ptText.tabGraphsOverview,
                  icon: BarChart3,
                },
                {
                  id: 'timeline' as const,
                  label: `${ptText.tabAllActivities} (${activityProfile.activities.length})`,
                  icon: ListChecks,
                },
                {
                  id: 'setup' as const,
                  label: `${ptText.tabSetupNotes} (${calcSetupPct(patient.setupChecklist)}%)`,
                  icon: ClipboardList,
                },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors',
                      activeTab === tab.id
                        ? 'border-[#2E6F73] bg-[#2E6F73] text-[#FAF4EA]'
                        : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]/70'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {patient.phoneVerified && (
                <Badge variant="success" className="whitespace-normal text-start">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span>{t.profilePage.phoneVerifiedBadge}</span>
                </Badge>
              )}
              {activityProfile.isActiveToday && (
                <Badge variant="success" className="whitespace-normal text-start">
                  {ptText.todayActiveBadge}: {activityProfile.todayCount}{' '}
                  {ptText.todayActivityCountLabel}
                </Badge>
              )}
              <StatusBadge status={patient.status} />
            </div>
          </div>

          {/* Always-visible Top 4 KPI Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] p-3">
              <span className="text-[10px] font-semibold uppercase text-[#4A5D5E]">
                {t.adminPage.inspector.tasksCard}
              </span>
              <p className="text-lg font-bold text-[#2E6F73] tabular-nums mt-0.5">
                {patient.latestTaskAccuracyPct !== null
                  ? `${patient.latestTaskAccuracyPct}%`
                  : naLabel}
              </p>
            </div>
            <div className="rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] p-3">
              <span className="text-[10px] font-semibold uppercase text-[#4A5D5E]">
                {t.adminPage.inspector.funcQCard}
              </span>
              <p className="text-lg font-bold text-[#0F3D3E] tabular-nums mt-0.5">
                {patient.latestFunctionalPct !== null
                  ? `${patient.latestFunctionalPct}%`
                  : naLabel}
              </p>
            </div>
            <div className="rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] p-3">
              <span className="text-[10px] font-semibold uppercase text-[#4A5D5E]">
                {t.adminPage.inspector.sleepAvgCard}
              </span>
              <p className="text-lg font-bold text-[#0F3D3E] tabular-nums mt-0.5">
                {patient.avgSleepHours7d} {t.units.hrs}
              </p>
            </div>
            <div className="rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] p-3">
              <span className="text-[10px] font-semibold uppercase text-[#4A5D5E]">
                {t.adminPage.inspector.dailyStepsCard}
              </span>
              <p className="text-lg font-bold text-[#2E6F73] tabular-nums mt-0.5">
                {patient.avgSteps7d.toLocaleString()}
              </p>
            </div>
          </div>

          {/* TAB 1: GRAPHS & ACTIVITY OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Row 1 Charts: Cognitive Trend + Sleep & Steps */}
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Cognitive & Functional Progress */}
                <div className="rounded-2xl border border-[#2E6F73]/20 bg-[#FAF4EA] p-4 space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#2E6F73]" />
                    <h4 className="text-xs font-bold text-[#0F3D3E]">
                      {ptText.cogTrendTitle}
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#4A5D5E]">
                    {ptText.cogTrendDesc}
                  </p>
                  {activityProfile.cognitiveTrend.length === 0 ? (
                    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-[#CBB9A1] bg-[#FBF6EE] p-4 text-center text-xs text-[#4A5D5E]">
                      {ptText.noAssessmentsYet}
                    </div>
                  ) : (
                    <div className="h-52 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={activityProfile.cognitiveTrend}
                          margin={{ top: 8, right: 10, left: -16, bottom: 2 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                          <XAxis
                            dataKey="dateLabel"
                            fontSize={11}
                            stroke="#4A5D5E"
                          />
                          <YAxis domain={[0, 100]} fontSize={11} stroke="#4A5D5E" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#F7EFE3',
                              borderRadius: '12px',
                              borderColor: '#2E6F73',
                              color: '#0A0F14',
                              fontSize: '11px',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Area
                            type="monotone"
                            dataKey="tasksPct"
                            name={ptText.tasksSeries}
                            stroke="#2E6F73"
                            fill="#2E6F73"
                            fillOpacity={0.18}
                            strokeWidth={2.5}
                            dot={{ r: 3.5, fill: '#2E6F73' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="functionalPct"
                            name={ptText.funcSeries}
                            stroke="#7FB388"
                            strokeWidth={2.5}
                            dot={{ r: 3.5, fill: '#7FB388' }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* 7-Day Sleep & Steps */}
                <div className="rounded-2xl border border-[#2E6F73]/20 bg-[#FAF4EA] p-4 space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#0F3D3E]" />
                    <h4 className="text-xs font-bold text-[#0F3D3E]">
                      {ptText.sleepAndStepsTitle}
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#4A5D5E]">
                    {ptText.sleepAndStepsDesc}
                  </p>
                  {activityProfile.wellnessTrend.length === 0 ? (
                    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-[#CBB9A1] bg-[#FBF6EE] p-4 text-center text-xs text-[#4A5D5E]">
                      {ptText.noWellnessYet}
                    </div>
                  ) : (
                    <div className="h-52 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={activityProfile.wellnessTrend}
                          margin={{ top: 8, right: 6, left: -10, bottom: 2 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                          <XAxis
                            dataKey="dateLabel"
                            fontSize={11}
                            stroke="#4A5D5E"
                          />
                          <YAxis
                            yAxisId="steps"
                            fontSize={10}
                            stroke="#0F3D3E"
                          />
                          <YAxis
                            yAxisId="sleep"
                            orientation="right"
                            domain={[0, 10]}
                            fontSize={10}
                            stroke="#2E6F73"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#F7EFE3',
                              borderRadius: '12px',
                              borderColor: '#2E6F73',
                              color: '#0A0F14',
                              fontSize: '11px',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar
                            yAxisId="steps"
                            dataKey="steps"
                            name={ptText.stepsSeries}
                            fill="#7FB388"
                            radius={[5, 5, 0, 0]}
                            barSize={18}
                          />
                          <Line
                            yAxisId="sleep"
                            type="monotone"
                            dataKey="sleepHours"
                            name={ptText.sleepSeries}
                            stroke="#2E6F73"
                            strokeWidth={2.5}
                            dot={{ r: 3.5, fill: '#2E6F73' }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: 6-Domain Profile Bar Chart + Strength/Focus & Coaching */}
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7 rounded-2xl border border-[#2E6F73]/20 bg-[#FAF4EA] p-4 space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#2E6F73]" />
                    <h4 className="text-xs font-bold text-[#0F3D3E]">
                      {ptText.domainRadarTitle}
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#4A5D5E]">
                    {ptText.domainRadarDesc}
                  </p>
                  {activityProfile.domainProfile.length === 0 ? (
                    <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-[#CBB9A1] bg-[#FBF6EE] p-4 text-center text-xs text-[#4A5D5E]">
                      {ptText.noAssessmentsYet}
                    </div>
                  ) : (
                    <div className="h-52 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={activityProfile.domainProfile}
                          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#CBB9A1"
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            domain={[0, 100]}
                            fontSize={11}
                            stroke="#4A5D5E"
                          />
                          <YAxis
                            type="category"
                            dataKey="domain"
                            width={82}
                            fontSize={11}
                            stroke="#263A3B"
                            tickLine={false}
                          />
                          <Tooltip
                            formatter={(val) => [`${val}%`, ptText.tasksSeries]}
                            contentStyle={{
                              backgroundColor: '#F7EFE3',
                              borderRadius: '12px',
                              borderColor: '#2E6F73',
                              color: '#0A0F14',
                              fontSize: '11px',
                            }}
                          />
                          <Bar
                            dataKey="scorePct"
                            name={ptText.tasksSeries}
                            fill="#2E6F73"
                            radius={[0, 6, 6, 0]}
                            barSize={14}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Right: Domain Highlights + Brain & Physical Guidance */}
                <div className="lg:col-span-5 space-y-3">
                  {activityProfile.strongestDomain &&
                    activityProfile.focusDomain && (
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="rounded-xl border border-[#7FB388]/55 bg-[#7FB388]/20 p-3 space-y-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0F3D3E]">
                            <Award className="h-3 w-3" />
                            {ptText.strongestSkillLabel}
                          </span>
                          <p className="text-xs font-bold text-[#0A0F14] truncate">
                            {activityProfile.strongestDomain.fullDomain}
                          </p>
                          <div className="flex items-center justify-between text-xs font-bold text-[#0F3D3E] tabular-nums">
                            <Progress
                              value={activityProfile.strongestDomain.scorePct}
                              className="h-1.5 me-2"
                              barClassName="bg-[#0F3D3E]"
                            />
                            {activityProfile.strongestDomain.scorePct}%
                          </div>
                        </div>

                        <div className="rounded-xl border border-[#C6601F]/45 bg-[#F7E8D8] p-3 space-y-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8C3F10]">
                            <Target className="h-3 w-3" />
                            {ptText.focusAreaLabel}
                          </span>
                          <p className="text-xs font-bold text-[#0A0F14] truncate">
                            {activityProfile.focusDomain.fullDomain}
                          </p>
                          <div className="flex items-center justify-between text-xs font-bold text-[#8C3F10] tabular-nums">
                            <Progress
                              value={activityProfile.focusDomain.scorePct}
                              className="h-1.5 me-2"
                              barClassName="bg-[#C6601F]"
                            />
                            {activityProfile.focusDomain.scorePct}%
                          </div>
                        </div>
                      </div>
                    )}

                  <div className="rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F3D3E]">
                      <Footprints className="h-4 w-4 text-[#2E6F73]" />
                      {t.adminPage.inspector.physicalFocusTitle}
                    </div>
                    <p className="text-xs text-[#263A3B]">
                      {patientDisplay.physicalSuggestion}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E6F73]">
                      <Sparkles className="h-4 w-4" />
                      {t.adminPage.inspector.cognitiveFocusTitle}
                    </div>
                    <p className="text-xs text-[#263A3B]">
                      {patientDisplay.cognitiveSuggestion}
                    </p>
                  </div>
                </div>
              </div>

              {/* Latest Activity Snapshot Strip */}
              <div className="rounded-2xl border border-[#2E6F73]/20 bg-[#FBF6EE] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#2E6F73]" />
                    <h4 className="text-xs font-bold text-[#0F3D3E]">
                      {ptText.tabAllActivities}
                    </h4>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('timeline')}
                  >
                    {t.viewAll} ({activityProfile.activities.length})
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {activityProfile.activities.slice(0, 4).map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#2E6F73]/20 bg-[#FAF4EA] px-3 py-2.5 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="mt-0.5 shrink-0">
                          {renderActivityIcon(act.kind)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0F3D3E] truncate">
                            {act.title}
                          </p>
                          <p className="text-[11px] text-[#4A5D5E] truncate">
                            {act.date} · {act.detail}
                          </p>
                        </div>
                      </div>
                      <Badge variant={act.variant} className="shrink-0 tabular-nums">
                        {act.metricText}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPLETE ACTIVITY TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Kind Filters */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all' as const, label: ptText.filterAll },
                  {
                    id: 'assessment' as const,
                    label: ptText.activityKinds.assessment,
                  },
                  { id: 'game' as const, label: ptText.activityKinds.game },
                  { id: 'sleep' as const, label: ptText.activityKinds.sleep },
                  {
                    id: 'lifestyle' as const,
                    label: ptText.activityKinds.lifestyle,
                  },
                  {
                    id: 'appointment' as const,
                    label: ptText.activityKinds.appointment,
                  },
                  {
                    id: 'assistant' as const,
                    label: ptText.activityKinds.assistant,
                  },
                ].map((f) => {
                  const cnt = activityProfile.countsByKind[f.id] ?? 0
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setKindFilter(f.id)}
                      className={cn(
                        'rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors tabular-nums',
                        kindFilter === f.id
                          ? 'border-[#2E6F73] bg-[#2E6F73] text-[#FAF4EA]'
                          : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]/70'
                      )}
                    >
                      {f.label} ({cnt})
                    </button>
                  )
                })}
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pe-1">
                {filteredActivities.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#CBB9A1] bg-[#FBF6EE] p-6 text-center text-xs text-[#4A5D5E]">
                    {ptText.emptyActivities}
                  </div>
                ) : (
                  filteredActivities.map((act) => (
                    <div
                      key={act.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] px-4 py-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF4EA] border border-[#2E6F73]/20 shrink-0">
                          {renderActivityIcon(act.kind)}
                        </span>
                        <div>
                          <p className="font-bold text-[#0F3D3E]">
                            {act.title}
                          </p>
                          <p className="text-[11px] text-[#263A3B] mt-0.5">
                            {act.detail}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:justify-end shrink-0">
                        <span className="text-[11px] text-[#4A5D5E] tabular-nums">
                          {act.date} · {act.timeLabel}
                        </span>
                        <Badge variant={act.variant} className="tabular-nums">
                          {act.metricText}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: 7-STEP SETUP CHECKLIST & COORDINATOR NOTES */}
          {activeTab === 'setup' && (
            <div className="space-y-5">
              {/* Interactive Setup & Activation Checklist */}
              <div className="rounded-2xl border border-[#2E6F73]/20 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-[#2E6F73]" />
                    <h4 className="text-sm font-bold text-[#0F3D3E]">
                      {t.adminPage.inspector.checklistHeading} (
                      {calcSetupPct(patient.setupChecklist)}%)
                    </h4>
                  </div>
                  <StatusBadge status={patient.status} />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {SETUP_STEP_KEYS.map((key) => {
                    const done = patient.setupChecklist[key]
                    const isLiveSelf = patient.id === state.user.id
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={isLiveSelf}
                        onClick={() => onToggleSetupItem(patient.id, key)}
                        className={cn(
                          'flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium text-start transition-colors',
                          done
                            ? 'border-[#7FB388]/60 bg-[#7FB388]/20 text-[#0F3D3E]'
                            : 'border-[#2E6F73]/20 bg-[#FBF6EE] text-[#4A5D5E]'
                        )}
                      >
                        <span>{t.adminPage.setupSteps[key]}</span>
                        <CheckCircle2
                          className={cn(
                            'h-4 w-4 shrink-0',
                            done ? 'text-[#0F3D3E]' : 'text-[#CBB9A1]'
                          )}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Care Coordinator Notes */}
              <div className="space-y-3 border-t border-[#CBB9A1]/60 pt-4">
                <h4 className="text-sm font-bold text-[#0F3D3E] flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#2E6F73]" />
                  {t.adminPage.inspector.notesTitle}
                </h4>

                <form onSubmit={onAddNote} className="flex gap-2">
                  <Textarea
                    value={newNoteText}
                    onChange={(e) => onChangeNoteText(e.target.value)}
                    placeholder={t.adminPage.inspector.notesPlaceholder}
                    className="min-h-[60px]"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    className="self-end shrink-0"
                  >
                    {t.adminPage.inspector.saveNoteBtn}
                  </Button>
                </form>

                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {patientNotes.length === 0 ? (
                    <p className="text-xs text-[#4A5D5E]">
                      {t.adminPage.inspector.noNotes}
                    </p>
                  ) : (
                    patientNotes.map((n) => {
                      const locN = getLocalizedCoordinatorNote(n, t)
                      const authorLabel =
                        n.author === 'Admin Care Coordinator (Demo)'
                          ? (t.coordinatorNoteLookup['cn-1']?.author ??
                            locN.author)
                          : locN.author
                      return (
                        <div
                          key={n.id}
                          className="rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] p-3 text-xs"
                        >
                          <div className="flex justify-between text-[11px] text-[#4A5D5E]">
                            <span className="font-semibold text-[#0F3D3E]">
                              {authorLabel}
                            </span>
                            <span>{n.createdAt}</span>
                          </div>
                          <p className="mt-1 text-[#263A3B]">{locN.text}</p>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}


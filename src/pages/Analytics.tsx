import { useMemo, useState } from 'react'
import { Info, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AppShell } from '@/components/layout/AppShell'
import { MedicalDisclaimerBanner } from '@/components/common/MedicalDisclaimerBanner'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import { computeBrainHealthReport } from '@/services/neurocareAI'
import type { CognitiveAssessmentSession } from '@/types/neurocare'
import { cn } from '@/utils/cn'

export default function Analytics() {
  const { state } = useNeuroCare()
  const t = useTranslation()
  const [filter, setFilter] = useState<'weekly' | 'monthly'>('monthly')
  const report = useMemo(() => computeBrainHealthReport(state), [state])

  const getLocalizedContextNote = (session: CognitiveAssessmentSession): string => {
    if (t.assessmentContextSampleNotes[session.id]) {
      return t.assessmentContextSampleNotes[session.id]
    }
    if (session.contextNote === 'Self-guided 6-domain check-in') {
      return t.assessmentContextSampleNotes.defaultSelfGuided
    }
    return session.contextNote || t.analyticsPage.routineNoteFallback
  }

  const assessmentsSorted = useMemo(
    () => [...state.assessments].sort((a, b) => a.date.localeCompare(b.date)),
    [state.assessments]
  )

  const cognitiveSeries = useMemo(() => {
    return assessmentsSorted.map((s) => {
      const mem = s.categories.find((c) => c.categoryId === 'memory')?.accuracyPct ?? 0
      const att = s.categories.find((c) => c.categoryId === 'attention')?.accuracyPct ?? 0
      const attMs = s.categories.find((c) => c.categoryId === 'attention')?.avgReactionMs ?? 700
      const func = s.functionalQuestionnairePct
      return {
        date: s.date.slice(5),
        memoryPct: mem,
        attentionPct: att,
        attentionMs: attMs,
        functionalPct: func,
        contextNote:
          t.assessmentContextSampleNotes[s.id] ??
          (s.contextNote === 'Self-guided 6-domain check-in'
            ? t.assessmentContextSampleNotes.defaultSelfGuided
            : s.contextNote) ??
          t.analyticsPage.routineNoteFallback,
      }
    })
  }, [assessmentsSorted, t])

  const sleepSeries = useMemo(() => {
    const sorted = [...state.sleepLogs].sort((a, b) => a.date.localeCompare(b.date))
    const sliced = filter === 'weekly' ? sorted.slice(-7) : sorted
    return sliced.map((s) => ({
      date: s.date.slice(5),
      hours: s.durationHours,
      quality: s.qualityRating,
    }))
  }, [state.sleepLogs, filter])

  const lifestyleSeries = useMemo(() => {
    const sorted = [...state.lifestyleLogs].sort((a, b) => a.date.localeCompare(b.date))
    const sliced = filter === 'weekly' ? sorted.slice(-7) : sorted
    return sliced.map((l) => ({
      date: l.date.slice(5),
      steps: l.walkingSteps,
      exercise: l.exerciseMinutes,
      mood: l.moodLevel,
      stress: l.stressLevel,
    }))
  }, [state.lifestyleLogs, filter])

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Badge variant="primary">{t.analyticsPage.badge}</Badge>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0F3D3E]">
              {t.analyticsPage.title}
            </h1>
            <p className="text-sm text-[#4A5D5E]">
              {t.analyticsPage.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-[#2E6F73]/25 bg-[#F7EFE3] p-1 self-start">
            <button
              type="button"
              onClick={() => setFilter('weekly')}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors',
                filter === 'weekly'
                  ? 'bg-[#2E6F73] text-[#FAF4EA]'
                  : 'text-[#4A5D5E] hover:text-[#0F3D3E]'
              )}
            >
              {t.analyticsPage.weeklyFilter}
            </button>
            <button
              type="button"
              onClick={() => setFilter('monthly')}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors',
                filter === 'monthly'
                  ? 'bg-[#2E6F73] text-[#FAF4EA]'
                  : 'text-[#4A5D5E] hover:text-[#0F3D3E]'
              )}
            >
              {t.analyticsPage.monthlyFilter}
            </button>
          </div>
        </div>

        <MedicalDisclaimerBanner compact />

        {/* Baseline & Practice-Effect Guardrail Banner */}
        <div className="rounded-2xl border border-[#2E6F73]/30 bg-[#F7EFE3] p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-[#2E6F73] shrink-0 mt-0.5" />
          <div className="text-xs text-[#263A3B] leading-relaxed">
            <strong className="text-[#0F3D3E]">{t.analyticsPage.interpretBold}</strong>{' '}
            {report.changeNarrative} {t.analyticsPage.interpretReminder}{' '}
            <strong className="text-[#0F3D3E]">{t.analyticsPage.interpretNoDeclineBold}</strong>
          </div>
        </div>

        {/* Baseline Comparison Indicators */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#4A5D5E]">
                  {t.analyticsPage.cardTasksTitle}
                </span>
                <StatusBadge status={report.taskStatus} />
              </div>
              <p className="text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {report.latestTaskPct !== null ? `${report.latestTaskPct}%` : '—'}
              </p>
              <p className="text-[11px] text-[#4A5D5E]">
                {report.taskDeltaPct !== null
                  ? `${report.taskDeltaPct >= 0 ? '+' : ''}${report.taskDeltaPct}% ${t.analyticsPage.vsPriorSession}`
                  : t.analyticsPage.baselineEstablished}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#4A5D5E]">
                  {t.analyticsPage.cardFuncTitle}
                </span>
                <StatusBadge status={report.functionalStatus} />
              </div>
              <p className="text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {report.latestFunctionalPct !== null
                  ? `${report.latestFunctionalPct}%`
                  : '—'}
              </p>
              <p className="text-[11px] text-[#4A5D5E]">
                {t.analyticsPage.selfReportedIndep}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#4A5D5E]">
                  {t.analyticsPage.cardSleepTitle}
                </span>
                <StatusBadge status={report.sleepStatus} />
              </div>
              <p className="text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {report.avgSleepHours7d} {t.units.hrs}
              </p>
              <p className="text-[11px] text-[#4A5D5E]">
                {t.analyticsPage.avgQuality7d} {report.avgSleepQuality7d}/5
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#4A5D5E]">
                  {t.analyticsPage.cardLifestyleTitle}
                </span>
                <StatusBadge status={report.lifestyleStatus} />
              </div>
              <p className="text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {report.avgSteps7d.toLocaleString()} {t.units.steps}
              </p>
              <p className="text-[11px] text-[#4A5D5E]">
                {t.analyticsPage.avgStress7d} {report.avgStress7d}/5
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 6 Separate Analytics Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 1. Memory Task Performance */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>{t.analyticsPage.charts.c1Title}</CardTitle>
                  <CardDescription>{t.analyticsPage.charts.c1Desc}</CardDescription>
                </div>
                <Badge variant="primary">{t.domainBadges.task}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cognitiveSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                    <XAxis dataKey="date" fontSize={12} stroke="#4A5D5E" />
                    <YAxis domain={[0, 100]} fontSize={12} stroke="#4A5D5E" />
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
                      dataKey="memoryPct"
                      name={t.analyticsPage.charts.c1Series}
                      stroke="#2E6F73"
                      fill="#2E6F73"
                      fillOpacity={0.18}
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 2. Attention Task Performance */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>{t.analyticsPage.charts.c2Title}</CardTitle>
                  <CardDescription>{t.analyticsPage.charts.c2Desc}</CardDescription>
                </div>
                <Badge variant="primary">{t.domainBadges.task}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={cognitiveSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                    <XAxis dataKey="date" fontSize={12} stroke="#4A5D5E" />
                    <YAxis yAxisId="left" domain={[0, 100]} fontSize={12} stroke="#2E6F73" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[400, 1000]}
                      fontSize={12}
                      stroke="#C6601F"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#F7EFE3',
                        borderRadius: 12,
                        border: '1px solid #2E6F73',
                        color: '#0A0F14',
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="attentionPct"
                      name={t.analyticsPage.charts.c2Bar}
                      fill="#2E6F73"
                      radius={[6, 6, 0, 0]}
                      barSize={24}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="attentionMs"
                      name={t.analyticsPage.charts.c2Line}
                      stroke="#C6601F"
                      strokeWidth={2.5}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 3. Sleep Duration & Quality */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>{t.analyticsPage.charts.c3Title}</CardTitle>
                  <CardDescription>{t.analyticsPage.charts.c3Desc}</CardDescription>
                </div>
                <Badge variant="cyan">{t.domainBadges.measuredSelfReport}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={sleepSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                    <XAxis dataKey="date" fontSize={12} stroke="#4A5D5E" />
                    <YAxis yAxisId="left" domain={[4, 10]} fontSize={12} stroke="#0F3D3E" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 5]}
                      fontSize={12}
                      stroke="#2E6F73"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#F7EFE3',
                        borderRadius: 12,
                        border: '1px solid #2E6F73',
                        color: '#0A0F14',
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="quality"
                      name={t.analyticsPage.charts.c3Line}
                      fill="#7FB388"
                      radius={[6, 6, 0, 0]}
                      barSize={18}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="hours"
                      name={t.analyticsPage.charts.c3Bar}
                      stroke="#0F3D3E"
                      strokeWidth={2.5}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 4. Physical Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>{t.analyticsPage.charts.c4Title}</CardTitle>
                  <CardDescription>{t.analyticsPage.charts.c4Desc}</CardDescription>
                </div>
                <Badge variant="success">{t.domainBadges.measuredLogged}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lifestyleSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                    <XAxis dataKey="date" fontSize={12} stroke="#4A5D5E" />
                    <YAxis fontSize={12} stroke="#0F3D3E" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#F7EFE3',
                        borderRadius: 12,
                        border: '1px solid #2E6F73',
                        color: '#0A0F14',
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="steps"
                      name={t.analyticsPage.charts.c4Bar}
                      fill="#7FB388"
                      radius={[6, 6, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 5. Mood & Stress */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>{t.analyticsPage.charts.c5Title}</CardTitle>
                  <CardDescription>{t.analyticsPage.charts.c5Desc}</CardDescription>
                </div>
                <Badge variant="warning">{t.domainBadges.questionnaire}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lifestyleSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                    <XAxis dataKey="date" fontSize={12} stroke="#4A5D5E" />
                    <YAxis domain={[1, 5]} fontSize={12} stroke="#4A5D5E" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#F7EFE3',
                        borderRadius: 12,
                        border: '1px solid #2E6F73',
                        color: '#0A0F14',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="mood"
                      name={t.analyticsPage.charts.c5Mood}
                      stroke="#2E6F73"
                      strokeWidth={2.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="stress"
                      name={t.analyticsPage.charts.c5Stress}
                      stroke="#C6601F"
                      strokeWidth={2.5}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 6. Functional Questionnaire Responses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>{t.analyticsPage.charts.c6Title}</CardTitle>
                  <CardDescription>{t.analyticsPage.charts.c6Desc}</CardDescription>
                </div>
                <Badge variant="warning">{t.domainBadges.questionnaire}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cognitiveSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                    <XAxis dataKey="date" fontSize={12} stroke="#4A5D5E" />
                    <YAxis domain={[0, 100]} fontSize={12} stroke="#4A5D5E" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#F7EFE3',
                        borderRadius: 12,
                        border: '1px solid #2E6F73',
                        color: '#0A0F14',
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="functionalPct"
                      name={t.analyticsPage.charts.c6Bar}
                      fill="#C6601F"
                      radius={[6, 6, 0, 0]}
                      barSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#2E6F73]" />
              <CardTitle>{t.analyticsPage.timelineTitle}</CardTitle>
            </div>
            <CardDescription>{t.analyticsPage.timelineDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...assessmentsSorted].reverse().map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0F3D3E] tabular-nums">
                      {s.date}
                    </span>
                    {s.isSample && (
                      <Badge variant="outline">{t.sampleDataBadge}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#4A5D5E] mt-0.5">
                    {getLocalizedContextNote(s)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary">
                    {t.analyticsPage.tasksShort} {s.taskPerformancePct}%
                  </Badge>
                  <Badge variant="warning">
                    {t.analyticsPage.funcQShort} {s.functionalQuestionnairePct}%
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Brain,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Footprints,
  Gamepad2,
  Moon,
  Smile,
  Sparkles,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AppShell } from '@/components/layout/AppShell'
import { MedicalDisclaimerBanner } from '@/components/common/MedicalDisclaimerBanner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import {
  getLocalizedGoal,
  getLocalizedRec,
  localizeGameMetric,
} from '@/data/translations'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { getTimeGreeting, useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/utils/cn'

type ProgressTab = 'weekly' | 'cognitive' | 'sleep' | 'lifestyle'

export default function Dashboard() {
  const { state, toggleDailyGoal, toggleRecommendation } = useNeuroCare()
  const navigate = useNavigate()
  const t = useTranslation()
  const greeting = getTimeGreeting(t)

  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly')
  const [activeTab, setActiveTab] = useState<ProgressTab>('weekly')

  const sortedAssessments = useMemo(
    () => [...state.assessments].sort((a, b) => a.date.localeCompare(b.date)),
    [state.assessments]
  )
  const latestAssessment = sortedAssessments[sortedAssessments.length - 1]
  const latestMemoryCat = latestAssessment?.categories.find(
    (c) => c.categoryId === 'memory'
  )

  const recentSleep = useMemo(() => {
    const sorted = [...state.sleepLogs].sort((a, b) => a.date.localeCompare(b.date))
    return timeframe === 'weekly' ? sorted.slice(-7) : sorted
  }, [state.sleepLogs, timeframe])

  const recentLifestyle = useMemo(() => {
    const sorted = [...state.lifestyleLogs].sort((a, b) => a.date.localeCompare(b.date))
    return timeframe === 'weekly' ? sorted.slice(-7) : sorted
  }, [state.lifestyleLogs, timeframe])

  const latestSleep = recentSleep[recentSleep.length - 1]
  const latestLifestyle = recentLifestyle[recentLifestyle.length - 1]

  const avgSleep7d = useMemo(() => {
    const slice = [...state.sleepLogs].slice(-7)
    if (!slice.length) return 0
    return Number(
      (slice.reduce((acc, s) => acc + s.durationHours, 0) / slice.length).toFixed(1)
    )
  }, [state.sleepLogs])

  const avgQuality7d = useMemo(() => {
    const slice = [...state.sleepLogs].slice(-7)
    if (!slice.length) return 0
    return Number(
      (slice.reduce((acc, s) => acc + s.qualityRating, 0) / slice.length).toFixed(1)
    )
  }, [state.sleepLogs])

  const combinedTrendData = useMemo(() => {
    return recentSleep.map((s) => {
      const life = state.lifestyleLogs.find((l) => l.date === s.date)
      return {
        date: s.date.slice(5),
        sleepHours: s.durationHours,
        sleepQualityScore: s.qualityRating * 20,
        stepsK: life ? Number((life.walkingSteps / 1000).toFixed(1)) : 0,
        exerciseMins: life?.exerciseMinutes ?? 0,
        stressScore: life?.stressLevel ?? 0,
      }
    })
  }, [recentSleep, state.lifestyleLogs])

  const assessmentChartData = useMemo(() => {
    return sortedAssessments.map((a) => ({
      date: a.date.slice(5),
      taskPerformancePct: a.taskPerformancePct,
      functionalQuestionnairePct: a.functionalQuestionnairePct,
    }))
  }, [sortedAssessments])

  const completedGoalsCount = state.dailyGoals.filter((g) => g.completed).length
  const goalProgressPct = Math.round(
    (completedGoalsCount / Math.max(1, state.dailyGoals.length)) * 100
  )

  const recentActivityFeed = useMemo(() => {
    const items: { id: string; title: string; detail: string; date: string; kind: string; route: string }[] = []
    if (latestAssessment) {
      items.push({
        id: latestAssessment.id,
        title: t.dashboard.activityFeed.assessmentTitle,
        detail: `${t.dashboard.tasksAELabel}: ${latestAssessment.taskPerformancePct}% · ${t.dashboard.functionalQShort}: ${latestAssessment.functionalQuestionnairePct}%`,
        date: latestAssessment.date,
        kind: t.dashboard.activityFeed.assessmentKind,
        route: '/history',
      })
    }
    state.gameResults.slice(0, 2).forEach((g) => {
      const gInfo = t.gamesPage.catalog[g.gameType]
      items.push({
        id: g.id,
        title: `${gInfo?.title ?? g.gameName} (${t.dashboard.activityFeed.playedSuffix})`,
        detail: `${gInfo?.metricLabel ?? g.metricLabel}: ${localizeGameMetric(g.metricValue, t)} (${g.accuracyPct}% ${t.dashboard.activityFeed.accuracySuffix})`,
        date: g.date,
        kind: t.dashboard.activityFeed.gameKind,
        route: '/games',
      })
    })
    if (latestSleep) {
      items.push({
        id: latestSleep.id,
        title: t.dashboard.activityFeed.sleepTitle,
        detail: `${latestSleep.durationHours} ${t.units.hrs} · ${t.dashboard.ratingLabel} ${latestSleep.qualityRating}/5 (${t.sleepRefreshed[latestSleep.refreshedRating]})`,
        date: latestSleep.date,
        kind: t.dashboard.activityFeed.sleepKind,
        route: '/sleep',
      })
    }
    if (latestLifestyle) {
      items.push({
        id: latestLifestyle.id,
        title: t.dashboard.activityFeed.lifestyleTitle,
        detail: `${latestLifestyle.walkingSteps.toLocaleString()} ${t.units.steps} · ${latestLifestyle.hydrationGlasses} ${t.units.glasses}`,
        date: latestLifestyle.date,
        kind: t.dashboard.activityFeed.lifestyleKind,
        route: '/lifestyle',
      })
    }
    return items.slice(0, 5)
  }, [latestAssessment, state.gameResults, latestSleep, latestLifestyle, t])

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="cyan">{t.dashboard.sampleBaselineBadge}</Badge>
              {state.user.wearableConnected && (
                <Badge variant="success">
                  {state.user.wearableProvider} {t.dashboard.syncSuffix}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F3D3E]">
              {greeting}, {state.user.fullName}
            </h1>
            <p className="text-sm text-[#4A5D5E] mt-0.5">
              {t.welcomeSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" onClick={() => navigate('/games')}>
              <Gamepad2 className="h-4 w-4 text-[#2E6F73]" />
              {t.dashboard.playGamesBtn}
            </Button>
            <Button variant="primary" onClick={() => navigate('/assessment')}>
              <ClipboardCheck className="h-4 w-4" />
              {t.dashboard.newCheckInBtn}
            </Button>
          </div>
        </div>

        {/* Scientific Integrity Notice */}
        <MedicalDisclaimerBanner compact />

        {/* 5 Main Overview Cards — Strictly Separated Data Domains */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {/* 1. Latest Cognitive Assessment */}
          <Card
            className="hover:shadow-md cursor-pointer min-w-0"
            onClick={() => navigate('/assessment')}
          >
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2E6F73]/15 text-[#0F3D3E] border border-[#2E6F73]/20">
                  <Brain className="h-4 w-4" />
                </span>
                <Badge variant="primary" className="max-w-full truncate">
                  {t.domainBadges.taskPerformance}
                </Badge>
              </div>
              <p className="mt-3 text-xs font-medium text-[#4A5D5E]">
                {t.dashboard.latestAssessment}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-2xl font-bold text-[#0A0F14] tabular-nums">
                  {latestAssessment ? `${latestAssessment.taskPerformancePct}%` : '—'}
                </span>
                <span className="text-[11px] text-[#4A5D5E]">{t.dashboard.tasksAELabel}</span>
              </div>
              <p className="mt-1.5 text-[11px] text-[#4A5D5E]">
                {latestAssessment
                  ? `${t.dashboard.datePrefix}: ${latestAssessment.date}`
                  : t.dashboard.noSessionYet}
              </p>
            </CardContent>
          </Card>

          {/* 2. Memory Performance */}
          <Card
            className="hover:shadow-md cursor-pointer min-w-0"
            onClick={() => navigate('/games')}
          >
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7FB388]/25 text-[#0F3D3E] border border-[#7FB388]/40">
                  <Sparkles className="h-4 w-4" />
                </span>
                <Badge variant="primary" className="max-w-full truncate">
                  {t.domainBadges.taskPerformance}
                </Badge>
              </div>
              <p className="mt-3 text-xs font-medium text-[#4A5D5E]">
                {t.dashboard.memoryPerformance}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-2xl font-bold text-[#0A0F14] tabular-nums">
                  {latestMemoryCat ? `${latestMemoryCat.accuracyPct}%` : '—'}
                </span>
                <span className="text-[11px] text-[#0F3D3E] font-semibold">
                  {latestMemoryCat
                    ? `${latestMemoryCat.rawScore}/${latestMemoryCat.maxScore} ${t.dashboard.recalledLabel}`
                    : ''}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-[#4A5D5E]">
                {t.dashboard.practiceGamesLabel}: {state.gameResults.length} {t.dashboard.loggedRunsLabel}
              </p>
            </CardContent>
          </Card>

          {/* 3. Sleep Quality */}
          <Card
            className="hover:shadow-md cursor-pointer min-w-0"
            onClick={() => navigate('/sleep')}
          >
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0F3D3E]/12 text-[#0F3D3E] border border-[#0F3D3E]/20">
                  <Moon className="h-4 w-4" />
                </span>
                <Badge variant="cyan" className="max-w-full truncate">
                  {t.domainBadges.measuredSelfReport}
                </Badge>
              </div>
              <p className="mt-3 text-xs font-medium text-[#4A5D5E]">
                {t.dashboard.sleepQuality}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-2xl font-bold text-[#0A0F14] tabular-nums">
                  {avgSleep7d} {t.units.hrs}
                </span>
                <span className="text-[11px] text-[#4A5D5E]">
                  · {avgQuality7d}/5 {t.dashboard.ratingLabel}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-[#4A5D5E]">
                {t.dashboard.targetLabel}: {state.user.sleepHabitTargetHours} {t.units.hrsPerNight}
              </p>
            </CardContent>
          </Card>

          {/* 4. Physical Activity */}
          <Card
            className="hover:shadow-md cursor-pointer min-w-0"
            onClick={() => navigate('/lifestyle')}
          >
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7FB388]/25 text-[#0F3D3E] border border-[#7FB388]/40">
                  <Footprints className="h-4 w-4" />
                </span>
                <Badge variant="success" className="max-w-full truncate">
                  {t.domainBadges.measuredLogged}
                </Badge>
              </div>
              <p className="mt-3 text-xs font-medium text-[#4A5D5E]">
                {t.dashboard.physicalActivity}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-2xl font-bold text-[#0A0F14] tabular-nums">
                  {latestLifestyle
                    ? latestLifestyle.walkingSteps.toLocaleString()
                    : '—'}
                </span>
                <span className="text-[11px] text-[#4A5D5E]">{t.units.steps}</span>
              </div>
              <p className="mt-1.5 text-[11px] text-[#4A5D5E]">
                {latestLifestyle?.exerciseMinutes ?? 0} {t.units.mins} {t.dashboard.activeExerciseLabel}
              </p>
            </CardContent>
          </Card>

          {/* 5. Mental Wellness & Daily Function */}
          <Card
            className="hover:shadow-md cursor-pointer min-w-0"
            onClick={() => navigate('/analytics')}
          >
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C6601F]/15 text-[#8C3F10] border border-[#C6601F]/30">
                  <Smile className="h-4 w-4" />
                </span>
                <Badge variant="warning" className="max-w-full truncate">
                  {t.domainBadges.questionnaire}
                </Badge>
              </div>
              <p className="mt-3 text-xs font-medium text-[#4A5D5E]">
                {t.dashboard.mentalWellness}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-xl 2xl:text-2xl font-bold text-[#0A0F14] tabular-nums">
                  {latestLifestyle ? `${t.dashboard.moodLabel} ${latestLifestyle.moodLevel}/5` : '—'}
                </span>
                <span className="text-[11px] text-[#4A5D5E]">
                  {t.dashboard.stressLabel} {latestLifestyle?.stressLevel ?? '-'}/5
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-[#4A5D5E]">
                {t.dashboard.functionalQShort}:{' '}
                {latestAssessment
                  ? `${latestAssessment.functionalQuestionnairePct}%`
                  : t.pending}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Workspace: Brain Health Progress + Right Action Column */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Large Brain Health Progress Section */}
          <Card className="lg:col-span-8 min-w-0">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#CBB9A1] pb-4">
              <div>
                <CardTitle className="text-lg">{t.dashboard.brainProgress}</CardTitle>
                <CardDescription>
                  {t.dashboard.brainProgressDesc}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-[#EADCC8] p-1 border border-[#2E6F73]/25 self-start">
                <button
                  type="button"
                  onClick={() => setTimeframe('weekly')}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    timeframe === 'weekly'
                      ? 'bg-[#0F3D3E] text-[#EADCC8] shadow-xs'
                      : 'text-[#4A5D5E] hover:text-[#0F3D3E]'
                  )}
                >
                  {t.dashboard.weeklyBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setTimeframe('monthly')}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    timeframe === 'monthly'
                      ? 'bg-[#0F3D3E] text-[#EADCC8] shadow-xs'
                      : 'text-[#4A5D5E] hover:text-[#0F3D3E]'
                  )}
                >
                  {t.dashboard.monthlyComparisonBtn}
                </button>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-5">
              {/* Sub-view tabs */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'weekly' as const, label: t.dashboard.tabs.weekly },
                  { id: 'cognitive' as const, label: t.dashboard.tabs.cognitive },
                  { id: 'sleep' as const, label: t.dashboard.tabs.sleep },
                  { id: 'lifestyle' as const, label: t.dashboard.tabs.lifestyle },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors border',
                      activeTab === tab.id
                        ? 'border-[#2E6F73] bg-[#2E6F73] text-[#FAF4EA]'
                        : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#4A5D5E] hover:text-[#0F3D3E]'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Chart Area */}
              <div className="h-72 w-full">
                {activeTab === 'weekly' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={combinedTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                      <XAxis dataKey="date" stroke="#4A5D5E" fontSize={12} tickLine={false} />
                      <YAxis
                        yAxisId="left"
                        stroke="#2E6F73"
                        fontSize={12}
                        tickLine={false}
                        domain={[4, 10]}
                        label={{
                          value: t.dashboard.chartLabels.sleepHrsAxis,
                          angle: -90,
                          position: 'insideLeft',
                          style: { fontSize: 11, fill: '#4A5D5E' },
                        }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#0F3D3E"
                        fontSize={12}
                        tickLine={false}
                        domain={[0, 12]}
                        label={{
                          value: t.dashboard.chartLabels.stepsKAxis,
                          angle: 90,
                          position: 'insideRight',
                          style: { fontSize: 11, fill: '#4A5D5E' },
                        }}
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
                        dataKey="stepsK"
                        name={t.dashboard.chartLabels.walkingSeries}
                        fill="#7FB388"
                        radius={[6, 6, 0, 0]}
                        barSize={20}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="sleepHours"
                        name={t.dashboard.chartLabels.sleepSeries}
                        stroke="#2E6F73"
                        strokeWidth={2.5}
                        dot={{ r: 3.5, fill: '#2E6F73' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}

                {activeTab === 'cognitive' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assessmentChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                      <XAxis dataKey="date" stroke="#4A5D5E" fontSize={12} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#4A5D5E" fontSize={12} tickLine={false} />
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
                        dataKey="taskPerformancePct"
                        name={t.dashboard.chartLabels.cognitiveTasksSeries}
                        fill="#2E6F73"
                        radius={[6, 6, 0, 0]}
                        barSize={26}
                      />
                      <Bar
                        dataKey="functionalQuestionnairePct"
                        name={t.dashboard.chartLabels.functionalSeries}
                        fill="#7FB388"
                        radius={[6, 6, 0, 0]}
                        barSize={26}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {activeTab === 'sleep' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedTrendData}>
                      <defs>
                        <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2E6F73" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#7FB388" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                      <XAxis dataKey="date" stroke="#4A5D5E" fontSize={12} tickLine={false} />
                      <YAxis domain={[4, 10]} stroke="#4A5D5E" fontSize={12} tickLine={false} />
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
                        dataKey="sleepHours"
                        name={t.dashboard.chartLabels.sleepSeries}
                        stroke="#2E6F73"
                        strokeWidth={2.5}
                        fill="url(#sleepGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {activeTab === 'lifestyle' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={combinedTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                      <XAxis dataKey="date" stroke="#4A5D5E" fontSize={12} tickLine={false} />
                      <YAxis yAxisId="left" stroke="#0F3D3E" fontSize={12} tickLine={false} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[1, 5]}
                        stroke="#C6601F"
                        fontSize={12}
                        tickLine={false}
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
                        dataKey="exerciseMins"
                        name={t.dashboard.chartLabels.exerciseSeries}
                        fill="#7FB388"
                        radius={[6, 6, 0, 0]}
                        barSize={22}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="stressScore"
                        name={t.dashboard.chartLabels.stressSeries}
                        stroke="#C6601F"
                        strokeWidth={2.5}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#EADCC8]/65 px-4 py-3 border border-[#2E6F73]/25">
                <p className="text-xs text-[#263A3B]">
                  <strong>{t.dashboard.baselineInsightLabel}</strong>{' '}
                  {timeframe === 'weekly'
                    ? `${t.dashboard.baselineLast7}: ${avgSleep7d} ${t.units.hrs}`
                    : t.dashboard.baseline14Day}
                  {' — '}
                  {t.dashboard.baselineAdvice}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/analytics')}
                >
                  {t.dashboard.deepAnalyticsBtn}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Daily Goal, Reminder & Recent Activity */}
          <div className="lg:col-span-4 min-w-0 space-y-6">
            {/* Assessment Reminder */}
            <Card className="bg-gradient-to-br from-[#0A0F14] to-[#0F3D3E] text-[#EADCC8] border border-[#2E6F73]/50 shadow-md">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7FB388]">
                    <CalendarClock className="h-4 w-4" />
                    {t.dashboard.reminderBadge}
                  </span>
                  <span className="rounded-full bg-[#2E6F73]/40 border border-[#7FB388]/30 px-2.5 py-0.5 text-[10px] font-semibold text-[#EADCC8]">
                    {t.dashboard.recommendedMorning}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#EADCC8]">
                  {t.dashboard.reminderTitle}
                </h3>
                <p className="text-xs text-[#EADCC8]/80 leading-relaxed">
                  {t.dashboard.reminderDesc}
                </p>
                <Button
                  variant="copper"
                  className="w-full"
                  onClick={() => navigate('/assessment')}
                >
                  {t.dashboard.startCheckInBtn}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </CardContent>
            </Card>

            {/* Daily Brain Wellness Goal */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>{t.dashboard.dailyGoal}</CardTitle>
                  <span className="text-xs font-bold text-[#2E6F73] tabular-nums">
                    {completedGoalsCount}/{state.dailyGoals.length}
                  </span>
                </div>
                <Progress value={goalProgressPct} className="mt-2" />
              </CardHeader>
              <CardContent className="space-y-2 pt-2">
                {state.dailyGoals.map((goal) => {
                  const locGoal = getLocalizedGoal(goal, t)
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => toggleDailyGoal(goal.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-start text-xs transition-colors',
                        goal.completed
                          ? 'border-[#7FB388]/65 bg-[#7FB388]/18 text-[#0A0F14]'
                          : 'border-[#2E6F73]/25 bg-[#FBF6EE] hover:bg-[#EADCC8]/60'
                      )}
                    >
                      <CheckCircle2
                        className={cn(
                          'h-4 w-4 shrink-0',
                          goal.completed ? 'text-[#0F3D3E]' : 'text-[#BFB09A]'
                        )}
                      />
                      <div className="flex-1">
                        <p className={cn('font-medium', goal.completed && 'line-through text-[#4A5D5E]')}>
                          {locGoal.label}
                        </p>
                        <span className="text-[10px] text-[#4A5D5E]">{locGoal.domain}</span>
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Row: Recommended Activities + Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-7 min-w-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t.dashboard.recommendedActivities}</CardTitle>
                <CardDescription>
                  {t.dashboard.recommendedActivitiesSub}
                </CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate('/recommendations')}>
                {t.viewAll}
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {state.recommendations.slice(0, 4).map((rec) => {
                const locRec = getLocalizedRec(rec, t)
                return (
                  <div
                    key={rec.id}
                    className={cn(
                      'rounded-xl border p-3.5 flex flex-col justify-between gap-2 transition-colors',
                      rec.completed
                        ? 'border-[#7FB388]/65 bg-[#7FB388]/18'
                        : 'border-[#2E6F73]/25 bg-[#FBF6EE]'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="primary">
                          {t.recCategories[rec.category] ?? rec.category}
                        </Badge>
                        <span className="text-[11px] text-[#4A5D5E]">
                          {locRec.durationLabel}
                        </span>
                      </div>
                      <h4 className="mt-2 text-sm font-semibold text-[#0F3D3E]">
                        {locRec.title}
                      </h4>
                      <p className="mt-1 text-xs text-[#4A5D5E] line-clamp-2">
                        {locRec.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRecommendation(rec.id)}
                      className={cn(
                        'mt-1 inline-flex items-center gap-1.5 text-xs font-semibold self-start',
                        rec.completed ? 'text-[#0F3D3E]' : 'text-[#2E6F73] hover:underline'
                      )}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {rec.completed ? t.completedToday : t.markCompleted}
                    </button>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="lg:col-span-5 min-w-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t.dashboard.recentActivity}</CardTitle>
                <CardDescription>{t.dashboard.recentActivitySub}</CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate('/history')}>
                {t.dashboard.fullHistoryBtn}
              </Button>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {recentActivityFeed.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.route)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] px-3.5 py-2.5 text-start hover:border-[#2E6F73]/55 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EADCC8] border border-[#2E6F73]/25 text-[#0F3D3E]">
                      <Activity className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0F3D3E] truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[#4A5D5E] truncate">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <Badge variant="outline">{item.kind}</Badge>
                    <span className="block text-[10px] text-[#4A5D5E] mt-1 tabular-nums">
                      {item.date}
                    </span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

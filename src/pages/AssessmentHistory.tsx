import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Compass,
  Download,
  Eye,
  FileText,
  Gamepad2,
  Moon,
  Plus,
  Sparkles,
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
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Progress } from '@/components/ui/Progress'
import { localizeGameMetric } from '@/data/translations'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import {
  computeBrainHealthReport,
  formatAssessmentCategorySummary,
} from '@/services/neurocareAI'
import type {
  AssessmentCategoryResult,
  CognitiveAssessmentSession,
} from '@/types/neurocare'
import { cn } from '@/utils/cn'

export default function AssessmentHistory() {
  const { state } = useNeuroCare()
  const t = useTranslation()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'assessments' | 'games'>('all')
  const [inspectSession, setInspectSession] =
    useState<CognitiveAssessmentSession | null>(null)
  const [selectedCompareId, setSelectedCompareId] = useState<string>('latest')
  const domainChartRef = useRef<HTMLDivElement | null>(null)

  const [todayIso] = useState(() => new Date().toISOString().slice(0, 10))
  const report = useMemo(() => computeBrainHealthReport(state), [state])

  const sortedAssessments = useMemo(
    () =>
      [...state.assessments].sort((a, b) =>
        b.completedAt.localeCompare(a.completedAt)
      ),
    [state.assessments]
  )

  const chronologicalAssessments = useMemo(
    () =>
      [...state.assessments].sort((a, b) =>
        a.completedAt.localeCompare(b.completedAt)
      ),
    [state.assessments]
  )

  const sortedGames = useMemo(
    () =>
      [...state.gameResults].sort((a, b) =>
        b.completedAt.localeCompare(a.completedAt)
      ),
    [state.gameResults]
  )

  const chronologicalGames = useMemo(
    () =>
      [...state.gameResults].sort((a, b) =>
        a.completedAt.localeCompare(b.completedAt)
      ),
    [state.gameResults]
  )

  const latestSession = sortedAssessments[0] ?? null
  const prevSession = sortedAssessments[1] ?? null
  const baselineSession = chronologicalAssessments[0] ?? null

  const comparedSession = useMemo(() => {
    if (!latestSession) return null
    if (selectedCompareId === 'latest') return latestSession
    return (
      sortedAssessments.find((s) => s.id === selectedCompareId) ?? latestSession
    )
  }, [latestSession, sortedAssessments, selectedCompareId])

  const todayAssessments = useMemo(
    () => sortedAssessments.filter((s) => s.date === todayIso),
    [sortedAssessments, todayIso]
  )
  const todayGames = useMemo(
    () => sortedGames.filter((g) => g.date === todayIso),
    [sortedGames, todayIso]
  )
  const todaySleepCount = useMemo(
    () => state.sleepLogs.filter((s) => s.date === todayIso).length,
    [state.sleepLogs, todayIso]
  )
  const todayLifestyleCount = useMemo(
    () => state.lifestyleLogs.filter((l) => l.date === todayIso).length,
    [state.lifestyleLogs, todayIso]
  )

  const todayCheckinCount = todayAssessments.length + todayGames.length
  const hasTodayCognitive = todayCheckinCount > 0

  const taskDeltaVsPrior =
    latestSession && prevSession
      ? latestSession.taskPerformancePct - prevSession.taskPerformancePct
      : null

  const avgGameAccuracy = useMemo(() => {
    if (sortedGames.length === 0) return 0
    const sum = sortedGames.reduce((acc, g) => acc + g.accuracyPct, 0)
    return Math.round(sum / sortedGames.length)
  }, [sortedGames])

  const { strongestCat, focusCat } = useMemo<{
    strongestCat: AssessmentCategoryResult | null
    focusCat: AssessmentCategoryResult | null
  }>(() => {
    if (!latestSession || latestSession.categories.length === 0) {
      return { strongestCat: null, focusCat: null }
    }
    const cats = [...latestSession.categories]
    const strongest = [...cats].sort((a, b) => b.accuracyPct - a.accuracyPct)[0]
    const lowest = [...cats].sort((a, b) => {
      if (a.accuracyPct !== b.accuracyPct) return a.accuracyPct - b.accuracyPct
      return a.domainType === 'task' ? -1 : 1
    })[0]
    return { strongestCat: strongest, focusCat: lowest }
  }, [latestSession])

  const getLocalizedContextNote = useCallback(
    (session: CognitiveAssessmentSession): string => {
      if (t.assessmentContextSampleNotes[session.id]) {
        return t.assessmentContextSampleNotes[session.id]
      }
      if (session.contextNote === 'Self-guided 6-domain check-in') {
        return t.assessmentContextSampleNotes.defaultSelfGuided
      }
      return session.contextNote || t.historyPage.routineFallback
    },
    [t]
  )

  const progressChartData = useMemo(
    () =>
      chronologicalAssessments.map((s) => ({
        dateLabel: s.date.slice(5),
        fullDate: s.date,
        tasksPct: s.taskPerformancePct,
        functionalPct: s.functionalQuestionnairePct,
        note: getLocalizedContextNote(s),
      })),
    [chronologicalAssessments, getLocalizedContextNote]
  )

  const domainComparisonData = useMemo(() => {
    if (!comparedSession || !baselineSession) return []
    return comparedSession.categories.map((cat) => {
      const baseCat = baselineSession.categories.find(
        (b) => b.categoryId === cat.categoryId
      )
      return {
        categoryId: cat.categoryId,
        domain:
          t.historyPage.todayHub.domainShort[cat.categoryId] ??
          t.categoryNames[cat.categoryId] ??
          cat.label,
        fullDomain: t.categoryNames[cat.categoryId] ?? cat.label,
        selectedPct: cat.accuracyPct,
        baselinePct: baseCat ? baseCat.accuracyPct : cat.accuracyPct,
      }
    })
  }, [comparedSession, baselineSession, t])

  const gamesChartData = useMemo(
    () =>
      chronologicalGames.map((g, idx) => ({
        runLabel: `${g.date.slice(5)} #${idx + 1}`,
        fullDate: g.date,
        gameTitle: t.gamesPage.catalog[g.gameType]?.title ?? g.gameName,
        metric: localizeGameMetric(g.metricValue, t),
        accuracyPct: g.accuracyPct,
        durationSeconds: g.durationSeconds,
      })),
    [chronologicalGames, t]
  )

  const sleepTargetLow =
    report.avgSleepHours7d > 0 &&
    report.avgSleepHours7d < state.user.sleepHabitTargetHours

  const handleCompareInGraph = (sessionId: string) => {
    setSelectedCompareId(sessionId)
    if (filter === 'games') {
      setFilter('all')
    }
    setTimeout(() => {
      domainChartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 60)
  }

  const exportCsv = () => {
    const rows = [
      [
        t.historyPage.tableHeaders.source,
        t.historyPage.tableHeaders.date,
        t.historyPage.tableHeaders.game,
        t.historyPage.tableHeaders.keyMetric,
        t.dashboard.functionalQShort,
        t.historyPage.tableHeaders.time,
        t.historyPage.tableHeaders.source,
      ],
      ...sortedAssessments.map((a) => [
        t.dashboard.activityFeed.assessmentKind,
        a.date,
        t.dashboard.activityFeed.assessmentTitle,
        `${a.taskPerformancePct}%`,
        `${a.functionalQuestionnairePct}%`,
        `${a.totalDurationSeconds}s`,
        a.isSample ? t.sampleLabel : t.personalLabel,
      ]),
      ...sortedGames.map((g) => [
        t.dashboard.activityFeed.gameKind,
        g.date,
        t.gamesPage.catalog[g.gameType]?.title ?? g.gameName,
        `${localizeGameMetric(g.metricValue, t)} (${g.accuracyPct}%)`,
        '-',
        `${g.durationSeconds}s`,
        g.isSample ? t.sampleLabel : t.personalLabel,
      ]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `neurocare-assessment-history-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Badge variant="primary">{t.historyPage.badge}</Badge>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0F3D3E]">
              {t.historyPage.title}
            </h1>
            <p className="text-sm text-[#4A5D5E]">{t.historyPage.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              {t.historyPage.exportCsvBtn}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/assessment')}
            >
              <Plus className="h-4 w-4" />
              {t.historyPage.newAssessmentBtn}
            </Button>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#4A5D5E]">
                  {t.historyPage.kpis.latestTasksTitle}
                </span>
                {taskDeltaVsPrior !== null && (
                  <Badge
                    variant={taskDeltaVsPrior >= 0 ? 'success' : 'warning'}
                    className="gap-0.5 tabular-nums"
                  >
                    {taskDeltaVsPrior >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {taskDeltaVsPrior >= 0 ? `+${taskDeltaVsPrior}%` : `${taskDeltaVsPrior}%`}
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {latestSession ? `${latestSession.taskPerformancePct}%` : '—'}
              </p>
              <p className="text-[11px] text-[#4A5D5E]">
                {taskDeltaVsPrior !== null
                  ? t.historyPage.kpis.vsPrior
                  : t.historyPage.kpis.baselineTag}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#4A5D5E]">
                  {t.historyPage.kpis.latestFuncTitle}
                </span>
                <Badge variant="warning">{t.domainBadges.questionnaire}</Badge>
              </div>
              <p className="text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {latestSession
                  ? `${latestSession.functionalQuestionnairePct}%`
                  : '—'}
              </p>
              <p className="text-[11px] text-[#4A5D5E]">
                {t.historyPage.kpis.selfReportedSub}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#4A5D5E]">
                  {t.historyPage.kpis.todayActivityTitle}
                </span>
                <Badge variant={hasTodayCognitive ? 'success' : 'primary'}>
                  {hasTodayCognitive
                    ? t.historyPage.todayHub.completedTodayBadge
                    : t.historyPage.todayHub.pendingTodayBadge}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {todayCheckinCount}
              </p>
              <p className="text-[11px] text-[#4A5D5E]">
                {hasTodayCognitive
                  ? t.historyPage.kpis.todayDoneSub
                  : t.historyPage.kpis.noTodaySub}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#4A5D5E]">
                  {t.historyPage.kpis.gamesAvgTitle}
                </span>
                <Gamepad2 className="h-4 w-4 text-[#2E6F73]" />
              </div>
              <p className="text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {sortedGames.length > 0 ? `${avgGameAccuracy}%` : '—'}
              </p>
              <p className="text-[11px] text-[#4A5D5E] tabular-nums">
                {t.historyPage.kpis.acrossRunsPrefix} {sortedGames.length}{' '}
                {t.historyPage.kpis.runsUnit}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today Snapshot & Smart "What To Focus On Next" Support Hub */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: What User Did Today + Domain Highlights */}
          <Card className="lg:col-span-7 border-[#2E6F73]/30 bg-gradient-to-br from-[#FAF4EA] via-[#F7EFE3] to-[#EADCC8]/70">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#2E6F73]" />
                  <CardTitle>{t.historyPage.todayHub.panelTitle}</CardTitle>
                </div>
                <Badge variant={hasTodayCognitive ? 'success' : 'cyan'}>
                  {todayIso} ·{' '}
                  {hasTodayCognitive
                    ? t.historyPage.todayHub.completedTodayBadge
                    : t.historyPage.todayHub.pendingTodayBadge}
                </Badge>
              </div>
              <CardDescription>
                {t.historyPage.todayHub.panelSubtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Today Status Callout */}
              <div
                className={cn(
                  'rounded-2xl border p-4',
                  hasTodayCognitive
                    ? 'border-[#7FB388]/60 bg-[#7FB388]/20'
                    : 'border-[#2E6F73]/25 bg-[#FBF6EE]'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#0F3D3E]">
                      {hasTodayCognitive
                        ? t.historyPage.todayHub.todaySummaryLine
                        : t.historyPage.todayHub.noTodayTitle}
                    </p>
                    {!hasTodayCognitive && (
                      <p className="text-xs text-[#263A3B]">
                        {t.historyPage.todayHub.noTodayDesc}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => navigate('/assessment')}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t.historyPage.todayHub.startTodayBtn}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/games')}
                    >
                      <Gamepad2 className="h-3.5 w-3.5" />
                      {t.historyPage.todayHub.practiceGamesBtn}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Today's 4-Pillar Daily Checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    key: 'assessment',
                    label: t.historyPage.todayHub.checklistLabels.assessment,
                    done: todayAssessments.length > 0,
                    route: '/assessment',
                  },
                  {
                    key: 'game',
                    label: t.historyPage.todayHub.checklistLabels.game,
                    done: todayGames.length > 0,
                    route: '/games',
                  },
                  {
                    key: 'sleep',
                    label: t.historyPage.todayHub.checklistLabels.sleep,
                    done: todaySleepCount > 0,
                    route: '/sleep',
                  },
                  {
                    key: 'lifestyle',
                    label: t.historyPage.todayHub.checklistLabels.lifestyle,
                    done: todayLifestyleCount > 0,
                    route: '/lifestyle',
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => navigate(item.route)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-xs font-semibold transition-colors',
                      item.done
                        ? 'border-[#7FB388]/60 bg-[#7FB388]/22 text-[#0F3D3E] hover:bg-[#7FB388]/32'
                        : 'border-[#2E6F73]/20 bg-[#FBF6EE] text-[#263A3B] hover:border-[#2E6F73]/50 hover:bg-[#EADCC8]/65'
                    )}
                  >
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-[#0F3D3E] shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-[#4A5D5E] shrink-0" />
                    )}
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Strongest & Focus-Next Visual Bars */}
              {strongestCat && focusCat && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#7FB388]/55 bg-[#FBF6EE] p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0F3D3E]">
                        <Award className="h-3.5 w-3.5" />
                        {t.historyPage.todayHub.strongestLabel}
                      </span>
                      <span className="text-sm font-bold text-[#0F3D3E] tabular-nums">
                        {strongestCat.accuracyPct}%
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#0A0F14]">
                      {t.categoryNames[strongestCat.categoryId] ??
                        strongestCat.label}
                    </p>
                    <Progress
                      value={strongestCat.accuracyPct}
                      barClassName="bg-gradient-to-r from-[#2E6F73] to-[#7FB388]"
                    />
                  </div>

                  <div className="rounded-xl border border-[#C6601F]/45 bg-[#FBF6EE] p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8C3F10]">
                        <Target className="h-3.5 w-3.5" />
                        {t.historyPage.todayHub.focusNextLabel}
                      </span>
                      <span className="text-sm font-bold text-[#0F3D3E] tabular-nums">
                        {focusCat.accuracyPct}%
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#0A0F14]">
                      {t.categoryNames[focusCat.categoryId] ?? focusCat.label}
                    </p>
                    <Progress
                      value={focusCat.accuracyPct}
                      barClassName="bg-gradient-to-r from-[#C6601F] to-[#2E6F73]"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Smart Next-Step Coaching & Support */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#2E6F73]" />
                <CardTitle>{t.historyPage.todayHub.nextSupportTitle}</CardTitle>
              </div>
              <CardDescription>
                {t.historyPage.todayHub.nextSupportSubtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {focusCat && (
                <div className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0F3D3E]">
                      {t.historyPage.todayHub.focusNextLabel}:{' '}
                      {t.categoryNames[focusCat.categoryId] ?? focusCat.label}
                    </span>
                    <Badge variant="primary">{focusCat.accuracyPct}%</Badge>
                  </div>
                  <p className="text-xs text-[#263A3B] leading-relaxed">
                    {t.historyPage.todayHub.domainTips[focusCat.categoryId]}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigate(
                        focusCat.categoryId === 'functional'
                          ? '/recommendations'
                          : '/games'
                      )
                    }
                  >
                    <Gamepad2 className="h-3.5 w-3.5" />
                    {t.historyPage.todayHub.practiceGamesBtn}
                  </Button>
                </div>
              )}

              <div className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  {sleepTargetLow ? (
                    <Moon className="h-4 w-4 text-[#C6601F] shrink-0" />
                  ) : (
                    <Activity className="h-4 w-4 text-[#2E6F73] shrink-0" />
                  )}
                  <span className="text-xs font-bold text-[#0F3D3E]">
                    {sleepTargetLow
                      ? `${report.avgSleepHours7d} ${t.units.hrs} / ${state.user.sleepHabitTargetHours} ${t.units.hrs}`
                      : `${t.analyticsPage.cardSleepTitle}: ${report.avgSleepHours7d} ${t.units.hrs}`}
                  </span>
                </div>
                <p className="text-xs text-[#263A3B] leading-relaxed">
                  {sleepTargetLow
                    ? t.historyPage.todayHub.sleepReminderTip
                    : t.historyPage.todayHub.sleepOnTrackTip}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/sleep')}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    {t.historyPage.todayHub.logSleepBtn}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/report')}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {t.historyPage.todayHub.viewReportBtn}
                  </Button>
                </div>
              </div>

              <p className="text-[11px] text-[#4A5D5E] leading-relaxed">
                {t.historyPage.todayHub.disclaimerNote}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Visual Progress & Domain Breakdown Graphs */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Chart 1: Longitudinal Assessments Trend */}
          {(filter === 'all' || filter === 'assessments') && (
            <Card className={cn(filter === 'all' ? 'lg:col-span-7' : 'lg:col-span-7', 'min-w-0')}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#2E6F73]" />
                    <CardTitle>{t.historyPage.charts.progressTitle}</CardTitle>
                  </div>
                  {baselineSession && (
                    <Badge variant="outline" className="tabular-nums">
                      {t.historyPage.charts.baselineLineLabel}:{' '}
                      {baselineSession.taskPerformancePct}%
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {t.historyPage.charts.progressDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {progressChartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#CBB9A1] bg-[#FBF6EE] p-8 text-center space-y-2">
                    <p className="text-sm font-bold text-[#0F3D3E]">
                      {t.historyPage.charts.emptyAssessmentsTitle}
                    </p>
                    <p className="text-xs text-[#4A5D5E] max-w-sm">
                      {t.historyPage.charts.emptyAssessmentsDesc}
                    </p>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => navigate('/assessment')}
                    >
                      {t.historyPage.newAssessmentBtn}
                    </Button>
                  </div>
                ) : (
                  <div className="h-64 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={progressChartData}
                        margin={{ top: 10, right: 12, left: -12, bottom: 4 }}
                      >
                        <defs>
                          <linearGradient
                            id="historyTasksGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#2E6F73"
                              stopOpacity={0.25}
                            />
                            <stop
                              offset="95%"
                              stopColor="#2E6F73"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                        <XAxis
                          dataKey="dateLabel"
                          fontSize={11}
                          stroke="#4A5D5E"
                        />
                        <YAxis domain={[0, 100]} fontSize={11} stroke="#4A5D5E" />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || payload.length === 0) {
                              return null
                            }
                            const point = payload[0]?.payload as {
                              fullDate: string
                              tasksPct: number
                              functionalPct: number
                              note: string
                            }
                            return (
                              <div className="rounded-xl border border-[#2E6F73] bg-[#F7EFE3] px-3 py-2.5 shadow-md text-xs space-y-1 max-w-[230px]">
                                <p className="font-bold text-[#0F3D3E] tabular-nums">
                                  {point.fullDate}
                                </p>
                                <p className="text-[#2E6F73] font-semibold tabular-nums">
                                  {t.historyPage.charts.tasksSeries}:{' '}
                                  {point.tasksPct}%
                                </p>
                                <p className="text-[#0F3D3E] font-semibold tabular-nums">
                                  {t.historyPage.charts.functionalSeries}:{' '}
                                  {point.functionalPct}%
                                </p>
                                <p className="text-[11px] text-[#4A5D5E] pt-0.5">
                                  {point.note}
                                </p>
                              </div>
                            )
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        {baselineSession && (
                          <ReferenceLine
                            y={baselineSession.taskPerformancePct}
                            stroke="#C6601F"
                            strokeDasharray="4 4"
                          />
                        )}
                        <Area
                          type="monotone"
                          dataKey="tasksPct"
                          name={t.historyPage.charts.tasksSeries}
                          stroke="#2E6F73"
                          strokeWidth={2.5}
                          fill="url(#historyTasksGradient)"
                          dot={{ r: 4, fill: '#2E6F73' }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="functionalPct"
                          name={t.historyPage.charts.functionalSeries}
                          stroke="#7FB388"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#7FB388' }}
                          activeDot={{ r: 6 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Chart 2: 6-Domain Selected / Latest vs Baseline Comparison */}
          {(filter === 'all' || filter === 'assessments') && (
            <div ref={domainChartRef} className="lg:col-span-5 min-w-0">
              <Card className="h-full min-w-0">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-[#2E6F73]" />
                      <CardTitle>{t.historyPage.charts.domainTitle}</CardTitle>
                    </div>
                    <CardDescription>
                      {t.historyPage.charts.domainDesc}
                    </CardDescription>
                  </div>
                  {sortedAssessments.length > 0 && (
                    <label className="flex items-center gap-1.5 text-xs">
                      <span className="sr-only">
                        {t.historyPage.charts.compareSelectLabel}
                      </span>
                      <select
                        aria-label={t.historyPage.charts.compareSelectLabel}
                        value={
                          comparedSession?.id === latestSession?.id
                            ? 'latest'
                            : comparedSession?.id ?? 'latest'
                        }
                        onChange={(e) => setSelectedCompareId(e.target.value)}
                        className="rounded-xl border border-[#2E6F73]/30 bg-[#FBF6EE] px-2.5 py-1.5 text-xs font-semibold text-[#0F3D3E] focus:border-[#2E6F73] focus:outline-none"
                      >
                        {sortedAssessments.map((s, idx) => (
                          <option
                            key={s.id}
                            value={idx === 0 ? 'latest' : s.id}
                          >
                            {s.date}{' '}
                            {idx === 0
                              ? t.historyPage.charts.latestOptionSuffix
                              : `(${s.taskPerformancePct}%)`}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {domainComparisonData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#CBB9A1] bg-[#FBF6EE] p-8 text-center">
                    <p className="text-xs text-[#4A5D5E]">
                      {t.historyPage.charts.emptyAssessmentsDesc}
                    </p>
                  </div>
                ) : (
                  <div className="h-64 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={domainComparisonData}
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
                          width={84}
                          fontSize={11}
                          stroke="#263A3B"
                          tickLine={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || payload.length === 0) {
                              return null
                            }
                            const row = payload[0]?.payload as {
                              fullDomain: string
                              selectedPct: number
                              baselinePct: number
                            }
                            const diff = row.selectedPct - row.baselinePct
                            return (
                              <div className="rounded-xl border border-[#2E6F73] bg-[#F7EFE3] px-3 py-2 shadow-md text-xs space-y-1">
                                <p className="font-bold text-[#0F3D3E]">
                                  {row.fullDomain}
                                </p>
                                <p className="text-[#2E6F73] font-semibold tabular-nums">
                                  {t.historyPage.charts.selectedSeries}:{' '}
                                  {row.selectedPct}%
                                </p>
                                <p className="text-[#4A5D5E] tabular-nums">
                                  {t.historyPage.charts.baselineSeries}:{' '}
                                  {row.baselinePct}%
                                </p>
                                <p
                                  className={cn(
                                    'font-semibold tabular-nums',
                                    diff >= 0
                                      ? 'text-[#0F3D3E]'
                                      : 'text-[#8C3F10]'
                                  )}
                                >
                                  {diff >= 0 ? `+${diff}%` : `${diff}%`}{' '}
                                  {t.historyPage.sessionExtras.vsBaselineLabel}
                                </p>
                              </div>
                            )
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar
                          dataKey="baselinePct"
                          name={t.historyPage.charts.baselineSeries}
                          fill="#CBB9A1"
                          radius={[0, 4, 4, 0]}
                          barSize={10}
                        />
                        <Bar
                          dataKey="selectedPct"
                          name={t.historyPage.charts.selectedSeries}
                          fill="#2E6F73"
                          radius={[0, 4, 4, 0]}
                          barSize={10}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Chart 3: Memory Game Accuracy & Completion Time */}
        {(filter === 'all' || filter === 'games') && (
          <Card className="min-w-0">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-[#2E6F73]" />
                  <CardTitle>{t.historyPage.charts.gamesTitle}</CardTitle>
                </div>
                <Badge variant="success" className="tabular-nums">
                  {t.historyPage.kpis.gamesAvgTitle}: {avgGameAccuracy}%
                </Badge>
              </div>
              <CardDescription>{t.historyPage.charts.gamesDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              {gamesChartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#CBB9A1] bg-[#FBF6EE] p-8 text-center space-y-2">
                  <p className="text-sm font-bold text-[#0F3D3E]">
                    {t.historyPage.charts.emptyGamesTitle}
                  </p>
                  <p className="text-xs text-[#4A5D5E] max-w-sm">
                    {t.historyPage.charts.emptyGamesDesc}
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate('/games')}
                  >
                    {t.historyPage.charts.goToGamesBtn}
                  </Button>
                </div>
              ) : (
                <div className="h-64 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={gamesChartData}
                      margin={{ top: 10, right: 10, left: -12, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                      <XAxis
                        dataKey="runLabel"
                        fontSize={11}
                        stroke="#4A5D5E"
                      />
                      <YAxis
                        yAxisId="left"
                        domain={[0, 100]}
                        fontSize={11}
                        stroke="#0F3D3E"
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        fontSize={11}
                        stroke="#C6601F"
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || payload.length === 0) {
                            return null
                          }
                          const run = payload[0]?.payload as {
                            fullDate: string
                            gameTitle: string
                            metric: string
                            accuracyPct: number
                            durationSeconds: number
                          }
                          return (
                            <div className="rounded-xl border border-[#2E6F73] bg-[#F7EFE3] px-3 py-2.5 shadow-md text-xs space-y-1">
                              <p className="font-bold text-[#0F3D3E]">
                                {run.gameTitle}
                              </p>
                              <p className="text-[11px] text-[#4A5D5E] tabular-nums">
                                {run.fullDate} · {run.metric}
                              </p>
                              <p className="text-[#0F3D3E] font-semibold tabular-nums">
                                {t.historyPage.charts.gameAccuracySeries}:{' '}
                                {run.accuracyPct}%
                              </p>
                              <p className="text-[#C6601F] font-semibold tabular-nums">
                                {t.historyPage.charts.gameDurationSeries}:{' '}
                                {run.durationSeconds}{' '}
                                {t.historyPage.charts.durationUnitSec}
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar
                        yAxisId="left"
                        dataKey="accuracyPct"
                        name={t.historyPage.charts.gameAccuracySeries}
                        fill="#7FB388"
                        radius={[6, 6, 0, 0]}
                        barSize={26}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="durationSeconds"
                        name={t.historyPage.charts.gameDurationSeries}
                        stroke="#C6601F"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#C6601F' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all' as const, label: t.historyPage.allRecordsTab },
            {
              id: 'assessments' as const,
              label: `${t.historyPage.assessmentsTab} (${sortedAssessments.length})`,
            },
            {
              id: 'games' as const,
              label: `${t.historyPage.gamesTab} (${sortedGames.length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                'rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors',
                filter === tab.id
                  ? 'border-[#2E6F73] bg-[#2E6F73] text-[#FAF4EA]'
                  : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]/70'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Assessments List */}
        {(filter === 'all' || filter === 'assessments') && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-[#2E6F73]" />
                <CardTitle>{t.historyPage.assessmentsCardTitle}</CardTitle>
              </div>
              <CardDescription>
                {t.historyPage.assessmentsCardDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedAssessments.map((s) => {
                const isBaseline = baselineSession?.id === s.id
                const deltaFromBase = baselineSession
                  ? s.taskPerformancePct - baselineSession.taskPerformancePct
                  : 0
                return (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#0F3D3E] tabular-nums">
                          {s.date}
                        </span>
                        {s.isSample ? (
                          <Badge variant="outline">{t.sampleDataBadge}</Badge>
                        ) : (
                          <Badge variant="success">
                            {t.personalSessionBadge}
                          </Badge>
                        )}
                        {isBaseline ? (
                          <Badge variant="cyan">
                            {t.historyPage.sessionExtras.baselineBadge}
                          </Badge>
                        ) : (
                          <Badge
                            variant={deltaFromBase >= 0 ? 'success' : 'warning'}
                            className="tabular-nums"
                          >
                            {deltaFromBase >= 0
                              ? `+${deltaFromBase}%`
                              : `${deltaFromBase}%`}{' '}
                            {t.historyPage.sessionExtras.vsBaselineLabel}
                          </Badge>
                        )}
                        <span className="text-xs text-[#4A5D5E]">
                          {t.historyPage.durationLabel}{' '}
                          {Math.floor(s.totalDurationSeconds / 60)}m{' '}
                          {s.totalDurationSeconds % 60}s
                        </span>
                      </div>
                      <p className="text-xs text-[#263A3B]">
                        {getLocalizedContextNote(s)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="primary">
                        {t.dashboard.tasksAELabel}: {s.taskPerformancePct}%
                      </Badge>
                      <Badge variant="warning">
                        {t.dashboard.functionalQShort}:{' '}
                        {s.functionalQuestionnairePct}%
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCompareInGraph(s.id)}
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        {t.historyPage.sessionExtras.inspectInChartBtn}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setInspectSession(s)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {t.details}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Mini-Games List */}
        {(filter === 'all' || filter === 'games') && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-[#2E6F73]" />
                <CardTitle>{t.historyPage.gamesCardTitle}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="border-b border-[#CBB9A1]/70 text-[#4A5D5E]">
                    <th className="py-2.5 pe-4 font-semibold">
                      {t.historyPage.tableHeaders.date}
                    </th>
                    <th className="py-2.5 pe-4 font-semibold">
                      {t.historyPage.tableHeaders.game}
                    </th>
                    <th className="py-2.5 pe-4 font-semibold">
                      {t.historyPage.tableHeaders.keyMetric}
                    </th>
                    <th className="py-2.5 pe-4 font-semibold">
                      {t.historyPage.tableHeaders.accuracy}
                    </th>
                    <th className="py-2.5 pe-4 font-semibold">
                      {t.historyPage.tableHeaders.time}
                    </th>
                    <th className="py-2.5 font-semibold">
                      {t.historyPage.tableHeaders.source}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBB9A1]/45">
                  {sortedGames.map((g) => (
                    <tr key={g.id}>
                      <td className="py-3 pe-4 tabular-nums font-medium text-[#0F3D3E]">
                        {g.date}
                      </td>
                      <td className="py-3 pe-4 font-semibold text-[#0A0F14]">
                        {t.gamesPage.catalog[g.gameType]?.title ?? g.gameName}
                      </td>
                      <td className="py-3 pe-4 tabular-nums text-[#2E6F73] font-semibold">
                        {localizeGameMetric(g.metricValue, t)}
                      </td>
                      <td className="py-3 pe-4 tabular-nums">
                        {g.accuracyPct}%
                      </td>
                      <td className="py-3 pe-4 tabular-nums text-[#4A5D5E]">
                        {g.durationSeconds}s
                      </td>
                      <td className="py-3">
                        <Badge variant={g.isSample ? 'outline' : 'success'}>
                          {g.isSample ? t.sampleLabel : t.personalLabel}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Inspection Modal */}
        <Modal
          open={Boolean(inspectSession)}
          onClose={() => setInspectSession(null)}
          title={`${t.historyPage.modalTitlePrefix} ${inspectSession?.date ?? ''}`}
          subtitle={
            inspectSession ? getLocalizedContextNote(inspectSession) : undefined
          }
          maxWidthClass="max-w-xl"
        >
          {inspectSession && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#4A5D5E]">
                {t.historyPage.sessionExtras.modalSummaryTitle}
              </p>
              {inspectSession.categories.map((cat) => {
                const baseCat = baselineSession?.categories.find(
                  (b) => b.categoryId === cat.categoryId
                )
                const baseDiff = baseCat
                  ? cat.accuracyPct - baseCat.accuracyPct
                  : 0
                return (
                  <div
                    key={cat.categoryId}
                    className="space-y-2 rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-[#0F3D3E]">
                          {t.categoryNames[cat.categoryId] ?? cat.label}
                        </p>
                        <p className="text-[11px] text-[#4A5D5E]">
                          {formatAssessmentCategorySummary(
                            cat,
                            state.user.preferredLanguage
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {baseCat &&
                          baselineSession?.id !== inspectSession.id && (
                            <span
                              className={cn(
                                'text-[11px] font-semibold tabular-nums',
                                baseDiff >= 0
                                  ? 'text-[#0F3D3E]'
                                  : 'text-[#8C3F10]'
                              )}
                            >
                              {baseDiff >= 0 ? `+${baseDiff}%` : `${baseDiff}%`}
                            </span>
                          )}
                        <Badge
                          variant={
                            cat.domainType === 'task' ? 'primary' : 'warning'
                          }
                        >
                          {cat.accuracyPct}%
                        </Badge>
                      </div>
                    </div>
                    <Progress
                      value={cat.accuracyPct}
                      barClassName={
                        cat.domainType === 'task'
                          ? 'bg-gradient-to-r from-[#2E6F73] to-[#7FB388]'
                          : 'bg-gradient-to-r from-[#C6601F] to-[#7FB388]'
                      }
                    />
                  </div>
                )
              })}
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  )
}

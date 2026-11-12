import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  Footprints,
  Info,
  Moon,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import {
  formatAssessmentCategorySummary,
  generateBrainAndPhysicalPlan,
} from '@/services/neurocareAI'
import type {
  AssessmentCategoryResult,
  CognitiveAssessmentSession,
} from '@/types/neurocare'
import { cn } from '@/utils/cn'

type Stage =
  | 'intro'
  | 'memory'
  | 'attention'
  | 'processing'
  | 'language'
  | 'executive'
  | 'functional'
  | 'complete'

// Indices [0, 2, 4, 6, 8] in stageA.options correspond to the 5 target words in every language
const MEMORY_TARGET_INDICES = new Set([0, 2, 4, 6, 8])

const STROOP_TRIALS = [
  { inkHex: '#B93822', inkKey: 'Red' },
  { inkHex: '#1D4ED8', inkKey: 'Blue' },
  { inkHex: '#1F7A52', inkKey: 'Green' },
  { inkHex: '#1D4ED8', inkKey: 'Blue' },
  { inkHex: '#C6601F', inkKey: 'Amber' },
  { inkHex: '#B93822', inkKey: 'Red' },
]

const SYMBOL_KEY = [
  { symbol: '◆', digit: 1 },
  { symbol: '▲', digit: 2 },
  { symbol: '●', digit: 3 },
  { symbol: '★', digit: 4 },
]

// Spatial layout mapped by logical step index 0..7 into t.assessment.stageE.sequence
const EXEC_NODE_POSITIONS = [
  { seqIdx: 0, x: 18, y: 24 },
  { seqIdx: 7, x: 78, y: 22 },
  { seqIdx: 2, x: 48, y: 18 },
  { seqIdx: 1, x: 25, y: 72 },
  { seqIdx: 6, x: 82, y: 74 },
  { seqIdx: 3, x: 64, y: 48 },
  { seqIdx: 4, x: 42, y: 66 },
  { seqIdx: 5, x: 14, y: 48 },
]

export default function Assessment() {
  const { state, addAssessmentSession } = useNeuroCare()
  const t = useTranslation()
  const navigate = useNavigate()

  const [stage, setStage] = useState<Stage>('intro')
  const sessionStartRef = useRef<number>(0)
  const stageStartRef = useRef<number>(0)
  const [results, setResults] = useState<AssessmentCategoryResult[]>([])
  const [completedSession, setCompletedSession] =
    useState<CognitiveAssessmentSession | null>(null)

  // A. Memory state (index-based so mid-assessment language switches never break scoring)
  const [memoryPhase, setMemoryPhase] = useState<'study' | 'recall'>('study')
  const [memoryTimer, setMemoryTimer] = useState(8)
  const [selectedWordIndices, setSelectedWordIndices] = useState<number[]>([])

  // B. Attention state
  const [stroopIdx, setStroopIdx] = useState(0)
  const [stroopCorrect, setStroopCorrect] = useState(0)
  const [stroopTimes, setStroopTimes] = useState<number[]>([])
  const trialStartRef = useRef<number>(0)

  // C. Processing speed state
  const [procTimeLeft, setProcTimeLeft] = useState(20)
  const [procTargetIdx, setProcTargetIdx] = useState(0)
  const [procScore, setProcScore] = useState(0)
  const [procAttempts, setProcAttempts] = useState(0)

  // D. Language state
  const [langIdx, setLangIdx] = useState(0)
  const [langCorrect, setLangCorrect] = useState(0)

  // E. Executive state
  const [execNextIdx, setExecNextIdx] = useState(0)
  const [execSlips, setExecSlips] = useState(0)

  // F. Functional questionnaire state
  const [funcRatings, setFuncRatings] = useState<number[]>([5, 5, 5, 5, 5])

  // Stage memory countdown
  useEffect(() => {
    if (stage !== 'memory' || memoryPhase !== 'study') return
    const id = setTimeout(() => {
      if (memoryTimer <= 1) {
        setMemoryTimer(0)
        setMemoryPhase('recall')
      } else {
        setMemoryTimer((s) => s - 1)
      }
    }, 1000)
    return () => clearTimeout(id)
  }, [stage, memoryPhase, memoryTimer])

  // Stage processing speed countdown
  useEffect(() => {
    if (stage !== 'processing') return
    const id = setTimeout(() => {
      if (procTimeLeft <= 1) {
        const accuracy = procAttempts
          ? Math.min(100, Math.round((procScore / Math.max(10, procAttempts)) * 100))
          : 0
        const cat: AssessmentCategoryResult = {
          categoryId: 'processing',
          domainType: 'task',
          label: 'Processing Speed',
          rawScore: procScore,
          maxScore: 14,
          accuracyPct: Math.min(100, Math.round((procScore / 14) * 100)) || accuracy,
          avgReactionMs: procScore > 0 ? Math.round(20000 / procScore) : 1500,
          completionSeconds: 20,
          detailSummary: `${procScore} symbol-digit matches in 20 seconds`,
        }
        setResults((prev) => [...prev, cat])
        stageStartRef.current = Date.now()
        setLangIdx(0)
        setLangCorrect(0)
        setStage('language')
      } else {
        setProcTimeLeft((tm) => tm - 1)
      }
    }, 1000)
    return () => clearTimeout(id)
  }, [stage, procTimeLeft, procScore, procAttempts])

  const startAssessment = () => {
    sessionStartRef.current = Date.now()
    stageStartRef.current = Date.now()
    setResults([])
    setCompletedSession(null)
    setMemoryPhase('study')
    setMemoryTimer(8)
    setSelectedWordIndices([])
    setStage('memory')
  }

  const toggleWordSelection = (idx: number) => {
    setSelectedWordIndices((prev) => {
      if (prev.includes(idx)) return prev.filter((x) => x !== idx)
      if (prev.length >= 5) return prev
      return [...prev, idx]
    })
  }

  const submitMemory = () => {
    const correctCount = selectedWordIndices.filter((idx) =>
      MEMORY_TARGET_INDICES.has(idx)
    ).length
    const elapsed = Math.max(10, Math.round((Date.now() - stageStartRef.current) / 1000))
    const cat: AssessmentCategoryResult = {
      categoryId: 'memory',
      domainType: 'task',
      label: 'Memory Recall',
      rawScore: correctCount,
      maxScore: 5,
      accuracyPct: Math.round((correctCount / 5) * 100),
      completionSeconds: elapsed,
      detailSummary: `${correctCount}/5 target words recalled accurately`,
    }
    setResults((prev) => [...prev, cat])
    stageStartRef.current = Date.now()
    trialStartRef.current = Date.now()
    setStroopIdx(0)
    setStroopCorrect(0)
    setStroopTimes([])
    setStage('attention')
  }

  const handleStroopAnswer = (choiceKey: string) => {
    const rt = Date.now() - trialStartRef.current
    const current = STROOP_TRIALS[stroopIdx]
    const isHit = choiceKey === current.inkKey
    const nextCorrect = stroopCorrect + (isHit ? 1 : 0)
    const nextTimes = [...stroopTimes, rt]

    if (stroopIdx + 1 < STROOP_TRIALS.length) {
      setStroopCorrect(nextCorrect)
      setStroopTimes(nextTimes)
      setStroopIdx(stroopIdx + 1)
      trialStartRef.current = Date.now()
    } else {
      const avgRt = Math.round(
        nextTimes.reduce((s, x) => s + x, 0) / nextTimes.length
      )
      const elapsed = Math.max(8, Math.round((Date.now() - stageStartRef.current) / 1000))
      const cat: AssessmentCategoryResult = {
        categoryId: 'attention',
        domainType: 'task',
        label: 'Attention & Concentration',
        rawScore: nextCorrect,
        maxScore: STROOP_TRIALS.length,
        accuracyPct: Math.round((nextCorrect / STROOP_TRIALS.length) * 100),
        avgReactionMs: avgRt,
        completionSeconds: elapsed,
        detailSummary: `${nextCorrect}/${STROOP_TRIALS.length} Stroop trials accurate, avg ${avgRt}ms`,
      }
      setResults((prev) => [...prev, cat])
      stageStartRef.current = Date.now()
      setProcTimeLeft(20)
      setProcScore(0)
      setProcAttempts(0)
      setProcTargetIdx(Math.floor(Math.random() * SYMBOL_KEY.length))
      setStage('processing')
    }
  }

  const handleProcClick = (digit: number) => {
    const target = SYMBOL_KEY[procTargetIdx]
    setProcAttempts((a) => a + 1)
    if (digit === target.digit) {
      setProcScore((s) => s + 1)
    }
    setProcTargetIdx((prev) => (prev + 1 + Math.floor(Math.random() * 3)) % SYMBOL_KEY.length)
  }

  const handleLanguageAnswer = (selectedIdx: number) => {
    const questions = t.assessment.stageD.questions
    const current = questions[langIdx]
    const nextCorrect = langCorrect + (selectedIdx === current.answerIdx ? 1 : 0)
    if (langIdx + 1 < questions.length) {
      setLangCorrect(nextCorrect)
      setLangIdx(langIdx + 1)
    } else {
      const elapsed = Math.max(8, Math.round((Date.now() - stageStartRef.current) / 1000))
      const cat: AssessmentCategoryResult = {
        categoryId: 'language',
        domainType: 'task',
        label: 'Language & Verbal',
        rawScore: nextCorrect,
        maxScore: questions.length,
        accuracyPct: Math.round((nextCorrect / questions.length) * 100),
        completionSeconds: elapsed,
        detailSummary: `${nextCorrect}/${questions.length} semantic & verbal items accurate`,
      }
      setResults((prev) => [...prev, cat])
      stageStartRef.current = Date.now()
      setExecNextIdx(0)
      setExecSlips(0)
      setStage('executive')
    }
  }

  const handleExecNodeClick = (seqIdx: number) => {
    if (seqIdx !== execNextIdx) {
      setExecSlips((s) => s + 1)
      return
    }
    if (execNextIdx + 1 < t.assessment.stageE.sequence.length) {
      setExecNextIdx(execNextIdx + 1)
    } else {
      const score = Math.max(1, 10 - execSlips)
      const elapsed = Math.max(6, Math.round((Date.now() - stageStartRef.current) / 1000))
      const cat: AssessmentCategoryResult = {
        categoryId: 'executive',
        domainType: 'task',
        label: 'Executive Function',
        rawScore: score,
        maxScore: 10,
        accuracyPct: Math.round((score / 10) * 100),
        completionSeconds: elapsed,
        detailSummary: `Alternating 1-A-2-B trail completed with ${execSlips} slip(s)`,
      }
      setResults((prev) => [...prev, cat])
      stageStartRef.current = Date.now()
      setFuncRatings([5, 5, 5, 5, 5])
      setStage('functional')
    }
  }

  const submitFunctionalAndFinish = () => {
    const funcQuestions = t.assessment.stageF.questions
    const rawFunc = funcRatings.reduce((s, v) => s + v, 0)
    const maxFunc = funcQuestions.length * 5
    const funcPct = Math.round((rawFunc / maxFunc) * 100)
    const elapsed = Math.max(5, Math.round((Date.now() - stageStartRef.current) / 1000))

    const funcCat: AssessmentCategoryResult = {
      categoryId: 'functional',
      domainType: 'questionnaire',
      label: 'Daily Functional Abilities',
      rawScore: rawFunc,
      maxScore: maxFunc,
      accuracyPct: funcPct,
      completionSeconds: elapsed,
      detailSummary: 'Self-reported independence across everyday planning & routines',
    }

    const allCats = [...results, funcCat]
    const taskCats = allCats.filter((c) => c.domainType === 'task')
    const taskPerformancePct = Math.round(
      taskCats.reduce((sum, c) => sum + c.accuracyPct, 0) / Math.max(1, taskCats.length)
    )
    const totalDurationSeconds = Math.max(
      30,
      Math.round((Date.now() - sessionStartRef.current) / 1000)
    )

    const today = new Date().toISOString().slice(0, 10)
    const sessionPayload: Omit<CognitiveAssessmentSession, 'id'> = {
      date: today,
      completedAt: new Date().toISOString(),
      totalDurationSeconds,
      taskPerformancePct,
      functionalQuestionnairePct: funcPct,
      categories: allCats,
      contextNote: 'Self-guided 6-domain check-in',
    }

    addAssessmentSession(sessionPayload)
    setCompletedSession({ ...sessionPayload, id: 'latest-local' })
    setStage('complete')
  }

  const stageOrder: Stage[] = [
    'memory',
    'attention',
    'processing',
    'language',
    'executive',
    'functional',
  ]
  const stepIndex = stageOrder.indexOf(stage)
  const progressPct =
    stage === 'intro'
      ? 0
      : stage === 'complete'
        ? 100
        : Math.round(((stepIndex + 1) / stageOrder.length) * 100)

  const previousSession = useMemo(() => {
    const sorted = [...state.assessments].sort((a, b) =>
      b.completedAt.localeCompare(a.completedAt)
    )
    return sorted[1] ?? null
  }, [state.assessments])

  const brainPhysicalPlan = useMemo(
    () =>
      completedSession
        ? generateBrainAndPhysicalPlan(state, completedSession)
        : [],
    [state, completedSession]
  )

  const localizedChartCats = useMemo(() => {
    if (!completedSession) return []
    return completedSession.categories.map((c) => ({
      ...c,
      localizedLabel: t.categoryNames[c.categoryId] ?? c.label,
    }))
  }, [completedSession, t.categoryNames])

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Badge variant="primary">{t.assessment.badge}</Badge>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0F3D3E]">
              {t.nav.assessment}
            </h1>
            <p className="text-sm text-[#4A5D5E]">
              {t.assessment.subtitle}
            </p>
          </div>
          {stage !== 'intro' && stage !== 'complete' && (
            <div className="flex items-center gap-2 rounded-xl bg-[#F7EFE3] border border-[#2E6F73]/25 px-3.5 py-2 text-xs font-semibold text-[#0F3D3E]">
              <span>
                {t.assessment.sectionProgress.replace('{step}', String(stepIndex + 1))}
              </span>
              <span className="text-[#C6601F] tabular-nums">{progressPct}%</span>
            </div>
          )}
        </div>

        <MedicalDisclaimerBanner />

        {stage !== 'intro' && stage !== 'complete' && (
          <Progress value={progressPct} />
        )}

        {/* INTRO SCREEN */}
        {stage === 'intro' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.assessment.beforeBeginTitle}</CardTitle>
              <CardDescription>
                {t.assessment.beforeBeginDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {t.assessment.introCards.map((c) => (
                  <div
                    key={c.code}
                    className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A0F14] text-xs font-bold text-[#EADCC8]">
                        {c.code}
                      </span>
                      <Badge variant={c.isTask ? 'primary' : 'warning'}>
                        {c.isTask ? t.domainBadges.task : t.domainBadges.questionnaire}
                      </Badge>
                    </div>
                    <h4 className="mt-2.5 text-sm font-semibold text-[#0F3D3E]">
                      {c.title}
                    </h4>
                    <p className="text-xs text-[#4A5D5E] mt-0.5">{c.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-[#2E6F73]/25 bg-[#EADCC8]/70 px-4 py-3 text-xs text-[#0A0F14]">
                <Info className="h-4 w-4 text-[#0F3D3E] shrink-0 mt-0.5" />
                <span>
                  <strong>{t.assessment.transparencyTitle}</strong>{' '}
                  {t.assessment.transparencyDesc}
                </span>
              </div>

              <Button size="lg" variant="primary" onClick={startAssessment}>
                <Play className="h-4 w-4" />
                {t.assessment.beginBtn}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* A. MEMORY */}
        {stage === 'memory' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <Badge variant="primary">
                  {t.assessment.categoryTaskPrefix.replace('{code}', 'A')}
                </Badge>
                <CardTitle className="mt-2 text-lg">{t.assessment.stageA.title}</CardTitle>
                <CardDescription>
                  {memoryPhase === 'study'
                    ? t.assessment.stageA.studyDesc
                    : t.assessment.stageA.recallDesc}
                </CardDescription>
              </div>
              {memoryPhase === 'study' && (
                <div className="flex items-center gap-1.5 rounded-xl bg-[#C6601F]/15 border border-[#C6601F]/35 px-3 py-1.5 text-sm font-bold text-[#8C3F10] tabular-nums">
                  <Clock className="h-4 w-4" />
                  {memoryTimer}s
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              {memoryPhase === 'study' ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {t.assessment.stageA.targets.map((word) => (
                      <div
                        key={word}
                        className="rounded-2xl border border-[#2E6F73]/30 bg-[#EADCC8]/75 py-5 text-center text-base font-bold text-[#0F3D3E]"
                      >
                        {word}
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" onClick={() => setMemoryPhase('recall')}>
                    {t.assessment.stageA.readyBtn}
                  </Button>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {t.assessment.stageA.options.map((word, idx) => {
                      const picked = selectedWordIndices.includes(idx)
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleWordSelection(idx)}
                          className={cn(
                            'rounded-xl border py-3 px-3 text-sm font-semibold transition-all',
                            picked
                              ? 'border-[#0F3D3E] bg-[#2E6F73] text-[#FAF4EA] shadow-sm'
                              : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#0A0F14] hover:bg-[#EADCC8]'
                          )}
                        >
                          {word}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-[#4A5D5E]">
                      {t.assessment.stageA.selectedCounter.replace(
                        '{count}',
                        String(selectedWordIndices.length)
                      )}
                    </span>
                    <Button
                      variant="primary"
                      disabled={selectedWordIndices.length === 0}
                      onClick={submitMemory}
                    >
                      {t.assessment.stageA.submitContinueBtn}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* B. ATTENTION */}
        {stage === 'attention' && (
          <Card>
            <CardHeader>
              <Badge variant="primary">
                {t.assessment.categoryTaskPrefix.replace('{code}', 'B')}
              </Badge>
              <CardTitle className="mt-2 text-lg">
                {t.assessment.stageB.title}
              </CardTitle>
              <CardDescription>
                {t.assessment.stageB.descPrefix}
                <strong>{t.assessment.stageB.descHighlight}</strong>
                {t.assessment.stageB.descSuffix}{' '}
                {t.assessment.stageB.trialCounter
                  .replace('{current}', String(stroopIdx + 1))
                  .replace('{total}', String(STROOP_TRIALS.length))}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="rounded-2xl border border-[#2E6F73]/25 bg-[#FBF6EE] py-10">
                <span
                  className="text-4xl sm:text-5xl font-extrabold tracking-wider"
                  style={{ color: STROOP_TRIALS[stroopIdx].inkHex }}
                >
                  {t.assessment.stageB.trialDisplayWords[stroopIdx]}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {t.assessment.stageB.colorChoices.map((choice) => (
                  <Button
                    key={choice.key}
                    variant="outline"
                    size="lg"
                    onClick={() => handleStroopAnswer(choice.key)}
                  >
                    {choice.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* C. PROCESSING SPEED */}
        {stage === 'processing' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <Badge variant="primary">
                  {t.assessment.categoryTaskPrefix.replace('{code}', 'C')}
                </Badge>
                <CardTitle className="mt-2 text-lg">{t.assessment.stageC.title}</CardTitle>
                <CardDescription>
                  {t.assessment.stageC.desc}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-[#C6601F]/15 border border-[#C6601F]/35 px-3.5 py-2 text-sm font-bold text-[#8C3F10] tabular-nums">
                <Clock className="h-4 w-4" />
                {procTimeLeft}s
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-4 gap-3 rounded-2xl bg-[#0A0F14] border border-[#2E6F73]/40 p-4 text-[#EADCC8] text-center">
                {SYMBOL_KEY.map((item) => (
                  <div key={item.digit} className="rounded-xl bg-[#0F3D3E]/80 border border-[#7FB388]/30 py-2">
                    <div className="text-xl">{item.symbol}</div>
                    <div className="text-xs font-bold text-[#7FB388] mt-1">
                      = {item.digit}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center py-4 rounded-2xl border border-[#2E6F73]/25 bg-[#FBF6EE]">
                <p className="text-xs text-[#4A5D5E]">{t.assessment.stageC.matchLabel}</p>
                <div className="mt-2 text-5xl font-bold text-[#0F3D3E]">
                  {SYMBOL_KEY[procTargetIdx].symbol}
                </div>
                <p className="mt-2 text-xs font-semibold text-[#2E6F73] tabular-nums">
                  {t.assessment.stageC.matchesSoFar} {procScore}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((d) => (
                  <Button
                    key={d}
                    size="lg"
                    variant="secondary"
                    className="text-lg font-bold"
                    onClick={() => handleProcClick(d)}
                  >
                    {d}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* D. LANGUAGE */}
        {stage === 'language' && (
          <Card>
            <CardHeader>
              <Badge variant="primary">
                {t.assessment.categoryTaskPrefix.replace('{code}', 'D')}
              </Badge>
              <CardTitle className="mt-2 text-lg">
                {t.assessment.stageD.title} ({langIdx + 1}/{t.assessment.stageD.questions.length})
              </CardTitle>
              <CardDescription>
                {t.assessment.stageD.desc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base font-semibold text-[#0F3D3E] rounded-xl bg-[#FBF6EE] p-4 border border-[#2E6F73]/25">
                {t.assessment.stageD.questions[langIdx].prompt}
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {t.assessment.stageD.questions[langIdx].options.map((opt, optIdx) => (
                  <Button
                    key={optIdx}
                    variant="outline"
                    size="lg"
                    className="justify-start text-start"
                    onClick={() => handleLanguageAnswer(optIdx)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* E. EXECUTIVE FUNCTION */}
        {stage === 'executive' && (
          <Card>
            <CardHeader>
              <Badge variant="primary">
                {t.assessment.categoryTaskPrefix.replace('{code}', 'E')}
              </Badge>
              <CardTitle className="mt-2 text-lg">
                {t.assessment.stageE.title}
              </CardTitle>
              <CardDescription>
                {t.assessment.stageE.desc}{' '}
                <strong dir="ltr">{t.assessment.stageE.sequence.join(' → ')}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#2E6F73]">
                  {t.assessment.stageE.nextTarget}{' '}
                  <span className="text-base font-bold text-[#0F3D3E]">
                    {t.assessment.stageE.sequence[execNextIdx]}
                  </span>
                </span>
                <span className="text-[#4A5D5E] tabular-nums">
                  {t.assessment.stageE.progressLabel} {execNextIdx}/
                  {t.assessment.stageE.sequence.length} · {t.assessment.stageE.slipsLabel}{' '}
                  {execSlips}
                </span>
              </div>

              <div className="relative h-72 w-full rounded-2xl border border-[#2E6F73]/25 bg-[#FBF6EE]">
                {EXEC_NODE_POSITIONS.map((node) => {
                  const isDone = node.seqIdx < execNextIdx
                  const label = t.assessment.stageE.sequence[node.seqIdx]
                  return (
                    <button
                      key={node.seqIdx}
                      type="button"
                      disabled={isDone}
                      onClick={() => handleExecNodeClick(node.seqIdx)}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      className={cn(
                        'absolute -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold shadow-sm transition-all',
                        isDone
                          ? 'bg-[#7FB388] text-[#0A0F14] border border-[#0F3D3E]/30 opacity-85'
                          : 'bg-[#F7EFE3] border-2 border-[#2E6F73] text-[#0F3D3E] hover:bg-[#2E6F73] hover:text-[#FAF4EA]'
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* F. DAILY FUNCTIONAL ABILITIES */}
        {stage === 'functional' && (
          <Card>
            <CardHeader>
              <Badge variant="warning">{t.assessment.categoryQuestPrefix}</Badge>
              <CardTitle className="mt-2 text-lg">
                {t.assessment.stageF.title}
              </CardTitle>
              <CardDescription>
                {t.assessment.stageF.desc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {t.assessment.stageF.questions.map((q, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-4 space-y-2.5"
                >
                  <p className="text-sm font-medium text-[#0F3D3E]">
                    {idx + 1}. {q}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() =>
                          setFuncRatings((prev) =>
                            prev.map((r, i) => (i === idx ? rating : r))
                          )
                        }
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                          funcRatings[idx] === rating
                            ? 'border-[#0F3D3E] bg-[#2E6F73] text-[#FAF4EA]'
                            : 'border-[#2E6F73]/25 bg-[#F7EFE3] text-[#263A3B] hover:bg-[#EADCC8]'
                        )}
                      >
                        {rating}{' '}
                        {rating === 1
                          ? t.assessment.stageF.ratingDifficult
                          : rating === 3
                            ? t.assessment.stageF.ratingModerate
                            : rating === 5
                              ? t.assessment.stageF.ratingEffortless
                              : ''}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-2">
                <Button size="lg" variant="success" onClick={submitFunctionalAndFinish}>
                  {t.assessment.stageF.completeBtn}
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* COMPLETION SCREEN */}
        {stage === 'complete' && completedSession && (
          <div className="space-y-6">
            <Card className="border-[#7FB388]/60 bg-gradient-to-br from-[#F7EFE3] to-[#EADCC8]">
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F3D3E] text-[#7FB388]">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#0F3D3E]">
                        {t.assessment.complete.title}
                      </h2>
                      <p className="text-xs text-[#4A5D5E]">
                        {t.assessment.complete.dateLabel} {completedSession.date} ·{' '}
                        {t.assessment.complete.totalTimeLabel}{' '}
                        {completedSession.totalDurationSeconds}s
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={startAssessment}>
                      <RotateCcw className="h-4 w-4" />
                      {t.assessment.complete.retakeBtn}
                    </Button>
                    <Button variant="primary" onClick={() => navigate('/analytics')}>
                      {t.assessment.complete.viewAnalyticsBtn}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                  </div>
                </div>

                {/* Separated Task Performance vs Questionnaire Summary */}
                <div className="grid gap-4 sm:grid-cols-3 pt-2">
                  <div className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-4">
                    <Badge variant="primary">{t.assessment.complete.objectiveTasksBadge}</Badge>
                    <div className="mt-2 text-3xl font-bold text-[#0F3D3E] tabular-nums">
                      {completedSession.taskPerformancePct}%
                    </div>
                    <p className="text-xs text-[#4A5D5E] mt-1">
                      {previousSession
                        ? `${t.assessment.complete.prevSessionPrefix} ${previousSession.taskPerformancePct}% (${
                            completedSession.taskPerformancePct -
                              previousSession.taskPerformancePct >=
                            0
                              ? '+'
                              : ''
                          }${
                            completedSession.taskPerformancePct -
                            previousSession.taskPerformancePct
                          }%)`
                        : t.assessment.complete.baselineEstablished}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-4">
                    <Badge variant="warning">{t.assessment.complete.questionnaireBadge}</Badge>
                    <div className="mt-2 text-3xl font-bold text-[#0F3D3E] tabular-nums">
                      {completedSession.functionalQuestionnairePct}%
                    </div>
                    <p className="text-xs text-[#4A5D5E] mt-1">
                      {t.assessment.complete.dailyConfDesc}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-4">
                    <Badge variant="cyan">{t.assessment.complete.completionTimeBadge}</Badge>
                    <div className="mt-2 text-3xl font-bold text-[#0F3D3E] tabular-nums">
                      {Math.floor(completedSession.totalDurationSeconds / 60)}m{' '}
                      {completedSession.totalDurationSeconds % 60}s
                    </div>
                    <p className="text-xs text-[#4A5D5E] mt-1">
                      {t.assessment.complete.recordedLocallyDesc}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.assessment.complete.domainBreakdownTitle}</CardTitle>
                <CardDescription>
                  {t.assessment.complete.domainBreakdownDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={localizedChartCats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                      <XAxis dataKey="localizedLabel" fontSize={11} stroke="#4A5D5E" />
                      <YAxis domain={[0, 100]} fontSize={11} stroke="#4A5D5E" />
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
                        dataKey="accuracyPct"
                        name={t.assessment.complete.resultSeriesLabel}
                        fill="#2E6F73"
                        radius={[6, 6, 0, 0]}
                        barSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {completedSession.categories.map((c) => (
                    <div
                      key={c.categoryId}
                      className="flex items-center justify-between rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] px-3.5 py-2.5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Brain className="h-3.5 w-3.5 text-[#2E6F73]" />
                          <span className="text-xs font-semibold text-[#0F3D3E]">
                            {t.categoryNames[c.categoryId] ?? c.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#4A5D5E] mt-0.5">
                          {formatAssessmentCategorySummary(c, state.user.preferredLanguage)}
                        </p>
                      </div>
                      <Badge variant={c.domainType === 'task' ? 'primary' : 'warning'}>
                        {c.accuracyPct}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Personalized Brain + Physical Activity Suggestions */}
            <Card className="border-[#2E6F73]/30">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Footprints className="h-4 w-4 text-[#0F3D3E]" />
                    <CardTitle>{t.assessment.complete.planTitle}</CardTitle>
                  </div>
                  <CardDescription>
                    {t.assessment.complete.planDesc}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/assistant')}
                >
                  <Bot className="h-4 w-4 text-[#2E6F73]" />
                  {t.assessment.complete.askVoiceCoachBtn}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {brainPhysicalPlan.map((item) => {
                    const isPhysical = item.pillar === 'Physical Activity'
                    const isSleep = item.pillar === 'Sleep & Recovery'
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant={
                              isPhysical
                                ? 'success'
                                : isSleep
                                  ? 'cyan'
                                  : 'primary'
                            }
                          >
                            {isPhysical ? (
                              <Footprints className="h-3 w-3" />
                            ) : isSleep ? (
                              <Moon className="h-3 w-3" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                            {item.pillarLabel}
                          </Badge>
                          <span className="text-[11px] font-semibold text-[#4A5D5E]">
                            {item.duration}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#0F3D3E]">
                          {item.title}
                        </h4>
                        <p className="text-xs text-[#263A3B] leading-relaxed">
                          {item.actionPlan}
                        </p>
                        <p className="text-[11px] text-[#4A5D5E] leading-snug pt-1 border-t border-[#CBB9A1]">
                          <strong>{t.assessment.complete.whySuggestedLabel}</strong>{' '}
                          {item.whySuggested}
                        </p>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/lifestyle')}
                  >
                    <Footprints className="h-3.5 w-3.5 text-[#0F3D3E]" />
                    {t.assessment.complete.logActivityBtn}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/report')}
                  >
                    {t.assessment.complete.openReportBtn}
                    <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}

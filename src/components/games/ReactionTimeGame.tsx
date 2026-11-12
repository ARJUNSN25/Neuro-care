import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Play, RotateCcw, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'
import type { GameResult } from '@/types/neurocare'

export function ReactionTimeGame({
  onComplete,
}: {
  onComplete: (result: Omit<GameResult, 'id'>) => void
}) {
  const t = useTranslation()
  const cat = t.gamesPage.catalog['reaction-time']
  const g = t.gamesPage.reactionTime
  const c = t.gamesPage.common

  const [phase, setPhase] = useState<'instructions' | 'waiting' | 'ready' | 'tooSoon' | 'trialDone' | 'result'>(
    'instructions'
  )
  const [trial, setTrial] = useState(1)
  const [latencies, setLatencies] = useState<number[]>([])
  const [lastMs, setLastMs] = useState<number | null>(null)
  const goTimeRef = useRef<number>(0)
  const sessionStartRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => () => clearTimer(), [])

  const scheduleSignal = () => {
    clearTimer()
    setPhase('waiting')
    const delay = 1300 + Math.floor(Math.random() * 2100)
    timerRef.current = setTimeout(() => {
      goTimeRef.current = performance.now()
      setPhase('ready')
    }, delay)
  }

  const startGame = () => {
    sessionStartRef.current = Date.now()
    setTrial(1)
    setLatencies([])
    setLastMs(null)
    scheduleSignal()
  }

  const handlePadClick = () => {
    if (phase === 'waiting') {
      clearTimer()
      setPhase('tooSoon')
      return
    }
    if (phase === 'ready') {
      const rt = Math.max(120, Math.round(performance.now() - goTimeRef.current))
      const nextList = [...latencies, rt]
      setLatencies(nextList)
      setLastMs(rt)

      if (trial >= 5) {
        const meanMs = Math.round(
          nextList.reduce((sum, x) => sum + x, 0) / nextList.length
        )
        const duration = Math.max(8, Math.round((Date.now() - sessionStartRef.current) / 1000))
        const score = Math.max(35, Math.min(100, Math.round(120 - meanMs / 6)))
        onComplete({
          gameType: 'reaction-time',
          gameName: cat.title,
          date: new Date().toISOString().slice(0, 10),
          completedAt: new Date().toISOString(),
          score,
          metricLabel: cat.metricLabel,
          metricValue: `${meanMs} ${t.units.ms}`,
          accuracyPct: 100,
          durationSeconds: duration,
          levelReached: 5,
        })
        setPhase('result')
      } else {
        setPhase('trialDone')
      }
    }
  }

  const nextTrial = () => {
    setTrial((tr) => tr + 1)
    scheduleSignal()
  }

  const meanMs = latencies.length
    ? Math.round(latencies.reduce((s, x) => s + x, 0) / latencies.length)
    : 0
  const bestMs = latencies.length ? Math.min(...latencies) : 0

  return (
    <div className="space-y-5">
      {phase === 'instructions' && (
        <div className="rounded-2xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C6601F]/18 text-[#8C3F10]">
              <Zap className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-[#0F3D3E]">{cat.title}</h3>
              <p className="text-xs text-[#4A5D5E]">{g.desc}</p>
            </div>
          </div>
          <ul className="text-sm text-[#263A3B] space-y-1.5 list-disc ps-5">
            {g.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <Button variant="primary" size="lg" onClick={startGame}>
            <Play className="h-4 w-4" />
            {g.startBtn}
          </Button>
        </div>
      )}

      {(phase === 'waiting' || phase === 'ready') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="primary">
              {g.trialBadge.replace('{trial}', String(trial))}
            </Badge>
            <span className="text-xs text-[#4A5D5E]">
              {latencies.length > 0 &&
                `${g.previousPrefix} ${latencies[latencies.length - 1]} ${t.units.ms}`}
            </span>
          </div>

          <button
            type="button"
            onClick={handlePadClick}
            className={`flex h-64 w-full flex-col items-center justify-center rounded-3xl font-bold transition-colors select-none ${
              phase === 'waiting'
                ? 'bg-[#0A0F14] hover:bg-[#0F3D3E] text-[#EADCC8]'
                : 'bg-[#7FB388] text-[#0A0F14] shadow-xl shadow-[#7FB388]/30'
            }`}
          >
            <Zap className="h-10 w-10 mb-3" />
            <span className="text-2xl sm:text-3xl">
              {phase === 'waiting' ? g.waitGreen : g.tapNow}
            </span>
          </button>
        </div>
      )}

      {phase === 'tooSoon' && (
        <div className="flex h-64 w-full flex-col items-center justify-center rounded-3xl bg-[#F7E8D8] border border-[#C6601F]/50 text-center p-6 space-y-4">
          <p className="text-xl font-bold text-[#8C3F10]">{g.tooEarly}</p>
          <Button variant="primary" onClick={scheduleSignal}>
            {g.retryTrial}
          </Button>
        </div>
      )}

      {phase === 'trialDone' && (
        <div className="flex h-64 w-full flex-col items-center justify-center rounded-3xl bg-[#EADCC8]/75 border border-[#2E6F73]/30 text-center p-6 space-y-4">
          <p className="text-sm font-semibold text-[#0F3D3E]">
            {g.trialComplete.replace('{ms}', String(lastMs ?? 0))}
          </p>
          <p className="text-4xl font-extrabold text-[#0A0F14] tabular-nums">
            {lastMs} {t.units.ms}
          </p>
          <Button variant="primary" onClick={nextTrial}>
            {g.nextTrial.replace('{next}', String(trial + 1))}
          </Button>
        </div>
      )}

      {phase === 'result' && (
        <div className="rounded-2xl border border-[#7FB388]/55 bg-[#7FB388]/18 p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#0F3D3E] font-bold">
            <CheckCircle2 className="h-5 w-5" />
            <span>
              {cat.title} — {c.savedBanner}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#FBF6EE] p-3.5 border border-[#2E6F73]/20">
              <p className="text-[11px] text-[#4A5D5E]">{g.meanLatency}</p>
              <p className="text-2xl font-bold text-[#0A0F14] tabular-nums">
                {meanMs} {t.units.ms}
              </p>
            </div>
            <div className="rounded-xl bg-[#FBF6EE] p-3.5 border border-[#2E6F73]/20">
              <p className="text-[11px] text-[#4A5D5E]">{g.fastestTrial}</p>
              <p className="text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {bestMs} {t.units.ms}
              </p>
            </div>
            <div className="rounded-xl bg-[#FBF6EE] p-3.5 border border-[#2E6F73]/20 col-span-2 sm:col-span-1">
              <p className="text-[11px] text-[#4A5D5E]">{g.allTrials}</p>
              <p className="text-xs font-semibold text-[#263A3B] mt-1 tabular-nums">
                {latencies.map((l) => `${l}${t.units.ms}`).join(' · ')}
              </p>
            </div>
          </div>
          <Button variant="primary" onClick={startGame}>
            <RotateCcw className="h-4 w-4" />
            {c.playAgain}
          </Button>
        </div>
      )}
    </div>
  )
}

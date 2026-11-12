import { useEffect, useRef, useState } from 'react'
import { BookText, CheckCircle2, Play, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'
import type { GameResult } from '@/types/neurocare'
import { cn } from '@/utils/cn'

export function WordRecallGame({
  onComplete,
}: {
  onComplete: (result: Omit<GameResult, 'id'>) => void
}) {
  const t = useTranslation()
  const cat = t.gamesPage.catalog['word-recall']
  const g = t.gamesPage.wordRecall
  const c = t.gamesPage.common

  const [phase, setPhase] = useState<'instructions' | 'study' | 'distractor' | 'recall' | 'result'>(
    'instructions'
  )
  const [setIdx, setSetIdx] = useState(0)
  // Indices 0..7 are targets; 8..15 are distractors — language-independent!
  const [optionIndices, setOptionIndices] = useState<number[]>([])
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [timer, setTimer] = useState(9)
  const [hits, setHits] = useState(0)
  const startTimeRef = useRef<number>(0)

  const currentSet = g.wordSets[setIdx] ?? g.wordSets[0]
  const combinedWords = [...currentSet.targets, ...currentSet.distractors]

  const startGame = () => {
    startTimeRef.current = Date.now()
    const pickedSet = Math.floor(Math.random() * g.wordSets.length)
    setSetIdx(pickedSet)
    const active = g.wordSets[pickedSet] ?? g.wordSets[0]
    const total = active.targets.length + active.distractors.length
    const shuffled = Array.from({ length: total }, (_, i) => i).sort(
      () => Math.random() - 0.5
    )
    setOptionIndices(shuffled)
    setSelectedIndices([])
    setTimer(9)
    setPhase('study')
  }

  useEffect(() => {
    if (phase !== 'study') return
    const id = setTimeout(() => {
      if (timer <= 1) {
        setTimer(0)
        setPhase('distractor')
      } else {
        setTimer((tm) => tm - 1)
      }
    }, 1000)
    return () => clearTimeout(id)
  }, [phase, timer])

  const toggleIndex = (idx: number) => {
    setSelectedIndices((prev) => {
      if (prev.includes(idx)) return prev.filter((x) => x !== idx)
      if (prev.length >= currentSet.targets.length) return prev
      return [...prev, idx]
    })
  }

  const submitRecall = () => {
    const targetTotal = currentSet.targets.length
    const count = selectedIndices.filter((idx) => idx < targetTotal).length
    setHits(count)
    const acc = Math.round((count / targetTotal) * 100)
    const duration = Math.max(10, Math.round((Date.now() - startTimeRef.current) / 1000))
    onComplete({
      gameType: 'word-recall',
      gameName: cat.title,
      date: new Date().toISOString().slice(0, 10),
      completedAt: new Date().toISOString(),
      score: acc,
      metricLabel: cat.metricLabel,
      metricValue: `${count} / ${targetTotal} ${t.units.words}`,
      accuracyPct: acc,
      durationSeconds: duration,
      levelReached: 1,
    })
    setPhase('result')
  }

  const totalTargets = currentSet.targets.length
  const pct = Math.round((hits / Math.max(1, totalTargets)) * 100)

  return (
    <div className="space-y-5">
      {phase === 'instructions' && (
        <div className="rounded-2xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7FB388]/25 text-[#0F3D3E]">
              <BookText className="h-5 w-5" />
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

      {phase === 'study' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="cyan">{g.studyBadge}</Badge>
            <span className="text-sm font-bold text-[#0F3D3E] tabular-nums">
              {timer}
              {g.leftSuffix}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {currentSet.targets.map((w) => (
              <div
                key={w}
                className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] py-4 text-center text-base font-bold text-[#0F3D3E] shadow-xs"
              >
                {w}
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setPhase('distractor')}>
            {g.readyBufferBtn}
          </Button>
        </div>
      )}

      {phase === 'distractor' && (
        <div className="rounded-2xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-6 text-center space-y-4 max-w-md mx-auto">
          <Badge variant="warning">{g.bufferBadge}</Badge>
          <p className="text-lg font-bold text-[#0F3D3E]">{g.bufferQuestion}</p>
          <div className="grid grid-cols-3 gap-3">
            {[35, 37, 39].map((ans) => (
              <Button
                key={ans}
                variant="outline"
                onClick={() => setPhase('recall')}
              >
                {ans}
              </Button>
            ))}
          </div>
        </div>
      )}

      {phase === 'recall' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="primary">
              {g.selectBadge.replace('{count}', String(selectedIndices.length))}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {optionIndices.map((idx) => {
              const label = combinedWords[idx] ?? ''
              const active = selectedIndices.includes(idx)
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleIndex(idx)}
                  className={cn(
                    'rounded-xl border py-3 px-3 text-sm font-semibold transition-all',
                    active
                      ? 'border-[#2E6F73] bg-[#2E6F73] text-[#FAF4EA]'
                      : 'border-[#2E6F73]/20 bg-[#FBF6EE] text-[#0A0F14] hover:bg-[#EADCC8]/70'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <Button
            variant="primary"
            disabled={selectedIndices.length === 0}
            onClick={submitRecall}
          >
            {g.submitBtn}
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
          <p className="text-2xl font-bold text-[#0A0F14] tabular-nums">
            {g.resultText
              .replace('{hits}', String(hits))
              .replace('{total}', String(totalTargets))
              .replace('{pct}', String(pct))}
          </p>
          <Button variant="primary" onClick={startGame}>
            <RotateCcw className="h-4 w-4" />
            {c.playAgain}
          </Button>
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Grid3x3, Play, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'
import type { GameResult } from '@/types/neurocare'
import { cn } from '@/utils/cn'

function generatePattern(gridSize: number, count: number): number[] {
  const total = gridSize * gridSize
  const indices = Array.from({ length: total }, (_, i) => i)
  return indices.sort(() => Math.random() - 0.5).slice(0, count)
}

export function PatternRecognitionGame({
  onComplete,
}: {
  onComplete: (result: Omit<GameResult, 'id'>) => void
}) {
  const t = useTranslation()
  const cat = t.gamesPage.catalog['pattern-recognition']
  const g = t.gamesPage.patternRec
  const c = t.gamesPage.common

  const [phase, setPhase] = useState<'instructions' | 'flash' | 'input' | 'result'>(
    'instructions'
  )
  const [round, setRound] = useState(1)
  const [gridSize, setGridSize] = useState(3)
  const [pattern, setPattern] = useState<number[]>([])
  const [picked, setPicked] = useState<number[]>([])
  const [clearedRounds, setClearedRounds] = useState(0)
  const [finalAcc, setFinalAcc] = useState(0)
  const startTimeRef = useRef<number>(0)

  const setupRound = (nextRound: number) => {
    const size = nextRound <= 2 ? 3 : 4
    const tileCount = nextRound + 2 // 3, 4, 5, 6 tiles
    setGridSize(size)
    setPattern(generatePattern(size, tileCount))
    setPicked([])
    setPhase('flash')
  }

  const startGame = () => {
    startTimeRef.current = Date.now()
    setRound(1)
    setClearedRounds(0)
    setFinalAcc(0)
    setupRound(1)
  }

  useEffect(() => {
    if (phase !== 'flash') return
    const id = setTimeout(() => setPhase('input'), 1700)
    return () => clearTimeout(id)
  }, [phase, round])

  const finishGame = (finalCleared: number, attempts: number) => {
    const acc = Math.round((finalCleared / Math.max(1, attempts)) * 100)
    setFinalAcc(acc)
    const duration = Math.max(8, Math.round((Date.now() - startTimeRef.current) / 1000))
    const score = Math.min(100, Math.round(finalCleared * 20 + 20))
    onComplete({
      gameType: 'pattern-recognition',
      gameName: cat.title,
      date: new Date().toISOString().slice(0, 10),
      completedAt: new Date().toISOString(),
      score,
      metricLabel: cat.metricLabel,
      metricValue: `${Math.max(1, finalCleared)} (${gridSize}×${gridSize})`,
      accuracyPct: acc,
      durationSeconds: duration,
      levelReached: Math.max(1, finalCleared),
    })
    setPhase('result')
  }

  const toggleCell = (idx: number) => {
    if (phase !== 'input') return
    if (picked.includes(idx)) {
      setPicked((prev) => prev.filter((p) => p !== idx))
      return
    }
    const nextPicked = [...picked, idx]
    setPicked(nextPicked)

    if (nextPicked.length === pattern.length) {
      const targetSet = new Set(pattern)
      const allCorrect = nextPicked.every((cell) => targetSet.has(cell))
      if (allCorrect) {
        const nextCleared = clearedRounds + 1
        setClearedRounds(nextCleared)
        if (round >= 4) {
          finishGame(nextCleared, round)
        } else {
          const nextR = round + 1
          setRound(nextR)
          setupRound(nextR)
        }
      } else {
        finishGame(clearedRounds, round)
      }
    }
  }

  return (
    <div className="space-y-5">
      {phase === 'instructions' && (
        <div className="rounded-2xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E6F73]/18 text-[#0F3D3E]">
              <Grid3x3 className="h-5 w-5" />
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

      {(phase === 'flash' || phase === 'input') && (
        <div className="max-w-sm mx-auto space-y-4 text-center">
          <div className="flex items-center justify-between">
            <Badge variant="primary">
              {g.roundBadge
                .replace('{round}', String(round))
                .replace(/\{grid\}/g, String(gridSize))}
            </Badge>
            <span className="text-xs font-semibold text-[#4A5D5E]">
              {phase === 'flash'
                ? g.watchPattern
                : `${g.selectTiles.replace('{count}', String(pattern.length))} (${picked.length}/${pattern.length})`}
            </span>
          </div>

          <div
            className="grid gap-2.5 rounded-2xl border border-[#2E6F73]/30 bg-[#0A0F14] p-4"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: gridSize * gridSize }, (_, idx) => {
              const isHighlighted = phase === 'flash' && pattern.includes(idx)
              const isPicked = phase === 'input' && picked.includes(idx)
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={phase === 'flash'}
                  onClick={() => toggleCell(idx)}
                  aria-label={g.gridCellAria.replace('{num}', String(idx + 1))}
                  className={cn(
                    'aspect-square rounded-xl transition-all duration-150',
                    isHighlighted
                      ? 'bg-[#7FB388] shadow-lg shadow-[#7FB388]/40 scale-[0.98]'
                      : isPicked
                        ? 'bg-[#2E6F73] ring-2 ring-[#7FB388]'
                        : 'bg-[#EADCC8]/15 hover:bg-[#EADCC8]/25'
                  )}
                />
              )
            })}
          </div>
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
              .replace('{level}', String(clearedRounds))
              .replace('{acc}', String(finalAcc))}
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

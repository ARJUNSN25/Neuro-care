import { useEffect, useRef, useState } from 'react'
import {
  Anchor,
  Apple,
  BookOpen,
  CheckCircle2,
  Compass,
  Flower2,
  Layers,
  Play,
  RotateCcw,
  Sparkles,
  Sun,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'
import type { GameResult } from '@/types/neurocare'
import { cn } from '@/utils/cn'

interface PairDef {
  id: string
  icon: typeof Flower2
  color: string
}

const PAIR_DEFS: PairDef[] = [
  { id: 'lotus', icon: Flower2, color: 'text-pink-600' },
  { id: 'compass', icon: Compass, color: 'text-[#2E6F73]' },
  { id: 'sun', icon: Sun, color: 'text-amber-600' },
  { id: 'book', icon: BookOpen, color: 'text-[#0F3D3E]' },
  { id: 'apple', icon: Apple, color: 'text-[#C6601F]' },
  { id: 'anchor', icon: Anchor, color: 'text-[#2E6F73]' },
]

interface BoardCard {
  uid: number
  pairId: string
  icon: typeof Flower2
  color: string
}

function buildShuffledDeck(): BoardCard[] {
  const doubled = [...PAIR_DEFS, ...PAIR_DEFS].map((def, i) => ({
    uid: i,
    pairId: def.id,
    icon: def.icon,
    color: def.color,
  }))
  return doubled.sort(() => Math.random() - 0.5)
}

export function MemoryPairsGame({
  onComplete,
}: {
  onComplete: (result: Omit<GameResult, 'id'>) => void
}) {
  const t = useTranslation()
  const cat = t.gamesPage.catalog['memory-pairs']
  const g = t.gamesPage.memoryPairs
  const itemLabels = t.gamesPage.imageRecall.items
  const c = t.gamesPage.common

  const [phase, setPhase] = useState<'instructions' | 'preview' | 'play' | 'result'>(
    'instructions'
  )
  const [deck, setDeck] = useState<BoardCard[]>([])
  const [previewTimer, setPreviewTimer] = useState(3)
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([])
  const [moves, setMoves] = useState(0)
  const [lastDuration, setLastDuration] = useState(0)
  const [finalMoves, setFinalMoves] = useState(0)
  const [finalEff, setFinalEff] = useState(100)

  const checkingRef = useRef(false)
  const mismatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef = useRef<number>(0)

  const clearMismatchTimer = () => {
    if (mismatchTimerRef.current) {
      clearTimeout(mismatchTimerRef.current)
      mismatchTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => clearMismatchTimer()
  }, [])

  const startGame = () => {
    clearMismatchTimer()
    checkingRef.current = false
    startTimeRef.current = Date.now()
    setDeck(buildShuffledDeck())
    setPreviewTimer(3)
    setFlippedIndices([])
    setMatchedPairIds([])
    setMoves(0)
    setPhase('preview')
  }

  useEffect(() => {
    if (phase !== 'preview') return
    const id = setTimeout(() => {
      if (previewTimer <= 1) {
        setPreviewTimer(0)
        setPhase('play')
      } else {
        setPreviewTimer((p) => p - 1)
      }
    }, 1000)
    return () => clearTimeout(id)
  }, [phase, previewTimer])

  const finishGame = (totalMoves: number) => {
    const duration = Math.max(6, Math.round((Date.now() - startTimeRef.current) / 1000))
    const efficiency = Math.min(100, Math.round((PAIR_DEFS.length / Math.max(PAIR_DEFS.length, totalMoves)) * 100))
    setFinalMoves(totalMoves)
    setFinalEff(efficiency)
    setLastDuration(duration)
    onComplete({
      gameType: 'memory-pairs',
      gameName: cat.title,
      date: new Date().toISOString().slice(0, 10),
      completedAt: new Date().toISOString(),
      score: efficiency,
      metricLabel: cat.metricLabel,
      metricValue: `${totalMoves} ${t.units.moves}`,
      accuracyPct: efficiency,
      durationSeconds: duration,
      levelReached: totalMoves <= 8 ? 3 : totalMoves <= 11 ? 2 : 1,
    })
    setPhase('result')
  }

  const handleCardClick = (idx: number) => {
    if (phase !== 'play' || checkingRef.current) return
    const card = deck[idx]
    if (!card) return
    if (matchedPairIds.includes(card.pairId) || flippedIndices.includes(idx)) return

    const nextFlipped = [...flippedIndices, idx]
    setFlippedIndices(nextFlipped)

    if (nextFlipped.length < 2) return

    const firstCard = deck[nextFlipped[0]]
    const secondCard = deck[nextFlipped[1]]
    const nextMoves = moves + 1
    setMoves(nextMoves)

    if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
      const nextMatched = [...matchedPairIds, firstCard.pairId]
      setMatchedPairIds(nextMatched)
      setFlippedIndices([])
      if (nextMatched.length >= PAIR_DEFS.length) {
        finishGame(nextMoves)
      }
    } else {
      checkingRef.current = true
      clearMismatchTimer()
      mismatchTimerRef.current = setTimeout(() => {
        setFlippedIndices([])
        checkingRef.current = false
      }, 600)
    }
  }

  return (
    <div className="space-y-5">
      {phase === 'instructions' && (
        <div className="rounded-2xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E6F73]/18 text-[#0F3D3E]">
              <Layers className="h-5 w-5" />
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

      {(phase === 'preview' || phase === 'play') && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {phase === 'preview' ? (
                <Badge variant="cyan">
                  {g.previewBadge} ({previewTimer}
                  {g.remainingSuffix})
                </Badge>
              ) : (
                <Badge variant="primary">
                  {g.pairsMatchedBadge
                    .replace('{matched}', String(matchedPairIds.length))
                    .replace('{total}', String(PAIR_DEFS.length))}
                </Badge>
              )}
              <Badge variant="outline">
                {g.movesBadge.replace('{moves}', String(moves))}
              </Badge>
            </div>
            {phase === 'preview' && (
              <Button variant="outline" size="sm" onClick={() => setPhase('play')}>
                {g.startNowBtn}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
            {deck.map((card, idx) => {
              const isMatched = matchedPairIds.includes(card.pairId)
              const isRevealed =
                phase === 'preview' || isMatched || flippedIndices.includes(idx)
              const Icon = card.icon
              return (
                <button
                  key={card.uid}
                  type="button"
                  disabled={phase === 'preview' || isMatched}
                  onClick={() => handleCardClick(idx)}
                  aria-label={g.cardAria.replace('{num}', String(idx + 1))}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-2xl border p-3.5 min-h-[96px] transition-all duration-150',
                    isMatched
                      ? 'border-[#7FB388]/60 bg-[#7FB388]/20'
                      : isRevealed
                        ? 'border-[#2E6F73] bg-[#FBF6EE] ring-2 ring-[#2E6F73]/30'
                        : 'border-[#2E6F73]/40 bg-[#0A0F14] text-[#EADCC8] hover:bg-[#0F3D3E]'
                  )}
                >
                  {isRevealed ? (
                    <>
                      <Icon className={cn('h-7 w-7 mb-1.5', card.color)} />
                      <span className="text-xs font-semibold text-[#0A0F14] text-center leading-tight">
                        {itemLabels[card.pairId] ?? card.pairId}
                      </span>
                    </>
                  ) : (
                    <Sparkles className="h-6 w-6 text-[#7FB388]" />
                  )}
                </button>
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
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#FBF6EE] p-3.5 border border-[#2E6F73]/20">
              <p className="text-[11px] text-[#4A5D5E]">{g.movesMetricLabel}</p>
              <p className="text-2xl font-bold text-[#0A0F14] tabular-nums">
                {finalMoves} {t.units.moves}
              </p>
            </div>
            <div className="rounded-xl bg-[#FBF6EE] p-3.5 border border-[#2E6F73]/20">
              <p className="text-[11px] text-[#4A5D5E]">{g.efficiencyLabel}</p>
              <p className="text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {finalEff}%
              </p>
            </div>
            <div className="rounded-xl bg-[#FBF6EE] p-3.5 border border-[#2E6F73]/20">
              <p className="text-[11px] text-[#4A5D5E]">{g.durationLabel}</p>
              <p className="text-2xl font-bold text-[#0A0F14] tabular-nums">
                {lastDuration}s
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


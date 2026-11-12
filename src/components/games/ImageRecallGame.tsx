import { useEffect, useRef, useState } from 'react'
import {
  Anchor,
  Apple,
  BookOpen,
  Camera,
  CheckCircle2,
  Coffee,
  Compass,
  Feather,
  Flame,
  Flower2,
  Image as ImageIcon,
  Key,
  Leaf,
  Play,
  RotateCcw,
  Sun,
  Umbrella,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'
import type { GameResult } from '@/types/neurocare'
import { cn } from '@/utils/cn'

const ITEM_POOL = [
  { id: 'lotus', icon: Flower2, color: 'text-pink-600' },
  { id: 'compass', icon: Compass, color: 'text-[#2E6F73]' },
  { id: 'coffee', icon: Coffee, color: 'text-amber-700' },
  { id: 'sun', icon: Sun, color: 'text-amber-600' },
  { id: 'leaf', icon: Leaf, color: 'text-[#0F3D3E]' },
  { id: 'book', icon: BookOpen, color: 'text-[#0F3D3E]' },
  { id: 'camera', icon: Camera, color: 'text-[#0A0F14]' },
  { id: 'umbrella', icon: Umbrella, color: 'text-[#2E6F73]' },
  { id: 'key', icon: Key, color: 'text-yellow-700' },
  { id: 'feather', icon: Feather, color: 'text-[#2E6F73]' },
  { id: 'apple', icon: Apple, color: 'text-[#C6601F]' },
  { id: 'anchor', icon: Anchor, color: 'text-[#0F3D3E]' },
  { id: 'flame', icon: Flame, color: 'text-[#C6601F]' },
]

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export function ImageRecallGame({
  onComplete,
}: {
  onComplete: (result: Omit<GameResult, 'id'>) => void
}) {
  const t = useTranslation()
  const cat = t.gamesPage.catalog['image-recall']
  const g = t.gamesPage.imageRecall
  const c = t.gamesPage.common

  const [phase, setPhase] = useState<'instructions' | 'memorize' | 'recall' | 'result'>(
    'instructions'
  )
  const [targets, setTargets] = useState<typeof ITEM_POOL>([])
  const [gallery, setGallery] = useState<typeof ITEM_POOL>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [timer, setTimer] = useState(6)
  const [hits, setHits] = useState(0)
  const startTimeRef = useRef<number>(0)

  const startGame = () => {
    startTimeRef.current = Date.now()
    const shuffled = shuffle(ITEM_POOL)
    const chosenTargets = shuffled.slice(0, 6)
    const distractorSet = shuffle(shuffled.slice(0, 12))
    setTargets(chosenTargets)
    setGallery(distractorSet)
    setSelectedIds([])
    setTimer(6)
    setPhase('memorize')
  }

  useEffect(() => {
    if (phase !== 'memorize') return
    const id = setTimeout(() => {
      if (timer <= 1) {
        setTimer(0)
        setPhase('recall')
      } else {
        setTimer((tm) => tm - 1)
      }
    }, 1000)
    return () => clearTimeout(id)
  }, [phase, timer])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 6) return prev
      return [...prev, id]
    })
  }

  const submitRecall = () => {
    const targetIds = new Set(targets.map((item) => item.id))
    const hitCount = selectedIds.filter((id) => targetIds.has(id)).length
    setHits(hitCount)
    const acc = Math.round((hitCount / 6) * 100)
    const duration = Math.max(8, Math.round((Date.now() - startTimeRef.current) / 1000))
    onComplete({
      gameType: 'image-recall',
      gameName: cat.title,
      date: new Date().toISOString().slice(0, 10),
      completedAt: new Date().toISOString(),
      score: acc,
      metricLabel: cat.metricLabel,
      metricValue: `${hitCount} / 6 ${t.units.items}`,
      accuracyPct: acc,
      durationSeconds: duration,
      levelReached: hitCount >= 5 ? 2 : 1,
    })
    setPhase('result')
  }

  const pct = Math.round((hits / 6) * 100)

  return (
    <div className="space-y-5">
      {phase === 'instructions' && (
        <div className="rounded-2xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E6F73]/18 text-[#0F3D3E]">
              <ImageIcon className="h-5 w-5" />
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

      {phase === 'memorize' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="cyan">{g.memorizeBadge}</Badge>
            <span className="text-sm font-bold text-[#0F3D3E] tabular-nums">
              {timer}
              {g.remainingSuffix}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {targets.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  className="flex flex-col items-center justify-center rounded-2xl border border-[#2E6F73]/30 bg-[#FBF6EE] p-5 shadow-xs"
                >
                  <Icon className={cn('h-10 w-10 mb-2', item.color)} />
                  <span className="text-sm font-semibold text-[#0A0F14]">
                    {g.items[item.id] ?? item.id}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'recall' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="primary">
              {g.selectBadge.replace('{count}', String(selectedIds.length))}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {gallery.map((item) => {
              const Icon = item.icon
              const active = selectedIds.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSelect(item.id)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-2xl border p-4 transition-all',
                    active
                      ? 'border-[#2E6F73] bg-[#2E6F73]/15 ring-2 ring-[#2E6F73]/30'
                      : 'border-[#2E6F73]/20 bg-[#FBF6EE] hover:bg-[#EADCC8]/70'
                  )}
                >
                  <Icon className={cn('h-8 w-8 mb-1.5', item.color)} />
                  <span className="text-xs font-semibold text-[#0A0F14]">
                    {g.items[item.id] ?? item.id}
                  </span>
                </button>
              )
            })}
          </div>
          <Button
            variant="primary"
            disabled={selectedIds.length === 0}
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

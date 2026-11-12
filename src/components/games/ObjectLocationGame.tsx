import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Glasses,
  Key,
  MapPin,
  Pill,
  Play,
  RotateCcw,
  Umbrella,
  Wallet,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'
import type { GameResult } from '@/types/neurocare'
import { cn } from '@/utils/cn'

const DAILY_ITEMS = [
  { id: 'keys', icon: Key, color: 'text-amber-700' },
  { id: 'glasses', icon: Glasses, color: 'text-[#2E6F73]' },
  { id: 'wallet', icon: Wallet, color: 'text-[#0F3D3E]' },
  { id: 'umbrella', icon: Umbrella, color: 'text-[#2E6F73]' },
  { id: 'pillbox', icon: Pill, color: 'text-[#C6601F]' },
  { id: 'notebook', icon: BookOpen, color: 'text-[#0F3D3E]' },
]

const PLACE_POOL = ['kitchen', 'desk', 'bedside', 'doorway', 'livingRoom', 'balcony']

interface ItemPlacePair {
  item: (typeof DAILY_ITEMS)[number]
  placeId: string
}

interface RecallAnswer {
  item: (typeof DAILY_ITEMS)[number]
  expectedPlaceId: string
  chosenPlaceId: string
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export function ObjectLocationGame({
  onComplete,
}: {
  onComplete: (result: Omit<GameResult, 'id'>) => void
}) {
  const t = useTranslation()
  const cat = t.gamesPage.catalog['object-location']
  const g = t.gamesPage.objectLocation
  const c = t.gamesPage.common

  const [phase, setPhase] = useState<'instructions' | 'study' | 'recall' | 'result'>(
    'instructions'
  )
  const [pairs, setPairs] = useState<ItemPlacePair[]>([])
  const [recallQueue, setRecallQueue] = useState<ItemPlacePair[]>([])
  const [placeOptions, setPlaceOptions] = useState<string[]>([])
  const [recallIdx, setRecallIdx] = useState(0)
  const [answers, setAnswers] = useState<RecallAnswer[]>([])
  const [timer, setTimer] = useState(10)
  const startTimeRef = useRef<number>(0)

  const startGame = () => {
    startTimeRef.current = Date.now()
    const pickedItems = shuffle(DAILY_ITEMS).slice(0, 5)
    const pickedPlaces = shuffle(PLACE_POOL).slice(0, 5)
    const paired = pickedItems.map((item, i) => ({
      item,
      placeId: pickedPlaces[i],
    }))
    setPairs(paired)
    setRecallQueue(shuffle(paired))
    setPlaceOptions(shuffle(pickedPlaces))
    setRecallIdx(0)
    setAnswers([])
    setTimer(10)
    setPhase('study')
  }

  useEffect(() => {
    if (phase !== 'study') return
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

  const handleChoosePlace = (chosenPlaceId: string) => {
    const currentPair = recallQueue[recallIdx]
    if (!currentPair) return

    const nextAnswers: RecallAnswer[] = [
      ...answers,
      {
        item: currentPair.item,
        expectedPlaceId: currentPair.placeId,
        chosenPlaceId,
      },
    ]
    setAnswers(nextAnswers)

    if (recallIdx + 1 < recallQueue.length) {
      setRecallIdx((idx) => idx + 1)
      return
    }

    const total = nextAnswers.length
    const hitCount = nextAnswers.filter(
      (a) => a.chosenPlaceId === a.expectedPlaceId
    ).length
    const acc = Math.round((hitCount / Math.max(1, total)) * 100)
    const duration = Math.max(8, Math.round((Date.now() - startTimeRef.current) / 1000))

    onComplete({
      gameType: 'object-location',
      gameName: cat.title,
      date: new Date().toISOString().slice(0, 10),
      completedAt: new Date().toISOString(),
      score: acc,
      metricLabel: cat.metricLabel,
      metricValue: `${hitCount} / ${total} ${t.units.items}`,
      accuracyPct: acc,
      durationSeconds: duration,
      levelReached: hitCount >= 4 ? 2 : 1,
    })
    setPhase('result')
  }

  const hits = answers.filter((a) => a.chosenPlaceId === a.expectedPlaceId).length
  const total = Math.max(1, answers.length || pairs.length)
  const pct = Math.round((hits / total) * 100)
  const activeRecallPair = recallQueue[recallIdx]

  return (
    <div className="space-y-5">
      {phase === 'instructions' && (
        <div className="rounded-2xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7FB388]/25 text-[#0F3D3E]">
              <MapPin className="h-5 w-5" />
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="cyan">{g.studyBadge}</Badge>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#0F3D3E] tabular-nums">
                {timer}
                {g.remainingSuffix}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPhase('recall')}>
                {g.readyBtn}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {pairs.map(({ item, placeId }) => {
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  data-testid="object-location-study-pair"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#2E6F73]/25 bg-[#FBF6EE] px-4 py-3.5 shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EADCC8]/75">
                      <Icon className={cn('h-5 w-5', item.color)} />
                    </span>
                    <span className="text-sm font-bold text-[#0A0F14] truncate">
                      {g.items[item.id] ?? item.id}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#4A5D5E] rtl:rotate-180" />
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#EADCC8]/80 px-3 py-1.5 text-xs font-semibold text-[#0F3D3E] shrink-0">
                    <MapPin className="h-3.5 w-3.5" />
                    {g.places[placeId] ?? placeId}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'recall' && activeRecallPair && (
        <div className="max-w-lg mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <Badge variant="primary">
              {g.recallBadge
                .replace('{current}', String(recallIdx + 1))
                .replace('{total}', String(recallQueue.length))}
            </Badge>
          </div>

          <div
            data-testid="object-location-active-item"
            className="rounded-2xl border border-[#2E6F73]/30 bg-[#FBF6EE] p-6 text-center space-y-2"
          >
            {(() => {
              const ActiveIcon = activeRecallPair.item.icon
              return (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7EFE3] border border-[#2E6F73]/20 shadow-xs">
                  <ActiveIcon className={cn('h-7 w-7', activeRecallPair.item.color)} />
                </div>
              )
            })()}
            <h4 className="text-xl font-bold text-[#0F3D3E]">
              {g.items[activeRecallPair.item.id] ?? activeRecallPair.item.id}
            </h4>
            <p className="text-xs text-[#4A5D5E]">{g.wherePlacedQuestion}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {placeOptions.map((placeId) => (
              <button
                key={placeId}
                type="button"
                onClick={() => handleChoosePlace(placeId)}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#2E6F73]/25 bg-[#F7EFE3] py-3 px-4 text-sm font-semibold text-[#0A0F14] hover:border-[#2E6F73] hover:bg-[#EADCC8]/70 transition-all"
              >
                <MapPin className="h-4 w-4 text-[#2E6F73]" />
                {g.places[placeId] ?? placeId}
              </button>
            ))}
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
              .replace('{hits}', String(hits))
              .replace('{total}', String(total))
              .replace('{pct}', String(pct))}
          </p>
          <div className="space-y-2">
            {answers.map((ans) => {
              const ok = ans.chosenPlaceId === ans.expectedPlaceId
              return (
                <div
                  key={ans.item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] px-3.5 py-2.5 text-xs"
                >
                  <span className="font-bold text-[#0A0F14]">
                    {g.items[ans.item.id] ?? ans.item.id}
                  </span>
                  <div className="flex items-center gap-2">
                    {ok ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#0F3D3E]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {g.places[ans.expectedPlaceId] ?? ans.expectedPlaceId}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[#4A5D5E]">
                        <XCircle className="h-3.5 w-3.5 text-[#C6601F]" />
                        <span>
                          {g.selectedPrefix} {g.places[ans.chosenPlaceId] ?? ans.chosenPlaceId} ·{' '}
                          <strong className="text-[#0A0F14]">
                            {g.correctPlacePrefix} {g.places[ans.expectedPlaceId] ?? ans.expectedPlaceId}
                          </strong>
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
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


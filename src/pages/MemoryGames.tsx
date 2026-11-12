import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BookText,
  Gamepad2,
  Grid3x3,
  Hash,
  Image as ImageIcon,
  Layers,
  MapPin,
  Trophy,
  Zap,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { MedicalDisclaimerBanner } from '@/components/common/MedicalDisclaimerBanner'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { NumberSequenceGame } from '@/components/games/NumberSequenceGame'
import { ImageRecallGame } from '@/components/games/ImageRecallGame'
import { PatternRecognitionGame } from '@/components/games/PatternRecognitionGame'
import { WordRecallGame } from '@/components/games/WordRecallGame'
import { ReactionTimeGame } from '@/components/games/ReactionTimeGame'
import { MemoryPairsGame } from '@/components/games/MemoryPairsGame'
import { ObjectLocationGame } from '@/components/games/ObjectLocationGame'
import { localizeGameMetric } from '@/data/translations'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import type { GameType } from '@/types/neurocare'
import { cn } from '@/utils/cn'

const GAME_META: { id: GameType; icon: typeof Hash }[] = [
  { id: 'number-sequence', icon: Hash },
  { id: 'image-recall', icon: ImageIcon },
  { id: 'pattern-recognition', icon: Grid3x3 },
  { id: 'word-recall', icon: BookText },
  { id: 'reaction-time', icon: Zap },
  { id: 'memory-pairs', icon: Layers },
  { id: 'object-location', icon: MapPin },
]

export default function MemoryGames() {
  const { state, addGameResult } = useNeuroCare()
  const t = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const paramGame = searchParams.get('game') as GameType | null
  const activeGame: GameType =
    paramGame && GAME_META.some((g) => g.id === paramGame)
      ? paramGame
      : 'number-sequence'

  const selectGame = (id: GameType) => {
    setSearchParams({ game: id })
  }

  const gameHistory = useMemo(
    () =>
      state.gameResults
        .filter((r) => r.gameType === activeGame)
        .slice(0, 8),
    [state.gameResults, activeGame]
  )

  const activeCatalogEntry = t.gamesPage.catalog[activeGame]

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Badge variant="cyan">{t.gamesPage.badge}</Badge>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0F3D3E]">
              {t.gamesPage.title}
            </h1>
            <p className="text-sm text-[#4A5D5E]">
              {t.gamesPage.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#2E6F73]/25 bg-[#F7EFE3] px-3.5 py-2 text-xs font-semibold text-[#0F3D3E]">
            <Gamepad2 className="h-4 w-4 text-[#2E6F73]" />
            <span>
              {state.gameResults.length} {t.gamesPage.sessionsLogged}
            </span>
          </div>
        </div>

        <MedicalDisclaimerBanner compact />

        {/* Game Selector Strip */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GAME_META.map((meta) => {
            const Icon = meta.icon
            const info = t.gamesPage.catalog[meta.id]
            const active = activeGame === meta.id
            const latestRun = state.gameResults.find((r) => r.gameType === meta.id)
            return (
              <button
                key={meta.id}
                type="button"
                onClick={() => selectGame(meta.id)}
                className={cn(
                  'rounded-2xl border p-4 text-start transition-all',
                  active
                    ? 'border-[#0F3D3E] bg-[#0F3D3E] text-[#EADCC8] shadow-md shadow-[#0A0F14]/20'
                    : 'border-[#2E6F73]/25 bg-[#F7EFE3] hover:border-[#2E6F73]'
                )}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                      active
                        ? 'bg-[#0A0F14]/50 text-[#7FB388]'
                        : 'bg-[#EADCC8] text-[#0F3D3E]'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full truncate',
                      active
                        ? 'bg-[#2E6F73] text-[#FAF4EA]'
                        : 'bg-[#EADCC8] text-[#0F3D3E]'
                    )}
                  >
                    {info.domain}
                  </span>
                </div>
                <h3
                  className={cn(
                    'mt-3 text-sm font-bold',
                    active ? 'text-[#EADCC8]' : 'text-[#0F3D3E]'
                  )}
                >
                  {info.title}
                </h3>
                <p
                  className={cn(
                    'text-[11px] mt-0.5',
                    active ? 'text-[#EADCC8]/80' : 'text-[#4A5D5E]'
                  )}
                >
                  {latestRun
                    ? `${t.gamesPage.lastPrefix} ${localizeGameMetric(latestRun.metricValue, t)}`
                    : info.subtitle}
                </p>
              </button>
            )
          })}
        </div>

        {/* Active Game Stage + Historical Results */}
        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-8">
            <CardContent className="pt-6">
              {activeGame === 'number-sequence' && (
                <NumberSequenceGame onComplete={addGameResult} />
              )}
              {activeGame === 'image-recall' && (
                <ImageRecallGame onComplete={addGameResult} />
              )}
              {activeGame === 'pattern-recognition' && (
                <PatternRecognitionGame onComplete={addGameResult} />
              )}
              {activeGame === 'word-recall' && (
                <WordRecallGame onComplete={addGameResult} />
              )}
              {activeGame === 'reaction-time' && (
                <ReactionTimeGame onComplete={addGameResult} />
              )}
              {activeGame === 'memory-pairs' && (
                <MemoryPairsGame onComplete={addGameResult} />
              )}
              {activeGame === 'object-location' && (
                <ObjectLocationGame onComplete={addGameResult} />
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#C6601F]" />
                <CardTitle>{t.gamesPage.historicalResultsTitle}</CardTitle>
              </div>
              <CardDescription>
                {t.gamesPage.pastSessionsFor} {activeCatalogEntry.title}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {gameHistory.length === 0 ? (
                <p className="text-xs text-[#4A5D5E] py-4 text-center">
                  {t.gamesPage.emptyHistory}
                </p>
              ) : (
                gameHistory.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] px-3.5 py-2.5"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#0F3D3E] tabular-nums">
                        {localizeGameMetric(run.metricValue, t)}
                      </p>
                      <p className="text-[11px] text-[#4A5D5E]">
                        {run.date} · {run.durationSeconds}s
                        {run.isSample ? ` · ${t.sampleLabel}` : ''}
                      </p>
                    </div>
                    <Badge variant="success">
                      {run.accuracyPct}% {t.gamesPage.accSuffix}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

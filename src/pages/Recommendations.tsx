import { useMemo, useState } from 'react'
import { CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { getLocalizedRec } from '@/data/translations'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import type { RecommendationCategory } from '@/types/neurocare'
import { cn } from '@/utils/cn'

const CATEGORIES: ('All' | RecommendationCategory)[] = [
  'All',
  'Cognitive',
  'Sleep',
  'Physical Activity',
  'Stress Management',
  'Nutrition',
  'Social',
  'Clinical Follow-up',
]

export default function Recommendations() {
  const { state, toggleRecommendation } = useNeuroCare()
  const t = useTranslation()
  const [selectedCategory, setSelectedCategory] =
    useState<'All' | RecommendationCategory>('All')

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return state.recommendations
    return state.recommendations.filter((r) => r.category === selectedCategory)
  }, [state.recommendations, selectedCategory])

  const completedCount = state.recommendations.filter((r) => r.completed).length
  const pct = Math.round(
    (completedCount / Math.max(1, state.recommendations.length)) * 100
  )

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Badge variant="success">{t.recommendationsPage.badge}</Badge>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0F3D3E]">
              {t.recommendationsPage.title}
            </h1>
            <p className="text-sm text-[#4A5D5E]">
              {t.recommendationsPage.subtitle}
            </p>
          </div>
          <div className="rounded-2xl border border-[#2E6F73]/25 bg-[#F7EFE3] px-4 py-3 min-w-[220px]">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold">
              <span className="text-[#0F3D3E]">
                {t.recommendationsPage.completedHabits}
              </span>
              <span className="text-[#0F3D3E] tabular-nums">
                {completedCount}/{state.recommendations.length} ({pct}%)
              </span>
            </div>
            <Progress value={pct} className="mt-2" />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                selectedCategory === cat
                  ? 'border-[#0F3D3E] bg-[#0F3D3E] text-[#FAF4EA]'
                  : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]/70'
              )}
            >
              {t.recCategories[cat]}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((rec) => {
            const loc = getLocalizedRec(rec, t)
            return (
              <Card
                key={rec.id}
                className={cn(
                  'transition-all',
                  rec.completed && 'border-[#7FB388]/65 bg-[#7FB388]/16'
                )}
              >
                <CardContent className="pt-5 flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="primary">
                          {t.recCategories[rec.category] ?? rec.category}
                        </Badge>
                        <Badge variant="cyan">{loc.culturalTag}</Badge>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#4A5D5E]">
                        <Clock className="h-3 w-3" />
                        {loc.frequency} · {loc.durationLabel}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#0F3D3E]">
                      {loc.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#263A3B] leading-relaxed">
                      {loc.description}
                    </p>
                    <div className="rounded-xl bg-[#EADCC8]/55 border border-[#CBB9A1]/70 px-3 py-2 text-[11px] text-[#263A3B]">
                      <span className="font-semibold text-[#0F3D3E]">
                        {t.recommendationsPage.whyHelps}
                      </span>{' '}
                      {loc.rationale}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#CBB9A1]/60">
                    <span className="text-[11px] text-[#4A5D5E]">
                      {rec.completed && rec.completedAt
                        ? `${t.recommendationsPage.completedOnPrefix} ${rec.completedAt}`
                        : t.recommendationsPage.tapToTrack}
                    </span>
                    <Button
                      size="sm"
                      variant={rec.completed ? 'success' : 'outline'}
                      onClick={() => toggleRecommendation(rec.id)}
                    >
                      {rec.completed ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t.completed}
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-[#2E6F73]" />
                          {t.markCompleted}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}

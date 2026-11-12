import React, { useMemo, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Droplets,
  Footprints,
  Heart,
  Users,
  Wind,
} from 'lucide-react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/utils/cn'

export default function LifestyleTracking() {
  const { state, addLifestyleLog } = useNeuroCare()
  const t = useTranslation()

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [exerciseMinutes, setExerciseMinutes] = useState(35)
  const [walkingSteps, setWalkingSteps] = useState(8200)
  const [hydrationGlasses, setHydrationGlasses] = useState(8)
  const [foodQualityRating, setFoodQualityRating] = useState<1 | 2 | 3 | 4 | 5>(4)
  const [foodTags, setFoodTags] = useState<string[]>([
    'Walnuts & Almonds',
    'Leafy Greens',
  ])
  const [socialMinutes, setSocialMinutes] = useState(40)
  const [stressLevel, setStressLevel] = useState<1 | 2 | 3 | 4 | 5>(2)
  const [moodLevel, setMoodLevel] = useState<1 | 2 | 3 | 4 | 5>(4)
  const [relaxationMinutes, setRelaxationMinutes] = useState(15)
  const [savedBanner, setSavedBanner] = useState(false)

  const toggleFoodTag = (tagId: string) => {
    setFoodTags((prev) =>
      prev.includes(tagId) ? prev.filter((item) => item !== tagId) : [...prev, tagId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addLifestyleLog({
      date,
      exerciseMinutes,
      walkingSteps,
      hydrationGlasses,
      foodQualityRating,
      foodTags,
      socialMinutes,
      stressLevel,
      moodLevel,
      relaxationMinutes,
    })
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 3000)
  }

  const chartData = useMemo(
    () =>
      [...state.lifestyleLogs]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7)
        .map((l) => ({
          date: l.date.slice(5),
          steps: l.walkingSteps,
          exerciseMinutes: l.exerciseMinutes,
          hydration: l.hydrationGlasses,
          stress: l.stressLevel,
        })),
    [state.lifestyleLogs]
  )

  const latestLog = state.lifestyleLogs[state.lifestyleLogs.length - 1]

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Badge variant="success">{t.lifestylePage.badge}</Badge>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0F3D3E]">
              {t.lifestylePage.title}
            </h1>
            <p className="text-sm text-[#4A5D5E]">
              {t.lifestylePage.subtitle}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Daily Lifestyle Logger */}
          <Card className="lg:col-span-6">
            <CardHeader>
              <CardTitle>{t.lifestylePage.logTitle}</CardTitle>
              <CardDescription>
                {t.lifestylePage.logDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {savedBanner && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#7FB388]/60 bg-[#7FB388]/20 px-3.5 py-2.5 text-xs font-semibold text-[#0F3D3E]">
                    <CheckCircle2 className="h-4 w-4" />
                    {t.lifestylePage.savedMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#0F3D3E]">
                      {t.lifestylePage.dateLabel}
                    </label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#0F3D3E]">
                      {t.lifestylePage.exerciseLabel}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={300}
                      value={exerciseMinutes}
                      onChange={(e) => setExerciseMinutes(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#0F3D3E]">
                      {t.lifestylePage.stepsLabel}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={40000}
                      step={100}
                      value={walkingSteps}
                      onChange={(e) => setWalkingSteps(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Hydration Interactive Counter */}
                <div className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Droplets className="h-5 w-5 text-[#2E6F73] shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#0F3D3E]">
                        {t.lifestylePage.hydrationTitle}: {hydrationGlasses} {t.units.glasses} ·{' '}
                        {hydrationGlasses * 250} {t.units.ml}
                      </p>
                      <p className="text-[11px] text-[#4A5D5E]">
                        {t.lifestylePage.hydrationTarget}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setHydrationGlasses((g) => Math.max(0, g - 1))}
                    >
                      -
                    </Button>
                    <Button
                      size="sm"
                      variant="cyan"
                      onClick={() => setHydrationGlasses((g) => Math.min(16, g + 1))}
                    >
                      {t.lifestylePage.addGlassBtn}
                    </Button>
                  </div>
                </div>

                {/* Food Habits */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-[#0F3D3E]">
                      {t.lifestylePage.foodHabitsLabel}
                    </label>
                    <span className="text-[11px] text-[#4A5D5E]">
                      {t.lifestylePage.nutritionQuality}: {foodQualityRating}/5
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.lifestylePage.foodTags.map((tag) => {
                      const active = foodTags.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleFoodTag(tag.id)}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                            active
                              ? 'border-[#0F3D3E] bg-[#0F3D3E] text-[#EADCC8]'
                              : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]'
                          )}
                        >
                          {tag.label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex gap-2 pt-1">
                    {([1, 2, 3, 4, 5] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFoodQualityRating(r)}
                        className={cn(
                          'flex-1 rounded-lg border py-1 text-xs font-semibold',
                          foodQualityRating === r
                            ? 'border-[#0F3D3E] bg-[#7FB388]/25 text-[#0F3D3E]'
                            : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#4A5D5E]'
                        )}
                      >
                        {r}/5
                      </button>
                    ))}
                  </div>
                </div>

                {/* Social, Stress, Mood & Relaxation */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#0F3D3E]">
                      {t.lifestylePage.socialLabel}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={socialMinutes}
                      onChange={(e) => setSocialMinutes(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#0F3D3E]">
                      {t.lifestylePage.relaxationLabel}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={relaxationMinutes}
                      onChange={(e) => setRelaxationMinutes(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#0F3D3E]">
                      {t.lifestylePage.stressLabel}
                    </label>
                    <div className="flex gap-1.5 mt-1">
                      {([1, 2, 3, 4, 5] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setStressLevel(lvl)}
                          className={cn(
                            'flex-1 rounded-lg border py-1.5 text-xs font-bold',
                            stressLevel === lvl
                              ? 'border-[#C6601F] bg-[#C6601F] text-[#FAF4EA]'
                              : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#0A0F14]'
                          )}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#0F3D3E]">
                      {t.lifestylePage.moodLabel}
                    </label>
                    <div className="flex gap-1.5 mt-1">
                      {([1, 2, 3, 4, 5] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setMoodLevel(lvl)}
                          className={cn(
                            'flex-1 rounded-lg border py-1.5 text-xs font-bold',
                            moodLevel === lvl
                              ? 'border-[#0F3D3E] bg-[#2E6F73] text-[#FAF4EA]'
                              : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#0A0F14]'
                          )}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button type="submit" variant="primary" size="lg" className="w-full">
                  <Activity className="h-4 w-4" />
                  {t.lifestylePage.saveBtn}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Charts & Pillars */}
          <div className="lg:col-span-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.lifestylePage.chartTitle}</CardTitle>
                <CardDescription>
                  {t.lifestylePage.chartDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                      <XAxis dataKey="date" fontSize={12} stroke="#4A5D5E" />
                      <YAxis yAxisId="left" fontSize={12} stroke="#0F3D3E" />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[1, 5]}
                        fontSize={12}
                        stroke="#C6601F"
                      />
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
                        yAxisId="left"
                        dataKey="steps"
                        name={t.lifestylePage.stepsSeries}
                        fill="#7FB388"
                        radius={[6, 6, 0, 0]}
                        barSize={22}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="stress"
                        name={t.lifestylePage.stressSeries}
                        stroke="#C6601F"
                        strokeWidth={2.5}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: Footprints,
                  label: t.lifestylePage.tiles.latestWalking,
                  val: `${(latestLog?.walkingSteps ?? 0).toLocaleString()} ${t.units.steps}`,
                },
                {
                  icon: Droplets,
                  label: t.lifestylePage.tiles.latestHydration,
                  val: `${latestLog?.hydrationGlasses ?? 0} ${t.units.glasses}`,
                },
                {
                  icon: Users,
                  label: t.lifestylePage.tiles.socialTime,
                  val: `${latestLog?.socialMinutes ?? 0} ${t.units.mins}`,
                },
                {
                  icon: Wind,
                  label: t.lifestylePage.tiles.relaxation,
                  val: `${latestLog?.relaxationMinutes ?? 0} ${t.units.mins}`,
                },
              ].map((tile) => {
                const Icon = tile.icon
                return (
                  <Card key={tile.label}>
                    <CardContent className="pt-4 flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EADCC8] text-[#0F3D3E] border border-[#2E6F73]/25">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] text-[#4A5D5E] truncate">{tile.label}</p>
                        <p className="text-sm font-bold text-[#0F3D3E] tabular-nums">
                          {tile.val}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card>
              <CardContent className="pt-4 flex items-start gap-3">
                <Heart className="h-5 w-5 text-[#2E6F73] shrink-0 mt-0.5" />
                <p className="text-xs text-[#263A3B] leading-relaxed">
                  <strong>{t.lifestylePage.whyTitle}</strong>{' '}
                  {t.lifestylePage.whyDesc}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

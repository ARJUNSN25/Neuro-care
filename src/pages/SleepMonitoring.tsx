import React, { useMemo, useState } from 'react'
import { BedDouble, CheckCircle2, Moon, Sparkles, Sun } from 'lucide-react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import type { SleepLog } from '@/types/neurocare'
import { cn } from '@/utils/cn'

function computeDurationHours(bed: string, wake: string): number {
  const [bh, bm] = bed.split(':').map(Number)
  const [wh, wm] = wake.split(':').map(Number)
  if (Number.isNaN(bh) || Number.isNaN(wh)) return 7.0
  let bedMins = bh * 60 + bm
  const wakeMins = wh * 60 + wm
  if (bedMins > wakeMins) bedMins -= 24 * 60
  return Number(((wakeMins - bedMins) / 60).toFixed(1))
}

const TIP_ICONS = [Moon, Sun, BedDouble, Sparkles] as const

export default function SleepMonitoring() {
  const { state, addSleepLog } = useNeuroCare()
  const t = useTranslation()

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [bedtime, setBedtime] = useState('22:50')
  const [wakeTime, setWakeTime] = useState('06:20')
  const [qualityRating, setQualityRating] = useState<1 | 2 | 3 | 4 | 5>(4)
  const [awakenings, setAwakenings] = useState(1)
  const [refreshedRating, setRefreshedRating] =
    useState<SleepLog['refreshedRating']>('Refreshed')
  const [screenBeforeBed, setScreenBeforeBed] = useState(false)
  const [notes, setNotes] = useState('')
  const [savedBanner, setSavedBanner] = useState(false)

  const computedDuration = computeDurationHours(bedtime, wakeTime)

  const sortedSleep = useMemo(
    () => [...state.sleepLogs].sort((a, b) => a.date.localeCompare(b.date)),
    [state.sleepLogs]
  )
  const weeklyData = useMemo(
    () =>
      sortedSleep.slice(-7).map((s) => ({
        date: s.date.slice(5),
        durationHours: s.durationHours,
        qualityRating: s.qualityRating,
      })),
    [sortedSleep]
  )

  const avgHours = useMemo(() => {
    const slice = sortedSleep.slice(-7)
    if (!slice.length) return 0
    return Number(
      (slice.reduce((sum, s) => sum + s.durationHours, 0) / slice.length).toFixed(1)
    )
  }, [sortedSleep])

  const avgQuality = useMemo(() => {
    const slice = sortedSleep.slice(-7)
    if (!slice.length) return 0
    return Number(
      (slice.reduce((sum, s) => sum + s.qualityRating, 0) / slice.length).toFixed(1)
    )
  }, [sortedSleep])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addSleepLog({
      date,
      durationHours: computedDuration,
      qualityRating,
      bedtime,
      wakeTime,
      awakenings,
      refreshedRating,
      screenBeforeBed,
      notes,
    })
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 3000)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Badge variant="cyan">{t.sleepPage.badge}</Badge>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0F3D3E]">
              {t.sleepPage.title}
            </h1>
            <p className="text-sm text-[#4A5D5E]">
              {t.sleepPage.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[#2E6F73]/25 bg-[#F7EFE3] px-4 py-2 text-end">
              <p className="text-[10px] font-semibold uppercase text-[#4A5D5E]">
                {t.sleepPage.sevenDayAvg}
              </p>
              <p className="text-base font-bold text-[#0F3D3E] tabular-nums">
                {avgHours} {t.units.hrs} · {avgQuality}/5
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Daily Sleep Logger + Quality Questionnaire */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>{t.sleepPage.logTitle}</CardTitle>
              <CardDescription>
                {t.sleepPage.logDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {savedBanner && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#7FB388]/60 bg-[#7FB388]/20 px-3.5 py-2.5 text-xs font-semibold text-[#0F3D3E]">
                    <CheckCircle2 className="h-4 w-4" />
                    {t.sleepPage.savedMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#0F3D3E]">
                      {t.sleepPage.dateLabel}
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
                      {t.sleepPage.bedtimeLabel}
                    </label>
                    <Input
                      type="time"
                      value={bedtime}
                      onChange={(e) => setBedtime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#0F3D3E]">
                      {t.sleepPage.wakeTimeLabel}
                    </label>
                    <Input
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#EADCC8]/70 px-4 py-2.5 border border-[#2E6F73]/25">
                  <span className="text-xs font-medium text-[#263A3B]">
                    {t.sleepPage.computedDuration}
                  </span>
                  <span className="text-lg font-bold text-[#0F3D3E] tabular-nums">
                    {computedDuration} {t.units.hrs}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.sleepPage.qualityQuestion}
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {([1, 2, 3, 4, 5] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setQualityRating(r)}
                        className={cn(
                          'rounded-xl border py-2 text-xs font-bold transition-colors',
                          qualityRating === r
                            ? 'border-[#0F3D3E] bg-[#2E6F73] text-[#FAF4EA]'
                            : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#0A0F14] hover:bg-[#EADCC8]'
                        )}
                      >
                        {r}★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#0F3D3E]">
                      {t.sleepPage.morningFeeling}
                    </label>
                    <Select
                      value={refreshedRating}
                      onChange={(e) =>
                        setRefreshedRating(e.target.value as SleepLog['refreshedRating'])
                      }
                      className="mt-1"
                    >
                      <option value="Refreshed">{t.sleepRefreshed.Refreshed}</option>
                      <option value="Moderate">{t.sleepRefreshed.Moderate}</option>
                      <option value="Fatigued">{t.sleepRefreshed.Fatigued}</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#0F3D3E]">
                      {t.sleepPage.nightAwakenings}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={awakenings}
                      onChange={(e) => setAwakenings(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] px-3.5 py-2.5 text-xs text-[#0A0F14] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={screenBeforeBed}
                    onChange={(e) => setScreenBeforeBed(e.target.checked)}
                    className="rounded"
                  />
                  {t.sleepPage.screenCheckbox}
                </label>

                <div>
                  <label className="text-[11px] font-semibold text-[#0F3D3E]">
                    {t.sleepPage.notesLabel}
                  </label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t.sleepPage.notesPlaceholder}
                    className="mt-1"
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full" size="lg">
                  <Moon className="h-4 w-4" />
                  {t.sleepPage.saveBtn}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Weekly Sleep Chart & Suggestions */}
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.sleepPage.chartTitle}</CardTitle>
                <CardDescription>
                  {t.sleepPage.chartDescPrefix} {state.user.sleepHabitTargetHours} {t.units.hrs}.{' '}
                  {t.sleepPage.chartDescSuffix}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#CBB9A1" />
                      <XAxis dataKey="date" fontSize={12} stroke="#4A5D5E" />
                      <YAxis
                        yAxisId="left"
                        domain={[4, 10]}
                        fontSize={12}
                        stroke="#2E6F73"
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 5]}
                        fontSize={12}
                        stroke="#0F3D3E"
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
                      <ReferenceLine
                        yAxisId="left"
                        y={state.user.sleepHabitTargetHours}
                        stroke="#C6601F"
                        strokeDasharray="4 4"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="qualityRating"
                        name={t.sleepPage.qualitySeries}
                        fill="#7FB388"
                        radius={[6, 6, 0, 0]}
                        barSize={22}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="durationHours"
                        name={t.sleepPage.durationSeries}
                        stroke="#2E6F73"
                        strokeWidth={2.5}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#2E6F73]" />
                  <CardTitle>{t.sleepPage.tipsTitle}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {t.sleepPage.tips.map((tip, idx) => {
                  const Icon = TIP_ICONS[idx % TIP_ICONS.length]
                  return (
                    <div
                      key={tip.title}
                      className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-3.5"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0F3D3E]">
                        <Icon className="h-4 w-4 text-[#2E6F73] shrink-0" />
                        {tip.title}
                      </div>
                      <p className="mt-1.5 text-xs text-[#4A5D5E] leading-relaxed">
                        {tip.desc}
                      </p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

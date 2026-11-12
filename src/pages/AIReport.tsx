import { useMemo } from 'react'
import { Download, Printer, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { MedicalDisclaimerBanner } from '@/components/common/MedicalDisclaimerBanner'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { TRANSLATIONS, getLocalizedRec } from '@/data/translations'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import {
  computeBrainHealthReport,
  formatAssessmentCategorySummary,
} from '@/services/neurocareAI'
import { generateBrainHealthReportPdf } from '@/utils/pdfExport'

export default function AIReport() {
  const { state } = useNeuroCare()
  const t = useTranslation()
  const report = useMemo(() => computeBrainHealthReport(state), [state])
  const latestAssessment = useMemo(
    () =>
      [...state.assessments].sort((a, b) =>
        b.completedAt.localeCompare(a.completedAt)
      )[0],
    [state.assessments]
  )

  const localizeCondition = (condition: string): string => {
    for (const bundle of Object.values(TRANSLATIONS)) {
      const idx = bundle.onboarding.conditionOptions.indexOf(condition)
      if (idx !== -1 && t.onboarding.conditionOptions[idx]) {
        return t.onboarding.conditionOptions[idx]
      }
    }
    return condition
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan">
                <Sparkles className="h-3 w-3" />
                {t.domainBadges.simulatedAiDemo}
              </Badge>
              <Badge variant="outline">{t.domainBadges.nonDiagnostic}</Badge>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0F3D3E]">
              {t.reportPage.title}
            </h1>
            <p className="text-sm text-[#4A5D5E]">
              {t.reportPage.preparedFor} {state.user.fullName} · {t.reportPage.generatedAt}{' '}
              {report.generatedAt}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              {t.reportPage.printViewBtn}
            </Button>
            <Button
              variant="primary"
              onClick={() => generateBrainHealthReportPdf(state)}
            >
              <Download className="h-4 w-4" />
              {t.cta.downloadPdf}
            </Button>
          </div>
        </div>

        <MedicalDisclaimerBanner />

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#2E6F73]/25 bg-[#F7EFE3] px-4 py-3 text-xs">
          <span className="font-semibold text-[#0F3D3E]">
            {t.reportPage.legendTitle}
          </span>
          <StatusBadge status="Stable" />
          <StatusBadge status="Changed" />
          <StatusBadge status="Needs attention" />
          <StatusBadge status="Insufficient information" />
        </div>

        {/* 1. Assessment Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>{t.reportPage.sec1Title}</CardTitle>
              <CardDescription>
                {t.dashboard.datePrefix} {report.latestAssessmentDate} — {t.reportPage.sec1Sub}
              </CardDescription>
            </div>
            <StatusBadge status={report.taskStatus} />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-[#FBF6EE] border border-[#2E6F73]/20 p-3.5">
              <p className="text-[11px] font-medium text-[#4A5D5E]">
                {t.reportPage.objTaskAcc}
              </p>
              <p className="mt-1 text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {report.latestTaskPct !== null
                  ? `${report.latestTaskPct}%`
                  : t.statusLabels['Insufficient information']}
              </p>
            </div>
            <div className="rounded-xl bg-[#FBF6EE] border border-[#2E6F73]/20 p-3.5">
              <p className="text-[11px] font-medium text-[#4A5D5E]">
                {t.reportPage.funcQuest}
              </p>
              <p className="mt-1 text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {report.latestFunctionalPct !== null
                  ? `${report.latestFunctionalPct}%`
                  : t.statusLabels['Insufficient information']}
              </p>
            </div>
            <div className="rounded-xl bg-[#FBF6EE] border border-[#2E6F73]/20 p-3.5">
              <p className="text-[11px] font-medium text-[#4A5D5E]">
                {t.reportPage.gameRuns}
              </p>
              <p className="mt-1 text-2xl font-bold text-[#0F3D3E] tabular-nums">
                {state.gameResults.length} {t.units.sessions}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Cognitive Task Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>{t.reportPage.sec2Title}</CardTitle>
              <CardDescription>{t.reportPage.sec2Sub}</CardDescription>
            </div>
            <StatusBadge status={report.taskStatus} />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {latestAssessment ? (
              latestAssessment.categories.map((cat) => (
                <div
                  key={cat.categoryId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-bold text-[#0F3D3E]">
                      {t.categoryNames[cat.categoryId] ?? cat.label}
                    </p>
                    <p className="text-[11px] text-[#4A5D5E]">
                      {formatAssessmentCategorySummary(cat, state.user.preferredLanguage)}
                    </p>
                  </div>
                  <Badge variant={cat.domainType === 'task' ? 'primary' : 'warning'}>
                    {cat.accuracyPct}%
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#4A5D5E]">
                {t.reportPage.noSessionInfo}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 3 & 4. Lifestyle Overview + Sleep Overview */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>{t.reportPage.sec3Title}</CardTitle>
              <StatusBadge status={report.lifestyleStatus} />
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-[#263A3B]">
              <p>
                <strong className="text-[#0F3D3E]">{t.reportPage.avgSteps7d}:</strong>{' '}
                {report.avgSteps7d.toLocaleString()} {t.units.stepsPerDay}
              </p>
              <p>
                <strong className="text-[#0F3D3E]">{t.reportPage.avgExercise7d}:</strong> {report.avgExerciseMins7d}{' '}
                {t.units.minsPerDay}
              </p>
              <p>
                <strong className="text-[#0F3D3E]">{t.reportPage.avgStress7d}:</strong> {report.avgStress7d}/5
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>{t.reportPage.sec4Title}</CardTitle>
              <StatusBadge status={report.sleepStatus} />
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-[#263A3B]">
              <p>
                <strong className="text-[#0F3D3E]">{t.reportPage.avgSleep7d}:</strong> {report.avgSleepHours7d}{' '}
                {t.units.hrsPerNight} ({t.reportPage.targetShort}{' '}
                {state.user.sleepHabitTargetHours} {t.units.hrs})
              </p>
              <p>
                <strong className="text-[#0F3D3E]">{t.reportPage.sleepQualityLabel}:</strong>{' '}
                {report.avgSleepQuality7d}/5
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 5 & 6. Relevant Health Factors + Family History */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>{t.reportPage.sec5Title}</CardTitle>
              <StatusBadge status={report.functionalStatus} />
            </CardHeader>
            <CardContent className="text-xs text-[#263A3B] space-y-1.5">
              <p>
                <strong className="text-[#0F3D3E]">{t.reportPage.ageBracket}</strong> {state.user.ageRange}
              </p>
              <p>
                <strong className="text-[#0F3D3E]">{t.reportPage.docConditions}</strong>{' '}
                {state.user.medicalConditions.length
                  ? state.user.medicalConditions.map(localizeCondition).join(', ')
                  : t.reportPage.noneListed}
              </p>
              <p>
                <strong className="text-[#0F3D3E]">{t.reportPage.wearableSync}</strong>{' '}
                {state.user.wearableConnected && state.user.wearableProvider !== 'None'
                  ? state.user.wearableProvider
                  : t.reportPage.notConnected}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>{t.reportPage.sec6Title}</CardTitle>
              <StatusBadge status={report.familyContextStatus} />
            </CardHeader>
            <CardContent className="text-xs text-[#263A3B] space-y-1.5">
              {state.familyPrivacy.includeInClinicianReport &&
              state.familyHistory.length > 0 ? (
                state.familyHistory.map((f) => (
                  <p key={f.id}>
                    • <strong className="text-[#0F3D3E]">{t.familyConditionNames[f.condition] ?? f.condition}</strong> (
                    {t.familyRelativeCommon[f.relative] ?? f.relative}
                    {f.approximateAgeOfOnset
                      ? `, ${t.reportPage.onsetPrefix} ~${f.approximateAgeOfOnset}`
                      : ''}
                    )
                  </p>
                ))
              ) : (
                <p>{t.reportPage.noFamilyIncluded}</p>
              )}
              <p className="text-[11px] text-[#4A5D5E] pt-1">
                {t.reportPage.genomicDisabledNote}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 7 & 8. Changes Since Previous Assessment + Areas Requiring Attention */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>{t.reportPage.sec7Title}</CardTitle>
            <StatusBadge status={report.taskStatus} />
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-[#263A3B] leading-relaxed">
            {report.changeNarrative}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.reportPage.sec8Title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.areasRequiringAttention.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] px-4 py-2.5 text-xs text-[#0A0F14]"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 9 & 10. Personalized Recommendations + Clinical Follow-up Suggestions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.reportPage.sec9Title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {state.recommendations.slice(0, 4).map((r) => {
                const locRec = getLocalizedRec(r, t)
                return (
                  <div
                    key={r.id}
                    className="rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#0F3D3E]">{locRec.title}</span>
                      <Badge variant={r.completed ? 'success' : 'muted'}>
                        {r.completed ? t.completed : t.active}
                      </Badge>
                    </div>
                    <p className="text-[#4A5D5E] mt-1">{locRec.description}</p>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.reportPage.sec10Title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-[#263A3B] leading-relaxed">
              {report.clinicalFollowUpSuggestions.map((s) => (
                <div
                  key={s}
                  className="rounded-xl border border-[#2E6F73]/20 bg-[#FBF6EE] p-3"
                >
                  {s}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

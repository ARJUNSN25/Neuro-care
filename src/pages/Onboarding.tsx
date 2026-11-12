import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Moon,
  ShieldCheck,
  Users,
  Watch,
} from 'lucide-react'
import { NeuroCareLogo } from '@/components/common/NeuroCareLogo'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Progress } from '@/components/ui/Progress'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import type { FamilyCondition, UserProfile } from '@/types/neurocare'

export default function Onboarding() {
  const { state, completeOnboarding } = useNeuroCare()
  const t = useTranslation()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const totalSteps = 5

  const [city, setCity] = useState(state.user.city || 'Bengaluru')
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [sleepTarget, setSleepTarget] = useState(state.user.sleepHabitTargetHours || 7.5)
  const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(
    state.user.activityLevel || 'Moderate'
  )
  const [mentalBaseline, setMentalBaseline] = useState(
    state.user.mentalWellnessBaseline || ''
  )
  const [medicalConditions, setMedicalConditions] = useState<string[]>([])

  const [addFamilyNow, setAddFamilyNow] = useState(false)
  const [famCondition, setFamCondition] = useState<FamilyCondition>('Hypertension')
  const [famRelative, setFamRelative] = useState('')
  const [famAge, setFamAge] = useState('')

  const [wearableConnected, setWearableConnected] = useState(false)
  const [wearableProvider, setWearableProvider] =
    useState<UserProfile['wearableProvider']>('Google Fit')
  const [consents, setConsents] = useState(state.user.consents)

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    )
  }

  const toggleCondition = (cond: string) => {
    if (cond === t.onboarding.nonePreferNot) {
      setMedicalConditions([t.onboarding.nonePreferNot])
      return
    }
    setMedicalConditions((prev) => {
      const cleaned = prev.filter((c) => c !== t.onboarding.nonePreferNot)
      return cleaned.includes(cond)
        ? cleaned.filter((c) => c !== cond)
        : [...cleaned, cond]
    })
  }

  const handleFinish = () => {
    completeOnboarding({
      city,
      primaryGoals: selectedGoals.length
        ? selectedGoals
        : [t.onboarding.goalOptions[0]],
      sleepHabitTargetHours: sleepTarget,
      activityLevel,
      mentalWellnessBaseline:
        mentalBaseline.trim() || state.user.mentalWellnessBaseline,
      medicalConditions: medicalConditions.filter(
        (c) => c !== t.onboarding.nonePreferNot
      ),
      wearableConnected,
      wearableProvider: wearableConnected ? wearableProvider : 'None',
      consents: {
        ...consents,
        wearableSyncConsent: wearableConnected,
      },
      optionalFamilyEntry: addFamilyNow
        ? {
            condition: famCondition,
            relative: famRelative.trim() || t.familyConditionNames[famCondition],
            approximateAgeOfOnset: famAge || undefined,
          }
        : undefined,
    })
    navigate('/dashboard')
  }

  const allConditionOptions = [
    ...t.onboarding.conditionOptions,
    t.onboarding.nonePreferNot,
  ]

  return (
    <div dir={t.dir} className="min-h-screen bg-[#0A0F14] bg-obsidian-grid text-[#EADCC8] py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <NeuroCareLogo dark />
          <Badge variant="cyan" className="bg-[#0F3D3E] text-[#EADCC8] border-[#7FB388]/45">
            {t.onboarding.stepBadge
              .replace('{step}', String(step))
              .replace('{total}', String(totalSteps))}
          </Badge>
        </div>

        <Progress value={(step / totalSteps) * 100} />

        <Card>
          <CardContent className="pt-6 space-y-6 text-[#0A0F14]">
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E6F73]/15 text-[#0F3D3E] border border-[#2E6F73]/25">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#0F3D3E]">
                      {t.onboarding.step1Title}
                    </h2>
                    <p className="text-xs text-[#4A5D5E]">
                      {t.onboarding.step1Sub}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.onboarding.cityLabel}
                  </label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t.onboarding.cityPlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.onboarding.goalsQuestion}
                  </label>
                  <div className="grid gap-2">
                    {t.onboarding.goalOptions.map((goal) => {
                      const active = selectedGoals.includes(goal)
                      return (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => toggleGoal(goal)}
                          className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-start text-xs sm:text-sm transition-colors ${
                            active
                              ? 'border-[#2E6F73] bg-[#EADCC8]/75 text-[#0F3D3E] font-semibold'
                              : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]/50'
                          }`}
                        >
                          <span>{goal}</span>
                          {active && <CheckCircle2 className="h-4 w-4 text-[#2E6F73] shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7FB388]/25 text-[#0F3D3E] border border-[#7FB388]/40">
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#0F3D3E]">
                      {t.onboarding.step2Title}
                    </h2>
                    <p className="text-xs text-[#4A5D5E]">
                      {t.onboarding.step2Sub}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.onboarding.sleepTargetLabel}: {sleepTarget} {t.units.hrs}
                  </label>
                  <input
                    type="range"
                    min={5.5}
                    max={9.5}
                    step={0.5}
                    value={sleepTarget}
                    onChange={(e) => setSleepTarget(Number(e.target.value))}
                    className="w-full accent-[#2E6F73]"
                  />
                  <div className="flex justify-between text-[11px] text-[#4A5D5E]">
                    <span>5.5 {t.units.hrs}</span>
                    <span>
                      7.5 {t.units.hrs} ({t.onboarding.recommendedTag})
                    </span>
                    <span>9.5 {t.units.hrs}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.onboarding.activityBaselineLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['Sedentary', 'Light', 'Moderate', 'Active'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setActivityLevel(lvl)}
                        className={`rounded-xl border p-3 text-start transition-all ${
                          activityLevel === lvl
                            ? 'border-[#2E6F73] bg-[#EADCC8]/75 text-[#0F3D3E]'
                            : 'border-[#2E6F73]/25 bg-[#FBF6EE] hover:bg-[#EADCC8]/50'
                        }`}
                      >
                        <div className="text-sm font-semibold text-[#0F3D3E]">
                          {t.activityLevels[lvl].label}
                        </div>
                        <div className="text-[11px] text-[#4A5D5E] mt-0.5">
                          {t.activityLevels[lvl].desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7FB388]/25 text-[#0F3D3E] border border-[#7FB388]/40">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#0F3D3E]">
                      {t.onboarding.step3Title}
                    </h2>
                    <p className="text-xs text-[#4A5D5E]">
                      {t.onboarding.step3Sub}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.onboarding.mentalNoteLabel}
                  </label>
                  <Textarea
                    value={mentalBaseline}
                    onChange={(e) => setMentalBaseline(e.target.value)}
                    placeholder={t.onboarding.mentalNotePlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.onboarding.healthContextLabel}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allConditionOptions.map((cond) => {
                      const active = medicalConditions.includes(cond)
                      return (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => toggleCondition(cond)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            active
                              ? 'border-[#0F3D3E] bg-[#2E6F73] text-[#FAF4EA]'
                              : 'border-[#2E6F73]/30 bg-[#FBF6EE] text-[#263A3B] hover:bg-[#EADCC8]'
                          }`}
                        >
                          {cond}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E6F73]/15 text-[#0F3D3E] border border-[#2E6F73]/25">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#0F3D3E]">
                      {t.onboarding.step4Title}
                    </h2>
                    <p className="text-xs text-[#4A5D5E]">
                      {t.onboarding.step4Sub}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#0F3D3E]">
                        {t.onboarding.addFamilyToggleTitle}
                      </p>
                      <p className="text-xs text-[#4A5D5E]">
                        {t.onboarding.addFamilyToggleSub}
                      </p>
                    </div>
                    <Switch
                      checked={addFamilyNow}
                      onCheckedChange={setAddFamilyNow}
                      aria-label={t.onboarding.addFamilyToggleTitle}
                    />
                  </div>

                  {addFamilyNow && (
                    <div className="grid gap-3 pt-2 border-t border-[#CBB9A1] sm:grid-cols-3">
                      <div>
                        <label className="text-[11px] font-semibold text-[#0F3D3E]">
                          {t.onboarding.conditionLabel}
                        </label>
                        <Select
                          value={famCondition}
                          onChange={(e) => setFamCondition(e.target.value as FamilyCondition)}
                          className="mt-1"
                        >
                          {(
                            [
                              'Hypertension',
                              'Diabetes',
                              'Stroke',
                              'Dementia',
                              "Alzheimer's Disease",
                              'Other Neurological Condition',
                            ] as FamilyCondition[]
                          ).map((cond) => (
                            <option key={cond} value={cond}>
                              {t.familyConditionNames[cond]}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#0F3D3E]">
                          {t.onboarding.relativeLabel}
                        </label>
                        <Input
                          value={famRelative}
                          onChange={(e) => setFamRelative(e.target.value)}
                          placeholder={t.onboarding.relativePlaceholder}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#0F3D3E]">
                          {t.onboarding.approxAgeLabel}
                        </label>
                        <Input
                          value={famAge}
                          onChange={(e) => setFamAge(e.target.value)}
                          placeholder={t.onboarding.approxAgePlaceholder}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-[#7FB388]/45 bg-[#7FB388]/18 p-3.5 text-xs text-[#0A0F14]">
                  <strong>{t.onboarding.genomicSafeguardTitle}:</strong>{' '}
                  {t.onboarding.genomicSafeguardDesc}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A0F14] text-[#7FB388] border border-[#2E6F73]/50">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#0F3D3E]">
                      {t.onboarding.step5Title}
                    </h2>
                    <p className="text-xs text-[#4A5D5E]">
                      {t.onboarding.step5Sub}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-2.5">
                      <Watch className="h-4 w-4 text-[#2E6F73] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-[#0F3D3E]">
                          {t.onboarding.wearableToggleTitle}
                        </p>
                        <p className="text-xs text-[#4A5D5E]">
                          {t.onboarding.wearableToggleSub}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={wearableConnected}
                      onCheckedChange={setWearableConnected}
                      aria-label={t.onboarding.wearableToggleTitle}
                    />
                  </div>

                  {wearableConnected && (
                    <div className="pt-2">
                      <Select
                        value={wearableProvider}
                        onChange={(e) =>
                          setWearableProvider(e.target.value as UserProfile['wearableProvider'])
                        }
                      >
                        <option value="Google Fit">
                          Google Fit {t.onboarding.demoSyncSuffix}
                        </option>
                        <option value="Apple Health">
                          Apple Health {t.onboarding.demoSyncSuffix}
                        </option>
                        <option value="Fitbit">
                          Fitbit {t.onboarding.demoSyncSuffix}
                        </option>
                        <option value="Oura Ring">
                          Oura Ring {t.onboarding.demoSyncSuffix}
                        </option>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      key: 'healthProfileConsent' as const,
                      title: t.onboarding.consentItems.healthTitle,
                      desc: t.onboarding.consentItems.healthDesc,
                    },
                    {
                      key: 'familyHistoryConsent' as const,
                      title: t.onboarding.consentItems.familyTitle,
                      desc: t.onboarding.consentItems.familyDesc,
                    },
                    {
                      key: 'clinicianReportShareConsent' as const,
                      title: t.onboarding.consentItems.reportTitle,
                      desc: t.onboarding.consentItems.reportDesc,
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] px-4 py-3"
                    >
                      <div>
                        <p className="text-xs font-semibold text-[#0F3D3E]">{item.title}</p>
                        <p className="text-[11px] text-[#4A5D5E]">{item.desc}</p>
                      </div>
                      <Switch
                        checked={consents[item.key]}
                        onCheckedChange={(val) =>
                          setConsents((prev) => ({ ...prev, [item.key]: val }))
                        }
                        aria-label={item.title}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#CBB9A1]">
              <Button
                variant="outline"
                onClick={() => (step > 1 ? setStep(step - 1) : navigate('/register'))}
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {t.back}
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                {step < totalSteps ? (
                  <>
                    <Button variant="ghost" onClick={handleFinish}>
                      {t.onboarding.skipToDashBtn}
                    </Button>
                    <Button variant="primary" onClick={() => setStep(step + 1)}>
                      {t.onboarding.nextStepBtn}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                  </>
                ) : (
                  <Button variant="success" onClick={handleFinish}>
                    {t.onboarding.completeSetupBtn}
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

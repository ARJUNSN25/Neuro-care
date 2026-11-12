import React, { useState } from 'react'
import { Lock, Plus, ShieldCheck, Trash2, Users } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import type { FamilyCondition, LanguageCode } from '@/types/neurocare'

const CONDITIONS: FamilyCondition[] = [
  'Dementia',
  "Alzheimer's Disease",
  'Stroke',
  'Diabetes',
  'Hypertension',
  'Other Neurological Condition',
]

const SAMPLE_FAMILY_NOTES: Record<string, Record<LanguageCode, string>> = {
  'fh-1': {
    en: 'Well-managed with medication and regular walking.',
    kn: 'ಔಷಧಿ ಮತ್ತು ನಿಯಮಿತ ನಡಿಗೆಯಿಂದ ಚೆನ್ನಾಗಿ ನಿಯಂತ್ರಿಸಲಾಗಿದೆ.',
    hi: 'दवा और नियमित सैर से अच्छी तरह नियंत्रित।',
    ar: 'تتم إدارته جيداً بالأدوية والمشي المنتظم.',
    ta: 'மருந்து மற்றும் வழக்கமான நடைப்பயிற்சியால் நன்கு கட்டுப்படுத்தப்பட்டது.',
  },
  'fh-2': {
    en: 'Type 2 diabetes history; informs preventive vascular care.',
    kn: 'ಟೈಪ್ 2 ಮಧುಮೇಹ ಇತಿಹಾಸ; ತಡೆಗಟ್ಟುವ ರಕ್ತನಾಳಗಳ ಆರೈಕೆಗೆ ಮಾಹಿತಿ ನೀಡುತ್ತದೆ.',
    hi: 'टाइप 2 मधुमेह इतिहास; निवारक संवहनी देखभाल में सहायक।',
    ar: 'تاريخ سكري النوع الثاني؛ يفيد في الرعاية الوقائية للأوعية.',
    ta: 'வகை 2 நீரிழிவு வரலாறு; தடுப்பு இரத்த நாளப் பராமரிப்பிற்கு உதவுகிறது.',
  },
}

export default function FamilyHistory() {
  const { state, addFamilyEntry, removeFamilyEntry, updateFamilyPrivacy } =
    useNeuroCare()
  const t = useTranslation()
  const lang = state.user.preferredLanguage

  const [condition, setCondition] = useState<FamilyCondition>('Hypertension')
  const [relative, setRelative] = useState(t.familyRelativeCommon.Mother ?? 'Mother')
  const [ageOfOnset, setAgeOfOnset] = useState('')
  const [notes, setNotes] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!relative.trim()) return
    addFamilyEntry({
      condition,
      relative: relative.trim(),
      approximateAgeOfOnset: ageOfOnset.trim() || undefined,
      notes: notes.trim() || undefined,
    })
    setAgeOfOnset('')
    setNotes('')
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Badge variant="primary">{t.familyPage.badge}</Badge>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0F3D3E]">
            {t.familyPage.title}
          </h1>
          <p className="text-sm text-[#4A5D5E]">
            {t.familyPage.subtitle}
          </p>
        </div>

        {/* Privacy & Genomic Safeguard Banner */}
        <div className="rounded-2xl border border-[#2E6F73]/30 bg-[#F7EFE3] p-4 flex items-start gap-3 shadow-xs">
          <Lock className="h-5 w-5 text-[#0F3D3E] shrink-0 mt-0.5" />
          <div className="text-xs text-[#263A3B] leading-relaxed space-y-1">
            <p className="font-semibold text-[#0F3D3E]">
              {t.familyPage.safeguardTitle}
            </p>
            <p>
              {t.familyPage.safeguardBody1}
              <strong>{t.familyPage.safeguardBold}</strong>
              {t.familyPage.safeguardBody2}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Add Form */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>{t.familyPage.formTitle}</CardTitle>
              <CardDescription>
                {t.familyPage.formDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.familyPage.conditionLabel}
                  </label>
                  <Select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as FamilyCondition)}
                    className="mt-1"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {t.familyConditionNames[c]}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#0F3D3E]">
                      {t.familyPage.relationshipLabel}
                    </label>
                    <Input
                      value={relative}
                      onChange={(e) => setRelative(e.target.value)}
                      placeholder={t.familyPage.relationshipPlaceholder}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#0F3D3E]">
                      {t.familyPage.onsetAgeLabel}
                    </label>
                    <Input
                      value={ageOfOnset}
                      onChange={(e) => setAgeOfOnset(e.target.value)}
                      placeholder={t.familyPage.onsetAgePlaceholder}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0F3D3E]">
                    {t.familyPage.notesLabel}
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t.familyPage.notesPlaceholder}
                    className="mt-1"
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full">
                  <Plus className="h-4 w-4" />
                  {t.familyPage.saveBtn}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Saved Entries + Privacy Controls */}
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>{t.familyPage.recordsTitle}</CardTitle>
                    <CardDescription>
                      {state.familyHistory.length} {t.familyPage.recordsDesc}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    <Users className="h-3 w-3" />
                    {state.familyHistory.length} {t.units.entries}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {state.familyHistory.length === 0 ? (
                  <p className="text-xs text-[#4A5D5E] py-6 text-center">
                    {t.familyPage.emptyText}
                  </p>
                ) : (
                  state.familyHistory.map((entry) => {
                    const locCondition =
                      t.familyConditionNames[entry.condition] ?? entry.condition
                    const locRelative =
                      t.familyRelativeCommon[entry.relative] ?? entry.relative
                    const locNote =
                      SAMPLE_FAMILY_NOTES[entry.id]?.[lang] ?? entry.notes
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start justify-between gap-4 rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-4"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-[#0F3D3E]">
                              {locCondition}
                            </span>
                            <Badge variant="primary">{locRelative}</Badge>
                            {entry.approximateAgeOfOnset && (
                              <Badge variant="muted">
                                {t.familyPage.onsetPrefix}{' '}
                                {entry.approximateAgeOfOnset} {t.units.yrs}
                              </Badge>
                            )}
                            {entry.isSample && (
                              <Badge variant="outline">{t.sampleLabel}</Badge>
                            )}
                          </div>
                          {locNote && (
                            <p className="mt-1.5 text-xs text-[#263A3B]">
                              {locNote}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFamilyEntry(entry.id)}
                          aria-label={`${t.familyPage.removeAria}: ${locCondition}`}
                          className="rounded-lg p-1.5 text-[#4A5D5E] hover:bg-[#C6601F]/12 hover:text-[#C6601F]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* Granular Privacy & Genomic Consent */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#0F3D3E]" />
                  <CardTitle>{t.familyPage.consentCardTitle}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-3.5">
                  <div>
                    <p className="text-xs font-semibold text-[#0F3D3E]">
                      {t.familyPage.includePdfTitle}
                    </p>
                    <p className="text-[11px] text-[#4A5D5E]">
                      {t.familyPage.includePdfDesc}
                    </p>
                  </div>
                  <Switch
                    checked={state.familyPrivacy.includeInClinicianReport}
                    onCheckedChange={(val) =>
                      updateFamilyPrivacy({ includeInClinicianReport: val })
                    }
                    aria-label={t.familyPage.includePdfTitle}
                  />
                </div>

                <div className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[#0F3D3E]">
                        {t.familyPage.genomicTitle}
                      </p>
                      <p className="text-[11px] text-[#4A5D5E]">
                        {t.familyPage.genomicDesc}
                      </p>
                    </div>
                    <Switch
                      checked={state.familyPrivacy.genomicConsentAccepted}
                      onCheckedChange={(val) =>
                        updateFamilyPrivacy({
                          genomicConsentAccepted: val,
                          genomicInfoProvided: val
                            ? state.familyPrivacy.genomicInfoProvided
                            : false,
                        })
                      }
                      aria-label={t.familyPage.genomicTitle}
                    />
                  </div>

                  {state.familyPrivacy.genomicConsentAccepted ? (
                    <div className="pt-2 border-t border-[#CBB9A1] space-y-2">
                      <Textarea
                        value={state.familyPrivacy.genomicNotes ?? ''}
                        onChange={(e) =>
                          updateFamilyPrivacy({
                            genomicNotes: e.target.value,
                            genomicInfoProvided: e.target.value.trim().length > 0,
                          })
                        }
                        placeholder={t.familyPage.genomicPlaceholder}
                      />
                      <p className="text-[11px] text-[#4A5D5E]">
                        {t.familyPage.genomicProtectedNote}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#4A5D5E]">
                      {t.familyPage.genomicProtectedNote}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

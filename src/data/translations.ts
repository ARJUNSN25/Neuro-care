import { ASSISTANT_CLINICAL_ADMIN_PROFILE_TRANSLATIONS } from '@/data/locales/assistantClinicalAdminProfile'
import { COMMON_TRANSLATIONS, LANGUAGE_OPTIONS } from '@/data/locales/commonAndNav'
import { DASHBOARD_ASSESSMENT_GAMES_TRANSLATIONS } from '@/data/locales/dashboardAssessmentGames'
import { HEALTH_ANALYTICS_REPORTS_TRANSLATIONS } from '@/data/locales/healthAnalyticsReports'
import { MARKETING_AUTH_TRANSLATIONS } from '@/data/locales/marketingAuth'
import type { FullTranslationBundle, LanguageOption } from '@/data/locales/types'
import type {
  AdminPatientRecord,
  AppNotification,
  CoordinatorNote,
  DailyGoalItem,
  DoctorProfile,
  LanguageCode,
  RecommendationItem,
} from '@/types/neurocare'

export { LANGUAGE_OPTIONS }
export type { FullTranslationBundle, LanguageOption }

export const TRANSLATIONS: Record<LanguageCode, FullTranslationBundle> = {
  en: {
    ...COMMON_TRANSLATIONS.en,
    ...MARKETING_AUTH_TRANSLATIONS.en,
    ...DASHBOARD_ASSESSMENT_GAMES_TRANSLATIONS.en,
    ...HEALTH_ANALYTICS_REPORTS_TRANSLATIONS.en,
    ...ASSISTANT_CLINICAL_ADMIN_PROFILE_TRANSLATIONS.en,
  },
  kn: {
    ...COMMON_TRANSLATIONS.kn,
    ...MARKETING_AUTH_TRANSLATIONS.kn,
    ...DASHBOARD_ASSESSMENT_GAMES_TRANSLATIONS.kn,
    ...HEALTH_ANALYTICS_REPORTS_TRANSLATIONS.kn,
    ...ASSISTANT_CLINICAL_ADMIN_PROFILE_TRANSLATIONS.kn,
  },
  hi: {
    ...COMMON_TRANSLATIONS.hi,
    ...MARKETING_AUTH_TRANSLATIONS.hi,
    ...DASHBOARD_ASSESSMENT_GAMES_TRANSLATIONS.hi,
    ...HEALTH_ANALYTICS_REPORTS_TRANSLATIONS.hi,
    ...ASSISTANT_CLINICAL_ADMIN_PROFILE_TRANSLATIONS.hi,
  },
  ar: {
    ...COMMON_TRANSLATIONS.ar,
    ...MARKETING_AUTH_TRANSLATIONS.ar,
    ...DASHBOARD_ASSESSMENT_GAMES_TRANSLATIONS.ar,
    ...HEALTH_ANALYTICS_REPORTS_TRANSLATIONS.ar,
    ...ASSISTANT_CLINICAL_ADMIN_PROFILE_TRANSLATIONS.ar,
  },
  ta: {
    ...COMMON_TRANSLATIONS.ta,
    ...MARKETING_AUTH_TRANSLATIONS.ta,
    ...DASHBOARD_ASSESSMENT_GAMES_TRANSLATIONS.ta,
    ...HEALTH_ANALYTICS_REPORTS_TRANSLATIONS.ta,
    ...ASSISTANT_CLINICAL_ADMIN_PROFILE_TRANSLATIONS.ta,
  },
}

export function getLocalizedGoal(goal: DailyGoalItem, t: FullTranslationBundle) {
  return t.goalLookup[goal.id] ?? { label: goal.label, domain: goal.domain }
}

export function getLocalizedRec(rec: RecommendationItem, t: FullTranslationBundle) {
  const hit = t.recLookup[rec.id]
  return {
    title: hit?.title ?? rec.title,
    description: hit?.description ?? rec.description,
    culturalTag: hit?.culturalTag ?? rec.culturalTag,
    frequency: hit?.frequency ?? rec.frequency,
    durationLabel: hit?.durationLabel ?? rec.durationLabel,
    rationale: hit?.rationale ?? rec.rationale,
  }
}

export function getLocalizedNotif(notif: AppNotification, t: FullTranslationBundle) {
  return (
    t.notifLookup[notif.id] ?? {
      title: notif.title,
      message: notif.message,
      timeLabel: notif.timeLabel,
    }
  )
}

export function getLocalizedDoctor(doc: DoctorProfile, t: FullTranslationBundle) {
  const hit = t.doctorDetails[doc.id]
  return {
    name: hit?.name ?? doc.name,
    specialty: t.specialistCategories[doc.specialty] ?? doc.specialty,
    credentials: hit?.credentials ?? doc.credentials,
    clinic: hit?.clinic ?? doc.hospitalOrClinic,
    city: hit?.city ?? doc.city,
    locality: doc.locality ?? '',
    nextSlot: hit?.nextSlot ?? doc.nextAvailableSlot,
    bio: hit?.bio ?? doc.bio,
    languages: hit?.languages ?? doc.languages.join(', '),
  }
}

export function getLocalizedCityLabel(
  rawCity: string,
  doctors: DoctorProfile[],
  t: FullTranslationBundle
): string {
  const normalized = rawCity.trim().toLowerCase()
  const match = doctors.find((d) => d.city.trim().toLowerCase() === normalized)
  if (match && t.doctorDetails[match.id]?.city) {
    return t.doctorDetails[match.id].city
  }
  return rawCity
}

export function getLocalizedCohortPatient(
  patient: AdminPatientRecord,
  t: FullTranslationBundle
) {
  const hit = t.cohortPatientNotes[patient.id]
  const langCode = (t.speechLocale?.slice(0, 2) || 'en') as LanguageCode
  const nudgeJustNowMap: Record<LanguageCode, string> = {
    en: 'Nudge sent just now',
    kn: 'ಈಗಷ್ಟೇ ಜ್ಞಾಪನೆ ಕಳುಹಿಸಲಾಗಿದೆ',
    hi: 'अभी रिमाइंडर भेजा गया',
    ar: 'تم إرسال التذكير للتو',
    ta: 'இப்போது நினைவூட்டல் அனுப்பப்பட்டது',
  }

  return {
    city: hit?.city ?? patient.city,
    lastActive:
      patient.id === 'active-user'
        ? t.adminPage.liveSessionNow
        : patient.lastActiveLabel === 'Enrolled just now'
          ? t.adminPage.enrolledJustNow
          : patient.lastActiveLabel === 'Nudge sent just now'
            ? (nudgeJustNowMap[langCode] ?? nudgeJustNowMap.en)
            : (hit?.lastActive ?? patient.lastActiveLabel),
    physicalSuggestion: hit?.physicalSuggestion ?? patient.physicalFocusSuggestion,
    cognitiveSuggestion: hit?.cognitiveSuggestion ?? patient.cognitiveFocusSuggestion,
  }
}

export function getLocalizedCoordinatorNote(
  note: CoordinatorNote,
  t: FullTranslationBundle
) {
  const hit = t.coordinatorNoteLookup[note.id]
  return {
    author: hit?.author ?? note.author,
    text: hit?.text ?? note.text,
  }
}

export function localizeGameMetric(metricValue: string, t: FullTranslationBundle): string {
  return metricValue
    .replace(/\bdigits\b/i, t.units.digits)
    .replace(/\bitems\b/i, t.units.items)
    .replace(/\bwords\b/i, t.units.words)
    .replace(/\bmoves\b/i, t.units.moves)
    .replace(/\bms\b/i, t.units.ms)
    .replace(/\bLevel\b/i, t.gamesPage.catalog['pattern-recognition'].metricLabel)
}

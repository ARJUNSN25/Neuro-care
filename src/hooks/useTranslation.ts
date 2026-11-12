import { useNeuroCare } from '@/context/NeuroCareContext'
import { TRANSLATIONS } from '@/data/translations'

export function useTranslation() {
  const { state } = useNeuroCare()
  const lang = state.user.preferredLanguage
  return TRANSLATIONS[lang] ?? TRANSLATIONS.en
}

export function getTimeGreeting(bundle: ReturnType<typeof useTranslation>) {
  const hour = new Date().getHours()
  if (hour < 12) return bundle.greetingPrefix.morning
  if (hour < 17) return bundle.greetingPrefix.afternoon
  return bundle.greetingPrefix.evening
}


export type EmergencyHelplineId =
  | 'emergency-112'
  | 'ambulance-108'
  | 'elderline-14567'
  | 'telemanas-14416'
  | 'website-desk'

export interface EmergencyHelplineItem {
  id: EmergencyHelplineId
  number: string
  telHref: string
  category: 'critical' | 'national-support' | 'website-desk'
}

export const WEBSITE_EMERGENCY_NUMBER = '+91 1800-599-0112'
export const WEBSITE_EMERGENCY_TEL = 'tel:+9118005990112'

export const EMERGENCY_HELPLINES: EmergencyHelplineItem[] = [
  {
    id: 'emergency-112',
    number: '112',
    telHref: 'tel:112',
    category: 'critical',
  },
  {
    id: 'ambulance-108',
    number: '108',
    telHref: 'tel:108',
    category: 'critical',
  },
  {
    id: 'elderline-14567',
    number: '14567',
    telHref: 'tel:14567',
    category: 'national-support',
  },
  {
    id: 'telemanas-14416',
    number: '14416',
    telHref: 'tel:14416',
    category: 'national-support',
  },
  {
    id: 'website-desk',
    number: WEBSITE_EMERGENCY_NUMBER,
    telHref: WEBSITE_EMERGENCY_TEL,
    category: 'website-desk',
  },
]

export function toTelHref(rawPhone: string): string {
  const sanitized = rawPhone.replace(/[^+\d]/g, '')
  return sanitized ? `tel:${sanitized}` : 'tel:112'
}


import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  Check,
  Copy,
  HeartPulse,
  PhoneCall,
  ShieldAlert,
  Siren,
  Stethoscope,
  UserCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  EMERGENCY_HELPLINES,
  toTelHref,
  type EmergencyHelplineId,
} from '@/data/emergencyHelplines'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/utils/cn'

export function EmergencyHelpModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { state } = useNeuroCare()
  const t = useTranslation()
  const navigate = useNavigate()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (id: string, value: string) => {
    setCopiedId(id)
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev))
    }, 2000)
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(value).catch(() => undefined)
      }
    } catch {
      // Ignore clipboard permission denials in restricted browser contexts.
    }
  }

  const trustedName = (state.user.emergencyContactName || '').trim()
  const trustedPhone = (state.user.emergencyContactPhone || '').trim()
  const hasTrustedContact = Boolean(trustedName || trustedPhone)

  const getIconForHelpline = (id: EmergencyHelplineId) => {
    if (id === 'emergency-112') return Siren
    if (id === 'ambulance-108') return HeartPulse
    if (id === 'website-desk') return Building2
    return PhoneCall
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.emergencyHelp.modalTitle}
      subtitle={t.emergencyHelp.modalSub}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-5" dir={t.dir}>
        {/* Top Critical Action Banner */}
        <div className="rounded-2xl border-2 border-[#C6601F]/45 bg-[#0A0F14] p-4 space-y-3 text-[#EADCC8]">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C6601F] text-[#FAF4EA] shadow-xs">
              <Siren className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h4 className="font-vintage-serif text-sm sm:text-base font-bold text-[#EADCC8]">
                {t.emergencyHelp.criticalBannerTitle}
              </h4>
              <p className="mt-1 text-xs sm:text-sm text-[#EADCC8]/85 leading-relaxed">
                {t.emergencyHelp.criticalBannerDesc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href="tel:112"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#C6601F] px-4 py-2.5 text-sm font-bold text-[#FAF4EA] shadow-sm hover:bg-[#A84E16] transition-colors"
            >
              <PhoneCall className="h-4 w-4 shrink-0" />
              <span>{t.emergencyHelp.quickCall112}</span>
              <span dir="ltr" className="tabular-nums font-extrabold">
                (112)
              </span>
            </a>
            <a
              href="tel:108"
              className="flex items-center justify-center gap-2 rounded-xl border border-[#7FB388]/45 bg-[#0F3D3E] px-4 py-2.5 text-sm font-bold text-[#EADCC8] hover:bg-[#2E6F73] transition-colors"
            >
              <HeartPulse className="h-4 w-4 shrink-0 text-[#7FB388]" />
              <span>{t.emergencyHelp.quickCall108}</span>
              <span dir="ltr" className="tabular-nums font-extrabold">
                (108)
              </span>
            </a>
          </div>
        </div>

        {/* Critical Warning Signs Checklist */}
        <div className="rounded-2xl border border-[#C6601F]/35 bg-[#C6601F]/10 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0F3D3E]">
            <AlertTriangle className="h-4 w-4 text-[#C6601F] shrink-0" />
            <span>{t.emergencyHelp.fastSignsTitle}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {t.emergencyHelp.fastSigns.map((sign) => (
              <div
                key={sign}
                className="flex items-start gap-2 rounded-xl bg-[#FBF6EE] border border-[#C6601F]/25 px-3 py-2 text-xs text-[#0A0F14] leading-snug"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-[#C6601F] shrink-0 mt-0.5" />
                <span>{sign}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Family / Trusted Emergency Contact */}
        <div className="rounded-2xl border border-[#2E6F73]/30 bg-[#EADCC8] p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F3D3E]">
                <UserCheck className="h-4 w-4 text-[#2E6F73] shrink-0" />
                <span>{t.emergencyHelp.trustedContactTitle}</span>
              </div>
              {hasTrustedContact ? (
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-[#0A0F14]">
                    {trustedName || t.emergencyHelp.trustedContactTitle}
                  </p>
                  {trustedPhone && (
                    <p
                      dir="ltr"
                      className="text-base font-extrabold text-[#0F3D3E] tabular-nums"
                    >
                      {trustedPhone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#263A3B] leading-relaxed">
                  {t.emergencyHelp.trustedContactMissing}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {trustedPhone ? (
                <>
                  <a
                    href={toTelHref(trustedPhone)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#2E6F73] px-3.5 text-xs font-bold text-[#FAF4EA] shadow-xs hover:bg-[#0F3D3E] transition-colors"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>{t.emergencyHelp.trustedContactCallBtn}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy('trusted-contact', trustedPhone)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#2E6F73]/35 bg-[#FBF6EE] px-3 text-xs font-semibold text-[#0A0F14] hover:bg-[#EADCC8]"
                  >
                    {copiedId === 'trusted-contact' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#0F3D3E]" />
                        <span className="text-[#0F3D3E]">{t.emergencyHelp.copiedBtn}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#4A5D5E]" />
                        <span>{t.emergencyHelp.copyBtn}</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose()
                    navigate(state.isAuthenticated ? '/profile' : '/register')
                  }}
                >
                  {t.emergencyHelp.editTrustedBtn}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Public National Emergency & Website Helplines */}
        <div className="space-y-3">
          <h4 className="font-vintage-serif text-sm font-bold text-[#0F3D3E]">
            {t.emergencyHelp.helplinesHeading}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EMERGENCY_HELPLINES.map((item) => {
              const info = t.emergencyHelp.helplineDetails[item.id]
              const Icon = getIconForHelpline(item.id)
              const isCritical = item.category === 'critical'
              const isWebsite = item.category === 'website-desk'

              return (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-2xl border p-4 flex flex-col justify-between gap-3',
                    isWebsite && 'sm:col-span-2 border-[#2E6F73]/40 bg-[#EADCC8]/70',
                    isCritical && 'border-[#C6601F]/40 bg-[#FBF6EE]',
                    !isCritical && !isWebsite && 'border-[#2E6F73]/25 bg-[#FBF6EE]'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span
                        className={cn(
                          'inline-flex h-7 w-7 items-center justify-center rounded-lg shrink-0',
                          isCritical
                            ? 'bg-[#C6601F]/15 text-[#C6601F]'
                            : isWebsite
                              ? 'bg-[#2E6F73]/18 text-[#0F3D3E]'
                              : 'bg-[#7FB388]/28 text-[#0F3D3E]'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <Badge
                        variant={
                          isCritical ? 'danger' : isWebsite ? 'primary' : 'success'
                        }
                        className="max-w-full whitespace-normal text-start leading-tight"
                      >
                        {isWebsite
                          ? t.emergencyHelp.websiteDemoTag
                          : t.emergencyHelp.nationalTag}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-[#0A0F14]">{info.title}</p>
                      <p
                        dir="ltr"
                        className={cn(
                          'mt-1 text-xl font-extrabold tracking-tight tabular-nums',
                          isCritical
                            ? 'text-[#C6601F]'
                            : isWebsite
                              ? 'text-[#0F3D3E]'
                              : 'text-[#2E6F73]'
                        )}
                      >
                        {item.number}
                      </p>
                      <p className="text-[11px] font-semibold text-[#4A5D5E]">
                        {info.availability}
                      </p>
                    </div>

                    <p className="text-xs text-[#263A3B] leading-relaxed">{info.desc}</p>
                    {isWebsite && (
                      <p className="text-[11px] text-[#4A5D5E] leading-snug">
                        {t.emergencyHelp.websiteDeskNote}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={item.telHref}
                      className={cn(
                        'inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors',
                        isCritical
                          ? 'bg-[#C6601F] text-[#FAF4EA] hover:bg-[#A84E16]'
                          : isWebsite
                            ? 'bg-[#2E6F73] text-[#FAF4EA] hover:bg-[#0F3D3E]'
                            : 'bg-[#0A0F14] text-[#EADCC8] hover:bg-[#0F3D3E]'
                      )}
                    >
                      <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                      <span>{t.emergencyHelp.callNowBtn}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.number)}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#2E6F73]/30 bg-[#FAF4EA] px-3 text-xs font-semibold text-[#0A0F14] hover:bg-[#EADCC8]"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#0F3D3E]" />
                          <span className="text-[#0F3D3E]">{t.emergencyHelp.copiedBtn}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#4A5D5E]" />
                          <span>{t.emergencyHelp.copyBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer Routine Follow-up Link */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2E6F73]/25 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose()
              navigate('/clinical-support')
            }}
          >
            <Stethoscope className="h-3.5 w-3.5 text-[#2E6F73]" />
            <span>{t.emergencyHelp.clinicalSupportBtn}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t.closeModal}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

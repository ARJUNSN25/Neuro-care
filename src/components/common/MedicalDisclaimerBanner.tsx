import { ShieldAlert } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/utils/cn'

export function MedicalDisclaimerBanner({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  const t = useTranslation()

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-[#C6601F]/35 bg-[#C6601F]/10 px-4 py-3 text-xs text-[#0A0F14]',
        className
      )}
      role="note"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#C6601F]" />
      <div className="leading-relaxed">
        <span className="font-bold text-[#0F3D3E]">
          {t.disclaimer.title}
        </span>{' '}
        {compact ? t.disclaimer.compactText : t.disclaimer.fullText}
      </div>
    </div>
  )
}

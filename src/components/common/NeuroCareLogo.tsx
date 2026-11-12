import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/utils/cn'

export function NeuroCareLogo({
  dark = false,
  compact = false,
  className,
}: {
  dark?: boolean
  compact?: boolean
  className?: string
}) {
  const t = useTranslation()

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#7FB388]/45 bg-gradient-to-br from-[#0A0F14] via-[#0F3D3E] to-[#2E6F73] shadow-sm shadow-[#0A0F14]/35">
        <svg
          viewBox="0 0 36 36"
          className="h-5 w-5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M18 6C12.2 6 7.5 10.6 7.5 16.3C7.5 19.4 8.9 22.2 11.2 24.1V27.2C11.2 28.7 12.4 30 14 30H22C23.6 30 24.8 28.7 24.8 27.2V24.1C27.1 22.2 28.5 19.4 28.5 16.3C28.5 10.6 23.8 6 18 6Z"
            stroke="#EADCC8"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="14.2" cy="15.2" r="2" fill="#EADCC8" />
          <circle cx="21.8" cy="15.2" r="2" fill="#7FB388" />
          <circle cx="18" cy="21" r="2" fill="#C6601F" />
          <path
            d="M14.2 15.2L18 21L21.8 15.2"
            stroke="#7FB388"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0A0F14] bg-[#C6601F]" />
      </div>

      {!compact && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              'font-vintage-serif text-[18px] font-bold tracking-tight',
              dark ? 'text-[#EADCC8]' : 'text-[#0A0F14]'
            )}
          >
            Neuro
            <span className={dark ? 'text-[#7FB388]' : 'text-[#2E6F73]'}>
              Care
            </span>
          </span>
          <span
            className={cn(
              'text-[10px] font-medium tracking-wider uppercase mt-0.5',
              dark ? 'text-[#EADCC8]/70' : 'text-[#4A5D5E]'
            )}
          >
            {t.brandSub}
          </span>
        </div>
      )}
    </div>
  )
}

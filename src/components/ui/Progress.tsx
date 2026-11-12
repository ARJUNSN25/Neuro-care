import { cn } from '@/utils/cn'

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number
  className?: string
  barClassName?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-[#DECDB3] border border-[#2E6F73]/15',
        className
      )}
    >
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-[#0F3D3E] via-[#2E6F73] to-[#7FB388] transition-all duration-300',
          barClassName
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

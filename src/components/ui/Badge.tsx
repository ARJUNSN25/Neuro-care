import React from 'react'
import { cn } from '@/utils/cn'

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'cyan'
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted'
  | 'outline'

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}) {
  const styles: Record<BadgeVariant, string> = {
    default: 'bg-[#EADCC8] text-[#0F3D3E] border-[#2E6F73]/25',
    primary: 'bg-[#2E6F73]/15 text-[#0F3D3E] border-[#2E6F73]/35',
    cyan: 'bg-[#7FB388]/25 text-[#0F3D3E] border-[#2E6F73]/35',
    success: 'bg-[#7FB388]/28 text-[#0A0F14] border-[#7FB388]/65',
    warning: 'bg-[#C6601F]/14 text-[#8C3F10] border-[#C6601F]/35',
    danger: 'bg-[#B93822]/14 text-[#8C2111] border-[#C6601F]/40',
    muted: 'bg-[#E3D3BC] text-[#4A5D5E] border-[#C8B79E]',
    outline: 'bg-[#FBF6EE] text-[#0F3D3E] border-[#2E6F73]/30',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-tight whitespace-nowrap',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

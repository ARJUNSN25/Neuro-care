import React from 'react'
import { cn } from '@/utils/cn'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'navy'
    | 'cyan'
    | 'copper'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'success'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary:
        'bg-[#2E6F73] text-[#FAF4EA] hover:bg-[#0F3D3E] border border-[#0F3D3E]/25 shadow-sm shadow-[#0A0F14]/15 active:scale-[0.99]',
      navy:
        'bg-[#0A0F14] text-[#EADCC8] hover:bg-[#0F3D3E] border border-[#2E6F73]/40 shadow-sm active:scale-[0.99]',
      cyan:
        'bg-[#7FB388] text-[#0A0F14] font-semibold hover:bg-[#6CA376] border border-[#0F3D3E]/20 shadow-sm',
      copper:
        'bg-[#C6601F] text-[#FAF4EA] font-semibold hover:bg-[#A84E16] border border-[#7C360B]/30 shadow-sm active:scale-[0.99]',
      secondary:
        'bg-[#EADCC8] text-[#0F3D3E] border border-[#2E6F73]/25 hover:bg-[#E1CEB4]',
      outline:
        'border border-[#2E6F73]/35 bg-[#FBF6EE] text-[#0A0F14] hover:bg-[#EADCC8]/75 hover:border-[#0F3D3E]/50',
      ghost:
        'text-[#0F3D3E] hover:bg-[#EADCC8]/70',
      danger:
        'bg-[#C6601F] text-[#FAF4EA] hover:bg-[#A64A13] shadow-sm border border-[#7F2E0A]/30',
      success:
        'bg-[#0F3D3E] text-[#EADCC8] hover:bg-[#0A2A2B] border border-[#7FB388]/40 shadow-sm',
    }

    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
      md: 'h-10 px-4 text-sm rounded-xl gap-2',
      lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
      icon: 'h-9 w-9 rounded-xl',
    }

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6F73]/50 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

import React from 'react'
import { cn } from '@/utils/cn'

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-xl border border-[#2E6F73]/35 bg-[#FBF6EE] px-3.5 py-2 text-sm text-[#0A0F14] placeholder:text-[#4A5D5E]/80 transition-colors focus:border-[#0F3D3E] focus:outline-none focus:ring-2 focus:ring-[#2E6F73]/20 disabled:cursor-not-allowed disabled:opacity-60',
      className
    )}
    {...props}
  />
))
Input.displayName = 'Input'

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[88px] w-full rounded-xl border border-[#2E6F73]/35 bg-[#FBF6EE] px-3.5 py-2.5 text-sm text-[#0A0F14] placeholder:text-[#4A5D5E]/80 transition-colors focus:border-[#0F3D3E] focus:outline-none focus:ring-2 focus:ring-[#2E6F73]/20 disabled:cursor-not-allowed disabled:opacity-60',
      className
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-xl border border-[#2E6F73]/35 bg-[#FBF6EE] px-3 py-2 text-sm text-[#0A0F14] transition-colors focus:border-[#0F3D3E] focus:outline-none focus:ring-2 focus:ring-[#2E6F73]/20 disabled:cursor-not-allowed disabled:opacity-60',
      className
    )}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = 'Select'

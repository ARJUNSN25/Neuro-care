import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClass = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  maxWidthClass?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0F14]/70 p-4 backdrop-blur-[3px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'relative w-full rounded-2xl border-2 border-[#2E6F73]/40 bg-[#F7EFE3] p-6 shadow-2xl shadow-[#0A0F14]/40 max-h-[90vh] overflow-y-auto',
          maxWidthClass
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#2E6F73]/25">
          <div>
            <h3 className="text-lg font-bold text-[#0F3D3E]">{title}</h3>
            {subtitle && (
              <p className="text-xs text-[#4A5D5E] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-[#4A5D5E] hover:bg-[#EADCC8] hover:text-[#0A0F14]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  )
}

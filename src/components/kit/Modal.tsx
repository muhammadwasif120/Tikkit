'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/cn'

/** Accessible modal on the native dialog element: focus trap, Escape and backdrop click close it. */
export function Modal({
  open, onClose, title, description, children, className,
}: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={e => { if (e.target === ref.current) onClose() }}
      className={cn('m-auto w-[min(92vw,520px)] rounded-2xl bg-surface p-0 text-fg shadow-pop backdrop:bg-black/60 backdrop:backdrop-blur-sm', className)}
      aria-labelledby="modal-title"
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <div>
          <h2 id="modal-title" className="text-lg font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="px-6 pb-6 pt-5">{open ? children : null}</div>
    </dialog>
  )
}

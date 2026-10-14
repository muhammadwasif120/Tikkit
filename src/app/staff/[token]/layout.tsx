import type { Metadata } from 'next'
import { Ticket } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tikkit Staff',
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--guest-bg)' }}>
      <header className="h-16 bg-brand-charcoal border-b border-[var(--border-faint)] flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-7 h-7 bg-brand-blue rounded-md flex items-center justify-center shrink-0">
          <Ticket className="w-4 h-4" style={{ color: 'var(--navy-950)' }} />
        </div>
        <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          Tikkit
        </span>
        <span className="badge-gray ml-2">
          Team
        </span>
      </header>
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  )
}
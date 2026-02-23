import type { Metadata } from 'next'
import { Ticket } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tikkit Staff',
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-dark">
      <header className="h-14 bg-brand-charcoal border-b border-white/5 flex items-center px-5 gap-2.5">
        <div className="w-6 h-6 bg-brand-blue rounded-md flex items-center justify-center shrink-0">
          <Ticket className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-base font-bold text-white tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Tikkit
        </span>
        <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-[10px] font-semibold text-purple-400 uppercase tracking-wide">
          Staff
        </span>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
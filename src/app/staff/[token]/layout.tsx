import type { Metadata } from 'next'
import { Ticket } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tikkit Staff',
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      <header className="h-16 bg-brand-charcoal border-b border-white/5 flex items-center px-5 gap-2.5 shrink-0">
        <div className="w-7 h-7 bg-brand-blue rounded-md flex items-center justify-center shrink-0">
          <Ticket className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Tikkit
        </span>
        <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-[10px] font-semibold text-purple-400 uppercase tracking-wide">
          Team
        </span>
      </header>
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  )
}
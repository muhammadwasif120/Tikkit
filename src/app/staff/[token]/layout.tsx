import type { Metadata } from 'next'
import { Logo } from '@/components/kit'

export const metadata: Metadata = { title: 'Door scanner', robots: { index: false, follow: false } }

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-fg">
      <header className="flex h-14 items-center border-b border-line px-4"><Logo compact /><span className="ml-3 text-sm text-muted">Door scanner</span></header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Not Found — Tikkit',
  description: 'The page you are looking for does not exist. Browse upcoming events in Pakistan on Tikkit.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--guest-bg, #080A10)' }}>
      <p className="text-6xl font-black mb-4" style={{ color: 'var(--brand-cyan, #00E5FF)' }}>404</p>
      <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--guest-text-primary, #F0F4FF)' }}>
        Page not found
      </h1>
      <p className="mb-8 max-w-sm" style={{ color: 'var(--guest-text-muted, #8892A4)' }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="/explore"
          className="rounded-full px-6 py-3 text-sm font-semibold text-black"
          style={{ background: 'var(--brand-cyan, #00E5FF)' }}
        >
          Explore Events
        </Link>
        <Link
          href="/"
          className="rounded-full px-6 py-3 text-sm font-semibold border"
          style={{ color: 'var(--guest-text-primary, #F0F4FF)', borderColor: 'var(--guest-border, #1E2535)' }}
        >
          Go Home
        </Link>
      </div>
    </main>
  )
}

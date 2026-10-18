import Link from 'next/link'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { ButtonLink } from '@/components/kit'

export const metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <MarketingShell>
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <p className="k-gradient-text text-7xl font-semibold tracking-tight">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-fg">We could not find that page</h1>
        <p className="mt-2 text-muted">It may have moved, or the event may have ended.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><ButtonLink href="/">Go home</ButtonLink><ButtonLink href="/explore" variant="secondary">Explore events</ButtonLink></div>
        <p className="mt-6 text-sm text-subtle">Need help? <Link href="/contact" className="text-accent hover:underline">Contact us</Link></p>
      </div>
    </MarketingShell>
  )
}

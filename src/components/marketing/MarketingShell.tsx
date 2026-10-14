import type { ReactNode } from 'react'
import { MarketingNav } from './MarketingNav'
import { MarketingFooter } from './MarketingFooter'

/** Page frame for every public marketing page. Server component. */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-canvas text-fg">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[44rem]" style={{ backgroundImage: 'var(--k-glow)' }} />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg">
        Skip to content
      </a>
      <MarketingNav />
      <main id="main" className="relative">{children}</main>
      <MarketingFooter />
    </div>
  )
}

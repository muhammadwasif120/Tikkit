import Link from 'next/link'
import { Logo } from '@/components/kit'

const cities = [
  ['Karachi', 'karachi'], ['Lahore', 'lahore'], ['Islamabad', 'islamabad'], ['Rawalpindi', 'rawalpindi'],
  ['Faisalabad', 'faisalabad'], ['Peshawar', 'peshawar'], ['Multan', 'multan'], ['Quetta', 'quetta'],
] as const

const cols: { title: string; links: [string, string][] }[] = [
  { title: 'Product', links: [['Features', '/#features'], ['How it works', '/how-it-works'], ['Pricing', '/pricing'], ['Explore events', '/explore']] },
  { title: 'Compare', links: [['Tikkit vs Ticketwala', '/compare/tikkit-vs-ticketwala'], ['Tikkit vs Bookme', '/compare/tikkit-vs-bookme']] },
  { title: 'Company', links: [['About', '/about'], ['Blog', '/blog'], ['Contact', '/contact'], ['Security', '/security']] },
  { title: 'Legal', links: [['Privacy', '/privacy'], ['Terms', '/terms']] },
]

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Tickets, guest lists and door control for organizers in Pakistan.
            </p>
            <a href="mailto:hello@tikkitx.com" className="mt-4 inline-block text-sm text-fg underline-offset-4 hover:underline">
              hello@tikkitx.com
            </a>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {cols.map(c => (
              <div key={c.title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{c.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map(([label, href]) => (
                    <li key={href}><Link href={href} className="text-sm text-muted transition-colors hover:text-fg">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Events by city</p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {cities.map(([label, slug]) => (
              <li key={slug}><Link href={`/explore/${slug}`} className="text-sm text-muted transition-colors hover:text-fg">Events in {label}</Link></li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-subtle sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Two Bit Digital Ltd. All rights reserved.</p>
          <p>Made in Karachi.</p>
        </div>
      </div>
    </footer>
  )
}

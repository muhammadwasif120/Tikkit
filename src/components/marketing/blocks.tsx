import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { ButtonLink } from '@/components/kit'
import { cn } from '@/lib/cn'

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6', className)}>{children}</div>
}

export function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return <section id={id} className={cn('scroll-mt-20 py-16 sm:py-24', className)}><Container>{children}</Container></section>
}

export function Eyebrow({ children, tone = 'accent' }: { children: ReactNode; tone?: 'accent' | 'magenta' }) {
  return (
    <p className={cn('text-xs font-semibold uppercase tracking-[0.14em]', tone === 'magenta' ? 'text-magenta' : 'text-accent')}>
      {children}
    </p>
  )
}

export function SectionHead({
  eyebrow, title, lead, align = 'left', tone,
}: { eyebrow?: string; title: ReactNode; lead?: ReactNode; align?: 'left' | 'center'; tone?: 'accent' | 'magenta' }) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{title}</h2>
      {lead && <p className="mt-4 text-pretty text-base leading-relaxed text-muted sm:text-lg">{lead}</p>}
    </div>
  )
}

/** Page hero for inner pages (not the home page). */
export function PageHero({
  eyebrow, title, lead, children,
}: { eyebrow?: string; title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <section className="pb-10 pt-16 sm:pb-14 sm:pt-24">
      <Container>
        <div className="max-w-3xl">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl">{title}</h1>
          {lead && <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted">{lead}</p>}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </Container>
    </section>
  )
}

export type FaqItem = { q: string; a: string }

/** Accessible accordion on native <details>. Pass the same items to faqJsonLd. */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-line rounded-2xl bg-surface shadow-card">
      {items.map(({ q, a }) => (
        <details key={q} className="group px-5 py-1 sm:px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-fg [&::-webkit-details-marker]:hidden">
            {q}
            <span aria-hidden className="text-lg leading-none text-subtle transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="pb-5 pr-8 text-[15px] leading-relaxed text-muted">{a}</p>
        </details>
      ))}
    </div>
  )
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }
}

export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}

export function CtaBand({
  title = 'Run your next event on TIKKIT X',
  lead = 'Free for 14 days. No card needed. Set up your first event in about ten minutes.',
}: { title?: string; lead?: string }) {
  return (
    <Section className="pt-8">
      <div className="k-gradient-ring relative overflow-hidden rounded-3xl bg-surface px-6 py-14 text-center sm:px-12 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: 'var(--k-glow)' }} />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted sm:text-lg">{lead}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/auth/login?flow=organizer-signup" size="lg" trailing={<ArrowRight className="h-4 w-4" />}>Start free trial</ButtonLink>
            <ButtonLink href="/pricing" size="lg" variant="secondary">See pricing</ButtonLink>
          </div>
        </div>
      </div>
    </Section>
  )
}

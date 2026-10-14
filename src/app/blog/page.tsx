import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getAllPosts, type BlogPostMeta } from '@/lib/blog'
import BlogCard from '@/components/blog/BlogCard'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { Container, PageHero } from '@/components/marketing/blocks'
import { cn } from '@/lib/cn'

export const metadata: Metadata = {
  title: 'Blog: Event Planning Tips, Guides & Pakistan Event Scene',
  description: 'Practical guides for event organisers in Pakistan. How to create events, manage guest lists, plan corporate dinners, yoga retreats and more, powered by Tikkit.',
  keywords: ['event planning Pakistan', 'corporate event guide', 'how to organise events Pakistan', 'event management tips', 'workshop planning Pakistan'],
  alternates: {
    canonical: 'https://www.tikkitx.com/blog',
    types: { 'application/rss+xml': 'https://www.tikkitx.com/feed.xml' },
  },
  openGraph: {
    title: 'Tikkit Blog: Event Planning Guides for Pakistan',
    description: 'Practical how-to guides, corporate event playbooks and Pakistan event scene insights.',
    siteName: 'Tikkit',
    locale: 'en_PK',
    type: 'website',
    url: 'https://www.tikkitx.com/blog',
  },
}

const CATEGORIES: Array<{ key: BlogPostMeta['category'] | 'all'; label: string }> = [
  { key: 'all', label: 'All articles' },
  { key: 'how-to', label: 'Platform guides' },
  { key: 'corporate', label: 'Corporate events' },
  { key: 'pulse', label: 'Wellness and retreats' },
  { key: 'pakistan', label: 'Pakistan events' },
]

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = (await searchParams) ?? {}
  const allPosts = getAllPosts()
  const active = category ?? 'all'
  const filtered = active === 'all' ? allPosts : allPosts.filter(p => p.category === active)
  const featured = allPosts[0]
  const showFeatured = active === 'all' && featured
  const rest = showFeatured ? filtered.filter(p => p.slug !== featured.slug) : filtered

  return (
    <MarketingShell>
      <PageHero eyebrow="Knowledge hub" title="Run better events. Start here." lead="Practical guides for event organisers across Pakistan, from your first event to a full corporate programme." />
      <Container className="pb-24">
        <nav aria-label="Blog categories" className="flex flex-wrap gap-2 pb-8">
          {CATEGORIES.map(c => (
            <Link
              key={c.key}
              href={c.key === 'all' ? '/blog' : `/blog?category=${c.key}`}
              aria-current={active === c.key ? 'page' : undefined}
              className={cn(
                'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors',
                active === c.key ? 'bg-accent/12 text-accent ring-1 ring-accent/40' : 'text-muted ring-1 ring-line hover:text-fg',
              )}
            >
              {c.label}
            </Link>
          ))}
        </nav>

        {showFeatured && (
          <Link href={`/blog/${featured.slug}`} className="k-gradient-ring group mb-10 block rounded-3xl bg-surface p-8 transition-colors hover:bg-raised sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-magenta">Featured</p>
            <h2 className="mt-3 max-w-2xl text-balance text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{featured.title}</h2>
            <p className="mt-3 max-w-2xl text-pretty text-muted">{featured.excerpt}</p>
            <p className="mt-6 flex items-center gap-3 text-sm text-subtle">
              {new Date(featured.publishedAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
              <span aria-hidden>·</span>{featured.readingTime} min read
              <ArrowUpRight className="ml-auto h-5 w-5 text-fg transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </p>
          </Link>
        )}

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-muted">No articles in this category yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map(post => <BlogCard key={post.slug} post={post} />)}
          </div>
        )}
      </Container>
    </MarketingShell>
  )
}

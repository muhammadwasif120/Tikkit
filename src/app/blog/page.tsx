import { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts, CATEGORY_LABELS, type BlogPostMeta } from '@/lib/blog'
import BlogCard from '@/components/blog/BlogCard'

export const metadata: Metadata = {
  title: 'Blog — Event Planning Tips, Guides & Pakistan Event Scene',
  description: 'Practical guides for event organisers in Pakistan. How to create events, manage guest lists, plan corporate dinners, yoga retreats and more — powered by Tikkit.',
  keywords: ['event planning Pakistan', 'corporate event guide', 'how to organise events Pakistan', 'event management tips', 'workshop planning Pakistan'],
  alternates: {
    canonical: 'https://www.tikkitx.com/blog',
    types: {
      'application/rss+xml': 'https://www.tikkitx.com/feed.xml',
    },
  },
  openGraph: {
    title: 'Tikkit Blog — Event Planning Guides for Pakistan',
    description: 'Practical how-to guides, corporate event playbooks and Pakistan event scene insights.',
    siteName: 'Tikkit',
    locale: 'en_PK',
    type: 'website',
    url: 'https://www.tikkitx.com/blog',
  },
}

const CATEGORIES: Array<{ key: BlogPostMeta['category'] | 'all'; label: string }> = [
  { key: 'all', label: 'All Articles' },
  { key: 'how-to', label: 'Platform Guides' },
  { key: 'corporate', label: 'Corporate Events' },
  { key: 'pulse', label: 'Wellness & Retreats' },
  { key: 'pakistan', label: 'Pakistan Events' },
]

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const resolvedParams = await searchParams
  const allPosts = getAllPosts()
  const activeCategory = resolvedParams?.category ?? 'all'
  const filtered = activeCategory === 'all'
    ? allPosts
    : allPosts.filter(p => p.category === activeCategory)

  const featured = allPosts[0]
  const rest = filtered.filter(p => p.slug !== featured?.slug)
  const showFeatured = activeCategory === 'all' && featured

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', paddingBottom: '80px' }}>

      {/* Hero */}
      <section style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '80px 24px 60px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <p style={{
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#1E5EFF',
            marginBottom: '16px',
          }}>
            Tikkit Knowledge Hub
          </p>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 800,
            lineHeight: 1.15,
            color: 'var(--foreground)',
            fontFamily: 'var(--font-display)',
            marginBottom: '20px',
          }}>
            Run better events.<br />Start here.
          </h1>
          <p style={{
            fontSize: '17px',
            lineHeight: 1.65,
            color: 'var(--foreground)',
            opacity: 0.6,
          }}>
            Practical guides for event organisers across Pakistan — from your first event to a full corporate programme.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 24px' }}>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '36px 0 32px' }}>
          {CATEGORIES.map(cat => (
            <Link
              key={cat.key}
              href={cat.key === 'all' ? '/blog' : `/blog?category=${cat.key}`}
              style={{
                padding: '7px 16px',
                borderRadius: '100px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid',
                borderColor: activeCategory === cat.key ? '#1E5EFF' : 'rgba(255,255,255,0.1)',
                background: activeCategory === cat.key ? 'rgba(30,94,255,0.12)' : 'transparent',
                color: activeCategory === cat.key ? '#1E5EFF' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.15s',
              }}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        {/* Featured article */}
        {showFeatured && (
          <Link
            href={`/blog/${featured.slug}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '40px',
              alignItems: 'center',
              background: 'var(--guest-surface, rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px',
              padding: '40px',
              marginBottom: '48px',
              textDecoration: 'none',
            }}
            className="group hover:border-brand-blue/30 max-md:grid-cols-1"
          >
            <div>
              <span style={{
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: 'rgba(30,94,255,0.12)',
                color: '#1E5EFF',
                marginBottom: '16px',
              }}>
                Featured
              </span>
              <h2 style={{
                fontSize: 'clamp(22px, 3vw, 32px)',
                fontWeight: 800,
                lineHeight: 1.25,
                color: 'var(--foreground)',
                fontFamily: 'var(--font-display)',
                marginBottom: '14px',
              }}>
                {featured.title}
              </h2>
              <p style={{
                fontSize: '15px',
                lineHeight: 1.65,
                color: 'var(--foreground)',
                opacity: 0.6,
                marginBottom: '24px',
              }}>
                {featured.excerpt}
              </p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--foreground)', opacity: 0.4 }}>
                <span>{new Date(featured.publishedAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span>·</span>
                <span>{featured.readingTime} min read</span>
              </div>
            </div>
            <div style={{
              background: 'rgba(30,94,255,0.06)',
              borderRadius: '12px',
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(30,94,255,0.1)',
            }}>
              <span style={{ fontSize: '48px', opacity: 0.4 }}>📋</span>
            </div>
          </Link>
        )}

        {/* Article grid */}
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.4, padding: '60px 0' }}>No articles in this category yet.</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}>
            {(showFeatured ? rest : filtered).map(post => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

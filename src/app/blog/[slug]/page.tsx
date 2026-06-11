import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { marked } from 'marked'
import { getPostBySlug, getAllPosts, CATEGORY_LABELS } from '@/lib/blog'
import { HOWTO_STEPS } from '@/lib/howto-steps'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author, url: 'https://www.tikkitx.com/about' }],
    alternates: {
      canonical: `https://www.tikkitx.com/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      siteName: 'Tikkit',
      locale: 'en_PK',
      url: `https://www.tikkitx.com/blog/${post.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      site: '@tikkitx',
    },
  }
}

const CATEGORY_BADGE: Record<string, { bg: string; text: string }> = {
  'how-to':    { bg: 'rgba(30,94,255,0.12)',   text: '#1E5EFF' },
  'corporate': { bg: 'rgba(99,179,237,0.12)',  text: '#63B3ED' },
  'pulse':     { bg: 'rgba(124,154,126,0.15)', text: '#7C9A7E' },
  'pakistan':  { bg: 'rgba(255,199,69,0.15)',  text: '#FFC745' },
}

// Configure marked for clean, safe output
marked.setOptions({ breaks: false, gfm: true })

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const htmlContent = await marked(post.content)
  const badge = CATEGORY_BADGE[post.category]

  const publishDate = new Date(post.publishedAt).toLocaleDateString('en-PK', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const updatedDate = post.updatedAt
    ? new Date(post.updatedAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const howTo = HOWTO_STEPS[post.slug]

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt ?? post.publishedAt,
      author: {
        '@type': 'Person',
        name: post.author,
        jobTitle: post.authorTitle,
        url: 'https://www.tikkitx.com/about',
        worksFor: { '@type': 'Organization', name: 'Two Bit Digital Ltd', url: 'https://www.tikkitx.com' },
      },
      publisher: { '@type': 'Organization', name: 'Tikkit X', url: 'https://www.tikkitx.com' },
      keywords: post.keywords.join(', '),
      inLanguage: 'en-PK',
      mainEntityOfPage: { '@type': 'WebPage', '@id': `https://www.tikkitx.com/blog/${post.slug}` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',   item: 'https://www.tikkitx.com' },
        { '@type': 'ListItem', position: 2, name: 'Blog',   item: 'https://www.tikkitx.com/blog' },
        { '@type': 'ListItem', position: 3, name: CATEGORY_LABELS[post.category], item: `https://www.tikkitx.com/blog?category=${post.category}` },
        { '@type': 'ListItem', position: 4, name: post.title, item: `https://www.tikkitx.com/blog/${post.slug}` },
      ],
    },
    ...(howTo ? [{
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: howTo.name,
      description: howTo.description,
      step: howTo.steps.map((s, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: s.name,
        text: s.text,
      })),
    }] : []),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <style>{`
        .blog-prose h2 {
          font-family: var(--font-display);
          font-size: clamp(20px, 2.5vw, 26px);
          font-weight: 700;
          line-height: 1.3;
          color: var(--foreground);
          margin-top: 44px;
          margin-bottom: 14px;
        }
        .blog-prose h3 {
          font-size: 18px;
          font-weight: 700;
          line-height: 1.35;
          color: var(--foreground);
          margin-top: 32px;
          margin-bottom: 10px;
        }
        .blog-prose p {
          font-size: 16px;
          line-height: 1.8;
          color: var(--foreground);
          opacity: 0.85;
          margin-bottom: 20px;
        }
        .blog-prose ul {
          margin-bottom: 24px;
          padding-left: 0;
          list-style: none;
        }
        .blog-prose ul li {
          font-size: 16px;
          line-height: 1.75;
          color: var(--foreground);
          opacity: 0.85;
          margin-bottom: 8px;
          padding-left: 20px;
          position: relative;
        }
        .blog-prose ul li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 10px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1E5EFF;
        }
        .blog-prose ol {
          margin-bottom: 24px;
          padding-left: 24px;
        }
        .blog-prose ol li {
          font-size: 16px;
          line-height: 1.75;
          color: var(--foreground);
          opacity: 0.85;
          margin-bottom: 8px;
        }
        .blog-prose strong {
          font-weight: 700;
          color: var(--foreground);
          opacity: 1;
        }
        .blog-prose em { font-style: italic; }
        .blog-prose blockquote {
          border-left: 3px solid #1E5EFF;
          padding-left: 20px;
          margin: 28px 0;
          opacity: 0.75;
          font-style: italic;
        }
        .blog-prose code {
          background: rgba(30,94,255,0.1);
          border: 1px solid rgba(30,94,255,0.2);
          border-radius: 4px;
          padding: 2px 7px;
          font-size: 13px;
          font-family: monospace;
          color: #1E5EFF;
        }
        .blog-prose pre {
          background: rgba(30,94,255,0.06);
          border: 1px solid rgba(30,94,255,0.15);
          border-radius: 10px;
          padding: 20px;
          overflow-x: auto;
          margin-bottom: 28px;
        }
        .blog-prose pre code {
          background: none;
          border: none;
          padding: 0;
          font-size: 14px;
          color: var(--foreground);
          opacity: 0.85;
        }
        .blog-prose hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.08);
          margin: 40px 0;
        }
        .blog-prose a {
          color: #1E5EFF;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .blog-prose table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          margin-bottom: 28px;
        }
        .blog-prose th {
          text-align: left;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--foreground);
          opacity: 0.5;
        }
        .blog-prose td {
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          color: var(--foreground);
          opacity: 0.8;
          line-height: 1.5;
        }
      `}</style>

      <main style={{ minHeight: '100vh', background: 'var(--background)', paddingBottom: '100px' }}>

        {/* Breadcrumb */}
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '28px 24px 0' }}>
          <nav style={{ fontSize: '13px', color: 'var(--foreground)', opacity: 0.4 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            {' / '}
            <Link href="/blog" style={{ color: 'inherit', textDecoration: 'none' }}>Blog</Link>
            {' / '}
            <span>{CATEGORY_LABELS[post.category]}</span>
          </nav>
        </div>

        {/* Article header */}
        <header style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px 0' }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            background: badge.bg,
            color: badge.text,
            marginBottom: '20px',
          }}>
            {CATEGORY_LABELS[post.category]}
          </span>

          <h1 style={{
            fontSize: 'clamp(26px, 4vw, 42px)',
            fontWeight: 800,
            lineHeight: 1.2,
            color: 'var(--foreground)',
            fontFamily: 'var(--font-display)',
            marginBottom: '20px',
          }}>
            {post.title}
          </h1>

          <p style={{
            fontSize: '18px',
            lineHeight: 1.65,
            color: 'var(--foreground)',
            opacity: 0.65,
            marginBottom: '28px',
          }}>
            {post.description}
          </p>

          <div style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            fontSize: '13px',
            color: 'var(--foreground)',
            opacity: 0.45,
            paddingBottom: '32px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            marginBottom: '48px',
          }}>
            <span>By {post.author}</span>
            <span>·</span>
            <span>{publishDate}</span>
            {updatedDate && <><span>·</span><span>Updated {updatedDate}</span></>}
            <span>·</span>
            <span>{post.readingTime} min read</span>
          </div>
        </header>

        {/* Article body */}
        <article
          className="blog-prose"
          style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Author bio */}
        <div style={{ maxWidth: '760px', margin: '56px auto 0', padding: '0 24px' }}>
          <div style={{
            display: 'flex', gap: 20, alignItems: 'flex-start',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '24px 24px',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: 'linear-gradient(135deg, #1E5EFF, #A855F7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#fff',
            }}>
              {post.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--foreground)' }}>{post.author}</span>
                <span style={{ fontSize: 12, color: 'var(--foreground)', opacity: 0.4 }}>{post.authorTitle}</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--foreground)', opacity: 0.55, margin: 0 }}>
                Muhammad built Tikkit X after watching Pakistani organisers run events on WhatsApp threads and Google Sheets.
                He writes about event management, ticketing, and building products for Pakistan.
              </p>
              <Link href="/about" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#1E5EFF', textDecoration: 'none', fontWeight: 600 }}>
                About the author →
              </Link>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ maxWidth: '760px', margin: '64px auto 0', padding: '0 24px' }}>
          <div style={{
            background: 'rgba(30,94,255,0.06)',
            border: '1px solid rgba(30,94,255,0.2)',
            borderRadius: '16px',
            padding: '36px',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--foreground)',
              fontFamily: 'var(--font-display)',
              marginBottom: '10px',
            }}>
              Ready to run your next event?
            </p>
            <p style={{ fontSize: '14px', color: 'var(--foreground)', opacity: 0.55, marginBottom: '24px' }}>
              Create your free organiser account and launch your first event in under 10 minutes.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/auth/login?flow=organizer-signup"
                style={{
                  padding: '12px 28px',
                  background: '#1E5EFF',
                  color: '#fff',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                Get started free
              </Link>
              <Link
                href="/blog"
                style={{
                  padding: '12px 28px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--foreground)',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  opacity: 0.7,
                }}
              >
                More articles
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

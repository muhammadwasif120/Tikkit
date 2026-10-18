import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge, ButtonLink, type BadgeTone } from '@/components/kit'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { JsonLd } from '@/components/marketing/blocks'
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

const CATEGORY_TONE: Record<string, BadgeTone> = { 'how-to': 'accent', corporate: 'info', pulse: 'success', pakistan: 'magenta' }

// Configure marked for clean, safe output
marked.setOptions({ breaks: false, gfm: true })

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const htmlContent = await marked(post.content)

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
    <MarketingShell>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-[13px] text-subtle">
          <Link href="/" className="hover:text-fg">Home</Link> / <Link href="/blog" className="hover:text-fg">Blog</Link> / <span>{CATEGORY_LABELS[post.category]}</span>
        </nav>

        <header className="mt-8">
          <Badge tone={CATEGORY_TONE[post.category] ?? 'neutral'}>{CATEGORY_LABELS[post.category]}</Badge>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.12] tracking-tight text-fg sm:text-5xl">{post.title}</h1>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted">{post.description}</p>
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line pb-8 text-[13px] text-subtle">
            <span>By {post.author}</span><span aria-hidden>·</span>
            <span>{publishDate}</span>
            {updatedDate && <><span aria-hidden>·</span><span>Updated {updatedDate}</span></>}
            <span aria-hidden>·</span><span>{post.readingTime} min read</span>
          </p>
        </header>

        <article className="mt-10 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-7 [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-muted [&_code]:rounded [&_code]:bg-raised [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:text-accent [&_h2]:mb-3.5 [&_h2]:mt-11 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:tracking-tight [&_h2]:text-fg [&_h3]:mb-2.5 [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-fg [&_hr]:my-10 [&_hr]:border-line [&_li]:mb-2 [&_li]:leading-8 [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-5 [&_p]:text-[16px] [&_p]:leading-8 [&_p]:text-muted [&_pre]:mb-7 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-surface [&_pre]:p-5 [&_pre_code]:bg-transparent [&_pre_code]:text-fg [&_strong]:font-semibold [&_strong]:text-fg [&_table]:mb-7 [&_table]:w-full [&_table]:text-sm [&_td]:border-b [&_td]:border-line [&_td]:px-3.5 [&_td]:py-2.5 [&_td]:text-muted [&_th]:border-b [&_th]:border-line-strong [&_th]:px-3.5 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-subtle [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:marker:text-accent [&_li]:text-muted" dangerouslySetInnerHTML={{ __html: htmlContent }} />

        <aside className="mt-14 flex items-start gap-5 rounded-2xl bg-surface p-6 shadow-card">
          <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-base font-bold text-accent-fg" style={{ background: 'linear-gradient(135deg, rgb(var(--k-accent)), rgb(var(--k-magenta)))' }}>
            {post.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-baseline gap-x-3"><span className="font-semibold text-fg">{post.author}</span><span className="text-xs text-subtle">{post.authorTitle}</span></p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">Muhammad built Tikkit X after watching Pakistani organisers run events on WhatsApp threads and Google Sheets. He writes about event management, ticketing, and building products for Pakistan.</p>
            <Link href="/about" className="mt-2 inline-block text-xs font-semibold text-accent hover:underline">About the author</Link>
          </div>
        </aside>

        <div className="k-gradient-ring mt-12 rounded-2xl bg-surface p-8 text-center sm:p-10">
          <p className="text-xl font-semibold tracking-tight text-fg">Ready to run your next event?</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">Start a 14 day free trial and launch your first event in about ten minutes.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/auth/login?flow=organizer-signup">Start free trial</ButtonLink>
            <ButtonLink href="/blog" variant="secondary">More articles</ButtonLink>
          </div>
        </div>
      </div>
    </MarketingShell>
  )
}

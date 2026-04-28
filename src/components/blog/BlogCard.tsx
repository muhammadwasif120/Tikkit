import Link from 'next/link'
import { BlogPostMeta, CATEGORY_LABELS } from '@/lib/blog'

const CATEGORY_BADGE: Record<BlogPostMeta['category'], { bg: string; text: string }> = {
  'how-to':    { bg: 'rgba(30,94,255,0.12)',  text: '#1E5EFF' },
  'corporate': { bg: 'rgba(99,179,237,0.12)', text: '#63B3ED' },
  'pulse':     { bg: 'rgba(124,154,126,0.15)', text: '#7C9A7E' },
  'pakistan':  { bg: 'rgba(255,199,69,0.15)', text: '#FFC745' },
}

export default function BlogCard({ post }: { post: BlogPostMeta }) {
  const badge = CATEGORY_BADGE[post.category]
  const date = new Date(post.publishedAt).toLocaleDateString('en-PK', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <Link
      href={`/blog/${post.slug}`}
      style={{
        display: 'block',
        background: 'var(--guest-surface)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '28px',
        textDecoration: 'none',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
      className="group hover:-translate-y-0.5 hover:border-brand-blue/30"
    >
      {/* Category badge */}
      <span style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: badge.bg,
        color: badge.text,
        marginBottom: '14px',
      }}>
        {CATEGORY_LABELS[post.category]}
      </span>

      {/* Title */}
      <h2 style={{
        fontSize: '17px',
        fontWeight: 700,
        lineHeight: 1.4,
        color: 'var(--foreground)',
        marginBottom: '10px',
        fontFamily: 'var(--font-display)',
      }}>
        {post.title}
      </h2>

      {/* Excerpt */}
      <p style={{
        fontSize: '14px',
        lineHeight: 1.6,
        color: 'var(--foreground)',
        opacity: 0.6,
        marginBottom: '20px',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {post.excerpt}
      </p>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--foreground)',
        opacity: 0.4,
      }}>
        <span>{date}</span>
        <span>{post.readingTime} min read</span>
      </div>
    </Link>
  )
}

import { ImageResponse } from 'next/og'
import { getPostBySlug, CATEGORY_LABELS } from '@/lib/blog'

export const runtime = 'nodejs'
export const alt = 'Tikkit Blog'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const CATEGORY_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  'how-to':    { bg: '#0B1628', text: '#1E5EFF', accent: 'rgba(30,94,255,0.15)' },
  'corporate': { bg: '#0F1724', text: '#63B3ED', accent: 'rgba(99,179,237,0.12)' },
  'pulse':     { bg: '#1A1410', text: '#7C9A7E', accent: 'rgba(124,154,126,0.15)' },
  'pakistan':  { bg: '#0D1A10', text: '#FFC745', accent: 'rgba(255,199,69,0.12)' },
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%', height: '100%',
            background: '#080A10',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ color: '#fff', fontSize: 48 }}>Tikkit Blog</span>
        </div>
      ),
      { ...size }
    )
  }

  const colors = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS['how-to']
  const categoryLabel = CATEGORY_LABELS[post.category] ?? post.category

  // Truncate title for display
  const title = post.title.length > 72 ? post.title.slice(0, 69) + '…' : post.title
  const description = post.description.length > 120
    ? post.description.slice(0, 117) + '…'
    : post.description

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: colors.bg,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 72px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Accent glow top-left */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: colors.accent,
            filter: 'blur(80px)',
          }}
        />

        {/* Top row: Logo + Category badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Tikkit wordmark */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#F0F2FF',
              letterSpacing: '-0.03em',
            }}
          >
            Tikkit
          </div>

          {/* Category badge */}
          <div
            style={{
              padding: '6px 16px',
              borderRadius: 100,
              background: colors.accent,
              border: `1px solid ${colors.text}33`,
              fontSize: 13,
              fontWeight: 700,
              color: colors.text,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            {categoryLabel}
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              fontSize: title.length > 50 ? 44 : 52,
              fontWeight: 800,
              color: '#F0F2FF',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              maxWidth: 900,
              display: 'flex',
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 20,
              color: 'rgba(240,242,255,0.6)',
              lineHeight: 1.5,
              maxWidth: 860,
              display: 'flex',
            }}
          >
            {description}
          </div>
        </div>

        {/* Bottom row: source + reading time */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 24,
          }}
        >
          <div style={{ fontSize: 16, color: 'rgba(240,242,255,0.4)', display: 'flex' }}>
            tikkitx.com/blog
          </div>
          <div style={{ fontSize: 16, color: colors.text, fontWeight: 600, display: 'flex' }}>
            {post.readingTime} min read
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

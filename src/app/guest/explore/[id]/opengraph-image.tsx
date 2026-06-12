import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'
import { isUUID } from '@/lib/slugify'
import { stripHtml } from '@/lib/sanitize'

export const runtime = 'nodejs'
export const alt = 'Tikkit Event'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id: idOrSlug } = await params
  const admin = createAdminClient()

  // Resolve slug or UUID
  let ev: any = null
  if (isUUID(idOrSlug)) {
    const { data } = await admin
      .from('events')
      .select('title, description, cover_image_url, venue_name, date_start, status')
      .eq('id', idOrSlug)
      .single()
    ev = data
  } else {
    const { data } = await admin
      .from('events')
      .select('title, description, cover_image_url, venue_name, date_start, status')
      .eq('slug', idOrSlug)
      .single()
    ev = data
  }

  // Format date helper
  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('en-PK', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      }).format(new Date(iso))
    } catch {
      return ''
    }
  }

  // Fallback for unknown events
  if (!ev) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%', height: '100%',
            background: '#080A10',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 36, fontWeight: 700 }}>
            tikkitx.com
          </span>
        </div>
      ),
      { ...size }
    )
  }

  const title = ev.title?.length > 64 ? ev.title.slice(0, 61) + '…' : (ev.title ?? 'Event')
  const description = (stripHtml(ev.description ?? '') || `Register for ${ev.title} on Tikkit.`)
  const shortDesc = description.length > 110 ? description.slice(0, 107) + '…' : description
  const dateStr = ev.date_start ? formatDate(ev.date_start) : ''
  const venue = ev.venue_name ?? ''

  // If cover image exists → use it as background with text overlay
  if (ev.cover_image_url) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%', height: '100%',
            display: 'flex', position: 'relative',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Cover image fills the full canvas */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ev.cover_image_url}
            width={1200}
            height={630}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            alt=""
          />

          {/* Dark gradient overlay — bottom half */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.15) 100%)',
              display: 'flex',
            }}
          />

          {/* Content */}
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              padding: '40px 56px',
            }}
          >
            {/* Top: Tikkit wordmark */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div
                style={{
                  background: 'rgba(0,0,0,0.45)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(6px)',
                  borderRadius: 100,
                  padding: '6px 20px',
                  fontSize: 18, fontWeight: 800,
                  color: '#F0F2FF',
                  letterSpacing: '-0.02em',
                  display: 'flex',
                }}
              >
                Tikkit
              </div>
            </div>

            {/* Bottom: event info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  fontSize: title.length > 42 ? 48 : 56,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  textShadow: '0 2px 16px rgba(0,0,0,0.8)',
                }}
              >
                {title}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {dateStr && (
                  <div
                    style={{
                      fontSize: 18, fontWeight: 600,
                      color: 'rgba(255,255,255,0.75)',
                      display: 'flex',
                    }}
                  >
                    {dateStr}
                  </div>
                )}
                {venue && (
                  <>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', display: 'flex' }} />
                    <div
                      style={{
                        fontSize: 18, fontWeight: 600,
                        color: 'rgba(255,255,255,0.75)',
                        display: 'flex',
                      }}
                    >
                      {venue}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
      { ...size }
    )
  }

  // No cover image → branded dark card
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          background: '#080A10',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '60px 72px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Blue accent glow */}
        <div
          style={{
            position: 'absolute',
            top: -100, left: -80,
            width: 500, height: 500,
            borderRadius: '50%',
            background: 'rgba(30,94,255,0.12)',
            display: 'flex',
          }}
        />

        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#F0F2FF', letterSpacing: '-0.03em', display: 'flex' }}>
            Tikkit
          </div>
          <div
            style={{
              padding: '6px 16px',
              borderRadius: 100,
              background: 'rgba(30,94,255,0.14)',
              border: '1px solid rgba(30,94,255,0.35)',
              fontSize: 12, fontWeight: 700,
              color: '#5B8CFF',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            Event
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontSize: title.length > 48 ? 48 : 58,
              fontWeight: 900,
              color: '#F0F2FF',
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              maxWidth: 960,
              display: 'flex',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 20,
              color: 'rgba(240,242,255,0.5)',
              lineHeight: 1.55,
              maxWidth: 860,
              display: 'flex',
            }}
          >
            {shortDesc}
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            paddingTop: 22,
          }}
        >
          <div style={{ fontSize: 16, color: 'rgba(240,242,255,0.35)', display: 'flex' }}>
            tikkitx.com
          </div>
          {(dateStr || venue) && (
            <div style={{ fontSize: 16, color: 'rgba(240,242,255,0.55)', fontWeight: 600, display: 'flex', gap: 12 }}>
              {dateStr && <span>{dateStr}</span>}
              {dateStr && venue && <span>·</span>}
              {venue && <span>{venue}</span>}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  )
}

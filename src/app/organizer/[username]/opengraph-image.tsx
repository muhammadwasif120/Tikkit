import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const alt = 'Tikkit Organizer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const admin = createAdminClient()

  const { data: rows } = await (admin as any)
    .rpc('get_public_organizer_profile', { p_lookup: username })
  const profile = (rows as any[])?.[0] ?? null

  // Fallback
  if (!profile) {
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

  const displayName: string = profile.company_name || profile.full_name || username
  const shortName = displayName.length > 42 ? displayName.slice(0, 39) + '…' : displayName
  const eventCount: number = profile.upcoming_event_count ?? 0
  const logoUrl: string | null = profile.logo_url ?? null
  const coverUrl: string | null = profile.cover_image_url ?? null

  // If cover image exists → use it as background
  if (coverUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%', height: '100%',
            display: 'flex', position: 'relative',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            width={1200}
            height={630}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            alt=""
          />
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.1) 100%)',
              display: 'flex',
            }}
          />
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
                  borderRadius: 100,
                  padding: '6px 20px',
                  fontSize: 18, fontWeight: 800,
                  color: '#F0F2FF',
                  display: 'flex',
                }}
              >
                Tikkit
              </div>
            </div>

            {/* Bottom: organizer info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {logoUrl && (
                <div
                  style={{
                    width: 72, height: 72, borderRadius: 16,
                    overflow: 'hidden',
                    border: '2px solid rgba(255,255,255,0.2)',
                    display: 'flex',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} width={72} height={72} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                </div>
              )}
              <div
                style={{
                  fontSize: shortName.length > 28 ? 50 : 60,
                  fontWeight: 900, color: '#FFFFFF',
                  lineHeight: 1.1, letterSpacing: '-0.02em',
                  display: 'flex',
                  textShadow: '0 2px 16px rgba(0,0,0,0.8)',
                }}
              >
                {shortName}
              </div>
              <div
                style={{
                  fontSize: 20, fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  display: 'flex',
                }}
              >
                {eventCount > 0
                  ? `${eventCount} upcoming event${eventCount === 1 ? '' : 's'} · tikkitx.com`
                  : 'Event Organizer · tikkitx.com'}
              </div>
            </div>
          </div>
        </div>
      ),
      { ...size }
    )
  }

  // No cover → branded dark card with optional logo
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
        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            top: -100, right: -80,
            width: 480, height: 480,
            borderRadius: '50%',
            background: 'rgba(30,94,255,0.1)',
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
            Organizer
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Logo if available */}
          {logoUrl && (
            <div
              style={{
                width: 80, height: 80, borderRadius: 18,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} width={80} height={80} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            </div>
          )}
          <div
            style={{
              fontSize: shortName.length > 32 ? 52 : 64,
              fontWeight: 900,
              color: '#F0F2FF',
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              display: 'flex',
            }}
          >
            {shortName}
          </div>
          <div
            style={{
              fontSize: 22,
              color: 'rgba(240,242,255,0.45)',
              display: 'flex',
            }}
          >
            {eventCount > 0
              ? `${eventCount} upcoming event${eventCount === 1 ? '' : 's'} on Tikkit`
              : 'Event Organizer on Tikkit'}
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
          <div style={{ fontSize: 16, color: 'rgba(240,242,255,0.3)', display: 'flex' }}>
            tikkitx.com/organizer/{username}
          </div>
          <div
            style={{
              fontSize: 14, fontWeight: 700,
              color: '#5B8CFF',
              display: 'flex',
            }}
          >
            Pakistan's Event Platform
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}

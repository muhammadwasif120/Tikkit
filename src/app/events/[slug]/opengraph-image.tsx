import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const alt = 'Event on TIKKIT X'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function EventOg({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_event', { p_slug: slug })
  const ev = data?.[0]
  const when = ev?.starts_at ? new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }).format(new Date(ev.starts_at)) : ''
  const where = ev?.is_secret_venue ? `Secret location · ${ev.area_label ?? ev.city ?? ''}` : [ev?.venue_name, ev?.area_label ?? ev?.city].filter(Boolean).join(', ')

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 64, background: ev?.cover_image_url ? '#070911' : 'linear-gradient(135deg,#070911 0%,#0d1230 60%,#2a0f3a 100%)', color: '#edf0f7', position: 'relative' }}>
        {ev?.cover_image_url ? <img src={ev.cover_image_url} alt="" width={1200} height={630} style={{ position: 'absolute', inset: 0, width: 1200, height: 630, objectFit: 'cover', opacity: 0.35 }} /> : null}
        <div style={{ display: 'flex', fontSize: 36, fontWeight: 800, color: '#22d3ee', position: 'relative' }}>TIKKIT X</div>
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'flex', fontSize: 30, color: '#22d3ee', marginBottom: 16 }}>{when}</div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>{(ev?.title ?? 'Event').slice(0, 70)}</div>
          <div style={{ display: 'flex', fontSize: 30, color: '#969fb7', marginTop: 20 }}>{where}</div>
        </div>
      </div>
    ),
    size,
  )
}

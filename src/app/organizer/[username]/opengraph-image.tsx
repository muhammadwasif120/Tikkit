import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const alt = 'Organizer on TIKKIT X'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OrganizerOg({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()
  const { data: org } = await supabase.from('public_organizers').select('company_name, full_name, bio, upcoming_event_count, city, logo_url').eq('username', username.toLowerCase()).maybeSingle()
  const name = org?.company_name ?? org?.full_name ?? username

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 64, background: 'linear-gradient(135deg,#070911 0%,#0d1230 60%,#2a0f3a 100%)', color: '#edf0f7' }}>
        <div style={{ display: 'flex', fontSize: 36, fontWeight: 800, color: '#22d3ee' }}>TIKKIT X</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 28, color: '#d660ec', marginBottom: 14 }}>Organizer</div>
          <div style={{ display: 'flex', fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>{name.slice(0, 40)}</div>
          <div style={{ display: 'flex', fontSize: 30, color: '#969fb7', marginTop: 22 }}>{[org?.city, `${org?.upcoming_event_count ?? 0} upcoming events`].filter(Boolean).join(' · ')}</div>
        </div>
      </div>
    ),
    size,
  )
}

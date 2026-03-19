import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCommandEvents } from '@/app/actions/commandActions'
import { Radio, Calendar, Users, ChevronRight, Zap } from 'lucide-react'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  published: { bg: 'rgba(34,197,94,0.1)',  color: '#22C55E', border: 'rgba(34,197,94,0.25)' },
  completed: { bg: 'rgba(75,85,99,0.1)',   color: '#6B7280', border: 'rgba(75,85,99,0.2)'  },
}

export default async function CommandPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const events = await getCommandEvents()

  return (
    <div style={{ padding: '28px 24px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Radio size={20} color="#A855F7" />
        </div>
        <div>
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)' }}>
            Command Center
          </h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>
            Real-time attendee management &amp; live chat per event
          </p>
        </div>
      </div>

      {/* What's this banner */}
      <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(30,94,255,0.06))', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Zap size={18} color="#A855F7" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 4px' }}>How it works</p>
          <p style={{ color: '#6B7280', fontSize: 12, margin: 0, lineHeight: 1.65 }}>
            Select an event below to open its Command Center — see every attendee&apos;s Triple-Verified status, approve or reject EOI/payment submissions, and chat live with guests. All chat data is automatically purged 72 hours after the event ends.
          </p>
        </div>
      </div>

      {/* Events list */}
      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Radio size={36} color="#1F2937" style={{ margin: '0 auto 14px', display: 'block' }} />
          <p style={{ color: '#6B7280', fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>No events yet</p>
          <p style={{ color: '#374151', fontSize: 13, margin: '0 0 20px' }}>Publish an event to use the Command Center</p>
          <Link href="/dashboard/events/new" style={{ background: '#1E5EFF', color: 'white', textDecoration: 'none', padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'inline-block' }}>
            Create Event
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.map(event => {
            const style = STATUS_STYLES[event.status] ?? STATUS_STYLES.completed
            return (
              <Link key={event.id} href={`/dashboard/command/${event.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#0C0E16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
                  padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'border-color 0.15s, transform 0.15s',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,85,247,0.3)'
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <p style={{ color: 'white', fontSize: 15, fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {event.title}
                      </p>
                      <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: style.bg, color: style.color, border: `1px solid ${style.border}`, flexShrink: 0 }}>
                        {event.status}
                      </span>
                    </div>
                    <p style={{ color: '#4B5563', fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={10} color="#4B5563" /> {fmtDate(event.date_start)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={10} color="#4B5563" /> {event._count} attendees
                      </span>
                    </p>
                  </div>
                  <ChevronRight size={18} color="#374151" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

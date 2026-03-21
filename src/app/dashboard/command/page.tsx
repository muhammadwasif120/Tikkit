import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCommandEvents } from '@/app/actions/commandActions'
import { Radio, Calendar, Users, ChevronRight, Zap, MessageSquare, Shield, ArrowRight } from 'lucide-react'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const COVER_GRADIENTS = [
  'linear-gradient(135deg,#0F2027,#203A43,#2C5364)',
  'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
  'linear-gradient(135deg,#200122,#6f0000)',
  'linear-gradient(135deg,#0d0d0d,#1a3a1a)',
  'linear-gradient(135deg,#1f0033,#2d0050)',
  'linear-gradient(135deg,#001233,#023e8a)',
  'linear-gradient(135deg,#0a0f2e,#1a2a6c,#1E5EFF)',
]
function getGrad(id: string) { return COVER_GRADIENTS[id.charCodeAt(0) % COVER_GRADIENTS.length] }

const STATUS_MAP: Record<string, { bg: string; color: string; border: string; label: string }> = {
  published: { bg: 'rgba(34,197,94,0.1)',  color: '#22C55E', border: 'rgba(34,197,94,0.25)', label: 'LIVE' },
  completed: { bg: 'rgba(75,85,99,0.1)',   color: '#6B7280', border: 'rgba(75,85,99,0.2)',   label: 'ENDED' },
  draft:     { bg: 'rgba(250,204,21,0.1)', color: '#FACC15', border: 'rgba(250,204,21,0.2)', label: 'DRAFT' },
}

export default async function CommandPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const events = await getCommandEvents()

  return (
    <div className="max-w-5xl px-0 pt-2 pb-6 sm:px-6 sm:pt-7">

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(30,94,255,0.15))',
          border: '1px solid rgba(168,85,247,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(168,85,247,0.15)',
        }}>
          <Radio size={22} color="#A855F7" />
        </div>
        <div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: '0 0 4px', fontFamily: 'var(--font-display)', letterSpacing: '-0.4px' }}>
            Command Center
          </h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Real-time attendee management, approvals &amp; live guest chat
          </p>
        </div>
      </div>

      {/* ── How it works strip ────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168,85,247,0.07) 0%, rgba(30,94,255,0.05) 100%)',
        border: '1px solid rgba(168,85,247,0.14)',
        borderRadius: 16, padding: '20px 24px', marginBottom: 28,
      }}>
        <p style={{ color: '#A855F7', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>
          How it works
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { icon: Users,         color: '#1E5EFF', label: 'Manage Attendees',    desc: 'See every guest — approve or reject EOI & payment submissions in one click.' },
            { icon: Shield,        color: '#22C55E', label: 'Triple Verification', desc: 'View ID & payment verification badges and Social Score for each attendee.' },
            { icon: MessageSquare, color: '#A855F7', label: 'Live Chat',           desc: 'Broadcast messages to all attendees. Purged automatically 72h after event ends.' },
          ].map(({ icon: Icon, color, label, desc }) => (
            <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Icon size={15} color={color} />
              </div>
              <div>
                <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '0 0 3px', fontFamily: 'var(--font-display)' }}>{label}</p>
                <p style={{ color: '#6B7280', fontSize: 11, margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Event list ───────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ color: '#4B5563', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 12px' }}>
          {events.length} {events.length === 1 ? 'Event' : 'Events'}
        </p>
      </div>

      {events.length === 0 ? (
        /* Empty state */
        <div style={{
          textAlign: 'center', padding: '72px 24px',
          background: '#0C0E16', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 18px',
            background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Radio size={28} color="#A855F7" />
          </div>
          <p style={{ color: 'white', fontSize: 16, fontWeight: 800, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>
            No events yet
          </p>
          <p style={{ color: '#4B5563', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
            Publish an event to start using the Command Center
          </p>
          <Link href="/dashboard/events/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: '#1E5EFF', color: 'white', textDecoration: 'none',
            padding: '11px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700,
            boxShadow: '0 8px 24px rgba(30,94,255,0.25)',
          }}>
            Create your first event <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.map(event => {
            const st = STATUS_MAP[event.status] ?? STATUS_MAP.completed
            const isLive = event.status === 'published'

            return (
              <Link key={event.id} href={`/dashboard/command/${event.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div className={`cc-event-card${isLive ? ' cc-live' : ''}`} style={{
                  background: '#0C0E16',
                  border: `1px solid ${isLive ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 18, padding: '0', overflow: 'hidden',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  cursor: 'pointer',
                  boxShadow: isLive ? '0 4px 24px rgba(168,85,247,0.08)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    {/* Cover thumbnail */}
                    <div style={{
                      width: 72, height: 72, flexShrink: 0,
                      background: event.cover_image_url ? `url(${event.cover_image_url}) center/cover` : getGrad(event.id),
                      position: 'relative',
                    }}>
                      {isLive && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(135deg, rgba(168,85,247,0.3), transparent)',
                        }} />
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p style={{
                          color: 'white', fontSize: 14, fontWeight: 800, margin: 0,
                          fontFamily: 'var(--font-display)', letterSpacing: '-0.2px',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {event.title}
                        </p>
                        <span style={{
                          padding: '2px 8px', borderRadius: 100, fontSize: 9, fontWeight: 800,
                          letterSpacing: '0.07em', flexShrink: 0,
                          background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          {isLive && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s infinite', display: 'inline-block' }} />}
                          {st.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4B5563', fontSize: 11, fontWeight: 600 }}>
                          <Calendar size={10} color="#4B5563" />
                          {fmtDate(event.date_start)} · {fmtTime(event.date_start)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4B5563', fontSize: 11, fontWeight: 600 }}>
                          <Users size={10} color="#4B5563" />
                          {event._count} {event._count === 1 ? 'attendee' : 'attendees'}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div style={{ padding: '0 18px 0 8px', flexShrink: 0 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 10,
                        background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <ChevronRight size={15} color="#A855F7" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .cc-event-card:hover {
          border-color: rgba(168,85,247,0.35) !important;
          box-shadow: 0 8px 32px rgba(168,85,247,0.12) !important;
        }
      `}</style>
    </div>
  )
}

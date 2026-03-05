'use client'

import Link from 'next/link'
import { CheckCircle, XCircle, AlertCircle, CreditCard, Bell, ChevronRight } from 'lucide-react'

type Registration = {
  id: string; status: string; payment_status: string
  reviewed_at: string | null; created_at: string
  event: { id: string; title: string; cover_image_url: string | null; date_start: string } | null
}

function fmtRelative(iso: string | null) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function getNotif(reg: Registration): { icon: typeof Bell; color: string; bg: string; title: string; body: string; cta?: { label: string; href: string } } | null {
  const event = reg.event
  if (!event) return null
  const name = event.title

  if (reg.status === 'rejected') return {
    icon: XCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.1)',
    title: 'Application Declined',
    body: `Your application for "${name}" was not accepted this time.`,
  }

  if (reg.status === 'approved' && reg.payment_status === 'pending') return {
    icon: AlertCircle, color: '#FFC745', bg: 'rgba(255,199,69,0.1)',
    title: 'Payment Required',
    body: `You've been approved for "${name}". Complete payment to confirm your spot.`,
    cta: { label: 'Pay Now', href: `/guest/tikkit` },
  }

  if (reg.status === 'approved' && reg.payment_status === 'submitted') return {
    icon: CreditCard, color: '#F97316', bg: 'rgba(249,115,22,0.1)',
    title: 'Payment Under Review',
    body: `Your payment for "${name}" is being reviewed by the organizer.`,
  }

  if (reg.status === 'approved' && (reg.payment_status === 'confirmed' || reg.payment_status === 'not_required')) return {
    icon: CheckCircle, color: '#22C55E', bg: 'rgba(34,197,94,0.1)',
    title: 'You\'re In! 🎉',
    body: `Your spot at "${name}" is confirmed. Check your tickets for the QR code.`,
    cta: { label: 'View Ticket', href: '/guest/tikkit' },
  }

  return null
}

export default function GuestNotificationsClient({ registrations }: { registrations: Registration[] }) {
  const notifs = registrations.map(r => ({ reg: r, notif: getNotif(r) })).filter(n => n.notif !== null)

  return (
    <div style={{ padding: '20px 18px 8px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.5px', margin: '0 0 20px' }}>
        Notifications
      </h1>

      {notifs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.03)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Bell size={22} color="#1F2937" />
          </div>
          <p style={{ color: '#374151', fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>All caught up</p>
          <p style={{ color: '#1F2937', fontSize: 13, margin: 0 }}>Notifications about your event applications will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notifs.map(({ reg, notif }) => {
            if (!notif) return null
            const Icon = notif.icon
            return (
              <div key={reg.id} style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {/* Icon */}
                <div style={{ width: 40, height: 40, borderRadius: 12, background: notif.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={notif.color} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>{notif.title}</p>
                    <span style={{ color: '#374151', fontSize: 11, flexShrink: 0, marginLeft: 8 }}>{fmtRelative(reg.reviewed_at ?? reg.created_at)}</span>
                  </div>
                  <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 8px', lineHeight: 1.5 }}>{notif.body}</p>

                  {/* Cover image + event date */}
                  {reg.event?.cover_image_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <img src={reg.event.cover_image_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                      <span style={{ color: '#374151', fontSize: 12 }}>
                        {new Date(reg.event.date_start).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}

                  {notif.cta && (
                    <Link href={notif.cta.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: notif.bg, border: `1px solid ${notif.color}30`, borderRadius: 20, textDecoration: 'none' }}>
                      <span style={{ color: notif.color, fontSize: 12, fontWeight: 700 }}>{notif.cta.label}</span>
                      <ChevronRight size={12} color={notif.color} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
'use client'

import { MessageCircle } from 'lucide-react'
import { supportWhatsAppUrl } from '@/lib/contact'

type Props = {
  userId: string
  userName: string
  userType: 'organizer' | 'attendee'
  variant?: 'card' | 'inline'
}

// Support runs over WhatsApp. This replaces the old in-app ticketing form.
export default function ReportProblemSection({ userName, userType, variant = 'card' }: Props) {
  const url = supportWhatsAppUrl(
    `Hi TIKKIT X, I need help. I am ${userName} (${userType === 'organizer' ? 'organizer' : 'attendee'}).`
  )

  const body = (
    <>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
        Something not working, a payment issue, or a dispute? Message us on WhatsApp.
        We usually reply within 30 minutes.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
      >
        <MessageCircle size={16} />
        Message us on WhatsApp
      </a>
    </>
  )

  if (variant === 'inline') return <div>{body}</div>

  return (
    <div
      style={{
        background: 'var(--card-fill, rgba(255,255,255,0.03))',
        border: '1px solid var(--border-faint)',
        borderRadius: 16,
        padding: 20,
        marginTop: 24,
      }}
    >
      <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>
        Report a problem
      </h3>
      {body}
    </div>
  )
}

import Link from 'next/link'
import { CalendarDays } from 'lucide-react'

export default function OrganizerNotFound() {
  return (
    <div style={{
      background: '#080A10', minHeight: '100svh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center',
    }}>
      <CalendarDays style={{ width: 40, height: 40, color: '#374151', marginBottom: 16 }} />
      <h1 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
        Organizer not found
      </h1>
      <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px' }}>
        This profile doesn&apos;t exist or hasn&apos;t been set up yet.
      </p>
      <Link
        href="/guest/explore"
        style={{
          color: '#1E5EFF', fontSize: 14, textDecoration: 'none',
          border: '1px solid rgba(30,94,255,0.3)', borderRadius: 10,
          padding: '8px 16px',
        }}
      >
        ← Browse Events
      </Link>
    </div>
  )
}

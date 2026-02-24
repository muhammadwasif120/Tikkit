'use client'

import { useState } from 'react'
import { Ticket, Star, Calendar, MapPin, Award, X } from 'lucide-react'

type Pass = {
  id: string
  event_title: string
  event_date: string
  venue_name: string | null
  cover_image_url: string | null
  was_vip: boolean
  ticket_price_paid: number
  pass_number: number | null
  serial: string | null
  issued_at: string
}

// Beautiful individual pass card — designed to look like a ticket stub
function PassCard({ pass, onClick }: { pass: Pass; onClick: () => void }) {
  const date = new Date(pass.event_date)
  const formattedDate = date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
  const formattedTime = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })

  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        background: pass.cover_image_url
          ? 'transparent'
          : 'linear-gradient(135deg, #0D1326 0%, #111827 50%, #0A0C12 100%)',
        borderRadius: 16,
        overflow: 'hidden',
        border: pass.was_vip
          ? '1px solid rgba(255,199,69,0.3)'
          : '1px solid rgba(255,255,255,0.07)',
        position: 'relative',
        transition: 'transform 0.18s',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.01)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
    >
      {/* Cover image or gradient background */}
      {pass.cover_image_url && (
        <div style={{ position: 'relative', height: 110, overflow: 'hidden' }}>
          <img src={pass.cover_image_url} alt={pass.event_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, rgba(10,12,18,0.95) 100%)' }} />
        </div>
      )}

      {/* VIP glow */}
      {pass.was_vip && (
        <div style={{
          position: 'absolute', top: 0, right: 0, left: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #FFC745, transparent)',
        }} />
      )}

      <div style={{ padding: pass.cover_image_url ? '0 14px 14px' : '14px' }}>
        {/* Title + VIP */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <h3 style={{
            color: 'white', fontSize: 15, fontWeight: 700,
            fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.3px',
            margin: 0, lineHeight: 1.3, flex: 1,
          }}>
            {pass.event_title}
          </h3>
          {pass.was_vip && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
              padding: '3px 8px', background: 'rgba(255,199,69,0.15)',
              border: '1px solid rgba(255,199,69,0.3)', borderRadius: 20,
            }}>
              <Star size={9} color="#FFC745" fill="#FFC745" />
              <span style={{ color: '#FFC745', fontSize: 10, fontWeight: 700 }}>VIP</span>
            </div>
          )}
        </div>

        {/* Date + Venue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={11} color="#4B5563" />
            <span style={{ color: '#6B7280', fontSize: 12 }}>{formattedDate} · {formattedTime}</span>
          </div>
          {pass.venue_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={11} color="#4B5563" />
              <span style={{ color: '#6B7280', fontSize: 12 }}>{pass.venue_name}</span>
            </div>
          )}
        </div>

        {/* Ticket stub divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          margin: '0 -14px 12px',
        }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#0A0C12', flexShrink: 0 }} />
          <div style={{ flex: 1, borderTop: '1.5px dashed rgba(255,255,255,0.08)' }} />
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#0A0C12', flexShrink: 0 }} />
        </div>

        {/* Serial + pass number */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#374151', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', margin: '0 0 2px' }}>SERIAL</p>
            <p style={{ color: '#4F8AFF', fontSize: 12, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.05em', margin: 0 }}>
              {pass.serial ?? '—'}
            </p>
          </div>
          {pass.pass_number && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#374151', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', margin: '0 0 2px' }}>PASS NO.</p>
              <p style={{ color: '#6B7280', fontSize: 12, fontWeight: 600, margin: 0 }}>#{pass.pass_number}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Full-screen pass detail modal
function PassModal({ pass, onClose }: { pass: Pass; onClose: () => void }) {
  const date = new Date(pass.event_date)
  const formattedDate = date.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const formattedTime = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
  const issuedDate = new Date(pass.issued_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0',
    }} onClick={onClose}>
      <div
        style={{
          background: '#13151E', borderRadius: '24px 24px 0 0',
          border: '1px solid rgba(255,255,255,0.07)',
          width: '100%', maxWidth: 480,
          padding: '0 0 40px',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cover */}
        <div style={{ position: 'relative', height: 200, background: '#0F1117', overflow: 'hidden' }}>
          {pass.cover_image_url ? (
            <>
              <img src={pass.cover_image_url} alt={pass.event_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(19,21,30,1) 100%)' }} />
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0D1326, #111827)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ticket size={48} color="rgba(30,94,255,0.2)" />
            </div>
          )}
          {/* VIP ribbon */}
          {pass.was_vip && (
            <div style={{
              position: 'absolute', top: 16, right: -24, transform: 'rotate(45deg)',
              background: '#FFC745', color: '#000', fontSize: 10, fontWeight: 800,
              padding: '4px 36px', letterSpacing: '0.1em',
            }}>VIP</div>
          )}
          {/* Close */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, left: 14,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} color="white" />
          </button>
        </div>

        <div style={{ padding: '20px 22px 0' }}>
          {/* Title */}
          <h2 style={{
            color: 'white', fontSize: 22, fontWeight: 800,
            fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.5px',
            margin: '0 0 4px',
          }}>{pass.event_title}</h2>

          {/* Info rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '16px 0' }}>
            {[
              { icon: Calendar, label: formattedDate },
              { icon: Calendar, label: formattedTime },
              ...(pass.venue_name ? [{ icon: MapPin, label: pass.venue_name }] : []),
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={14} color="#4B5563" />
                <span style={{ color: '#9CA3AF', fontSize: 14 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Stub divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '16px -22px' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0A0C12', flexShrink: 0 }} />
            <div style={{ flex: 1, borderTop: '2px dashed rgba(255,255,255,0.07)' }} />
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0A0C12', flexShrink: 0 }} />
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
            {[
              { label: 'SERIAL', value: pass.serial ?? '—', mono: true },
              { label: 'PASS NO.', value: pass.pass_number ? `#${pass.pass_number}` : '—' },
              { label: 'ISSUED', value: issuedDate },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ color: '#374151', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', margin: '0 0 4px' }}>{label}</p>
                <p style={{ color: '#E5E7EB', fontSize: 13, fontWeight: 600, margin: 0, fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Points earned note */}
          <div style={{
            marginTop: 16, padding: '12px 14px',
            background: 'rgba(30,94,255,0.08)', border: '1px solid rgba(30,94,255,0.15)',
            borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Award size={16} color="#4F8AFF" />
            <span style={{ color: '#4F8AFF', fontSize: 13 }}>
              You earned <strong>{pass.was_vip ? '100' : '50'} Social Credits</strong> for attending this event
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PassesClient({ passes }: { passes: Pass[] }) {
  const [selectedPass, setSelectedPass] = useState<Pass | null>(null)

  return (
    <div style={{ padding: '20px 18px 8px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Ticket size={13} color="#4F8AFF" />
          <span style={{ color: '#4F8AFF', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>COLLECTION</span>
        </div>
        <h1 style={{
          color: 'white', fontSize: 26, fontWeight: 800,
          fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.6px', margin: '0 0 4px',
        }}>My Passes</h1>
        <p style={{ color: '#4B5563', fontSize: 14, margin: 0 }}>
          {passes.length > 0 ? `${passes.length} event${passes.length !== 1 ? 's' : ''} attended` : 'Your collectible event passes will appear here'}
        </p>
      </div>

      {passes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{
            width: 64, height: 64, background: 'rgba(255,255,255,0.03)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Ticket size={28} color="#1F2937" />
          </div>
          <p style={{ color: '#374151', fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>No passes yet</p>
          <p style={{ color: '#1F2937', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            Attend events and scan out at the exit<br/>to earn your collectible passes
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {passes.map(pass => (
            <PassCard key={pass.id} pass={pass} onClick={() => setSelectedPass(pass)} />
          ))}
        </div>
      )}

      {selectedPass && (
        <PassModal pass={selectedPass} onClose={() => setSelectedPass(null)} />
      )}
    </div>
  )
}
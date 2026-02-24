'use client'

import { useState } from 'react'
import { Award, Calendar, MapPin, Star, X, Zap } from 'lucide-react'

type Pass = {
  id: string; event_title: string; event_date: string
  venue_name: string | null; cover_image_url: string | null
  was_vip: boolean; ticket_price_paid: number
  pass_number: number | null; serial: string | null; issued_at: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

function PassCard({ pass, onClick }: { pass: Pass; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      background: '#13151E',
      border: pass.was_vip ? '1px solid rgba(255,199,69,0.25)' : '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
      transition: 'transform 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.01)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
    >
      {pass.was_vip && <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #FFC745, transparent)' }} />}

      {/* Cover */}
      <div style={{ height: 100, position: 'relative', background: '#0F1117' }}>
        {pass.cover_image_url ? (
          <>
            <img src={pass.cover_image_url} alt={pass.event_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(19,21,30,0.9), transparent)' }} />
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0D1A3A, #0A0C12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={24} color="rgba(168,85,247,0.3)" />
          </div>
        )}
        {pass.was_vip && (
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', background: 'rgba(255,199,69,0.9)', borderRadius: 20 }}>
            <Star size={9} color="#000" fill="#000" />
            <span style={{ fontSize: 9, fontWeight: 800, color: '#000' }}>VIP</span>
          </div>
        )}
      </div>

      <div style={{ padding: '10px 12px 12px' }}>
        <h3 style={{ color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'Poppins, sans-serif', margin: '0 0 4px', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
          {pass.event_title}
        </h3>
        <p style={{ color: '#4B5563', fontSize: 11, margin: '0 0 8px' }}>{fmtDate(pass.event_date)}</p>

        {/* Stub divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '0 -12px 8px' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#080A0F', flexShrink: 0 }} />
          <div style={{ flex: 1, borderTop: '1px dashed rgba(255,255,255,0.07)' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#080A0F', flexShrink: 0 }} />
        </div>

        <p style={{ color: '#4F8AFF', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', margin: 0, letterSpacing: '0.04em' }}>
          {pass.serial ?? '—'}
        </p>
      </div>
    </div>
  )
}

function PassModal({ pass, onClose }: { pass: Pass; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div style={{ background: '#13151E', borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,0.07)', width: '100%', maxWidth: 480, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {pass.was_vip && <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #FFC745, transparent)' }} />}

        {/* Cover */}
        <div style={{ position: 'relative', height: 180 }}>
          {pass.cover_image_url ? (
            <>
              <img src={pass.cover_image_url} alt={pass.event_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(19,21,30,1) 0%, transparent 50%)' }} />
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0D1A3A, #0A0C12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={48} color="rgba(168,85,247,0.2)" />
            </div>
          )}
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="white" />
          </button>
          {pass.was_vip && (
            <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(255,199,69,0.9)', borderRadius: 20 }}>
              <Star size={11} color="#000" fill="#000" />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#000' }}>VIP</span>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 20px 36px' }}>
          <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.4px', margin: '0 0 12px' }}>
            {pass.event_title}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={14} color="#4B5563" /><span style={{ color: '#9CA3AF', fontSize: 14 }}>{fmtDate(pass.event_date)}</span></div>
            {pass.venue_name && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={14} color="#4B5563" /><span style={{ color: '#9CA3AF', fontSize: 14 }}>{pass.venue_name}</span></div>}
          </div>

          {/* Stub divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '0 -20px 16px' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#080A0F', flexShrink: 0 }} />
            <div style={{ flex: 1, borderTop: '2px dashed rgba(255,255,255,0.06)' }} />
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#080A0F', flexShrink: 0 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'SERIAL', value: pass.serial ?? '—', mono: true },
              { label: 'PASS NO.', value: pass.pass_number ? `#${pass.pass_number}` : '—' },
              { label: 'ISSUED', value: fmtDate(pass.issued_at) },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ color: '#374151', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', margin: '0 0 4px' }}>{label}</p>
                <p style={{ color: '#E5E7EB', fontSize: 12, fontWeight: 600, margin: 0, fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(30,94,255,0.08)', border: '1px solid rgba(30,94,255,0.15)', borderRadius: 12 }}>
            <Zap size={15} color="#4F8AFF" />
            <span style={{ color: '#4F8AFF', fontSize: 13 }}>
              You earned <strong>{pass.was_vip ? '100' : '50'} Social Credits</strong> for this event
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PassesClient({ passes, stats }: { passes: Pass[]; stats: { credit_score: number; total_attended: number } | null }) {
  const [selected, setSelected] = useState<Pass | null>(null)

  return (
    <div style={{ padding: '20px 18px 8px' }}>
      <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.5px', margin: '0 0 4px' }}>Passes</h1>
      <p style={{ color: '#4B5563', fontSize: 14, margin: '0 0 20px' }}>
        {passes.length > 0 ? `${passes.length} collectible pass${passes.length !== 1 ? 'es' : ''}` : 'Earn passes by attending events'}
      </p>

      {/* Stats strip */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          <div style={{ background: '#13151E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px' }}>
            <Zap size={16} color="#4F8AFF" style={{ marginBottom: 6 }} />
            <p style={{ color: 'white', fontSize: 22, fontWeight: 800, fontFamily: 'Poppins, sans-serif', margin: '0 0 2px', letterSpacing: '-0.5px' }}>{stats.credit_score.toLocaleString()}</p>
            <p style={{ color: '#4B5563', fontSize: 12, margin: 0 }}>Social Credits</p>
          </div>
          <div style={{ background: '#13151E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px' }}>
            <Award size={16} color="#A855F7" style={{ marginBottom: 6 }} />
            <p style={{ color: 'white', fontSize: 22, fontWeight: 800, fontFamily: 'Poppins, sans-serif', margin: '0 0 2px', letterSpacing: '-0.5px' }}>{passes.length}</p>
            <p style={{ color: '#4B5563', fontSize: 12, margin: 0 }}>Events Attended</p>
          </div>
        </div>
      )}

      {passes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: 60, height: 60, background: 'rgba(168,85,247,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Award size={26} color="#A855F7" />
          </div>
          <p style={{ color: '#374151', fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>No passes yet</p>
          <p style={{ color: '#1F2937', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            Attend an event and scan out at the exit<br />to earn your first collectible pass
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {passes.map(pass => <PassCard key={pass.id} pass={pass} onClick={() => setSelected(pass)} />)}
        </div>
      )}

      {selected && <PassModal pass={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
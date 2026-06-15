'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, ChevronRight, Calendar, MapPin, Banknote, User } from 'lucide-react'
import { createDeal, updateDealStage, type DealStage, type EventTypeTag } from '@/app/actions/vendorXActions'
import { format } from 'date-fns'

/* ─── Types ── */
type Deal = {
  id: string; client_name: string; event_name: string
  event_date: string | null; event_type: EventTypeTag; event_location: string | null
  quote_value: number; stage: DealStage; notes: string | null
  created_at: string; updated_at: string
}

/* ─── Stage config ── */
const STAGES: { key: DealStage; label: string; color: string; bg: string }[] = [
  { key: 'new_inquiry',       label: 'New Inquiry',        color: '#A0AEC0', bg: 'rgba(160,174,192,0.08)' },
  { key: 'quote_sent',        label: 'Quote Sent',         color: '#00E5FF', bg: 'rgba(0,229,255,0.08)'   },
  { key: 'negotiating',       label: 'Negotiating',        color: '#CC00FF', bg: 'rgba(204,0,255,0.08)'   },
  { key: 'deposit_confirmed', label: 'Deposit Confirmed',  color: '#F6C90E', bg: 'rgba(246,201,14,0.08)'  },
  { key: 'confirmed',         label: 'Confirmed',          color: '#48BB78', bg: 'rgba(72,187,120,0.08)'  },
  { key: 'event_day',         label: 'Event Day',          color: '#ED8936', bg: 'rgba(237,137,54,0.08)'  },
  { key: 'fulfilled',         label: 'Fulfilled ✓',        color: '#48BB78', bg: 'rgba(72,187,120,0.06)'  },
  { key: 'lost',              label: 'Lost ✗',             color: '#FC8181', bg: 'rgba(252,129,129,0.06)' },
]

const EVENT_TYPES: EventTypeTag[] = ['wedding', 'corporate', 'concert', 'festival', 'private', 'other']

const C = {
  black:   '#050508',
  cyan:    '#00E5FF',
  surface: '#0D0D14',
  border:  'rgba(0,229,255,0.1)',
  muted:   'rgba(255,255,255,0.35)',
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '9px 12px', color: '#FFFFFF', fontSize: 13,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

/* ─── New Deal Drawer ── */
function NewDealDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: (d: Deal) => void }) {
  const [clientName, setClientName]       = useState('')
  const [clientContact, setClientContact] = useState('')
  const [eventName, setEventName]         = useState('')
  const [eventDate, setEventDate]         = useState('')
  const [eventType, setEventType]         = useState<EventTypeTag>('other')
  const [eventLocation, setLocation]      = useState('')
  const [quoteValue, setQuoteValue]       = useState('')
  const [notes, setNotes]                 = useState('')
  const [busy, setBusy]                   = useState(false)
  const [err, setErr]                     = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!clientName.trim()) { setErr('Client name is required'); return }
    if (!eventName.trim())  { setErr('Event name is required');  return }
    setBusy(true); setErr(null)
    const fd = new FormData()
    fd.append('client_name',    clientName.trim())
    fd.append('client_contact', clientContact.trim())
    fd.append('event_name',     eventName.trim())
    fd.append('event_date',     eventDate)
    fd.append('event_type',     eventType)
    fd.append('event_location', eventLocation.trim())
    fd.append('quote_value',    quoteValue || '0')
    fd.append('notes',          notes.trim())
    const res = await createDeal(fd)
    setBusy(false)
    if (res?.error) { setErr(res.error); return }
    if (res?.deal) onCreated(res.deal as Deal)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#0D0D14', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, padding: '24px 24px 40px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 800, margin: 0 }}>New Deal</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Client Name *</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ahmad Events Co." style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Contact (phone/email)</label>
              <input value={clientContact} onChange={e => setClientContact(e.target.value)} placeholder="+92 300 0000000" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Event Name *</label>
            <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="Ali & Sara Wedding" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Date</label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Type</label>
              <select value={eventType} onChange={e => setEventType(e.target.value as EventTypeTag)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Quote (PKR)</label>
              <input type="number" value={quoteValue} onChange={e => setQuoteValue(e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Location</label>
            <input value={eventLocation} onChange={e => setLocation(e.target.value)} placeholder="Pearl Continental, Karachi" style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Initial requirements, special requests…" style={{ ...inputStyle, resize: 'none' }} />
          </div>
        </div>

        {err && <p style={{ color: '#CC00FF', fontSize: 12, marginTop: 10 }}>{err}</p>}

        <button
          onClick={handleSubmit}
          disabled={busy}
          style={{ width: '100%', marginTop: 16, padding: '13px', borderRadius: 12, border: 'none', background: busy ? 'rgba(0,229,255,0.3)' : C.cyan, color: '#050508', fontSize: 14, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          {busy ? 'Creating…' : 'Add to Pipeline'}
        </button>
      </div>
    </div>
  )
}

/* ─── Filter Pills ── */
const ALL_FILTERS: { key: string; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: '#FFFFFF' },
  ...STAGES,
]

function FilterPills({ deals, filter, setFilter }: { deals: Deal[]; filter: string; setFilter: (f: DealStage | 'all') => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
      {ALL_FILTERS.map(s => {
        const active = filter === s.key
        const count = s.key === 'all' ? deals.length : deals.filter(d => d.stage === s.key).length
        return (
          <button key={s.key} onClick={() => setFilter(s.key as DealStage | 'all')}
            style={{ padding: '5px 12px', borderRadius: 20, background: active ? 'rgba(0,229,255,0.1)' : 'transparent', border: `1px solid ${active ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.08)'}`, color: active ? '#00E5FF' : C.muted, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            {s.label}<span style={{ marginLeft: 5, opacity: 0.6 }}>{count}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ─── Deal Card ── */
function DealCard({ deal, onStageChange }: { deal: Deal; onStageChange: (id: string, stage: DealStage) => void }) {
  const router = useRouter()
  const stage = STAGES.find(s => s.key === deal.stage)!
  const [moving, setMoving] = useState(false)

  const moveStage = async (direction: 1 | -1) => {
    const idx = STAGES.findIndex(s => s.key === deal.stage)
    const next = STAGES[idx + direction]
    if (!next) return
    setMoving(true)
    await updateDealStage(deal.id, next.key)
    onStageChange(deal.id, next.key)
    setMoving(false)
  }

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${stage.bg.replace('0.08', '0.15')}`,
      borderRadius: 14, padding: '14px', cursor: 'pointer',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onClick={() => router.push(`/vendor/os/deals/${deal.id}`)}
    >
      {/* Stage badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: stage.color, background: stage.bg, border: `1px solid ${stage.color}30`, borderRadius: 20, padding: '2px 8px' }}>
          {stage.label}
        </span>
        <span style={{ color: '#00E5FF', fontSize: 13, fontWeight: 800 }}>
          PKR {deal.quote_value.toLocaleString('en-PK')}
        </span>
      </div>

      {/* Event + client */}
      <p style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700, margin: '0 0 4px', lineHeight: 1.3 }}>{deal.event_name}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.muted, fontSize: 12, marginBottom: 8 }}>
        <User size={11} /> {deal.client_name}
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {deal.event_date && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.muted, fontSize: 11 }}>
            <Calendar size={10} /> {format(new Date(deal.event_date), 'MMM d, yyyy')}
          </span>
        )}
        {deal.event_location && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.muted, fontSize: 11 }}>
            <MapPin size={10} /> {deal.event_location}
          </span>
        )}
      </div>

      {/* Quick stage arrows */}
      <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }} onClick={e => e.stopPropagation()}>
        {STAGES.findIndex(s => s.key === deal.stage) > 0 && (
          <button onClick={() => moveStage(-1)} disabled={moving} style={{ flex: 1, padding: '5px 0', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: C.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Back
          </button>
        )}
        {STAGES.findIndex(s => s.key === deal.stage) < STAGES.length - 1 && (
          <button onClick={() => moveStage(1)} disabled={moving} style={{ flex: 1, padding: '5px 0', borderRadius: 7, background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', color: '#00E5FF', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            Advance →
          </button>
        )}
        <button onClick={() => router.push(`/vendor/os/deals/${deal.id}`)} style={{ padding: '5px 8px', borderRadius: 7, background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: C.muted, cursor: 'pointer' }}>
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}

/* ─── Main Kanban ── */
export default function DealKanbanClient({ deals: initial, vendorId }: { deals: Deal[]; vendorId: string }) {
  const [deals, setDeals] = useState(initial)
  const [showNew, setShowNew] = useState(false)
  const [filter, setFilter] = useState<DealStage | 'all'>('all')

  const handleStageChange = (id: string, stage: DealStage) =>
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d))

  const handleCreated = (d: Deal) => setDeals(prev => [d, ...prev])

  const visible = filter === 'all' ? deals : deals.filter(d => d.stage === filter)

  // Analytics
  const active = deals.filter(d => !['fulfilled', 'lost'].includes(d.stage))
  const fulfilled = deals.filter(d => d.stage === 'fulfilled')
  const lost = deals.filter(d => d.stage === 'lost')
  const closed = fulfilled.length + lost.length
  const winRate = closed > 0 ? Math.round((fulfilled.length / closed) * 100) : null
  const pipelineValue = active.reduce((s, d) => s + d.quote_value, 0)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Deal Pipeline</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{deals.length} deal{deals.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 12, background: C.cyan, border: 'none', color: '#050508', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Plus size={15} /> New Deal
        </button>
      </div>

      {/* Analytics strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Active Pipeline', value: `PKR ${pipelineValue.toLocaleString('en-PK')}`, color: '#00E5FF' },
          { label: 'Active Deals',    value: active.length.toString(),                         color: '#FFFFFF' },
          { label: 'Win Rate',        value: winRate !== null ? `${winRate}%` : '—',            color: '#48BB78' },
          { label: 'Fulfilled',       value: fulfilled.length.toString(),                       color: '#48BB78' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{label}</p>
            <p style={{ color, fontSize: 18, fontWeight: 900, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Stage filter pills */}
      <FilterPills
        deals={deals}
        filter={filter}
        setFilter={setFilter}
      />

      {/* Cards grid */}
      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Banknote size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
          <p style={{ color: C.muted, fontSize: 14 }}>No deals yet. Add your first inquiry.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {visible.map(d => (
            <DealCard key={d.id} deal={d} onStageChange={handleStageChange} />
          ))}
        </div>
      )}

      {showNew && <NewDealDrawer onClose={() => setShowNew(false)} onCreated={handleCreated} />}
    </div>
  )
}

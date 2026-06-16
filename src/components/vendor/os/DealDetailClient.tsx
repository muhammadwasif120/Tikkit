'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, Edit2, Trash2, ChevronRight, FileText, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  updateDeal, updateDealStage, deleteDeal,
  addCrossHire, updateCrossHirePaymentStatus, deleteCrossHire,
  type DealStage, type EventTypeTag,
} from '@/app/actions/vendorXActions'

/* ─── Types ── */
type Deal = {
  id: string; client_name: string; client_contact: string | null
  event_name: string; event_date: string | null; event_type: EventTypeTag
  event_location: string | null; quote_value: number; stage: DealStage
  notes: string | null; created_at: string; updated_at: string
}
type CrossHire = {
  id: string; type: string; supplier_name: string; supplier_contact: string | null
  description: string | null; cost: number; payment_status: string; notes: string | null
}
type Invoice = { id: string; invoice_number: string; total: number; status: string; due_date: string | null }

const STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: 'new_inquiry',       label: 'New Inquiry',       color: '#A0AEC0' },
  { key: 'quote_sent',        label: 'Quote Sent',        color: '#00E5FF' },
  { key: 'negotiating',       label: 'Negotiating',       color: '#CC00FF' },
  { key: 'deposit_confirmed', label: 'Deposit Confirmed', color: '#F6C90E' },
  { key: 'confirmed',         label: 'Confirmed',         color: '#48BB78' },
  { key: 'event_day',         label: 'Event Day',         color: '#ED8936' },
  { key: 'fulfilled',         label: 'Fulfilled ✓',       color: '#48BB78' },
  { key: 'lost',              label: 'Lost ✗',            color: '#FC8181' },
]
const EVENT_TYPES: EventTypeTag[] = ['wedding', 'corporate', 'concert', 'festival', 'private', 'other']
const HIRE_TYPES = ['sub_contractor', 'equipment_rental', 'transport', 'other']
const HIRE_PAYMENT_STATUSES = ['pending', 'partially_paid', 'paid'] as const

const C = {
  black: '#050508', cyan: '#00E5FF', surface: '#0D0D14',
  border: 'rgba(0,229,255,0.1)', muted: 'rgba(255,255,255,0.35)',
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '9px 12px', color: '#FFFFFF', fontSize: 13,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

/* ─── Section card wrapper ── */
function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
        <p style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700, margin: 0 }}>{title}</p>
        {action}
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  )
}

export default function DealDetailClient({
  deal: initial, crossHires: initialHires, invoices, vendorId,
}: {
  deal: Deal; crossHires: CrossHire[]; invoices: Invoice[]; vendorId: string
}) {
  const router = useRouter()
  const [deal, setDeal]             = useState(initial)
  const [hires, setHires]           = useState(initialHires)
  const [editing, setEditing]       = useState(false)
  const [addingHire, setAddingHire] = useState(false)
  const [busy, setBusy]             = useState(false)

  // Edit form state
  const [eClientName, setEClientName]     = useState(deal.client_name)
  const [eClientContact, setEContact]     = useState(deal.client_contact ?? '')
  const [eEventName, setEEventName]       = useState(deal.event_name)
  const [eEventDate, setEEventDate]       = useState(deal.event_date ?? '')
  const [eEventType, setEEventType]       = useState<EventTypeTag>(deal.event_type)
  const [eLocation, setELocation]         = useState(deal.event_location ?? '')
  const [eQuoteValue, setEQuoteValue]     = useState(deal.quote_value.toString())
  const [eNotes, setENotes]               = useState(deal.notes ?? '')

  // Cross-hire form
  const [hType, setHType]             = useState('sub_contractor')
  const [hSupplier, setHSupplier]     = useState('')
  const [hContact, setHContact]       = useState('')
  const [hDesc, setHDesc]             = useState('')
  const [hCost, setHCost]             = useState('')
  const [hNotes, setHNotes]           = useState('')
  const [hErr, setHErr]               = useState<string | null>(null)

  const stage = STAGES.find(s => s.key === deal.stage)!
  const totalHireCost = hires.reduce((s, h) => s + h.cost, 0)
  const netMarginPKR  = deal.quote_value - totalHireCost
  const netMarginPct  = deal.quote_value > 0 ? ((netMarginPKR / deal.quote_value) * 100).toFixed(1) : null

  const handleSaveEdit = async () => {
    setBusy(true)
    const fd = new FormData()
    fd.append('client_name', eClientName); fd.append('client_contact', eClientContact)
    fd.append('event_name', eEventName);   fd.append('event_date', eEventDate)
    fd.append('event_type', eEventType);   fd.append('event_location', eLocation)
    fd.append('quote_value', eQuoteValue); fd.append('notes', eNotes)
    await updateDeal(deal.id, fd)
    setDeal(d => ({
      ...d, client_name: eClientName, client_contact: eClientContact || null,
      event_name: eEventName, event_date: eEventDate || null, event_type: eEventType,
      event_location: eLocation || null, quote_value: parseFloat(eQuoteValue) || 0,
      notes: eNotes || null,
    }))
    setBusy(false); setEditing(false)
  }

  const handleMoveStage = async (stage: DealStage) => {
    await updateDealStage(deal.id, stage)
    setDeal(d => ({ ...d, stage }))
  }

  const handleDelete = async () => {
    if (!confirm('Delete this deal? This cannot be undone.')) return
    await deleteDeal(deal.id)
    router.push('/vendor/os/deals')
  }

  const handleAddHire = async () => {
    if (!hSupplier.trim()) { setHErr('Supplier name required'); return }
    if (!hCost || isNaN(parseFloat(hCost))) { setHErr('Enter a valid cost'); return }
    setBusy(true); setHErr(null)
    const fd = new FormData()
    fd.append('type', hType); fd.append('supplier_name', hSupplier.trim())
    fd.append('supplier_contact', hContact.trim()); fd.append('description', hDesc.trim())
    fd.append('cost', hCost); fd.append('notes', hNotes.trim())
    const res = await addCrossHire(deal.id, fd)
    setBusy(false)
    if (res?.error) { setHErr(res.error); return }
    if (res?.crossHire) setHires(h => [...h, res.crossHire as CrossHire])
    setHSupplier(''); setHContact(''); setHDesc(''); setHCost(''); setHNotes('')
    setAddingHire(false)
  }

  const cycleHireStatus = async (hire: CrossHire) => {
    const next = hire.payment_status === 'pending' ? 'partially_paid'
      : hire.payment_status === 'partially_paid' ? 'paid' : 'pending'
    await updateCrossHirePaymentStatus(hire.id, next)
    setHires(h => h.map(x => x.id === hire.id ? { ...x, payment_status: next } : x))
  }

  const handleDeleteHire = async (hireId: string) => {
    await deleteCrossHire(hireId, deal.id)
    setHires(h => h.filter(x => x.id !== hireId))
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Back + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
          <ArrowLeft size={15} /> Deals
        </button>
      </div>

      {/* Deal header */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: '20px 20px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: stage.color, background: `${stage.color}18`, border: `1px solid ${stage.color}30`, borderRadius: 20, padding: '2px 8px', marginBottom: 8, display: 'inline-block' }}>
              {stage.label}
            </span>
            {editing ? (
              <input value={eEventName} onChange={e => setEEventName(e.target.value)} style={{ ...inputStyle, fontSize: 18, fontWeight: 800, marginBottom: 4 }} />
            ) : (
              <h1 style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 900, margin: '8px 0 4px', letterSpacing: '-0.4px' }}>{deal.event_name}</h1>
            )}
            <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{deal.client_name}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 12 }}>
            <button onClick={() => setEditing(!editing)} style={{ padding: '7px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
              <Edit2 size={12} /> {editing ? 'Cancel' : 'Edit'}
            </button>
            <button onClick={handleDelete} style={{ padding: '7px 10px', borderRadius: 10, background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.15)', color: '#FC8181', cursor: 'pointer' }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Client Name</label>
                <input value={eClientName} onChange={e => setEClientName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Contact</label>
                <input value={eClientContact} onChange={e => setEContact(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Date</label>
                <input type="date" value={eEventDate} onChange={e => setEEventDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Type</label>
                <select value={eEventType} onChange={e => setEEventType(e.target.value as EventTypeTag)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Quote (PKR)</label>
                <input type="number" value={eQuoteValue} onChange={e => setEQuoteValue(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Location</label>
              <input value={eLocation} onChange={e => setELocation(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Notes</label>
              <textarea value={eNotes} onChange={e => setENotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'none' }} />
            </div>
            <button onClick={handleSaveEdit} disabled={busy} style={{ padding: '10px', borderRadius: 10, background: C.cyan, border: 'none', color: '#050508', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {[
              { label: 'Client',    value: deal.client_name },
              { label: 'Contact',   value: deal.client_contact ?? '—' },
              { label: 'Date',      value: deal.event_date ? format(new Date(deal.event_date), 'MMM d, yyyy') : '—' },
              { label: 'Type',      value: deal.event_type.charAt(0).toUpperCase() + deal.event_type.slice(1) },
              { label: 'Location',  value: deal.event_location ?? '—' },
              { label: 'Quote',     value: `PKR ${deal.quote_value.toLocaleString('en-PK')}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ color: C.muted, fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</p>
                <p style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {!editing && deal.notes && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
            <p style={{ color: C.muted, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{deal.notes}</p>
          </div>
        )}

        {/* Stage selector */}
        {!editing && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
            <p style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>Move stage</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STAGES.map(s => (
                <button
                  key={s.key}
                  onClick={() => handleMoveStage(s.key)}
                  style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: deal.stage === s.key ? 700 : 500,
                    background: deal.stage === s.key ? `${s.color}18` : 'transparent',
                    border: `1px solid ${deal.stage === s.key ? `${s.color}40` : 'rgba(255,255,255,0.08)'}`,
                    color: deal.stage === s.key ? s.color : C.muted,
                    cursor: deal.stage === s.key ? 'default' : 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Margin card */}
      <div style={{ background: C.surface, border: `1px solid rgba(0,229,255,0.15)`, borderRadius: 16, padding: '16px 20px', marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Gross Revenue',   value: `PKR ${deal.quote_value.toLocaleString('en-PK')}`,  color: '#FFFFFF'  },
          { label: 'Total Cross-Hire', value: `PKR ${totalHireCost.toLocaleString('en-PK')}`,   color: '#FC8181'  },
          { label: 'Net Margin',       value: netMarginPct ? `${netMarginPct}%` : '—',           color: netMarginPKR >= 0 ? '#48BB78' : '#FC8181' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <p style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{label}</p>
            <p style={{ color, fontSize: 16, fontWeight: 900, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
            {label === 'Net Margin' && netMarginPct && (
              <p style={{ color: C.muted, fontSize: 11, margin: '2px 0 0' }}>PKR {netMarginPKR.toLocaleString('en-PK')}</p>
            )}
          </div>
        ))}
      </div>

      {/* Cross-hires */}
      <Section
        title={`Cross-Hires (${hires.length})`}
        action={
          <button onClick={() => setAddingHire(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: C.cyan, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={12} /> Add
          </button>
        }
      >
        {addingHire && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Type</label>
                <select value={hType} onChange={e => setHType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {HIRE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Supplier Name *</label>
                <input value={hSupplier} onChange={e => setHSupplier(e.target.value)} placeholder="e.g. Sound House" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Supplier Contact</label>
                <input value={hContact} onChange={e => setHContact(e.target.value)} placeholder="+92 / email" style={inputStyle} />
              </div>
              <div>
                <label style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Cost (PKR) *</label>
                <input type="number" value={hCost} onChange={e => setHCost(e.target.value)} placeholder="0" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Description</label>
              <input value={hDesc} onChange={e => setHDesc(e.target.value)} placeholder="What are they providing?" style={inputStyle} />
            </div>
            {hErr && <p style={{ color: '#CC00FF', fontSize: 12, margin: '0 0 8px' }}>{hErr}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleAddHire} disabled={busy} style={{ flex: 1, padding: '9px', borderRadius: 10, background: C.cyan, border: 'none', color: '#050508', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                {busy ? 'Adding…' : 'Add Cross-Hire'}
              </button>
              <button onClick={() => setAddingHire(false)} style={{ padding: '9px 12px', borderRadius: 10, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: C.muted, cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {hires.length === 0 && !addingHire ? (
          <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No sub-hires yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hires.map(hire => {
              const statusColor = hire.payment_status === 'paid' ? '#48BB78' : hire.payment_status === 'partially_paid' ? '#F6C90E' : '#FC8181'
              return (
                <div key={hire.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, margin: 0 }}>{hire.supplier_name}</p>
                      <span style={{ fontSize: 10, color: C.muted, background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '1px 6px' }}>{hire.type.replace('_', ' ')}</span>
                    </div>
                    {hire.description && <p style={{ color: C.muted, fontSize: 11, margin: '2px 0 0' }}>{hire.description}</p>}
                  </div>
                  <span style={{ color: '#FC8181', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    − PKR {hire.cost.toLocaleString('en-PK')}
                  </span>
                  <button onClick={() => cycleHireStatus(hire)} style={{ padding: '4px 8px', borderRadius: 8, background: `${statusColor}18`, border: `1px solid ${statusColor}30`, color: statusColor, fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                    {hire.payment_status.replace('_', ' ')}
                  </button>
                  <button onClick={() => handleDeleteHire(hire.id)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                    <X size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* Linked invoices */}
      <Section
        title={`Invoices (${invoices.length})`}
        action={
          <Link href={`/vendor/os/invoices/new?deal=${deal.id}`} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: C.cyan, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
            <Plus size={12} /> Create
          </Link>
        }
      >
        {invoices.length === 0 ? (
          <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>No invoices yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {invoices.map(inv => {
              const sc = { paid: '#48BB78', sent: '#00E5FF', draft: C.muted, overdue: '#FC8181', partially_paid: '#F6C90E', cancelled: '#A0AEC0' }
              const c = sc[inv.status as keyof typeof sc] ?? C.muted
              return (
                <Link key={inv.id} href={`/vendor/os/invoices/${inv.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none' }}>
                  <FileText size={14} color={C.muted} />
                  <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, flex: 1 }}>{inv.invoice_number}</span>
                  <span style={{ color: '#FFFFFF', fontSize: 13 }}>PKR {inv.total.toLocaleString('en-PK')}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: c, background: `${c}18`, border: `1px solid ${c}30`, borderRadius: 20, padding: '2px 8px' }}>{inv.status}</span>
                  <ChevronRight size={13} color={C.muted} />
                </Link>
              )
            })}
          </div>
        )}
      </Section>
    </div>
  )
}

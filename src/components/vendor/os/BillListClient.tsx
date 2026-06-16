'use client'

import { useState, useTransition } from 'react'
import { createBill, updateBillStatus, deleteBill } from '@/app/actions/vendorXActions'
import { format } from 'date-fns'

const C = {
  surface: '#0D0D14', card: '#111118', border: 'rgba(0,229,255,0.12)',
  cyan: '#00E5FF', magenta: '#CC00FF', muted: 'rgba(255,255,255,0.4)', text: '#FFFFFF',
}

const STATUS_COLORS: Record<string, string> = {
  pending:  '#F6C90E',
  paid:     '#48BB78',
  overdue:  '#FC8181',
  disputed: '#CC00FF',
}

type Bill = {
  id: string; supplier_name: string; bill_number: string | null
  issue_date: string; due_date: string | null; total: number
  status: string; notes: string | null
}

type LineItem = { desc: string; qty: number; unit_price: number }

const inputSt: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 9, boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
}
const labelSt: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: C.muted,
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5,
}

function NewBillForm({ onDone }: { onDone: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<LineItem[]>([{ desc: '', qty: 1, unit_price: 0 }])
  const [tax, setTax] = useState(0)

  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0)

  function addLine() { setItems(p => [...p, { desc: '', qty: 1, unit_price: 0 }]) }
  function removeLine(i: number) { setItems(p => p.filter((_, j) => j !== i)) }
  function setLine(i: number, key: keyof LineItem, val: string) {
    setItems(p => p.map((l, j) => j === i ? { ...l, [key]: key === 'desc' ? val : Number(val) } : l))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('line_items', JSON.stringify(items))
    fd.set('tax', String(tax))
    startTransition(async () => {
      const res = await createBill(fd)
      if (res?.error) setError(res.error)
      else onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
      <p style={{ color: C.cyan, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 16px' }}>New Bill</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelSt}>Supplier Name *</label>
          <input name="supplier_name" required style={inputSt} placeholder="e.g. Al-Noor Sound" />
        </div>
        <div>
          <label style={labelSt}>Bill #</label>
          <input name="bill_number" style={inputSt} placeholder="BILL-001" />
        </div>
        <div>
          <label style={labelSt}>Supplier Phone</label>
          <input name="supplier_phone" style={inputSt} placeholder="+92 300 0000000" />
        </div>
        <div>
          <label style={labelSt}>Supplier Email</label>
          <input name="supplier_email" type="email" style={inputSt} placeholder="supplier@example.com" />
        </div>
        <div>
          <label style={labelSt}>Issue Date *</label>
          <input name="issue_date" type="date" required defaultValue={new Date().toISOString().slice(0,10)} style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>Due Date</label>
          <input name="due_date" type="date" style={inputSt} />
        </div>
      </div>

      {/* Line items */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ ...labelSt, marginBottom: 8 }}>Line Items</p>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 100px 28px', gap: 6, marginBottom: 6 }}>
            <input value={item.desc} onChange={e => setLine(i, 'desc', e.target.value)} style={inputSt} placeholder="Description" />
            <input value={item.qty} type="number" min={1} onChange={e => setLine(i, 'qty', e.target.value)} style={inputSt} />
            <input value={item.unit_price} type="number" min={0} onChange={e => setLine(i, 'unit_price', e.target.value)} style={inputSt} placeholder="Unit PKR" />
            <button type="button" onClick={() => removeLine(i)} style={{ background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.2)', borderRadius: 7, color: '#FC8181', cursor: 'pointer', fontSize: 14 }}>×</button>
          </div>
        ))}
        <button type="button" onClick={addLine} style={{ fontSize: 12, color: C.cyan, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>+ Add line</button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelSt}>Tax (PKR)</label>
          <input type="number" min={0} value={tax} onChange={e => setTax(Number(e.target.value))} style={inputSt} />
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <p style={{ fontSize: 12, color: C.muted, margin: '0 0 4px' }}>Total</p>
          <p style={{ fontSize: 20, fontWeight: 900, color: C.cyan, margin: 0 }}>PKR {(subtotal + tax).toLocaleString('en-PK')}</p>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelSt}>Notes</label>
        <textarea name="notes" rows={2} style={{ ...inputSt, resize: 'vertical' }} placeholder="Optional notes…" />
      </div>

      {error && <p style={{ color: '#FC8181', fontSize: 12, margin: '0 0 10px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={isPending} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${C.cyan},${C.magenta})`, color: '#050508', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', opacity: isPending ? 0.7 : 1 }}>
          {isPending ? 'Saving…' : 'Save Bill'}
        </button>
        <button type="button" onClick={onDone} style={{ padding: '9px 20px', borderRadius: 10, border: `1px solid rgba(255,255,255,0.1)`, background: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function BillCard({ bill, onRefresh }: { bill: Bill; onRefresh: () => void }) {
  const [isPending, startTransition] = useTransition()
  const color = STATUS_COLORS[bill.status] ?? C.muted

  function markStatus(status: string) {
    startTransition(async () => { await updateBillStatus(bill.id, status); onRefresh() })
  }
  function handleDelete() {
    if (!confirm('Delete this bill?')) return
    startTransition(async () => { await deleteBill(bill.id); onRefresh() })
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <p style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: 0 }}>{bill.supplier_name}</p>
          {bill.bill_number && <span style={{ fontSize: 11, color: C.muted }}>#{bill.bill_number}</span>}
          <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 20, padding: '2px 8px', marginLeft: 'auto' }}>{bill.status}</span>
        </div>
        <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>
          Issued {format(new Date(bill.issue_date), 'd MMM yyyy')}
          {bill.due_date && <> · Due {format(new Date(bill.due_date), 'd MMM yyyy')}</>}
        </p>
      </div>
      <p style={{ color: C.cyan, fontSize: 16, fontWeight: 900, margin: 0, flexShrink: 0 }}>PKR {bill.total.toLocaleString('en-PK')}</p>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {bill.status !== 'paid' && (
          <button onClick={() => markStatus('paid')} disabled={isPending} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(72,187,120,0.3)', background: 'rgba(72,187,120,0.1)', color: '#48BB78', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            Mark Paid
          </button>
        )}
        {bill.status === 'pending' && (
          <button onClick={() => markStatus('overdue')} disabled={isPending} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(252,129,129,0.3)', background: 'rgba(252,129,129,0.1)', color: '#FC8181', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            Overdue
          </button>
        )}
        <button onClick={handleDelete} disabled={isPending} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'none', color: C.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
          Delete
        </button>
      </div>
    </div>
  )
}

export default function BillListClient({ initialBills }: { initialBills: Bill[] }) {
  const [bills, setBills] = useState(initialBills)
  const [tab, setTab] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')
  const [showForm, setShowForm] = useState(false)

  const filtered = tab === 'all' ? bills : bills.filter(b => b.status === tab)
  const counts = {
    all: bills.length,
    pending: bills.filter(b => b.status === 'pending').length,
    paid: bills.filter(b => b.status === 'paid').length,
    overdue: bills.filter(b => b.status === 'overdue').length,
  }

  // Optimistic refresh: just re-filter; real data comes on next server render
  function onRefresh() { window.location.reload() }

  const TABS: { key: typeof tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'paid', label: 'Paid' },
    { key: 'overdue', label: 'Overdue' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: C.text, fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.4px' }}>Bills</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Incoming invoices from your suppliers.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ padding: '9px 18px', borderRadius: 11, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${C.cyan},${C.magenta})`, color: '#050508', fontSize: 13, fontWeight: 800, fontFamily: 'inherit' }}>
          {showForm ? 'Cancel' : '+ New Bill'}
        </button>
      </div>

      {showForm && <NewBillForm onDone={() => { setShowForm(false); onRefresh() }} />}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '6px 14px', borderRadius: 20, border: tab === t.key ? `1px solid ${C.cyan}` : '1px solid rgba(255,255,255,0.1)',
            background: tab === t.key ? 'rgba(0,229,255,0.1)' : 'none',
            color: tab === t.key ? C.cyan : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {t.label} <span style={{ opacity: 0.6 }}>({counts[t.key]})</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <p style={{ color: C.muted, fontSize: 14, textAlign: 'center', padding: '40px 0' }}>No bills here.</p>
        ) : (
          filtered.map(b => <BillCard key={b.id} bill={b} onRefresh={onRefresh} />)
        )}
      </div>
    </div>
  )
}

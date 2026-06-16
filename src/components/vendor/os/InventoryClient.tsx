'use client'

import { useState, useTransition } from 'react'
import { createInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/app/actions/vendorXActions'

const C = {
  surface: '#0D0D14', card: '#111118', border: 'rgba(0,229,255,0.12)',
  cyan: '#00E5FF', magenta: '#CC00FF', muted: 'rgba(255,255,255,0.4)', text: '#FFFFFF',
}

const CATEGORIES = ['Audio', 'Lighting', 'Staging / Decor', 'AV & Video', 'Transport', 'Generator / Power', 'Other']
const CONDITIONS  = ['Excellent', 'Good', 'Fair', 'Needs Repair', 'Retired']

const COND_COLOR: Record<string, string> = {
  'Excellent': '#48BB78', 'Good': '#00E5FF', 'Fair': '#F6C90E',
  'Needs Repair': '#FC8181', 'Retired': 'rgba(255,255,255,0.3)',
}

type Item = {
  id: string; name: string; category: string
  quantity: number; available_quantity: number
  condition: string; description: string | null
  purchase_value: number | null; daily_hire_rate: number | null
  notes: string | null
}

const inputSt: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 8, boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
}
const labelSt: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: C.muted,
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4,
}

function ItemForm({ item, onDone }: { item?: Item; onDone: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = item
        ? await updateInventoryItem(item.id, fd)
        : await createInventoryItem(fd)
      if (res?.error) setError(res.error)
      else onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
      <p style={{ color: C.cyan, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 14px' }}>
        {item ? 'Edit Item' : 'Add Item'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelSt}>Name *</label>
          <input name="name" required defaultValue={item?.name} style={inputSt} placeholder="e.g. Yamaha QL5 Console" />
        </div>
        <div>
          <label style={labelSt}>Category *</label>
          <select name="category" defaultValue={item?.category ?? 'Other'} style={{ ...inputSt, appearance: 'none', cursor: 'pointer' }}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelSt}>Condition *</label>
          <select name="condition" defaultValue={item?.condition ?? 'Good'} style={{ ...inputSt, appearance: 'none', cursor: 'pointer' }}>
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelSt}>Total Qty *</label>
          <input name="quantity" type="number" min={1} required defaultValue={item?.quantity ?? 1} style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>Available Qty</label>
          <input name="available_quantity" type="number" min={0} defaultValue={item?.available_quantity ?? 1} style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>Purchase Value (PKR)</label>
          <input name="purchase_value" type="number" min={0} defaultValue={item?.purchase_value ?? ''} style={inputSt} placeholder="0" />
        </div>
        <div>
          <label style={labelSt}>Daily Hire Rate (PKR)</label>
          <input name="daily_hire_rate" type="number" min={0} defaultValue={item?.daily_hire_rate ?? ''} style={inputSt} placeholder="0" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelSt}>Description</label>
          <input name="description" defaultValue={item?.description ?? ''} style={inputSt} placeholder="Short description (optional)" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelSt}>Notes</label>
          <textarea name="notes" rows={2} defaultValue={item?.notes ?? ''} style={{ ...inputSt, resize: 'vertical' }} placeholder="Storage location, serial numbers, etc." />
        </div>
      </div>
      {error && <p style={{ color: '#FC8181', fontSize: 12, margin: '0 0 8px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={isPending} style={{ padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${C.cyan},${C.magenta})`, color: '#050508', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', opacity: isPending ? 0.7 : 1 }}>
          {isPending ? 'Saving…' : item ? 'Update' : 'Add Item'}
        </button>
        <button type="button" onClick={onDone} style={{ padding: '8px 18px', borderRadius: 9, border: `1px solid rgba(255,255,255,0.1)`, background: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
      </div>
    </form>
  )
}

function ItemCard({ item, onRefresh }: { item: Item; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const condColor = COND_COLOR[item.condition] ?? C.muted

  if (editing) return <ItemForm item={item} onDone={() => { setEditing(false); onRefresh() }} />

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>{item.name}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)', color: C.cyan, fontWeight: 700 }}>{item.category}</span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${condColor}12`, border: `1px solid ${condColor}28`, color: condColor, fontWeight: 700 }}>{item.condition}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setEditing(true)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, border: `1px solid rgba(0,229,255,0.2)`, background: 'rgba(0,229,255,0.05)', color: C.cyan, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Edit</button>
          <button onClick={() => { if (!confirm('Delete this item?')) return; startTransition(async () => { await deleteInventoryItem(item.id); onRefresh() }) }} disabled={isPending} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'none', color: C.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Del</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: C.muted, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total</p>
          <p style={{ fontSize: 16, fontWeight: 900, color: C.text, margin: 0 }}>{item.quantity}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: C.muted, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Available</p>
          <p style={{ fontSize: 16, fontWeight: 900, color: item.available_quantity > 0 ? '#48BB78' : '#FC8181', margin: 0 }}>{item.available_quantity}</p>
        </div>
        {item.daily_hire_rate != null && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: C.muted, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Daily Rate</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.cyan, margin: 0 }}>PKR {item.daily_hire_rate.toLocaleString('en-PK')}</p>
          </div>
        )}
        {item.purchase_value != null && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: C.muted, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Book Value</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.muted, margin: 0 }}>PKR {item.purchase_value.toLocaleString('en-PK')}</p>
          </div>
        )}
      </div>
      {item.description && <p style={{ fontSize: 12, color: C.muted, margin: '8px 0 0' }}>{item.description}</p>}
    </div>
  )
}

export default function InventoryClient({ initialItems }: { initialItems: Item[] }) {
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState('All')

  const cats = ['All', ...Array.from(new Set(initialItems.map(i => i.category)))]
  const filtered = filterCat === 'All' ? initialItems : initialItems.filter(i => i.category === filterCat)

  function onRefresh() { window.location.reload() }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: C.text, fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.4px' }}>Inventory</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{initialItems.length} items · track gear, availability, and hire rates.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ padding: '9px 18px', borderRadius: 11, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${C.cyan},${C.magenta})`, color: '#050508', fontSize: 13, fontWeight: 800, fontFamily: 'inherit' }}>
          {showForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {showForm && <ItemForm onDone={() => { setShowForm(false); onRefresh() }} />}

      {/* Category filter */}
      {cats.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              border: filterCat === c ? `1px solid ${C.cyan}` : '1px solid rgba(255,255,255,0.1)',
              background: filterCat === c ? 'rgba(0,229,255,0.1)' : 'none',
              color: filterCat === c ? C.cyan : C.muted,
            }}>{c}</button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {filtered.length === 0
          ? <p style={{ color: C.muted, fontSize: 14, gridColumn: '1/-1', textAlign: 'center', padding: '40px 0' }}>No items yet. Add your first piece of gear.</p>
          : filtered.map(item => <ItemCard key={item.id} item={item} onRefresh={onRefresh} />)
        }
      </div>
    </div>
  )
}

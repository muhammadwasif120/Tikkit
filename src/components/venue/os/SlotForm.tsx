'use client'

import { useActionState } from 'react'
import { createResource } from '@/app/actions/venueActions'
import Link from 'next/link'

const C = { emerald: '#00D4AA', surface: '#0A0F14', border: 'rgba(0,212,170,0.12)', muted: 'rgba(255,255,255,0.4)' }

const input: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14,
  fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
}
const label: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700, color: C.muted,
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
}
const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }
const card: React.CSSProperties = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, marginBottom: 20 }

const DAYS = [
  { value: 1, label: 'Mon' }, { value: 2, label: 'Tue' }, { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' }, { value: 5, label: 'Fri' }, { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
]

export default function SlotForm() {
  const [state, action, pending] = useActionState(
    async (_: unknown, fd: FormData) => {
      const result = await createResource(fd)
      return result
    },
    null
  )

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Add Bookable Resource</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Courts, studios, rooms, tables — anything guests can book by the slot.</p>
      </div>

      <form action={action}>
        {state?.error && (
          <div style={{ background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, color: '#FC8181', fontSize: 13 }}>
            {state.error}
          </div>
        )}

        <div style={card}>
          <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 20px' }}>Resource Details</p>

          <div style={row}>
            <div>
              <label style={label}>Name *</label>
              <input name="name" required placeholder="e.g. Squash Court A" style={input} />
            </div>
            <div>
              <label style={label}>Type</label>
              <select name="resource_type" style={{ ...input, appearance: 'none' }}>
                {['court', 'studio', 'room', 'booth', 'table', 'space', 'lane', 'other'].map(t => (
                  <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={row}>
            <div>
              <label style={label}>Slot Duration (minutes)</label>
              <select name="duration_unit_mins" style={{ ...input, appearance: 'none' }}>
                {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Price per Slot (PKR)</label>
              <input name="price_per_slot" type="number" min="0" step="100" defaultValue="0" style={input} />
            </div>
          </div>

          <div style={row}>
            <div>
              <label style={label}>Open Time</label>
              <input name="open_time" type="time" defaultValue="08:00" style={input} />
            </div>
            <div>
              <label style={label}>Close Time</label>
              <input name="close_time" type="time" defaultValue="22:00" style={input} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Active Days</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DAYS.map(d => (
                <label key={d.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" name="active_days" value={d.value} defaultChecked style={{ accentColor: C.emerald }} />
                  <span style={{ fontSize: 13, color: C.muted }}>{d.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={row}>
            <div>
              <label style={label}>Capacity (pax per slot)</label>
              <input name="capacity" type="number" min="1" defaultValue="1" style={input} />
            </div>
            <div>
              <label style={label}>Buffer between slots (min)</label>
              <input name="buffer_mins" type="number" min="0" step="5" defaultValue="0" style={input} />
            </div>
          </div>

          <div style={row}>
            <div>
              <label style={label}>Min notice (hours)</label>
              <input name="min_notice_hours" type="number" min="0" defaultValue="2" style={input} />
            </div>
            <div>
              <label style={label}>Max advance booking (days)</label>
              <input name="max_advance_days" type="number" min="1" defaultValue="30" style={input} />
            </div>
          </div>

          <div>
            <label style={label}>Description</label>
            <textarea name="description" rows={2} placeholder="Optional details about the space..." style={{ ...input, resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/venue/os/slots" style={{ flex: 1, padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: C.muted, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' as const }}>
            Cancel
          </Link>
          <button type="submit" disabled={pending} style={{ flex: 2, padding: '12px 20px', borderRadius: 12, background: C.emerald, color: '#050508', fontSize: 14, fontWeight: 800, border: 'none', cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.7 : 1, fontFamily: 'inherit' }}>
            {pending ? 'Saving…' : 'Add Resource'}
          </button>
        </div>
      </form>
    </div>
  )
}

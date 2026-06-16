'use client'

import { useActionState } from 'react'
import { createProgramme } from '@/app/actions/venueActions'
import Link from 'next/link'

const C = { emerald: '#00D4AA', violet: '#7C3AED', surface: '#0A0F14', border: 'rgba(0,212,170,0.12)', muted: 'rgba(255,255,255,0.4)' }

const CATEGORIES = [
  { value: 'experience', label: 'Experience' },
  { value: 'fitness',    label: 'Fitness' },
  { value: 'arts',       label: 'Arts & Crafts' },
  { value: 'music',      label: 'Music' },
  { value: 'food',       label: 'Food & Drink' },
  { value: 'wellness',   label: 'Wellness' },
  { value: 'business',   label: 'Business' },
  { value: 'education',  label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other',      label: 'Other' },
]

const RRULE_PRESETS = [
  { value: 'FREQ=WEEKLY;BYDAY=MO',          label: 'Every Monday' },
  { value: 'FREQ=WEEKLY;BYDAY=TU',          label: 'Every Tuesday' },
  { value: 'FREQ=WEEKLY;BYDAY=WE',          label: 'Every Wednesday' },
  { value: 'FREQ=WEEKLY;BYDAY=TH',          label: 'Every Thursday' },
  { value: 'FREQ=WEEKLY;BYDAY=FR',          label: 'Every Friday' },
  { value: 'FREQ=WEEKLY;BYDAY=SA',          label: 'Every Saturday' },
  { value: 'FREQ=WEEKLY;BYDAY=SU',          label: 'Every Sunday' },
  { value: 'FREQ=WEEKLY;BYDAY=SA,SU',       label: 'Every Weekend' },
  { value: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',    label: 'Mon / Wed / Fri' },
  { value: 'FREQ=MONTHLY;BYDAY=1SA',        label: 'First Saturday' },
  { value: 'FREQ=MONTHLY;BYDAY=1SU',        label: 'First Sunday' },
  { value: '',                               label: 'Manual (no recurrence)' },
]

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

export default function ProgrammeForm() {
  const [state, action, pending] = useActionState(
    async (_: unknown, fd: FormData) => {
      const result = await createProgramme(fd)
      return result
    },
    null
  )

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.5px' }}>New Programme</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Create a recurring experience at your venue.</p>
      </div>

      <form action={action}>
        {state?.error && (
          <div style={{ background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, color: '#FC8181', fontSize: 13 }}>
            {state.error}
          </div>
        )}

        <div style={card}>
          <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 20px' }}>Programme Details</p>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Title *</label>
            <input name="title" required placeholder="e.g. Saturday Morning Yoga" style={input} />
          </div>

          <div style={row}>
            <div>
              <label style={label}>Category</label>
              <select name="category" style={{ ...input, appearance: 'none' }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Price (PKR)</label>
              <input name="price" type="number" min="0" step="100" defaultValue="0" style={input} />
            </div>
          </div>

          <div style={row}>
            <div>
              <label style={label}>Start Time</label>
              <input name="start_time" type="time" required defaultValue="10:00" style={input} />
            </div>
            <div>
              <label style={label}>Duration (minutes)</label>
              <select name="duration_mins" style={{ ...input, appearance: 'none' }}>
                {[30,45,60,90,120,150,180].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Recurrence</label>
            <select name="rrule" style={{ ...input, appearance: 'none' }}>
              {RRULE_PRESETS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Capacity per session</label>
            <input name="capacity" type="number" min="1" defaultValue="20" style={input} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Description</label>
            <textarea name="description" rows={3} placeholder="Describe what participants can expect..." style={{ ...input, resize: 'vertical' }} />
          </div>

          <div>
            <label style={label}>Tags (comma-separated)</label>
            <input name="tags" placeholder="yoga, beginner-friendly, outdoor" style={input} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/venue/os/programmes" style={{ flex: 1, padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: C.muted, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' as const }}>
            Cancel
          </Link>
          <button type="submit" disabled={pending} style={{ flex: 2, padding: '12px 20px', borderRadius: 12, background: C.emerald, color: '#050508', fontSize: 14, fontWeight: 800, border: 'none', cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.7 : 1, fontFamily: 'inherit' }}>
            {pending ? 'Creating…' : 'Create Programme'}
          </button>
        </div>
      </form>
    </div>
  )
}

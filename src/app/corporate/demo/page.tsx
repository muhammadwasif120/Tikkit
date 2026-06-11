'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'
import { ArrowRight, CheckCircle, ChevronLeft } from 'lucide-react'
import { submitCorporateLead } from '@/app/actions/corporateLeadActions'

const EVENT_TYPES = [
  'Annual Dinner / Gala',
  'Conference / Seminar',
  'Product Launch / Roadshow',
  'Team Retreat / Offsite',
  'Board / Leadership Meeting',
  'Government / Diplomatic Function',
  'Other',
]

const HEADCOUNTS = ['Under 50', '50–150', '150–500', '500–1,000', '1,000+']

type Field = {
  name: string
  label: string
  type?: string
  placeholder?: string
  required?: boolean
  half?: boolean
}

const FIELDS: Field[] = [
  { name: 'full_name',  label: 'Full name',     placeholder: 'Ahmed Raza',              required: true, half: true },
  { name: 'company',   label: 'Company',        placeholder: 'Habib Bank Limited',       required: true, half: true },
  { name: 'role',      label: 'Your role',      placeholder: 'Head of Corporate Affairs',required: true, half: true },
  { name: 'email',     label: 'Work email',     placeholder: 'ahmed@hbl.com', type: 'email', required: true, half: true },
  { name: 'phone',     label: 'Phone (optional)',placeholder: '+92 300 0000000', type: 'tel', half: true },
]

export default function CorporateDemoPage() {
  const [form, setForm] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function set(name: string, value: string) {
    setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const result = await submitCorporateLead({
      full_name:  form.full_name  ?? '',
      company:    form.company    ?? '',
      role:       form.role       ?? '',
      email:      form.email      ?? '',
      phone:      form.phone,
      event_type: form.event_type ?? '',
      headcount:  form.headcount  ?? '',
      message:    form.message,
    })

    setSubmitting(false)
    if (result.error) {
      setError('Something went wrong. Please email us at corporate@tikkitx.com')
    } else {
      setDone(true)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '13px 16px',
    fontSize: 14,
    color: '#E2E8F0',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#64748B',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 8,
  }

  if (done) {
    return (
      <main style={{ minHeight: '100vh', background: '#0F1724', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 32px',
          }}>
            <CheckCircle size={32} color="#22C55E" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: 0 }}>
            We&apos;ll be in touch.
          </h1>
          <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.75, marginBottom: 40 }}>
            Your demo request has been received. Someone from the Tikkit corporate team
            will reach out within one business day.
          </p>
          <Link
            href="/corporate"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 10,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#CBD5E1', fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}
          >
            <ChevronLeft size={16} /> Back to Corporate
          </Link>
        </div>
      </main>
    )
  }

  return (
    <>
      <style>{`
        body { background: #0F1724 !important; }
        .demo-input:focus { border-color: rgba(74,144,217,0.6) !important; box-shadow: 0 0 0 3px rgba(74,144,217,0.1); }
        .demo-select option { background: #1A2332; color: #E2E8F0; }
        @media (max-width: 600px) { .demo-half { grid-column: 1 / -1 !important; } }
      `}</style>

      <main style={{ minHeight: '100vh', background: '#0F1724', padding: '0 0 80px' }}>

        {/* Header */}
        <header style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TikkitXLogo size="sm" />
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: 'rgba(74,144,217,0.15)', color: '#4A90D9', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Corporate</span>
            </div>
            <Link href="/corporate" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', textDecoration: 'none' }}>
              <ChevronLeft size={14} /> Back
            </Link>
          </div>
        </header>

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 0' }}>

          {/* Heading */}
          <div style={{ marginBottom: 48 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: '#4A90D9', padding: '6px 14px', borderRadius: 100,
              background: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.25)',
              marginBottom: 20,
            }}>
              Book a Demo
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 'clamp(2rem,4.5vw,3rem)', color: '#fff',
              lineHeight: 1.1, letterSpacing: 0, marginBottom: 16,
            }}>
              Let&apos;s talk about your next event.
            </h1>
            <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.7, maxWidth: 520 }}>
              Fill in a few details and the Tikkit corporate team will be in touch within one business day.
              No sales scripts. Just a conversation about your events.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{
              background: '#1A2332',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20,
              padding: '40px',
            }}>

              {/* Two-col grid for short fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                {FIELDS.map(f => (
                  <div key={f.name} className={f.half ? 'demo-half' : ''} style={{ gridColumn: f.half ? undefined : '1 / -1' }}>
                    <label style={labelStyle}>{f.label}{f.required && <span style={{ color: '#4A90D9', marginLeft: 3 }}>*</span>}</label>
                    <input
                      className="demo-input"
                      type={f.type ?? 'text'}
                      placeholder={f.placeholder}
                      required={f.required}
                      value={form[f.name] ?? ''}
                      onChange={e => set(f.name, e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>

              {/* Event type */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Event type<span style={{ color: '#4A90D9', marginLeft: 3 }}>*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {EVENT_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set('event_type', t)}
                      style={{
                        padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                        background: form.event_type === t ? 'rgba(74,144,217,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${form.event_type === t ? 'rgba(74,144,217,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        color: form.event_type === t ? '#4A90D9' : '#94A3B8',
                        transition: 'all 0.15s',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {/* Hidden required input */}
                <input type="text" required value={form.event_type ?? ''} onChange={() => {}} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0 }} tabIndex={-1} />
              </div>

              {/* Expected headcount */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Expected headcount<span style={{ color: '#4A90D9', marginLeft: 3 }}>*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {HEADCOUNTS.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => set('headcount', h)}
                      style={{
                        padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                        background: form.headcount === h ? 'rgba(74,144,217,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${form.headcount === h ? 'rgba(74,144,217,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        color: form.headcount === h ? '#4A90D9' : '#94A3B8',
                        transition: 'all 0.15s',
                      }}
                    >
                      {h}
                    </button>
                  ))}
                </div>
                <input type="text" required value={form.headcount ?? ''} onChange={() => {}} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0 }} tabIndex={-1} />
              </div>

              {/* Message */}
              <div style={{ marginBottom: 32 }}>
                <label style={labelStyle}>Anything else we should know? <span style={{ color: '#334155' }}>(optional)</span></label>
                <textarea
                  className="demo-input"
                  rows={4}
                  placeholder="Tell us about the event — venue, date, specific requirements..."
                  value={form.message ?? ''}
                  onChange={e => set('message', e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
                />
              </div>

              {error && (
                <p style={{ fontSize: 13, color: '#F87171', marginBottom: 20 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%', padding: '16px', borderRadius: 12,
                  background: submitting ? '#1E3A6E' : '#4A90D9',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'background 0.2s',
                }}
              >
                {submitting ? 'Sending…' : <><span>Send demo request</span><ArrowRight size={17} /></>}
              </button>

              <p style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#334155' }}>
                Or email us directly at{' '}
                <a href="mailto:corporate@tikkitx.com" style={{ color: '#4A90D9', textDecoration: 'none' }}>corporate@tikkitx.com</a>
              </p>

            </div>
          </form>
        </div>
      </main>
    </>
  )
}

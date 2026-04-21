'use client'

import { useState } from 'react'
import {
  AlertTriangle, Ticket, XCircle, Scale, KeyRound,
  CreditCard, Bug, Lightbulb, HelpCircle, CheckCircle, Send,
} from 'lucide-react'
import { createSupportQuery } from '@/app/actions/masterActions'

// ─── Category definitions ──────────────────────────────────────────────────

type CategoryKey =
  | 'ticket_registration'
  | 'event_cancellation'
  | 'organizer_dispute'
  | 'attendee_dispute'
  | 'account_access'
  | 'payment_billing'
  | 'technical_bug'
  | 'feature_request'
  | 'other'

type Category = {
  key: CategoryKey
  label: string
  icon: React.ElementType
  color: string
  hint: string
  priority: 'high' | 'medium' | 'low'
  forOrganizer: boolean
  forAttendee: boolean
}

const ALL_CATEGORIES: Category[] = [
  {
    key: 'ticket_registration',
    label: 'Ticket / Registration',
    icon: Ticket,
    color: '#1E5EFF',
    hint: 'Missing ticket, wrong details, or registration not going through',
    priority: 'high',
    forOrganizer: false,
    forAttendee: true,
  },
  {
    key: 'event_cancellation',
    label: 'Event Cancellation / Refund',
    icon: XCircle,
    color: '#EF4444',
    hint: 'Event was cancelled, postponed, or you need a refund',
    priority: 'high',
    forOrganizer: true,
    forAttendee: true,
  },
  {
    key: 'organizer_dispute',
    label: 'Complaint Against Organizer',
    icon: Scale,
    color: '#F97316',
    hint: 'Misconduct, misrepresentation, or unfair treatment by an organizer',
    priority: 'high',
    forOrganizer: false,
    forAttendee: true,
  },
  {
    key: 'attendee_dispute',
    label: 'Attendee Complaint',
    icon: Scale,
    color: '#F97316',
    hint: 'Disruptive, fraudulent, or abusive behaviour from an attendee',
    priority: 'high',
    forOrganizer: true,
    forAttendee: false,
  },
  {
    key: 'account_access',
    label: 'Account Access',
    icon: KeyRound,
    color: '#8B5CF6',
    hint: 'Can\'t log in, password issue, or account locked',
    priority: 'medium',
    forOrganizer: true,
    forAttendee: true,
  },
  {
    key: 'payment_billing',
    label: 'Payment & Billing',
    icon: CreditCard,
    color: '#F59E0B',
    hint: 'Incorrect charge, failed payment, or billing query',
    priority: 'high',
    forOrganizer: true,
    forAttendee: true,
  },
  {
    key: 'technical_bug',
    label: 'Technical Bug',
    icon: Bug,
    color: '#06B6D4',
    hint: 'Something on the app isn\'t working as expected',
    priority: 'medium',
    forOrganizer: true,
    forAttendee: true,
  },
  {
    key: 'feature_request',
    label: 'Feature Request',
    icon: Lightbulb,
    color: '#FACC15',
    hint: 'Suggest an improvement or new capability',
    priority: 'low',
    forOrganizer: true,
    forAttendee: true,
  },
  {
    key: 'other',
    label: 'Other',
    icon: HelpCircle,
    color: 'var(--text-muted)',
    hint: 'Anything else not covered above',
    priority: 'medium',
    forOrganizer: true,
    forAttendee: true,
  },
]

// ─── Props ─────────────────────────────────────────────────────────────────

type Props = {
  userId: string
  userName: string
  userType: 'organizer' | 'attendee'
  /** Display variant — 'card' wraps in a card-style box, 'inline' renders bare */
  variant?: 'card' | 'inline'
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function ReportProblemSection({ userId, userName, userType, variant = 'card' }: Props) {
  const categories = ALL_CATEGORIES.filter(c =>
    userType === 'organizer' ? c.forOrganizer : c.forAttendee
  )

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<CategoryKey | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null) // ticket ID
  const [err, setErr] = useState('')

  const selectedCat = categories.find(c => c.key === selected)

  function handleSelect(key: CategoryKey) {
    setSelected(key)
    setErr('')
    // Pre-fill subject from category label if empty
    const cat = categories.find(c => c.key === key)
    if (cat && !subject) setSubject(cat.label)
  }

  async function handleSubmit() {
    if (!selected) { setErr('Please choose a category.'); return }
    if (!subject.trim()) { setErr('Please enter a subject.'); return }
    if (!body.trim() || body.trim().length < 20) { setErr('Please describe the issue in at least 20 characters.'); return }

    setSubmitting(true)
    setErr('')
    const cat = categories.find(c => c.key === selected)!
    const { error, id } = await createSupportQuery({
      from_name: userName,
      from_type: userType,
      from_id: userId,
      subject: subject.trim(),
      body: body.trim(),
      category: selected,
      priority: cat.priority,
    })
    setSubmitting(false)
    if (error) { setErr('Something went wrong — please try again.'); return }
    setSubmitted(id ?? 'submitted')
  }

  function handleReset() {
    setSelected(null)
    setSubject('')
    setBody('')
    setSubmitted(null)
    setErr('')
  }

  const content = (
    <div>
      {/* Header row */}
      {variant === 'card' && (
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <AlertTriangle size={18} color="#EF4444" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Report a Problem</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '2px 0 0' }}>File a support request or dispute</p>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
            {open ? '▲' : '▼'}
          </span>
        </button>
      )}

      {/* Form body */}
      {(open || variant === 'inline') && (
        <div style={{ marginTop: variant === 'card' ? 20 : 0 }}>
          {submitted ? (
            /* ── Success state ── */
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
              }}>
                <CheckCircle size={24} color="#22C55E" />
              </div>
              <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>
                Report Submitted
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 4px', lineHeight: 1.5 }}>
                Our team will review your report and respond within 1–2 business days.
              </p>
              {submitted !== 'submitted' && (
                <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '8px 0 0', fontFamily: 'monospace' }}>
                  Reference: <span style={{ color: 'var(--text-muted)' }}>{submitted}</span>
                </p>
              )}
              <button
                onClick={handleReset}
                style={{
                  marginTop: 18, padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)', color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Submit another
              </button>
            </div>
          ) : (
            <>
              {/* ── Category pills ── */}
              <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', margin: '0 0 10px', fontFamily: 'var(--font-body)' }}>
                WHAT BEST DESCRIBES YOUR ISSUE?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 8, marginBottom: 18 }}>
                {categories.map(cat => {
                  const active = selected === cat.key
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.key}
                      onClick={() => handleSelect(cat.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                        background: active ? `${cat.color}14` : 'var(--guest-surface-2)',
                        border: `1px solid ${active ? cat.color + '45' : 'var(--guest-border)'}`,
                        color: active ? cat.color : 'var(--text-muted)',
                        fontSize: 12, fontWeight: active ? 700 : 500,
                        fontFamily: 'var(--font-body)', textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Icon size={13} style={{ flexShrink: 0 }} />
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* ── Hint ── */}
              {selectedCat && (
                <div style={{
                  background: `${selectedCat.color}0A`, border: `1px solid ${selectedCat.color}20`,
                  borderRadius: 8, padding: '8px 12px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <selectedCat.icon size={13} color={selectedCat.color} style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ color: selectedCat.color, fontSize: 12, margin: 0, lineHeight: 1.5, opacity: 0.85 }}>
                    {selectedCat.hint}
                  </p>
                </div>
              )}

              {/* ── Subject ── */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
                  SUBJECT
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Brief title of your issue"
                  maxLength={120}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 10,
                    background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)',
                    color: 'white', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* ── Description ── */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
                  DESCRIPTION
                </label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Describe the issue in detail — the more context you provide, the faster we can help."
                  rows={4}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 10, resize: 'vertical',
                    background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)',
                    color: 'white', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                    boxSizing: 'border-box', lineHeight: 1.55,
                  }}
                />
                <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '4px 0 0', textAlign: 'right' }}>
                  {body.length} / 2000
                </p>
              </div>

              {/* ── Error ── */}
              {err && (
                <p style={{ color: '#EF4444', fontSize: 12, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlertTriangle size={12} /> {err}
                </p>
              )}

              {/* ── Submit ── */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 10,
                  background: submitting ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444',
                  fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'background 0.15s',
                }}
              >
                {submitting ? (
                  <>
                    <div style={{ width: 13, height: 13, border: '2px solid rgba(239,68,68,0.3)', borderTopColor: '#EF4444', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Submitting…
                  </>
                ) : (
                  <><Send size={13} /> Submit Report</>
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )

  if (variant === 'inline') return content

  return (
    <div style={{
      background: 'var(--surface-card)', border: '1px solid var(--guest-border)',
      borderRadius: 16, padding: '16px 18px',
    }}>
      {content}
    </div>
  )
}

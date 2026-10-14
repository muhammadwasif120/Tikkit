'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { joinModuleWaitlist, type WaitlistModule } from '@/app/actions/moduleWaitlistActions'

export interface WaitlistTheme {
  accentFrom: string
  accentTo: string
  accentText: string
  buttonTextColor: string
  surface: string
  border: string
  text: string
  muted: string
}

interface Props {
  module: WaitlistModule
  theme: WaitlistTheme
}

export function ModuleWaitlistForm({ module, theme: t }: Props) {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setLoading(true)
    setError('')

    const res = await joinModuleWaitlist({ module, full_name: name, email, phone })

    setLoading(false)
    if ('error' in res && res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${t.border}`,
    borderRadius: 12, color: t.text, fontSize: 15,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  if (success) {
    return (
      <div id="waitlist" style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: `${t.accentFrom}18`, border: `1px solid ${t.accentFrom}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <CheckCircle size={26} color={t.accentFrom} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: t.text, marginBottom: 6 }}>You&apos;re on the list!</div>
        <p style={{ fontSize: 14, color: t.muted, lineHeight: 1.6, margin: 0 }}>We&apos;ll email you the moment this opens up.</p>
      </div>
    )
  }

  return (
    <form id="waitlist" onSubmit={handleSubmit} noValidate style={{ maxWidth: 380, margin: '0 auto', textAlign: 'left' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
        <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
        <input type="tel" placeholder="Phone number (optional)" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
      </div>

      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 14,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          fontSize: 13, color: '#FCA5A5',
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !name.trim() || !email.trim()}
        style={{
          width: '100%', padding: '14px 24px', border: 'none', borderRadius: 12,
          background: loading || !name.trim() || !email.trim()
            ? `${t.accentFrom}26`
            : `linear-gradient(135deg, ${t.accentFrom}, ${t.accentTo})`,
          color: loading || !name.trim() || !email.trim() ? t.muted : t.buttonTextColor,
          fontWeight: 800, fontSize: 15,
          cursor: loading || !name.trim() || !email.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Joining…' : 'Join the Waitlist'}
      </button>
    </form>
  )
}

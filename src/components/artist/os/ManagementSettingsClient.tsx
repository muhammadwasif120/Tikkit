'use client'

import { useState } from 'react'
import { Check, Building2 } from 'lucide-react'
import { updateManagementSettings } from '@/app/actions/artistActions'

const C = {
  black: '#050508', cyan: '#00E5FF', magenta: '#CC00FF',
  surface: '#0D1117', card: '#111820',
  border: 'rgba(0,229,255,0.08)', muted: 'rgba(255,255,255,0.4)', text: '#FFFFFF',
}

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '11px 14px', color: C.text, fontSize: 14,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '5px 0 0' }}>{hint}</p>}
    </div>
  )
}

export default function ManagementSettingsClient({ mgmt }: { mgmt: any }) {
  const [companyName, setCompanyName] = useState(mgmt.company_name ?? '')
  const [email,       setEmail]       = useState(mgmt.contact_email ?? '')
  const [phone,       setPhone]       = useState(mgmt.contact_phone ?? '')
  const [website,     setWebsite]     = useState(mgmt.website ?? '')
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const fd = new FormData()
    fd.append('company_name',  companyName)
    fd.append('contact_email', email)
    fd.append('contact_phone', phone)
    fd.append('website',       website)
    const res = await updateManagementSettings(fd)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ padding: '24px', maxWidth: 560 }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>Settings</p>
        <p style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Management Account</p>
      </div>

      {/* Account info card */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${C.cyan}15, ${C.magenta}15)`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} color={C.cyan} />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{mgmt.company_name}</p>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Account status: <span style={{ color: mgmt.account_status === 'active' ? C.cyan : '#F6C90E', fontWeight: 600 }}>{mgmt.account_status}</span></p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Company / Agency Name">
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your management company name" style={inputStyle} />
          </Field>
          <Field label="Contact Email" hint="Used for Tikkit X correspondence">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@yourcompany.com" style={inputStyle} type="email" />
          </Field>
          <Field label="Contact Phone">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 300 0000000" style={inputStyle} type="tel" />
          </Field>
          <Field label="Website">
            <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourcompany.com" style={inputStyle} type="url" />
          </Field>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.2)', fontSize: 13, color: '#FC8181', marginBottom: 16 }}>{error}</div>
      )}

      <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`, border: 'none', color: C.black, fontSize: 14, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {saved ? <><Check size={14} /> Saved</> : saving ? 'Saving…' : 'Save Settings'}
      </button>

      {/* Read-only info */}
      <div style={{ marginTop: 28, padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>Account ID</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0, fontFamily: 'monospace', wordBreak: 'break-all' }}>{mgmt.id}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', margin: '8px 0 0' }}>To change your account tier or transfer ownership, contact <span style={{ color: C.cyan }}>hello@tikkitx.com</span></p>
      </div>
    </div>
  )
}

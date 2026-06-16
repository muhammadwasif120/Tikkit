'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, ChevronDown } from 'lucide-react'
import { createVendorAccount } from '@/app/actions/vendorXActions'
import { PAKISTAN_CITIES } from '@/lib/pakistanCities'

const CATEGORIES = [
  { value: 'av_production',  label: 'AV / Production',  desc: 'Sound, lighting, video, staging' },
  { value: 'fnb',            label: 'Food & Beverage',  desc: 'Catering, food trucks, beverage' },
  { value: 'human_capital',  label: 'Human Capital',    desc: 'Staff, security, DJs, photographers' },
  { value: 'infrastructure', label: 'Infrastructure',   desc: 'Tenting, furniture, generators, décor' },
]

const C = {
  black:   '#050508',
  cyan:    '#00E5FF',
  magenta: '#CC00FF',
  surface: '#0D0D14',
  border:  'rgba(0,229,255,0.12)',
  muted:   'rgba(255,255,255,0.4)',
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, padding: '11px 14px', color: '#FFFFFF', fontSize: 14,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

export default function VendorOnboardingClient({ userId }: { userId: string }) {
  const router = useRouter()
  const [tradingName, setTradingName]   = useState('')
  const [companyName, setCompanyName]   = useState('')
  const [category, setCategory]         = useState('')
  const [cities, setCities]             = useState<string[]>([])
  const [cityInput, setCityInput]       = useState('')
  const [busy, setBusy]                 = useState(false)
  const [err, setErr]                   = useState<string | null>(null)

  const toggleCity = (c: string) =>
    setCities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const filteredCities = PAKISTAN_CITIES.filter(c =>
    c.toLowerCase().includes(cityInput.toLowerCase())
  ).slice(0, 8)

  const handleSubmit = async () => {
    if (!tradingName.trim()) { setErr('Trading name is required'); return }
    if (!category) { setErr('Please select your primary category'); return }
    setBusy(true); setErr(null)
    try {
      const fd = new FormData()
      fd.append('trading_name', tradingName.trim())
      fd.append('company_name', companyName.trim())
      fd.append('category', category)
      fd.append('cities_covered', JSON.stringify(cities))
      const res = await createVendorAccount(fd)
      if (res?.error) { setErr(res.error); return }
      router.replace('/vendor/os')
    } catch { setErr('Something went wrong. Try again.') }
    finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#00E5FF,#CC00FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={15} color="#050508" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>Vendor X</span>
          </div>
          <h1 style={{ color: '#FFFFFF', fontSize: 26, fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.6px', fontFamily: '"Clash Display", sans-serif' }}>
            Set up your OS
          </h1>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
            Takes 60 seconds. You can edit everything later.
          </p>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px 24px' }}>

          {/* Trading name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Trading Name *
            </label>
            <input
              value={tradingName}
              onChange={e => setTradingName(e.target.value)}
              placeholder="e.g. SoundLab Productions"
              style={inputStyle}
            />
          </div>

          {/* Company name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Company / Firm Name <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional)</span>
            </label>
            <input
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Registered company name if different"
              style={inputStyle}
            />
          </div>

          {/* Category */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Primary Category *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CATEGORIES.map(cat => {
                const sel = category === cat.value
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    style={{
                      padding: '12px 14px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                      background: sel ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${sel ? 'rgba(0,229,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: sel ? '0 0 16px rgba(0,229,255,0.15)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <p style={{ color: sel ? '#00E5FF' : '#FFFFFF', fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>{cat.label}</p>
                    <p style={{ color: C.muted, fontSize: 11, margin: 0, lineHeight: 1.3 }}>{cat.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cities covered */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Cities You Cover <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional)</span>
            </label>
            {cities.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {cities.map(c => (
                  <button key={c} onClick={() => toggleCity(c)} style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', color: '#00E5FF', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {c} ×
                  </button>
                ))}
              </div>
            )}
            <div style={{ position: 'relative' }}>
              <input
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                placeholder="Search cities…"
                style={{ ...inputStyle, paddingRight: 36 }}
              />
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
            </div>
            {cityInput.length > 0 && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, marginTop: 4, overflow: 'hidden' }}>
                {filteredCities.map(c => (
                  <button key={c} onClick={() => { toggleCity(c); setCityInput('') }} style={{ width: '100%', padding: '9px 14px', textAlign: 'left', background: cities.includes(c) ? 'rgba(0,229,255,0.06)' : 'none', border: 'none', borderBottom: `1px solid ${C.border}`, color: cities.includes(c) ? '#00E5FF' : '#FFFFFF', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {c} {cities.includes(c) && '✓'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {err && (
            <div style={{ padding: '10px 14px', background: 'rgba(204,0,255,0.08)', border: '1px solid rgba(204,0,255,0.2)', borderRadius: 10, color: '#CC00FF', fontSize: 13, marginBottom: 16 }}>
              {err}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={busy}
            style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: busy ? 'rgba(0,229,255,0.3)' : '#00E5FF', color: '#050508', fontSize: 15, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {busy ? 'Setting up…' : 'Launch my OS →'}
          </button>

          <p style={{ color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 12 }}>
            Free forever. No credit card required.
          </p>
        </div>
      </div>
    </div>
  )
}

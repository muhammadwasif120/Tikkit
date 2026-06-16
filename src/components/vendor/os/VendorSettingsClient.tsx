'use client'

import { useState, useTransition } from 'react'
import { updateVendorProfile } from '@/app/actions/vendorXActions'

const C = {
  black:   '#050508',
  cyan:    '#00E5FF',
  magenta: '#CC00FF',
  surface: '#0D0D14',
  card:    '#111118',
  border:  'rgba(0,229,255,0.12)',
  muted:   'rgba(255,255,255,0.4)',
  text:    '#FFFFFF',
}

const CATEGORIES = [
  { value: 'av_production',  label: 'AV Production' },
  { value: 'fnb',            label: 'F&B' },
  { value: 'human_capital',  label: 'Human Capital' },
  { value: 'infrastructure', label: 'Infrastructure' },
]

type Vendor = {
  trading_name:      string
  company_name:      string | null
  category:          string
  bio:               string | null
  cities_covered:    string[]
  portfolio_urls:    string[]
  verification_tier: number
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: 10, boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700,
  color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
}

export default function VendorSettingsClient({ vendor }: { vendor: Vendor }) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [bioLen, setBioLen] = useState(vendor.bio?.length ?? 0)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaved(false)
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateVendorProfile(fd)
      if (res?.error) setError(res.error)
      else setSaved(true)
    })
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.4px' }}>
          Profile Settings
        </h1>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
          Update your vendor profile — visible to organisers browsing Vendor X.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
        {/* Card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}>

          {/* Section: Identity */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
            <p style={{ color: C.cyan, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
              Identity
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Trading Name *</label>
                <input
                  name="trading_name"
                  defaultValue={vendor.trading_name}
                  required
                  style={inputStyle}
                  placeholder="e.g. SoundLab Productions"
                />
              </div>
              <div>
                <label style={labelStyle}>Legal / Company Name</label>
                <input
                  name="company_name"
                  defaultValue={vendor.company_name ?? ''}
                  style={inputStyle}
                  placeholder="Registered legal name (optional)"
                />
              </div>
            </div>
          </div>

          {/* Section: Category */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
            <p style={{ color: C.cyan, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
              Category
            </p>
            <label style={labelStyle}>What do you do? *</label>
            <select
              name="category"
              defaultValue={vendor.category}
              required
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Section: Bio */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
            <p style={{ color: C.cyan, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
              Bio
            </p>
            <label style={labelStyle}>Short bio <span style={{ color: bioLen > 260 ? '#FC8181' : C.muted }}>({bioLen}/280)</span></label>
            <textarea
              name="bio"
              defaultValue={vendor.bio ?? ''}
              maxLength={280}
              rows={4}
              onChange={e => setBioLen(e.target.value.length)}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              placeholder="Describe your services, experience, and what sets you apart…"
            />
          </div>

          {/* Section: Coverage */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
            <p style={{ color: C.cyan, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
              Coverage
            </p>
            <label style={labelStyle}>Cities covered <span style={{ color: C.muted, fontWeight: 400, textTransform: 'none' }}>(comma-separated)</span></label>
            <input
              name="cities_covered"
              defaultValue={vendor.cities_covered.join(', ')}
              style={inputStyle}
              placeholder="Karachi, Lahore, Islamabad"
            />
          </div>

          {/* Section: Portfolio */}
          <div style={{ padding: '20px 24px' }}>
            <p style={{ color: C.cyan, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
              Portfolio
            </p>
            <label style={labelStyle}>Portfolio links <span style={{ color: C.muted, fontWeight: 400, textTransform: 'none' }}>(one URL per line)</span></label>
            <textarea
              name="portfolio_urls"
              defaultValue={vendor.portfolio_urls.join('\n')}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.8 }}
              placeholder={'https://yourdemo.com\nhttps://instagram.com/yourpage'}
            />
          </div>
        </div>

        {/* Tier badge (read-only) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: C.cyan, fontWeight: 700 }}>Verification Tier {vendor.verification_tier}</span>
          <span style={{ fontSize: 12, color: C.muted }}>·</span>
          <span style={{ fontSize: 12, color: C.muted }}>
            {vendor.verification_tier === 1 && 'Message TIKKIT X on WhatsApp to get verified and unlock organiser search.'}
            {vendor.verification_tier === 2 && 'Verified vendor — you appear in organiser searches.'}
            {vendor.verification_tier === 3 && 'Elite verified vendor.'}
          </span>
        </div>

        {/* Feedback */}
        {saved && (
          <p style={{ fontSize: 13, color: '#48BB78', margin: '0 0 12px', fontWeight: 600 }}>
            ✓ Profile saved successfully.
          </p>
        )}
        {error && (
          <p style={{ fontSize: 13, color: '#FC8181', margin: '0 0 12px', fontWeight: 600 }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '12px 28px', borderRadius: 12, border: 'none', cursor: isPending ? 'wait' : 'pointer',
            background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`,
            color: '#050508', fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
            opacity: isPending ? 0.7 : 1, transition: 'opacity 0.15s',
          }}
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}

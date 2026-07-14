'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Country, City } from 'country-state-city'
import { Phone, CreditCard, User, Calendar, Users, Globe, MapPin, AlertCircle, ShieldCheck } from 'lucide-react'
import { completeSignupProfile, getProfileForCompletion } from '@/app/actions/profileCompletionActions'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'
import Link from 'next/link'

const ALL_COUNTRIES = Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name))

function Field({ Icon, type, placeholder, value, onChange }: {
  Icon: typeof Phone; type: string; placeholder: string
  value: string; onChange: (v: string) => void
}) {
  const [focus, setFocus] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <Icon size={15} color={focus ? '#FFC745' : '#4B5563'}
        style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color .15s', zIndex: 1 }} />
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          display: 'block', width: '100%', padding: '13px 16px 13px 40px',
          background: focus ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${focus ? '#FFC74555' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 10, color: '#F0F2FF', fontSize: 14, outline: 'none',
          boxSizing: 'border-box' as const, fontFamily: 'var(--font-body)',
          transition: 'background .15s, border-color .15s',
        }}
      />
    </div>
  )
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [role, setRole] = useState<'organizer' | 'guest' | null>(null)

  const [phone, setPhone]   = useState('')
  const [idType, setIdType] = useState<'cnic' | 'passport'>('cnic')
  const [idNumber, setIdNumber] = useState('')
  const [hasIdOnFile, setHasIdOnFile] = useState(false)
  const [company, setCompany] = useState('')
  const [dob, setDob]     = useState('')
  const [gender, setGender] = useState('')
  const [countryIso, setCountryIso] = useState('PK')
  const [city, setCity]   = useState('')

  const cities = useMemo(() =>
    [...new Set((City.getCitiesOfCountry(countryIso) ?? []).map(c => c.name))].sort(),
    [countryIso]
  )

  useEffect(() => {
    (async () => {
      const data = await getProfileForCompletion()
      if (!data) { router.replace('/explore'); return }
      setRole(data.role)
      setPhone(data.phone_number ?? '')
      setCity(data.city ?? '')
      setCompany(data.company_name ?? '')
      setHasIdOnFile(data.hasIdOnFile)
      if (data.id_type === 'passport') setIdType('passport')
      if (data.dob) setDob(data.dob)
      if (data.gender) setGender(data.gender)
      const iso = ALL_COUNTRIES.find(c => c.name === data.country)?.isoCode
      if (iso) setCountryIso(iso)
      setLoading(false)
    })()
  }, [router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)

    if (!phone.trim()) { setErr('Phone number is required'); return }
    if (!hasIdOnFile && !idNumber.trim()) {
      setErr(idType === 'cnic' ? 'CNIC is required for identity verification' : 'Passport number is required for identity verification')
      return
    }
    if (!city) { setErr('Please select your city'); return }
    if (role === 'organizer' && !company.trim()) { setErr('Company or brand name is required'); return }
    if (role === 'guest' && (!dob || !gender)) { setErr('Date of birth and gender are required'); return }

    setBusy(true)
    const res = await completeSignupProfile({
      phone: phone.trim(),
      idType,
      idNumber: hasIdOnFile ? (idNumber.trim() || 'ON_FILE') : idNumber.trim(),
      country: ALL_COUNTRIES.find(c => c.isoCode === countryIso)?.name ?? 'Pakistan',
      city,
      company: role === 'organizer' ? company.trim() : undefined,
      dob: role === 'guest' ? dob : undefined,
      gender: role === 'guest' ? gender : undefined,
    })
    setBusy(false)

    if (res.error) { setErr(res.error); return }
    router.push(role === 'organizer' ? '/dashboard' : '/explore')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080A10' }}>
        <div style={{ color: '#6B7280', fontSize: 13, fontFamily: 'var(--font-body)' }}>Loading…</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px', background: '#080A10', fontFamily: 'var(--font-body)' }}>
      <style>{`::placeholder { color: #374151 !important; }`}</style>
      <div style={{ marginBottom: 32 }}>
        <Link href="/" style={{ display: 'inline-flex', textDecoration: 'none' }}><TikkitXLogo size="lg" /></Link>
      </div>

      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
          background: 'rgba(255,199,69,0.1)', border: '1px solid rgba(255,199,69,0.25)',
          borderRadius: 99, marginBottom: 16,
        }}>
          <ShieldCheck size={12} color="#FFC745" />
          <span style={{ color: '#FFC745', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, fontFamily: 'var(--font-display)' }}>
            One last step
          </span>
        </div>

        <h1 style={{ color: '#F0F2FF', fontSize: 'clamp(24px,4vw,30px)', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-1px', lineHeight: 1.15, fontFamily: 'var(--font-display)' }}>
          Complete your profile
        </h1>
        <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
          Tikkit is a vetted community — we need a few details before you can {role === 'organizer' ? 'run events' : 'RSVP to events'}. Takes under a minute.
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <Field Icon={Phone} type="tel" placeholder="Phone Number" value={phone} onChange={setPhone} />

          <div style={{ display: 'flex', gap: 6, padding: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
            {(['cnic', 'passport'] as const).map(t => (
              <button key={t} type="button" onClick={() => { setIdType(t); setIdNumber('') }}
                style={{
                  flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', borderRadius: 8,
                  background: idType === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: idType === t ? '#F0F2FF' : '#6B7280',
                  fontSize: 12, fontWeight: idType === t ? 700 : 500,
                  transition: 'all .15s', fontFamily: 'var(--font-display)',
                }}>
                {t === 'cnic' ? '🇵🇰 CNIC' : '🌍 Passport'}
              </button>
            ))}
          </div>

          {hasIdOnFile ? (
            <div style={{ padding: '11px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10, fontSize: 12.5, color: '#86EFAC' }}>
              ID already on file — you're set here.
            </div>
          ) : (
            <Field Icon={CreditCard} type="text"
              placeholder={idType === 'cnic' ? 'CNIC Number (xxxxx-xxxxxxx-x)' : 'Passport Number'}
              value={idNumber} onChange={setIdNumber} />
          )}

          {role === 'organizer' ? (
            <Field Icon={User} type="text" placeholder="Company or Brand Name" value={company} onChange={setCompany} />
          ) : (
            <div style={{ display: 'flex', gap: 9 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6, paddingLeft: 4, fontWeight: 500 }}>Date of Birth</div>
                <Field Icon={Calendar} type="date" placeholder="Date of Birth" value={dob} onChange={setDob} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6, paddingLeft: 4, fontWeight: 500 }}>Gender</div>
                <div style={{ position: 'relative' }}>
                  <Users size={15} color={gender ? '#FFC745' : '#4B5563'} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
                  <select value={gender} onChange={e => setGender(e.target.value)}
                    style={{
                      display: 'block', width: '100%', padding: '13px 16px 13px 40px',
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${gender ? '#FFC74555' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 10, color: gender ? '#F0F2FF' : '#9CA3AF', fontSize: 14, outline: 'none',
                      fontFamily: 'var(--font-body)', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
                    }}>
                    <option value="" disabled>Select Gender</option>
                    <option value="male" style={{ background: '#0C0E16' }}>Male</option>
                    <option value="female" style={{ background: '#0C0E16' }}>Female</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Globe size={15} color="#FFC745" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
            <select value={countryIso} onChange={e => { setCountryIso(e.target.value); setCity('') }}
              style={{
                display: 'block', width: '100%', padding: '13px 16px 13px 40px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid #FFC74555',
                borderRadius: 10, color: '#F0F2FF', fontSize: 14, outline: 'none',
                fontFamily: 'var(--font-body)', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
              }}>
              {ALL_COUNTRIES.map(c => (
                <option key={c.isoCode} value={c.isoCode} style={{ background: '#0C0E16' }}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <MapPin size={15} color={city ? '#FFC745' : '#4B5563'} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
            {cities.length > 0 ? (
              <select value={city} onChange={e => setCity(e.target.value)}
                style={{
                  display: 'block', width: '100%', padding: '13px 16px 13px 40px',
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${city ? '#FFC74555' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 10, color: city ? '#F0F2FF' : '#9CA3AF', fontSize: 14, outline: 'none',
                  fontFamily: 'var(--font-body)', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
                }}>
                <option value="" disabled>Select City</option>
                {cities.map((c, i) => <option key={`${c}-${i}`} value={c} style={{ background: '#0C0E16' }}>{c}</option>)}
              </select>
            ) : (
              <Field Icon={MapPin} type="text" placeholder="Your City" value={city} onChange={setCity} />
            )}
          </div>

          {err && (
            <div style={{ display: 'flex', gap: 9, padding: '10px 13px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 9 }}>
              <AlertCircle size={14} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ color: '#FCA5A5', fontSize: 13, lineHeight: 1.5 }}>{err}</span>
            </div>
          )}

          <button type="submit" disabled={busy}
            style={{
              marginTop: 2, padding: '14px', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: busy ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#FFC745,#f59e0b)',
              color: busy ? '#374151' : '#000', cursor: busy ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-display)', transition: 'all .2s',
            }}>
            {busy ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ensureProfileRole } from '@/app/actions/authActions'
import { useRouter } from 'next/navigation'
import {
  Mail, Lock, Eye, EyeOff, User,
  ArrowRight, AlertCircle, ChevronLeft,
  QrCode, Users, CreditCard, BarChart3, Zap,
  Calendar, MapPin, Phone, Globe,
} from 'lucide-react'
import { Country, City } from 'country-state-city'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'
import Link from 'next/link'

const ALL_COUNTRIES = Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name))

type Mode    = null | 'organizer' | 'attendee'
type SubMode = 'login' | 'signup'

// ─── Field ─────────────────────────────────────────────────────────────────

function Field({ Icon, type, placeholder, value, onChange, end, accent }: {
  Icon: typeof Mail; type: string; placeholder: string
  value: string; onChange: (v: string) => void
  end?: React.ReactNode; accent?: string
}) {
  const [focus, setFocus] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <Icon
        size={15}
        color={focus ? (accent ?? '#6B7280') : '#4B5563'}
        style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color .15s', zIndex: 1 }}
      />
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          display: 'block', width: '100%',
          padding: end ? '13px 44px 13px 40px' : '13px 16px 13px 40px',
          background: focus ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${focus ? (accent ? accent + '55' : 'rgba(148,163,184,0.25)') : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 10, color: '#F0F2FF', fontSize: 14, outline: 'none',
          boxSizing: 'border-box' as const, fontFamily: 'var(--font-body)',
          transition: 'background .15s, border-color .15s',
        }}
      />
      {end && (
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
          {end}
        </span>
      )}
    </div>
  )
}

// ─── AuthForm ──────────────────────────────────────────────────────────────

function AuthForm({ mode, onBack }: { mode: Mode; onBack: () => void }) {
  const supabase = createClient()
  const router   = useRouter()
  const isOrg    = mode === 'organizer'
  const accent   = isOrg ? '#1E5EFF' : '#FFC745'
  const btnBg    = isOrg ? 'linear-gradient(135deg,#1E5EFF,#3b82f6)' : 'linear-gradient(135deg,#FFC745,#f59e0b)'
  const btnClr   = isOrg ? '#fff' : '#000'
  const btnGlow  = isOrg ? 'rgba(30,94,255,0.4)' : 'rgba(255,199,69,0.35)'
  const expRole  = isOrg ? 'organizer' : 'guest'

  const [tab,    setTab]    = useState<SubMode>('login')
  const [step,   setStep]   = useState<1 | 2>(1)
  const [name,   setName]   = useState('')
  const [email,  setEmail]  = useState('')
  const [pw,     setPw]     = useState('')
  const [phone,  setPhone]  = useState('')
  const [idType, setIdType] = useState<'cnic' | 'passport'>('cnic')
  const [cnic,   setCnic]   = useState('')
  const [company,setCompany]= useState('')
  const [dob,    setDob]    = useState('')
  const [gender, setGender] = useState('')
  const [countryIso, setCountryIso] = useState('PK')
  const [city,   setCity]   = useState('')
  const [show,   setShow]   = useState(false)

  const cities = useMemo(() =>
    [...new Set((City.getCitiesOfCountry(countryIso) ?? []).map(c => c.name))].sort(),
    [countryIso]
  )
  const [busy,   setBusy]   = useState(false)
  const [err,    setErr]    = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)

  const reset = (t: SubMode) => { setErr(null); setName(''); setEmail(''); setPw(''); setPhone(''); setIdType('cnic'); setCnic(''); setCompany(''); setDob(''); setGender(''); setCountryIso('PK'); setCity(''); setAgreed(false); setStep(1); setTab(t) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    
    if (tab === 'signup' && step === 1) {
      if (!name.trim())  { setErr('Enter your full name'); return }
      if (!email.trim() || !pw) { setErr('Please complete all fields'); return }
      if (pw.length < 8) { setErr('Password must be at least 8 characters'); return }
      setStep(2)
      return
    }

    setBusy(true)
    try {
      if (tab === 'signup' && step === 2) {
        if (!phone.trim()) { setErr('Phone Number is strictly required for security'); return }
        if (!cnic.trim()) { setErr(idType === 'cnic' ? 'CNIC is required for identity verification' : 'Passport Number is required for identity verification'); return }
        
        if (isOrg) {
          if (!company.trim()) { setErr('Company or Brand Name is required'); return }
        } else {
          if (!dob) { setErr('Date of birth is required'); return }
          if (!gender) { setErr('Gender is required for demographic curation'); return }
        }
        if (!city) { setErr('Please select your city'); return }
        if (!agreed) { setErr('Please agree to the Terms & Conditions to continue'); return }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: pw,
          options: { data: { full_name: name.trim(), role: isOrg ? 'organizer' : 'guest' } },
        })

        if (error) {
          setErr(error.message.toLowerCase().includes('already')
            ? 'Email already registered — sign in instead.'
            : error.message)
          return
        }

        if (data.user) {
          // Step 1: guarantee the profile row exists with the correct role.
          // Pass the form role as a hint for accounts created before metadata
          // was added. ensureProfileRole prefers auth.users metadata when set.
          await ensureProfileRole(isOrg ? 'organizer' : 'guest')

          // Step 2: write the extended signup fields (never touches role column)
          await supabase.from('profiles').update({
            phone_number:    phone.trim(),
            company_name:    isOrg ? company.trim() : null,
            id_type:         idType,
            cnic_number:     idType === 'cnic'     ? cnic.trim() : null,
            passport_number: idType === 'passport' ? cnic.trim() : null,
            country:         Country.getCountryByCode(countryIso)?.name ?? 'Pakistan',
            city:            city || null,
          }).eq('id', data.user.id)

          if (!isOrg) {
            await supabase
              .from('guest_profiles')
              .upsert({ 
                 id: data.user.id,
                 date_of_birth: dob,
                 gender: gender
              }, { onConflict: 'id', ignoreDuplicates: false })
          }
          
          router.push(isOrg ? '/dashboard' : '/explore')
        }
      } else if (tab === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: pw,
        })

        if (error) { setErr('Wrong email or password'); return }

        if (data.user) {
          // Fix any profile with wrong role or create missing one.
          // Pass form role as a hint for accounts without metadata.
          await ensureProfileRole(expRole)

          // Re-fetch the profile now that it's been corrected
          const { data: p } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

          const role = p?.role ?? expRole

          // Mismatch logic:
          // - A guest must not use the organizer form
          // - An organizer/admin/staff must not use the guest form
          // Admin and staff are always allowed through the organizer form
          const isWrongForm =
            (expRole === 'organizer' && role === 'guest') ||
            (expRole === 'guest'     && role !== 'guest')

          if (isWrongForm) {
            await supabase.auth.signOut()
            setErr(isOrg
              ? "That's a guest account — use \"Join The Scene\"."
              : "That's an organizer account — use \"Run The Scene\".")
            return
          }

          // Admin → /master, organizer/staff → /dashboard, guest → /explore
          const dest = role === 'guest' ? '/explore'
                     : role === 'admin' ? '/master'
                     : '/dashboard'
          router.push(dest)
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const disabled = busy 
    || (tab === 'login' && (!email.trim() || !pw))
    || (tab === 'signup' && step === 1 && (!name.trim() || !email.trim() || pw.length < 8))
    || (tab === 'signup' && step === 2 && (!phone.trim() || !cnic.trim() || !city || !agreed || (isOrg ? !company.trim() : (!dob || !gender))))

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => { if (tab === 'signup' && step === 2) setStep(1); else onBack(); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#4B5563', fontSize: 13, padding: '0 0 24px',
          display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: 'var(--font-body)', transition: 'color .2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
        onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
      >
        <ChevronLeft size={13} /> {tab === 'signup' && step === 2 ? 'Previous Step' : 'Back'}
      </button>

      {/* Mode pill */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 12px',
        background: `${accent}18`,
        border: `1px solid ${accent}35`,
        borderRadius: 99, marginBottom: 16,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, boxShadow: `0 0 6px ${accent}` }} />
        <span style={{
          color: accent, fontSize: 11, fontWeight: 700,
          letterSpacing: '.08em', textTransform: 'uppercase' as const,
          fontFamily: 'var(--font-display)',
        }}>
          {isOrg ? 'Organizer Access' : 'Guest Pass'}
        </span>
      </div>

      {/* Heading */}
      <h1 style={{
        color: '#F0F2FF', fontSize: 'clamp(26px,4vw,34px)', fontWeight: 800,
        margin: '0 0 6px', letterSpacing: '-1.2px', lineHeight: 1.1,
        fontFamily: 'var(--font-display)',
      }}>
        {tab === 'login' ? 'Welcome back.' : (isOrg ? 'Run the scene.' : 'Join the scene.')}
      </h1>
      <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
        {tab === 'login'
          ? 'Sign in to your Tikkit account.'
          : isOrg ? 'Create your organizer account — free to start.' : 'Create your free account.'}
      </p>

      {/* Tab toggle */}
      <div style={{
        display: 'flex', padding: 3,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, marginBottom: 20, gap: 3,
      }}>
        {(['login', 'signup'] as SubMode[]).map(t => (
          <button
            key={t} onClick={() => reset(t)}
            style={{
              flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer',
              borderRadius: 8,
              background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: tab === t ? '#F0F2FF' : '#6B7280',
              fontSize: 13, fontWeight: tab === t ? 700 : 500,
              transition: 'all .15s', fontFamily: 'var(--font-display)',
            }}
          >
            {t === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {tab === 'login' || (tab === 'signup' && step === 1) ? (
          <>
            {tab === 'signup' && (
              <Field Icon={User} type="text" placeholder="Full name" value={name} onChange={setName} accent={accent} />
            )}
            <Field Icon={Mail} type="email" placeholder="your@email.com" value={email} onChange={setEmail} accent={accent} />
            <Field
              Icon={Lock} type={show ? 'text' : 'password'} placeholder="Password" value={pw} onChange={setPw} accent={accent}
              end={
                <button type="button" onClick={() => setShow(!show)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: 2, display: 'flex', transition: 'color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
          </>
        ) : (
          /* Step 2 Inputs */
          <>
            <Field Icon={Phone} type="tel" placeholder="Phone Number" value={phone} onChange={setPhone} accent={accent} />

            {/* ID Type toggle */}
            <div style={{ display: 'flex', gap: 6, padding: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
              {(['cnic', 'passport'] as const).map(t => (
                <button
                  key={t} type="button" onClick={() => { setIdType(t); setCnic('') }}
                  style={{
                    flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', borderRadius: 8,
                    background: idType === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: idType === t ? '#F0F2FF' : '#6B7280',
                    fontSize: 12, fontWeight: idType === t ? 700 : 500,
                    transition: 'all .15s', fontFamily: 'var(--font-display)',
                  }}
                >
                  {t === 'cnic' ? '🇵🇰 CNIC' : '🌍 Passport'}
                </button>
              ))}
            </div>

            <Field
              Icon={CreditCard}
              type="text"
              placeholder={idType === 'cnic' ? 'CNIC Number (xxxxx-xxxxxxx-x)' : 'Passport Number (e.g. AB1234567)'}
              value={cnic}
              onChange={setCnic}
              accent={accent}
            />
            <div style={{ margin: '-3px 0 10px', fontSize: 11, color: '#6B7280', fontFamily: 'var(--font-body)', lineHeight: 1.4, paddingLeft: 4 }}>
              {idType === 'cnic'
                ? <>This info is collected to keep the platform secure. Complete CNIC verification in Settings to get a <span style={{ color: accent, fontWeight: 600 }}>Verified Profile badge</span>.</>
                : <>For foreign nationals. Your passport number is used for identity verification. You can upload your passport in Settings for a <span style={{ color: accent, fontWeight: 600 }}>Verified Profile badge</span>.</>
              }
            </div>
            
            {isOrg ? (
              <Field Icon={User} type="text" placeholder="Company or Brand Name" value={company} onChange={setCompany} accent={accent} />
            ) : (
              <div style={{ display: 'flex', gap: 9 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6, paddingLeft: 4, fontWeight: 500 }}>Date of Birth</div>
                  <Field Icon={Calendar} type="date" placeholder="Date of Birth" value={dob} onChange={setDob} accent={accent} />
                </div>
                <div style={{ position: 'relative', flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6, paddingLeft: 4, fontWeight: 500 }}>Gender</div>
                  <div style={{ position: 'relative' }}>
                    <Users size={15} color={gender ? accent : '#4B5563'} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
                    <select 
                      value={gender} onChange={e => setGender(e.target.value)}
                      style={{
                        display: 'block', width: '100%', padding: '13px 16px 13px 40px',
                        background: 'rgba(255,255,255,0.03)', border: `1px solid ${gender ? accent + '55' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 10, color: gender ? '#F0F2FF' : '#9CA3AF', fontSize: 14, outline: 'none',
                        fontFamily: 'var(--font-body)', transition: 'all .15s', cursor: 'pointer',
                        appearance: 'none', WebkitAppearance: 'none'
                      }}
                    >
                      <option value="" disabled>Select Gender</option>
                    <option value="male" style={{ background: '#0C0E16', color: '#F0F2FF' }}>Male</option>
                    <option value="female" style={{ background: '#0C0E16', color: '#F0F2FF' }}>Female</option>
                  </select>
                </div>
                </div>
              </div>
            )}

            {/* Country */}
            <div style={{ position: 'relative' }}>
              <Globe size={15} color={countryIso ? accent : '#4B5563'} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
              <select
                value={countryIso}
                onChange={e => { setCountryIso(e.target.value); setCity('') }}
                style={{
                  display: 'block', width: '100%', padding: '13px 16px 13px 40px',
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${accent}55`,
                  borderRadius: 10, color: '#F0F2FF', fontSize: 14, outline: 'none',
                  fontFamily: 'var(--font-body)', transition: 'all .15s', cursor: 'pointer',
                  appearance: 'none', WebkitAppearance: 'none',
                }}
              >
                {ALL_COUNTRIES.map(c => (
                  <option key={c.isoCode} value={c.isoCode} style={{ background: '#0C0E16', color: '#F0F2FF' }}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City — dropdown if data available, free text otherwise */}
            <div style={{ position: 'relative' }}>
              <MapPin size={15} color={city ? accent : '#4B5563'} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
              {cities.length > 0 ? (
                <select
                  value={city} onChange={e => setCity(e.target.value)}
                  style={{
                    display: 'block', width: '100%', padding: '13px 16px 13px 40px',
                    background: 'rgba(255,255,255,0.03)', border: `1px solid ${city ? accent + '55' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10, color: city ? '#F0F2FF' : '#9CA3AF', fontSize: 14, outline: 'none',
                    fontFamily: 'var(--font-body)', transition: 'all .15s', cursor: 'pointer',
                    appearance: 'none', WebkitAppearance: 'none',
                  }}
                >
                  <option value="" disabled>Select City</option>
                  {cities.map((c, i) => (
                    <option key={`${c}-${i}`} value={c} style={{ background: '#0C0E16', color: '#F0F2FF' }}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text" placeholder="Your City" value={city}
                  onChange={e => setCity(e.target.value)}
                  style={{
                    display: 'block', width: '100%', padding: '13px 16px 13px 40px',
                    background: city ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${city ? accent + '55' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10, color: '#F0F2FF', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box' as const, fontFamily: 'var(--font-body)',
                    transition: 'background .15s, border-color .15s',
                  }}
                />
              )}
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none', marginTop: 10 }}>
              <div
                onClick={() => setAgreed(v => !v)}
                style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                  background: agreed ? accent : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${agreed ? accent : 'rgba(255,255,255,0.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s', cursor: 'pointer',
                }}
              >
                {agreed && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke={isOrg ? '#fff' : '#000'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                I verify these details are accurate and agree to the{' '}
                <Link href="/terms" target="_blank" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>Terms &amp; Conditions</Link>
                {' '}and{' '}
                <Link href="/privacy" target="_blank" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
              </span>
            </label>
          </>
        )}

        {tab === 'login' && (
          <div style={{ textAlign: 'right' }}>
            <a href="/auth/reset-password"
              style={{ color: '#4B5563', fontSize: 12, textDecoration: 'none', fontFamily: 'var(--font-body)', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
            >
              Forgot password?
            </a>
          </div>
        )}

        {err && (
          <div style={{ display: 'flex', gap: 9, padding: '10px 13px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 9 }}>
            <AlertCircle size={14} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ color: '#FCA5A5', fontSize: 13, lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>{err}</span>
          </div>
        )}

        <button
          type="button" 
          onClick={e => submit(e)}
          disabled={disabled}
          style={{
            marginTop: 2, padding: '14px', border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 700,
            background: disabled ? 'rgba(255,255,255,0.05)' : btnBg,
            color: disabled ? '#374151' : btnClr,
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            fontFamily: 'var(--font-display)',
            transition: 'all .2s',
            boxShadow: disabled ? 'none' : `0 8px 28px ${btnGlow}`,
          }}
          onMouseEnter={e => { if (!disabled) e.currentTarget.style.boxShadow = `0 12px 36px ${btnGlow}` }}
          onMouseLeave={e => { if (!disabled) e.currentTarget.style.boxShadow = `0 8px 28px ${btnGlow}` }}
        >
          {busy ? 'Please wait…' : tab === 'login'
            ? <><span>Sign In</span><ArrowRight size={15} /></>
            : tab === 'signup' && step === 1 
            ? <><span>Continue</span><ArrowRight size={15} /></>
            : <><span>Create Account</span><ArrowRight size={15} /></>}
        </button>

        <p style={{ textAlign: 'center', color: '#6B7280', fontSize: 13, margin: '2px 0 0', fontFamily: 'var(--font-body)' }}>
          {tab === 'login' ? "Don't have an account? " : 'Already registered? '}
          <button
            type="button"
            onClick={() => reset(tab === 'login' ? 'signup' : 'login')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: accent, fontWeight: 700, fontSize: 13, padding: 0, fontFamily: 'var(--font-body)' }}
          >
            {tab === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </form>
    </div>
  )
}

// ─── RolePicker ────────────────────────────────────────────────────────────

function RolePicker({ onSelect }: { onSelect: (m: Mode) => void }) {
  return (
    <div>
      <div style={{ marginBottom: 36, textAlign: 'center' }}>
        <h1 style={{
          color: '#F0F2FF', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800,
          margin: '0 0 10px', letterSpacing: '0.01em', lineHeight: 1.15,
          fontFamily: 'var(--font-display)',
        }}>
          How will you use Tikkit?
        </h1>
        <p style={{ color: '#6B7280', fontSize: 14, margin: 0, lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
          Choose your path to get started.
        </p>
      </div>

      <div className="role-grid">
        {/* Organizer card */}
        <RoleOption
          accent="#1E5EFF"
          glow="rgba(30,94,255,0.3)"
          label="Organizer"
          title="Run The Scene"
          sub="Create events, manage your guest list, and collect payments — all in one place."
          perks={['Create & manage events', 'Guest approvals & check-in', 'Payment collection', 'Analytics & reporting', 'Team & staff access']}
          onClick={() => onSelect('organizer')}
        />
        {/* Guest card */}
        <RoleOption
          accent="#FFC745"
          glow="rgba(255,199,69,0.25)"
          label="Guest"
          title="Join The Scene"
          sub="Discover events, register instantly, and collect digital passes from every show."
          perks={['Discover & register for events', 'Earn Social Credits at every event', 'Collect digital souvenir passes', 'Follow your favourite organizers', 'QR ticket delivered to your phone']}
          onClick={() => onSelect('attendee')}
        />
      </div>
    </div>
  )
}

function RoleOption({ accent, glow, label, title, sub, perks, onClick }: {
  accent: string; glow: string; label: string; title: string
  sub: string; perks: string[]; onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
    >
      <div style={{
        padding: '28px 24px',
        background: hov ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${hov ? accent + '45' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 16, position: 'relative', overflow: 'hidden',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'all .22s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: hov ? `0 16px 48px rgba(0,0,0,.45), 0 0 32px ${glow}` : '0 2px 12px rgba(0,0,0,.25)',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: -60, left: -40,
          width: 220, height: 220, borderRadius: '50%',
          background: glow, filter: 'blur(60px)',
          opacity: hov ? .35 : .12, transition: 'opacity .3s',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          {/* Label pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px',
            background: `${accent}18`,
            border: `1px solid ${accent}30`,
            borderRadius: 99, marginBottom: 16,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: accent, boxShadow: `0 0 5px ${accent}` }} />
            <span style={{ color: accent, fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, fontFamily: 'var(--font-display)' }}>
              {label}
            </span>
          </div>

          <h2 style={{
            color: '#F0F2FF', fontWeight: 800, fontSize: 'clamp(20px,2.5vw,26px)',
            margin: '0 0 8px', letterSpacing: '-0.8px', lineHeight: 1.15,
            fontFamily: 'var(--font-display)',
          }}>
            {title}
          </h2>

          <p className="role-sub" style={{ color: '#6B7280', fontSize: 13, margin: '0 0 20px', lineHeight: 1.65, fontFamily: 'var(--font-body)' }}>
            {sub}
          </p>

          <div className="role-perks" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginBottom: 16 }}>
            {perks.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: accent, boxShadow: `0 0 5px ${accent}`, flexShrink: 0 }} />
                <span style={{ color: '#9CA3AF', fontSize: 13, fontFamily: 'var(--font-body)' }}>{p}</span>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            color: accent, fontSize: 13, fontWeight: 700,
            fontFamily: 'var(--font-display)',
          }}>
            <span>Get started</span><ArrowRight size={13} />
          </div>
        </div>
      </div>
    </button>
  )
}

// ─── Brand Panel ───────────────────────────────────────────────────────────

const miniFeatures = [
  { icon: Users,      label: 'Guest lists & approvals' },
  { icon: QrCode,     label: 'QR scan — works offline' },
  { icon: CreditCard, label: 'JazzCash & EasyPaisa' },
  { icon: BarChart3,  label: 'Real-time analytics' },
]

const miniEvents = [
  { name: 'Rooftop Night — Karachi',  date: 'Sat 22 Mar', count: 84,  color: '#1E5EFF', status: 'Live' },
  { name: 'Brand Launch — Lahore',    date: 'Fri 28 Mar', count: 127, color: '#22C55E', status: 'Open' },
]

function BrandPanel() {
  return (
    <div className="brand-panel">
      {/* Ambient blobs */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%',
        width: '70%', height: '60%',
        background: 'radial-gradient(ellipse, rgba(30,94,255,0.2) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '5%', right: '-5%',
        width: '50%', height: '40%',
        background: 'radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Top: logo + heading */}
        <div>
          <Link href="/" style={{ display: 'inline-flex', textDecoration: 'none', marginBottom: 40 }}>
            <TikkitXLogo size="lg" />
          </Link>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px',
            background: 'rgba(30,94,255,0.12)',
            border: '1px solid rgba(30,94,255,0.25)',
            borderRadius: 99, marginBottom: 20,
          }}>
            <Zap size={11} color="#1E5EFF" />
            <span style={{ color: '#1E5EFF', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, fontFamily: 'var(--font-display)' }}>
              Made for Pakistan
            </span>
          </div>

          <h2 style={{
            color: '#F0F2FF', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 800,
            margin: '0 0 16px', letterSpacing: '-1.5px', lineHeight: 1.1,
            fontFamily: 'var(--font-display)',
          }}>
            Pakistan&apos;s first<br />
            <span style={{ color: '#1E5EFF' }}>event OS.</span>
          </h2>

          <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 36px', lineHeight: 1.7, fontFamily: 'var(--font-body)', maxWidth: 340 }}>
            Stop juggling WhatsApp threads and bank screenshots. Run every event — guest lists, payments, QR check-in — from one place.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
            {miniFeatures.map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: 'rgba(30,94,255,0.1)',
                  border: '1px solid rgba(30,94,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={14} color="#1E5EFF" />
                </div>
                <span style={{ color: '#9CA3AF', fontSize: 13, fontFamily: 'var(--font-body)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: mini event cards */}
        <div className="brand-events">
          <p style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, margin: '0 0 12px', fontFamily: 'var(--font-display)' }}>
            Live on Tikkit
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {miniEvents.map(ev => (
              <div key={ev.name} style={{
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#F0F2FF', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{ev.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: ev.color, boxShadow: `0 0 6px ${ev.color}` }} />
                    <span style={{ color: ev.color, fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const }}>{ev.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4B5563', fontSize: 11 }}>
                    <Calendar size={10} /><span>{ev.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4B5563', fontSize: 11 }}>
                    <Users size={10} /><span>{ev.count} going</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>(null)

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; background: #080A10; }
        ::placeholder { color: #374151 !important; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #0c0e16 inset !important;
          -webkit-text-fill-color: #F0F2FF !important;
        }

        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes authFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gridPulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.6; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }

        /* Layout */
        .auth-root {
          min-height: 100svh;
          display: flex;
          font-family: var(--font-body);
          background: #080A10;
          animation: authFadeIn .3s ease both;
        }

        /* Left brand panel */
        .brand-panel {
          display: none;
          position: relative; overflow: hidden;
          background: #080A10;
          border-right: 1px solid rgba(255,255,255,0.05);
          padding: 48px 48px;
        }

        /* Subtle grid on brand panel */
        .brand-panel::before {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 80% 70% at 30% 20%, black 0%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 70% at 30% 20%, black 0%, transparent 100%);
        }

        /* Right auth panel */
        .auth-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: max(48px, env(safe-area-inset-top) + 32px) 24px max(48px, env(safe-area-inset-bottom) + 32px);
          position: relative;
          overflow-y: auto;
        }

        /* Mobile: top logo + grid bg */
        .auth-panel::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 100% 60% at 50% 0%, black 0%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 100% 60% at 50% 0%, black 0%, transparent 100%);
        }

        .auth-inner {
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 1;
          animation: authFadeUp .28s ease both;
        }

        @media (min-width: 860px) {
          .auth-inner.picker { max-width: 860px; }
        }

        /* Mobile logo */
        .mobile-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }

        /* Role grid — side by side on desktop, stacked on mobile */
        .role-grid {
          display: flex;
          flex-direction: row;
          gap: 16px;
        }
        .role-grid > * { flex: 1 1 0; min-width: 0; }

        @media (max-width: 859px) {
          .role-grid { flex-direction: column; gap: 12px; }
          .role-grid > * { flex: none; }
        }

        /* Brand panel hidden on all screens */
        .brand-panel { display: none !important; }

        /* Mobile tweaks */
        @media (max-width: 899px) {
          .brand-events { display: none; }
          .role-perks { display: block; }
        }

        @media (max-width: 480px) {
          .auth-panel {
            padding-left: 16px;
            padding-right: 16px;
          }
          .role-perks { display: none; }
          .role-sub { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        }
      `}</style>

      <div className="auth-root">
        {/* Left — brand */}
        <BrandPanel />

        {/* Right — auth */}
        <div className="auth-panel">
          {/* Mobile-only logo */}
          <div className="mobile-logo">
            <Link href="/" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              <TikkitXLogo size="lg" />
            </Link>
          </div>

          <div className={`auth-inner${!mode ? ' picker' : ''}`}>
            {mode
              ? <AuthForm mode={mode} onBack={() => setMode(null)} />
              : <RolePicker onSelect={setMode} />
            }
          </div>
        </div>
      </div>
    </>
  )
}

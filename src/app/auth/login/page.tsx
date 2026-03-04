'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Ticket, Mail, Lock, Eye, EyeOff, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react'

type Mode    = null | 'organizer' | 'attendee'
type SubMode = 'login' | 'signup'

function Field({ Icon, type, placeholder, value, onChange, end }: {
  Icon: typeof Mail; type: string; placeholder: string
  value: string; onChange: (v: string) => void; end?: React.ReactNode
}) {
  const [focus, setFocus] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <Icon
        size={16}
        color={focus ? '#94A3B8' : '#475569'}
        style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color .15s', zIndex: 1 }}
      />
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          display: 'block', width: '100%',
          padding: end ? '14px 44px 14px 42px' : '14px 16px 14px 42px',
          background: focus ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${focus ? 'rgba(148,163,184,0.3)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 12, color: '#F1F5F9', fontSize: 15, outline: 'none',
          boxSizing: 'border-box' as const, fontFamily: 'inherit',
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

function AuthPanel({ mode, onBack }: { mode: Mode; onBack: () => void }) {
  const supabase = createClient()
  const router   = useRouter()
  const isOrg    = mode === 'organizer'
  const accent   = isOrg ? '#60A5FA' : '#FCD34D'
  const btnBg    = isOrg ? '#2563EB' : '#F59E0B'
  const btnClr   = isOrg ? '#fff'    : '#000'
  const expRole  = isOrg ? 'organizer' : 'guest'

  const [tab,  setTab]  = useState<SubMode>('login')
  const [name, setName] = useState('')
  const [email,setEmail]= useState('')
  const [pw,   setPw]   = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState<string | null>(null)

  const reset = (t: SubMode) => { setErr(null); setName(''); setEmail(''); setPw(''); setTab(t) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)

    try {
      if (tab === 'signup') {
        if (!name.trim())  { setErr('Enter your name'); return }
        if (pw.length < 8) { setErr('Password must be at least 8 characters'); return }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: pw,
          options: {
            data: {
              full_name: name.trim(),
              role: isOrg ? 'organizer' : 'guest',   // ← trigger reads this
            },
          },
        })

        if (error) {
          setErr(error.message.toLowerCase().includes('already')
            ? 'Email already registered — sign in instead.'
            : error.message)
          return
        }

        if (data.user) {
          // Ensure guest_profiles row exists for attendees
          if (!isOrg) {
            await supabase
              .from('guest_profiles')
              .upsert({ id: data.user.id }, { onConflict: 'id', ignoreDuplicates: true })
          }
          router.push(isOrg ? '/dashboard' : '/explore')
        }

      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: pw,
        })

        if (error) { setErr('Wrong email or password'); return }

        if (data.user) {
          const { data: p } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

          const role = p?.role ?? expRole

          if (role !== expRole) {
            await supabase.auth.signOut()
            setErr(isOrg
              ? 'That\'s an attendee account — use "Join The Scene".'
              : 'That\'s an organizer account — use "Run The Scene".')
            return
          }

          router.push(role === 'guest' ? '/explore' : '/dashboard')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const disabled = busy || !email.trim() || !pw

  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 13, padding: '0 0 28px', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}
      >
        ← Back
      </button>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 13px', background: isOrg ? 'rgba(37,99,235,0.15)' : 'rgba(245,158,11,0.12)', borderRadius: 99, marginBottom: 16 }}>
        {isOrg ? <Ticket size={12} color={accent} /> : <Sparkles size={12} color={accent} />}
        <span style={{ color: accent, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          {isOrg ? 'Organizer Access' : 'Guest Pass'}
        </span>
      </div>

      <h1 style={{ color: '#F8FAFC', fontSize: 30, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-.6px', lineHeight: 1.15, fontFamily: "'Syne', sans-serif" }}>
        {tab === 'login'
          ? (isOrg ? 'Welcome back' : 'Welcome back')
          : (isOrg ? 'Run the scene' : 'Join the scene')}
      </h1>
      <p style={{ color: '#64748B', fontSize: 15, margin: '0 0 28px', lineHeight: 1.6 }}>
        {tab === 'login'
          ? 'Sign in to your account.'
          : isOrg ? 'Create your organizer account.' : 'Create your free account.'}
      </p>

      {/* Login / Signup toggle */}
      <div style={{ display: 'flex', padding: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 12, marginBottom: 22, gap: 3 }}>
        {(['login', 'signup'] as SubMode[]).map(t => (
          <button
            key={t} onClick={() => reset(t)}
            style={{ flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', borderRadius: 9, background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent', color: tab === t ? '#F1F5F9' : '#475569', fontSize: 14, fontWeight: tab === t ? 700 : 500, transition: 'all .15s', fontFamily: 'inherit' }}
          >
            {t === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {tab === 'signup' && (
          <Field Icon={User} type="text" placeholder="Full name" value={name} onChange={setName} />
        )}
        <Field Icon={Mail} type="email" placeholder="your@email.com" value={email} onChange={setEmail} />
        <Field
          Icon={Lock} type={show ? 'text' : 'password'} placeholder="Password" value={pw} onChange={setPw}
          end={
            <button type="button" onClick={() => setShow(!show)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2, display: 'flex' }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {tab === 'login' && (
          <div style={{ textAlign: 'right' }}>
            <a href="/auth/reset-password" style={{ color: '#475569', fontSize: 13, textDecoration: 'none' }}>
              Forgot password?
            </a>
          </div>
        )}

        {err && (
          <div style={{ display: 'flex', gap: 10, padding: '11px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 11 }}>
            <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ color: '#FCA5A5', fontSize: 13, lineHeight: 1.5 }}>{err}</span>
          </div>
        )}

        <button
          type="submit" disabled={disabled}
          style={{ marginTop: 4, padding: '14px', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, background: disabled ? 'rgba(255,255,255,0.05)' : btnBg, color: disabled ? '#334155' : btnClr, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', transition: 'all .2s', boxShadow: disabled ? 'none' : isOrg ? '0 0 24px rgba(37,99,235,.4)' : '0 0 24px rgba(245,158,11,.3)' }}
        >
          {busy
            ? 'Please wait…'
            : tab === 'login'
              ? <><span>Sign In</span><ArrowRight size={16} /></>
              : <><span>Create Account</span><ArrowRight size={16} /></>}
        </button>

        <p style={{ textAlign: 'center', color: '#475569', fontSize: 14, margin: '4px 0 0' }}>
          {tab === 'login' ? "Don't have an account? " : 'Already registered? '}
          <button
            type="button"
            onClick={() => reset(tab === 'login' ? 'signup' : 'login')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: accent, fontWeight: 700, fontSize: 14, padding: 0, fontFamily: 'inherit' }}
          >
            {tab === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </form>

      <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ color: '#334155', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>
          What you get
        </p>
        {(isOrg
          ? ['Create & manage events', 'Guest approvals & check-in', 'Payment collection', 'Analytics & reporting']
          : ['Discover & register for events', 'Earn Social Credits at every event', 'Collect digital souvenir passes']
        ).map(p => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0 }} />
            <span style={{ color: '#94A3B8', fontSize: 14 }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Card({ badge, badgeIcon, accent, glowClr, title, sub, perks, onClick }: {
  badge: string; badgeIcon: React.ReactNode; accent: string; glowClr: string
  title: string; sub: string; perks: string[]; onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', flex: '1 1 0', minWidth: 0 }}
    >
      <div className="card-inner" style={{
        height: '100%', boxSizing: 'border-box' as const,
        background: hov ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 20, position: 'relative', overflow: 'hidden',
        transform: hov ? 'translateY(-3px)' : 'none',
        transition: 'all .2s',
        boxShadow: hov ? '0 20px 60px rgba(0,0,0,.4)' : '0 4px 24px rgba(0,0,0,.2)',
      }}>
        <div style={{ position: 'absolute', top: -60, left: -40, width: 200, height: 200, borderRadius: '50%', background: glowClr, filter: 'blur(60px)', opacity: hov ? .28 : .14, transition: 'opacity .3s', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', background: `${accent}22`, borderRadius: 99, marginBottom: 24 }}>
            {badgeIcon}
            <span style={{ color: accent, fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase' }}>{badge}</span>
          </div>
          <h2 className="card-title" style={{ color: '#F8FAFC', fontWeight: 800, margin: '0 0 14px', letterSpacing: '-.5px', lineHeight: 1.2, fontFamily: "'Syne', sans-serif" }}>
            {title}
          </h2>
          <p style={{ color: '#64748B', fontSize: 15, margin: '0 0 28px', lineHeight: 1.7 }}>{sub}</p>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 22 }} />
          <p style={{ color: '#334155', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>
            What you get
          </p>
          {perks.map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0 }} />
              <span style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.5 }}>{p}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 28, color: accent, fontSize: 14, fontWeight: 600 }}>
            <span>Get started</span><ArrowRight size={14} />
          </div>
        </div>
      </div>
    </button>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>(null)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; background: #060810; }
        ::placeholder { color: #334155 !important; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #0d1117 inset !important; -webkit-text-fill-color: #F1F5F9 !important; }
        @keyframes fade { from{opacity:0} to{opacity:1} }
        @keyframes up   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        .page {
          min-height: 100svh;
          background: radial-gradient(ellipse 90% 55% at 50% -5%, rgba(14,30,80,.85) 0%, #060810 65%);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 48px clamp(24px, 5vw, 80px);
          font-family: 'DM Sans', -apple-system, sans-serif;
          animation: fade .35s ease both;
        }
        .content-wrap { width: 100%; margin: 0 auto; transition: max-width .3s ease; }
        .content-wrap.picker { max-width: 1200px; }
        .content-wrap.form   { max-width: 480px; }
        .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: stretch; }
        .card-inner { padding: clamp(28px, 3vw, 44px) clamp(24px, 2.5vw, 40px); }
        .card-title  { font-size: clamp(26px, 2.4vw, 36px); }
        .fbox {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px; padding: 40px 36px;
          animation: up .25s ease both;
        }
        @media (max-width: 640px) {
          .page { padding: 28px 16px; }
          .content-wrap.picker { max-width: 480px; }
          .cards { grid-template-columns: 1fr; gap: 16px; }
          .fbox { padding: 28px 20px; }
          .card-title { font-size: 28px; }
        }
        @media (min-width: 1440px) {
          .content-wrap.picker { max-width: 1320px; }
          .cards { gap: 28px; }
        }
      `}</style>

      <div className="page">
        <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none', zIndex: 0 }} />

        <div className={`content-wrap ${mode ? 'form' : 'picker'}`} style={{ position: 'relative', zIndex: 1 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(37,99,235,.5),inset 0 1px 0 rgba(255,255,255,.15)' }}>
                <Ticket size={22} color="white" strokeWidth={2.5} />
              </div>
              <span style={{ color: '#F8FAFC', fontSize: 26, fontWeight: 800, letterSpacing: '-.5px', fontFamily: "'Syne',sans-serif" }}>Tikkit</span>
            </a>
          </div>

          {!mode && (
            <div style={{ textAlign: 'center', marginBottom: 36, animation: 'up .3s ease both' }}>
              <h1 style={{ color: '#F8FAFC', fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-.8px', lineHeight: 1.15, fontFamily: "'Syne', sans-serif" }}>
                How will you use Tikkit?
              </h1>
              <p style={{ color: '#64748B', fontSize: 16, margin: 0, lineHeight: 1.6 }}>
                Choose your path to get started.
              </p>
            </div>
          )}

          {!mode ? (
            <div className="cards" style={{ animation: 'up .3s ease both' }}>
              <Card
                badge="Organizer Access" badgeIcon={<Ticket size={12} color="#60A5FA" />}
                accent="#60A5FA" glowClr="rgba(37,99,235,.8)"
                title="Run The Scene"
                sub="Create events, manage your guest list, and collect payments — all in one place."
                perks={['Create & manage events', 'Guest approvals & check-in', 'Payment collection', 'Analytics & reporting']}
                onClick={() => setMode('organizer')}
              />
              <Card
                badge="Guest Pass" badgeIcon={<Sparkles size={12} color="#FCD34D" />}
                accent="#FCD34D" glowClr="rgba(245,158,11,.6)"
                title="Join The Scene"
                sub="Discover events, register instantly, and collect digital passes from every show you attend."
                perks={['Discover & register for events', 'Earn Social Credits at every event', 'Collect digital souvenir passes']}
                onClick={() => setMode('attendee')}
              />
            </div>
          ) : (
            <div className="fbox">
              <AuthPanel mode={mode} onBack={() => setMode(null)} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
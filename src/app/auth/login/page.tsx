'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Ticket, Mail, Lock, Eye, EyeOff, User,
  ArrowRight, AlertCircle, Sparkles, ChevronLeft,
} from 'lucide-react'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'

type Mode    = null | 'organizer' | 'attendee'
type SubMode = 'login' | 'signup'

// ─── Field ───────────────────────────────────────────────────────────────────

function Field({ Icon, type, placeholder, value, onChange, end, accent }: {
  Icon: typeof Mail; type: string; placeholder: string
  value: string; onChange: (v: string) => void
  end?: React.ReactNode; accent?: string
}) {
  const [focus, setFocus] = useState(false)
  const borderColor = focus
    ? (accent ? `${accent}55` : 'rgba(148,163,184,0.3)')
    : 'rgba(255,255,255,0.07)'
  return (
    <div style={{ position: 'relative' }}>
      <Icon
        size={16}
        color={focus ? (accent ?? '#9CA3AF') : '#374151'}
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
          border: `1px solid ${borderColor}`,
          borderRadius: 12, color: '#F0F2FF', fontSize: 'var(--fs-md)', outline: 'none',
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

// ─── AuthPanel ────────────────────────────────────────────────────────────────

function AuthPanel({ mode, onBack }: { mode: Mode; onBack: () => void }) {
  const supabase = createClient()
  const router   = useRouter()
  const isOrg    = mode === 'organizer'
  const accent   = isOrg ? '#1E5EFF' : '#FFC745'
  const btnBg    = isOrg ? '#1E5EFF' : '#FFC745'
  const btnClr   = isOrg ? '#fff'    : '#000'
  const btnGlow  = isOrg ? 'rgba(30,94,255,0.45)' : 'rgba(255,199,69,0.4)'
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
          options: { data: { full_name: name.trim(), role: isOrg ? 'organizer' : 'guest' } },
        })

        if (error) {
          setErr(error.message.toLowerCase().includes('already')
            ? 'Email already registered — sign in instead.'
            : error.message)
          return
        }

        if (data.user) {
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

  const perks = isOrg
    ? ['Create & manage events', 'Guest approvals & check-in', 'Payment collection', 'Analytics & reporting']
    : ['Discover & register for events', 'Earn Social Credits at every event', 'Collect digital souvenir passes']

  return (
    <div>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#4B5563', fontSize: 'var(--fs-base)', padding: '0 0 28px',
          display: 'flex', alignItems: 'center', gap: 5,
          fontFamily: 'var(--font-body)', transition: 'color .2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
        onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
      >
        <ChevronLeft size={14} /> Back
      </button>

      {/* Mode badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '5px 13px',
        background: `${accent}15`,
        border: `1px solid ${accent}30`,
        borderRadius: 99, marginBottom: 18,
      }}>
        {isOrg ? <Ticket size={11} color={accent} /> : <Sparkles size={11} color={accent} />}
        <span style={{
          color: accent, fontSize: 'var(--fs-xs)', fontWeight: 700,
          letterSpacing: '.08em', textTransform: 'uppercase' as const,
          fontFamily: 'var(--font-display)',
        }}>
          {isOrg ? 'Organizer Access' : 'Guest Pass'}
        </span>
      </div>

      {/* Heading */}
      <h1 style={{
        color: '#F0F2FF', fontSize: 32, fontWeight: 700,
        margin: '0 0 8px', letterSpacing: '-1px', lineHeight: 1.1,
        fontFamily: 'var(--font-display)',
      }}>
        {tab === 'login' ? 'Welcome back' : (isOrg ? 'Run the scene' : 'Join the scene')}
      </h1>
      <p style={{ color: '#6B7280', fontSize: 'var(--fs-md)', margin: '0 0 28px', lineHeight: 1.65, fontFamily: 'var(--font-body)' }}>
        {tab === 'login'
          ? 'Sign in to your account.'
          : isOrg ? 'Create your organizer account.' : 'Create your free account.'}
      </p>

      {/* Sign In / Sign Up toggle */}
      <div style={{
        display: 'flex', padding: 3,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 12, marginBottom: 22, gap: 3,
      }}>
        {(['login', 'signup'] as SubMode[]).map(t => (
          <button
            key={t} onClick={() => reset(t)}
            style={{
              flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
              borderRadius: 9,
              background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: tab === t ? '#F0F2FF' : '#6B7280',
              fontSize: 'var(--fs-md)', fontWeight: tab === t ? 700 : 500,
              transition: 'all .15s', fontFamily: 'var(--font-display)',
            }}
          >
            {t === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tab === 'signup' && (
          <Field Icon={User} type="text" placeholder="Full name" value={name} onChange={setName} accent={accent} />
        )}
        <Field Icon={Mail} type="email" placeholder="your@email.com" value={email} onChange={setEmail} accent={accent} />
        <Field
          Icon={Lock} type={show ? 'text' : 'password'} placeholder="Password" value={pw} onChange={setPw} accent={accent}
          end={
            <button type="button" onClick={() => setShow(!show)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: 2, display: 'flex' }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {tab === 'login' && (
          <div style={{ textAlign: 'right' }}>
            <a href="/auth/reset-password"
              style={{ color: '#4B5563', fontSize: 'var(--fs-base)', textDecoration: 'none', fontFamily: 'var(--font-body)', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
            >
              Forgot password?
            </a>
          </div>
        )}

        {err && (
          <div style={{ display: 'flex', gap: 10, padding: '11px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 11 }}>
            <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ color: '#FCA5A5', fontSize: 'var(--fs-base)', lineHeight: 1.5 }}>{err}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit" disabled={disabled}
          style={{
            marginTop: 4, padding: '15px', border: 'none', borderRadius: 12,
            fontSize: 'var(--fs-md)', fontWeight: 700,
            background: disabled ? 'rgba(255,255,255,0.05)' : btnBg,
            color: disabled ? '#374151' : btnClr,
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'var(--font-display)',
            transition: 'all .2s',
            boxShadow: disabled ? 'none' : `0 0 36px ${btnGlow}`,
          }}
        >
          {busy
            ? 'Please wait…'
            : tab === 'login'
              ? <><span>Sign In</span><ArrowRight size={16} /></>
              : <><span>Create Account</span><ArrowRight size={16} /></>}
        </button>

        <p style={{ textAlign: 'center', color: '#6B7280', fontSize: 'var(--fs-md)', margin: '4px 0 0', fontFamily: 'var(--font-body)' }}>
          {tab === 'login' ? "Don't have an account? " : 'Already registered? '}
          <button
            type="button"
            onClick={() => reset(tab === 'login' ? 'signup' : 'login')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: accent, fontWeight: 700, fontSize: 'var(--fs-md)', padding: 0, fontFamily: 'var(--font-body)' }}
          >
            {tab === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </form>

      {/* Perks */}
      <div className="auth-form-perks" style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ color: '#374151', fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, margin: '0 0 14px', fontFamily: 'var(--font-display)' }}>
          What you get
        </p>
        {perks.map(p => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: accent, boxShadow: `0 0 6px ${accent}`, flexShrink: 0 }} />
            <span style={{ color: '#9CA3AF', fontSize: 'var(--fs-md)', fontFamily: 'var(--font-body)' }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── RoleCard ─────────────────────────────────────────────────────────────────

function RoleCard({ badge, badgeIcon, accent, glowClr, title, sub, perks, onClick }: {
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
      <div className="auth-card-inner" style={{
        height: '100%', boxSizing: 'border-box' as const,
        padding: 'clamp(28px,3vw,44px) clamp(24px,2.5vw,40px)',
        background: hov ? 'rgba(255,255,255,0.04)' : 'rgba(13,15,22,0.95)',
        border: `1px solid ${hov ? accent + '40' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 20, position: 'relative', overflow: 'hidden',
        transform: hov ? 'translateY(-4px)' : 'none',
        transition: 'all .25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: hov
          ? `0 24px 64px rgba(0,0,0,.5), 0 0 48px ${glowClr}`
          : '0 4px 24px rgba(0,0,0,.35)',
      }}>
        {/* Glow blob */}
        <div style={{
          position: 'absolute', top: -80, left: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: glowClr, filter: 'blur(80px)',
          opacity: hov ? .22 : .09, transition: 'opacity .3s',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          {/* Badge */}
          <div className="auth-card-badge" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '5px 13px',
            background: `${accent}15`,
            border: `1px solid ${accent}30`,
            borderRadius: 99, marginBottom: 24,
          }}>
            {badgeIcon}
            <span style={{
              color: accent, fontSize: 'var(--fs-xs)', fontWeight: 700,
              letterSpacing: '.08em', textTransform: 'uppercase' as const,
              fontFamily: 'var(--font-display)',
            }}>
              {badge}
            </span>
          </div>

          {/* Title */}
          <h2 className="auth-card-title" style={{
            color: '#F0F2FF', fontWeight: 700,
            margin: '0 0 14px', letterSpacing: '-1px', lineHeight: 1.15,
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(26px,2.4vw,38px)',
          }}>
            {title}
          </h2>

          <p className="auth-card-sub" style={{ color: '#6B7280', fontSize: 'var(--fs-md)', margin: '0 0 28px', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
            {sub}
          </p>

          <div className="auth-card-divider" style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 22 }} />

          <div className="auth-card-perks">
            <p style={{
              color: '#374151', fontSize: 'var(--fs-xs)', fontWeight: 700,
              letterSpacing: '.1em', textTransform: 'uppercase' as const,
              margin: '0 0 14px', fontFamily: 'var(--font-display)',
            }}>
              What you get
            </p>
            {perks.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: accent, boxShadow: `0 0 6px ${accent}`, flexShrink: 0 }} />
                <span style={{ color: '#9CA3AF', fontSize: 'var(--fs-md)', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>{p}</span>
              </div>
            ))}
          </div>

          <div className="auth-card-cta" style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 28,
            color: accent, fontSize: 'var(--fs-md)', fontWeight: 600,
            fontFamily: 'var(--font-display)',
            transition: 'gap .2s',
          }}>
            <span>Get started</span><ArrowRight size={14} />
          </div>
        </div>
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes authFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes orbDrift {
          0%,100% { transform: translate(0,0)        scale(1);    opacity: .18; }
          33%     { transform: translate(50px,-40px)  scale(1.1);  opacity: .25; }
          66%     { transform: translate(-30px,30px)  scale(0.9);  opacity: .12; }
        }
        @keyframes orbDrift2 {
          0%,100% { transform: translate(0,0)         scale(1);    opacity: .1; }
          50%     { transform: translate(-60px,40px)   scale(1.15); opacity: .18; }
        }
        @keyframes blobMorph {
          0%,100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25%     { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          50%     { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; }
          75%     { border-radius: 60% 30% 60% 40% / 70% 40% 50% 60%; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }

        .auth-page {
          min-height: 100svh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 48px clamp(20px, 5vw, 80px);
          font-family: var(--font-body);
          position: relative; overflow: hidden;
          animation: authFadeIn .35s ease both;
        }
        /* Grid overlay */
        .auth-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.022) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 90% 80% at 50% 10%, black 0%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 90% 80% at 50% 10%, black 0%, transparent 100%);
        }
        /* Orbs */
        .auth-orb-1 {
          position: fixed; top: -20%; left: 50%; transform: translateX(-50%);
          width: 800px; height: 600px; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse, rgba(30,94,255,.18) 0%, transparent 68%);
          animation: orbDrift 18s ease-in-out infinite;
        }
        .auth-orb-2 {
          position: fixed; top: 25%; right: 5%;
          width: 500px; height: 500px; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse, rgba(139,92,246,.08) 0%, transparent 70%);
          border-radius: 50%;
          animation: blobMorph 14s ease-in-out infinite, orbDrift2 20s ease-in-out infinite;
        }
        .auth-orb-3 {
          position: fixed; bottom: 5%; left: 5%;
          width: 400px; height: 400px; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse, rgba(255,199,69,.06) 0%, transparent 70%);
          border-radius: 50%;
          animation: blobMorph 11s ease-in-out 4s infinite;
        }
        /* Content wrapper */
        .auth-content {
          width: 100%; position: relative; z-index: 1;
          transition: max-width .3s cubic-bezier(0.4,0,0.2,1);
        }
        .auth-content.picker { max-width: 1100px; }
        .auth-content.form   { max-width: 480px; }
        /* Cards */
        .auth-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: stretch; }
        /* Form box */
        .auth-fbox {
          background: rgba(13,15,22,0.92);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px; padding: 40px 36px;
          animation: authFadeUp .25s ease both;
          box-shadow: 0 24px 64px rgba(0,0,0,.5);
        }
        /* Responsive */
        @media (max-width: 640px) {
          .auth-page {
            padding: max(32px, env(safe-area-inset-top) + 16px) 16px max(48px, env(safe-area-inset-bottom) + 24px);
            justify-content: center;
          }
          .auth-content.picker { max-width: 480px; }
          .auth-cards { grid-template-columns: 1fr; gap: 10px; }
          .auth-fbox { padding: 24px 20px; border-radius: 18px; }

          /* Compact role tiles on mobile — hide the verbose parts */
          .auth-card-divider { display: none; }
          .auth-card-perks   { display: none; }
          .auth-card-inner   { padding: 20px 22px 22px !important; }
          .auth-card-cta     { margin-top: 12px !important; }
          .auth-card-title   { font-size: 22px !important; letter-spacing: -0.5px !important; margin-bottom: 6px !important; }
          .auth-card-sub     { font-size: 13px !important; margin-bottom: 0 !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          .auth-card-badge   { margin-bottom: 12px !important; }

          /* Picker heading on mobile */
          .auth-picker-heading h1 { font-size: 26px !important; letter-spacing: -0.8px !important; }
          .auth-picker-heading    { margin-bottom: 20px !important; }

          /* Logo on mobile */
          .auth-logo { margin-bottom: 24px !important; }

          /* Hide perks in form on mobile */
          .auth-form-perks { display: none; }
        }
        @media (min-width: 1440px) {
          .auth-content.picker { max-width: 1280px; }
          .auth-cards { gap: 24px; }
        }
      `}</style>

      <div className="auth-page">
        {/* Background layers */}
        <div className="auth-grid"  aria-hidden="true" />
        <div className="auth-orb-1" aria-hidden="true" />
        <div className="auth-orb-2" aria-hidden="true" />
        <div className="auth-orb-3" aria-hidden="true" />

        <div className={`auth-content ${mode ? 'form' : 'picker'}`}>

          {/* Logo */}
          <div className="auth-logo" style={{ textAlign: 'center', marginBottom: 40 }}>
            <a href="/" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              <TikkitXLogo size="lg" />
            </a>
          </div>

          {/* Picker heading */}
          {!mode && (
            <div className="auth-picker-heading" style={{ textAlign: 'center', marginBottom: 36, animation: 'authFadeUp .3s ease both' }}>
              <h1 style={{
                color: '#F0F2FF',
                fontSize: 'clamp(28px, 3vw, 46px)', fontWeight: 700,
                margin: '0 0 10px', letterSpacing: '-1.5px', lineHeight: 1.1,
                fontFamily: 'var(--font-display)',
              }}>
                How will you use Tikkit?
              </h1>
              <p style={{ color: '#6B7280', fontSize: 'var(--fs-lg)', margin: 0, lineHeight: 1.65, fontFamily: 'var(--font-body)' }}>
                Choose your path to get started.
              </p>
            </div>
          )}

          {/* Cards or Form */}
          {!mode ? (
            <div className="auth-cards" style={{ animation: 'authFadeUp .35s ease 0.05s both' }}>
              <RoleCard
                badge="Organizer Access"
                badgeIcon={<Ticket size={11} color="#1E5EFF" />}
                accent="#1E5EFF"
                glowClr="rgba(30,94,255,0.35)"
                title="Run The Scene"
                sub="Create events, manage your guest list, and collect payments — all in one place."
                perks={['Create & manage events', 'Guest approvals & check-in', 'Payment collection', 'Analytics & reporting']}
                onClick={() => setMode('organizer')}
              />
              <RoleCard
                badge="Guest Pass"
                badgeIcon={<Sparkles size={11} color="#FFC745" />}
                accent="#FFC745"
                glowClr="rgba(255,199,69,0.25)"
                title="Join The Scene"
                sub="Discover events, register instantly, and collect digital passes from every show you attend."
                perks={['Discover & register for events', 'Earn Social Credits at every event', 'Collect digital souvenir passes']}
                onClick={() => setMode('attendee')}
              />
            </div>
          ) : (
            <div className="auth-fbox">
              <AuthPanel mode={mode} onBack={() => setMode(null)} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

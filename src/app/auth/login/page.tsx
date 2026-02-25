'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Ticket, Mail, Lock, Eye, EyeOff, User, ArrowRight, ChevronLeft, AlertCircle, Sparkles } from 'lucide-react'

type Mode    = null | 'organizer' | 'attendee'
type SubMode = 'login' | 'signup'

// ── Input ─────────────────────────────────────────────────────────────────────
function InputField({ icon: Icon, type, placeholder, value, onChange, rightEl }: {
  icon: typeof Mail; type: string; placeholder: string
  value: string; onChange: (v: string) => void; rightEl?: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <Icon size={18} color="#4B5563" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '15px 16px 15px 46px',
          background: focused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${focused ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 14, color: 'white', fontSize: 15, outline: 'none',
          boxSizing: 'border-box' as const, transition: 'all 0.15s', fontFamily: 'inherit',
        }}
      />
      {rightEl && <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>{rightEl}</div>}
    </div>
  )
}

// ── Auth Form ─────────────────────────────────────────────────────────────────
function AuthForm({ mode, onBack }: { mode: 'organizer' | 'attendee'; onBack: () => void }) {
  const supabase     = createClient()
  const router       = useRouter()
  const isOrg        = mode === 'organizer'
  const accent       = isOrg ? '#4F8AFF' : '#FFC745'
  const badgeBg      = isOrg ? 'rgba(30,94,255,0.15)' : 'rgba(255,199,69,0.12)'
  const btnBg        = isOrg ? '#2563EB' : '#FFC745'
  const btnText      = isOrg ? 'white' : '#000'
  const expectedRole = isOrg ? 'organizer' : 'guest'

  const [tab,      setTab]      = useState<SubMode>('login')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const resetForm = (t: SubMode) => { setError(null); setName(''); setEmail(''); setPassword(''); setTab(t) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true)
    if (tab === 'signup') {
      if (!name.trim())        { setError('Please enter your name'); setLoading(false); return }
      if (password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return }
      const { data, error: err } = await supabase.auth.signUp({ email: email.toLowerCase().trim(), password, options: { data: { full_name: name.trim() } } })
      if (err) { setError(err.message.toLowerCase().includes('already') ? 'Email already registered. Try signing in.' : err.message); setLoading(false); return }
      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, email: email.toLowerCase().trim(), full_name: name.trim(), role: isOrg ? 'organizer' : 'guest' }, { onConflict: 'id' })
        if (!isOrg) await supabase.from('guest_profiles').upsert({ id: data.user.id }, { onConflict: 'id', ignoreDuplicates: true })
        router.push(isOrg ? '/dashboard' : '/explore')
      }
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.toLowerCase().trim(), password })
      if (err) { setError('Incorrect email or password'); setLoading(false); return }
      if (data.user) {
        let actualRole = expectedRole
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
        if (profile?.role) actualRole = profile.role
        else { const { data: r } = await supabase.rpc('get_my_role'); if (r) actualRole = r }
        if (actualRole !== expectedRole) {
          await supabase.auth.signOut()
          setError(isOrg ? 'This is an Attendee account — use "Join The Scene".' : 'This is an Organizer account — use "Run The Scene".')
          setLoading(false); return
        }
        router.push(actualRole === 'guest' ? '/explore' : '/dashboard')
      }
    }
    setLoading(false)
  }

  const disabled = loading || !email.trim() || !password
  const perks = isOrg
    ? ['Create & manage events', 'Guest approvals & check-in', 'Payment collection', 'Analytics & reporting']
    : ['Discover & register for events', 'Earn Social Credits at every event', 'Collect digital souvenir passes']

  return (
    <div style={{ animation: 'slideUp 0.22s ease' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 24px', color: '#6B7280', fontSize: 14, fontFamily: 'inherit' }}>
        <ChevronLeft size={16} /><span>Back</span>
      </button>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: badgeBg, borderRadius: 30, marginBottom: 20 }}>
        {isOrg ? <Ticket size={13} color={accent} /> : <Sparkles size={13} color={accent} />}
        <span style={{ color: accent, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{isOrg ? 'Organizer Access' : 'Guest Pass'}</span>
      </div>
      <h2 style={{ color: 'white', fontSize: 30, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
        {tab === 'login' ? (isOrg ? 'Welcome back' : 'Join the scene') : (isOrg ? 'Run The Scene' : 'Join The Scene')}
      </h2>
      <p style={{ color: '#6B7280', fontSize: 15, margin: '0 0 28px', lineHeight: 1.6 }}>
        {tab === 'login' ? 'Sign in to your account.' : isOrg ? 'Create your organizer account.' : 'Sign up — no hassle, just good events.'}
      </p>
      <div style={{ display: 'flex', gap: 3, padding: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 14, marginBottom: 20 }}>
        {(['login', 'signup'] as const).map(t => (
          <button key={t} onClick={() => resetForm(t)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', background: tab === t ? 'rgba(255,255,255,0.09)' : 'transparent', color: tab === t ? 'white' : '#4B5563', fontSize: 14, fontWeight: tab === t ? 700 : 500, transition: 'all 0.15s', fontFamily: 'inherit' }}>
            {t === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'signup' && <InputField icon={User} type="text" placeholder={isOrg ? 'Your name or company' : 'Your full name'} value={name} onChange={setName} />}
        <InputField icon={Mail} type="email" placeholder="your@email.com" value={email} onChange={setEmail} />
        <InputField icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Password" value={password} onChange={setPassword}
          rightEl={<button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#4B5563' }}>{showPw ? <EyeOff size={17} /> : <Eye size={17} />}</button>} />
        {tab === 'login' && <div style={{ textAlign: 'right' }}><a href="/auth/reset-password" style={{ color: '#4B5563', fontSize: 13, textDecoration: 'none' }}>Forgot password?</a></div>}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertCircle size={16} color="#FCA5A5" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ color: '#FCA5A5', fontSize: 13, lineHeight: 1.5 }}>{error}</span>
          </div>
        )}
        <button type="submit" disabled={disabled} style={{ width: '100%', padding: '15px', background: disabled ? 'rgba(255,255,255,0.06)' : btnBg, color: disabled ? '#374151' : btnText, border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', fontFamily: 'inherit', marginTop: 4, boxShadow: disabled ? 'none' : isOrg ? '0 0 28px rgba(37,99,235,0.35)' : '0 0 28px rgba(255,199,69,0.2)' }}>
          {loading ? 'Please wait…' : tab === 'login' ? <><span>Sign In</span><ArrowRight size={16} /></> : <><span>Create Account</span><ArrowRight size={16} /></>}
        </button>
        <p style={{ textAlign: 'center', color: '#4B5563', fontSize: 14, margin: '6px 0 0' }}>
          {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => resetForm(tab === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accent, fontWeight: 700, fontSize: 14, padding: 0, fontFamily: 'inherit' }}>
            {tab === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </form>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 28, paddingTop: 22 }}>
        <p style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>What you get</p>
        {perks.map(p => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: accent, flexShrink: 0 }} />
            <span style={{ color: '#9CA3AF', fontSize: 14 }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [mode, setMode] = useState<Mode>(null)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #080A0F; }
        ::placeholder { color: #374151 !important; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #111318 inset !important; -webkit-text-fill-color: white !important; }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{
        minHeight: '100svh',
        background: 'radial-gradient(ellipse at 30% 0%, rgba(10,18,50,0.95) 0%, #080A0F 60%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', fontFamily: "'Inter', -apple-system, sans-serif",
        animation: 'fadeIn 0.3s ease',
      }}>
        {/* Grid texture */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: mode ? 460 : 980 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <div style={{ width: 48, height: 48, background: '#2563EB', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(37,99,235,0.45)' }}>
                <Ticket size={22} color="white" strokeWidth={2.5} />
              </div>
              <span style={{ color: 'white', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>Tikkit</span>
            </a>
          </div>

          {!mode ? (
            /* ── Cards ── */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, animation: 'slideUp 0.28s ease' }}>

              {/* Organizer */}
              {[
                {
                  m: 'organizer' as Mode,
                  badge: 'Organizer Access', accent: '#4F8AFF',
                  badgeBg: 'rgba(30,94,255,0.15)', glow: 'rgba(30,94,255,0.5)',
                  title: 'Run The\nScene',
                  sub: 'Create events, manage your guest list, and collect payments — all in one place.',
                  perks: ['Create & manage events', 'Guest approvals & check-in', 'Payment collection', 'Analytics & reporting'],
                  icon: <Ticket size={13} color="#4F8AFF" />,
                },
                {
                  m: 'attendee' as Mode,
                  badge: 'Guest Pass', accent: '#FFC745',
                  badgeBg: 'rgba(255,199,69,0.12)', glow: 'rgba(255,199,69,0.4)',
                  title: 'Join The\nScene',
                  sub: 'Discover events, register instantly, and collect digital passes from every show.',
                  perks: ['Discover & register for events', 'Earn Social Credits at every event', 'Collect digital souvenir passes'],
                  icon: <Sparkles size={13} color="#FFC745" />,
                },
              ].map(({ m, badge, accent, badgeBg, glow, title, sub, perks, icon }) => (
                <button key={badge} onClick={() => setMode(m)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                  <div
                    style={{ padding: '40px 36px', background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 22, position: 'relative', overflow: 'hidden', transition: 'all 0.2s', height: '100%' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.05)'; el.style.borderColor = 'rgba(255,255,255,0.14)'; el.style.transform = 'translateY(-3px)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.03)'; el.style.borderColor = 'rgba(255,255,255,0.08)'; el.style.transform = 'none' }}
                  >
                    {/* Glow */}
                    <div style={{ position: 'absolute', top: -50, left: -50, width: 160, height: 160, background: glow, borderRadius: '50%', filter: 'blur(55px)', opacity: 0.2, pointerEvents: 'none' }} />

                    <div style={{ position: 'relative' }}>
                      {/* Badge */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: badgeBg, borderRadius: 30, marginBottom: 20 }}>
                        {icon}
                        <span style={{ color: accent, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{badge}</span>
                      </div>

                      {/* Title — whitespace preserved to match screenshot line breaks */}
                      <h2 style={{ color: 'white', fontSize: 30, fontWeight: 800, margin: '0 0 14px', letterSpacing: '-0.5px', lineHeight: 1.15, whiteSpace: 'pre-line' }}>
                        {title}
                      </h2>

                      <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px', lineHeight: 1.7 }}>{sub}</p>

                      {/* Divider */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 20 }} />

                      <p style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>What you get</p>

                      {perks.map(p => (
                        <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 11 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: accent, flexShrink: 0, marginTop: 5 }} />
                          <span style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.5 }}>{p}</span>
                        </div>
                      ))}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 24, color: accent, fontSize: 14, fontWeight: 600 }}>
                        <span>Get started</span><ArrowRight size={15} />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* ── Auth form ── */
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: '36px 32px', animation: 'slideUp 0.22s ease' }}>
              <AuthForm mode={mode} onBack={() => setMode(null)} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
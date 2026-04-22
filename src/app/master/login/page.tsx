'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ForceNoir from '@/components/master/ForceNoir'

export default function MasterLoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [errorCode]             = useState(() => Math.floor(Math.random() * 9000 + 1000).toString())
  const [ts]                    = useState(() => new Date().toISOString())
  const [mounted, setMounted]   = useState(false)

  // If already authed as admin, go straight through
  useEffect(() => {
    setMounted(true)
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (p?.role === 'admin') router.replace('/master')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !data.user) {
      setError('Invalid credentials.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single()

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut()
      setError('Invalid credentials.')
      setLoading(false)
      return
    }

    router.replace('/master')
  }

  return (
    <>
    <ForceNoir />
    <div style={{
      minHeight: '100vh', background: '#050608',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      color: '#4B5563',
    }}>

      {/* ── Top bar ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1f2937' }} />
          <span style={{ fontSize: 11, letterSpacing: '0.08em', color: '#1f2937' }}>ERR_RESOURCE_NOT_FOUND</span>
        </div>
        <span style={{ fontSize: 10, color: '#1a1d24' }}>{mounted ? ts : ''}</span>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>

        {/* 404 display */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{
            fontSize: 'clamp(96px, 20vw, 160px)', fontWeight: 900, margin: 0, lineHeight: 1,
            color: 'rgba(255,255,255,0.03)', letterSpacing: '-8px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            userSelect: 'none',
          }}>404</p>
          <p style={{ fontSize: 13, color: '#374151', margin: '8px 0 4px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            This page could not be found.
          </p>
          <p style={{ fontSize: 11, color: '#1f2937', margin: 0 }}>
            Request ID: {mounted ? errorCode : '----'} · {mounted ? ts.slice(0, 10) : '----'}
          </p>
        </div>

        {/* ── The actual login form — styled as an "access terminal" ── */}
        <form
          onSubmit={handleSubmit}
          style={{
            width: '100%', maxWidth: 340,
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 6, overflow: 'hidden',
          }}
        >
          {/* Terminal header */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1f2937' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1f2937' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1f2937' }} />
            <span style={{ marginLeft: 8, fontSize: 10, color: '#374151', letterSpacing: '0.06em' }}>restricted.access</span>
          </div>

          <div style={{ padding: '20px 18px' }}>
            <p style={{ fontSize: 10, color: '#374151', margin: '0 0 16px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              ▸ Authentication required
            </p>

            {/* Email */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 9, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
                identifier
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="user@domain"
                autoComplete="username"
                required
                style={{
                  width: '100%', background: 'transparent',
                  border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.6)', fontSize: 12, padding: '6px 0',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  caretColor: 'rgba(255,255,255,0.4)',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 9, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
                passphrase
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
                style={{
                  width: '100%', background: 'transparent',
                  border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.6)', fontSize: 12, padding: '6px 0',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  caretColor: 'rgba(255,255,255,0.4)',
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <p style={{ fontSize: 10, color: '#EF4444', margin: '0 0 12px', letterSpacing: '0.06em' }}>
                ✕ {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                width: '100%', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 4, padding: '9px 0',
                color: loading ? '#374151' : 'rgba(255,255,255,0.25)',
                fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)' }}
            >
              {loading ? '▸ verifying...' : '▸ authenticate'}
            </button>
          </div>
        </form>

        {/* Footer trace — looks like an error stack trace */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: '#111318', margin: 0, letterSpacing: '0.04em' }}>
            at Router.resolve (next/dist/server/router.js:248)
          </p>
          <p style={{ fontSize: 10, color: '#111318', margin: '2px 0 0', letterSpacing: '0.04em' }}>
            at Object.match (next/dist/shared/lib/router/utils/route-matcher.js:31)
          </p>
        </div>
      </div>
    </div>
    </>
  )
}

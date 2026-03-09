'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Edit3, Star, Zap, TrendingUp, TrendingDown, Award, LogOut, Bell, Instagram, ChevronRight, X, Check, AlertCircle, Flame, Lock, Sparkles, KeyRound } from 'lucide-react'
import { updateGuestProfile, signOut, sendPasswordReset } from '@/app/actions/guestProfileActions'
import { getCreditTier } from '@/lib/creditUtils'

/* ─── Types ──────────────────────────────────────────────────────── */
type Profile = {
  id: string; full_name: string | null; username: string | null
  phone: string | null; avatar_url: string | null; instagram_handle: string | null
  bio: string | null; is_discoverable: boolean
  attendance_streak: number; total_attended: number; total_no_shows: number
  credit_score: number
}
type Transaction = {
  id: string; type: string; amount: number; balance_after: number
  created_at: string; note: string | null
  event: { title: string; date_start: string } | null
}

/* ─── Fireworks ──────────────────────────────────────────────────── */
function Fireworks({ active }: { active: boolean }) {
  if (!active) return null
  const colors = ['#FFC745', '#EF4444', '#1E5EFF', '#10B981', '#A855F7', '#FFFFFF']
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {Array.from({ length: 100 }).map((_, i) => {
        const x = 20 + Math.random() * 60
        const delay = Math.random() * 1.5
        const color = colors[Math.floor(Math.random() * colors.length)]
        const angle = Math.random() * 360
        const dist = 80 + Math.random() * 120
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${x}%`, top: `${10 + Math.random() * 50}%`,
            width: `${3 + Math.random() * 5}px`, height: `${3 + Math.random() * 5}px`,
            borderRadius: '50%', background: color,
            animation: `firework ${0.8 + Math.random()}s ease-out forwards`,
            animationDelay: `${delay}s`,
            '--angle': `${angle}deg`,
            '--dist': `${dist}px`,
          } as any} />
        )
      })}
    </div>
  )
}

/* ─── Edit Sheet ─────────────────────────────────────────────────── */
function EditSheet({ profile, email, onClose, onSave }: {
  profile: Profile; email: string; onClose: () => void; onSave: (p: Partial<Profile>) => void
}) {
  const [full_name, setName]             = useState(profile.full_name ?? '')
  const [username, setUsername]          = useState(profile.username ?? '')
  const [instagram_handle, setInstagram] = useState(profile.instagram_handle ?? '')
  const [bio, setBio]                    = useState(profile.bio ?? '')
  const [is_discoverable, setDiscoverable] = useState(profile.is_discoverable)
  const [busy, setBusy]                  = useState(false)
  const [err, setErr]                    = useState<string | null>(null)
  const [usernameState, setUsernameState] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle')
  const usernameTimer = useRef<any>(null)

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '11px 13px', color: 'white', fontSize: 14,
    fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
  }

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)
    setUsername(clean)
    setUsernameState('idle')
    if (clean === profile.username) return
    if (clean.length < 3) return
    clearTimeout(usernameTimer.current)
    usernameTimer.current = setTimeout(async () => {
      setUsernameState('checking')
      try {
        const res = await fetch(`/api/check-username?username=${clean}&userId=${profile.id}`)
        const data = await res.json()
        setUsernameState(data.available ? 'available' : 'taken')
      } catch { setUsernameState('idle') }
    }, 600)
  }

  const handleSave = async () => {
    if (usernameState === 'taken') { setErr('Username is already taken'); return }
    if (usernameState === 'checking') { setErr('Please wait for username check'); return }
    if (username.length > 0 && username.length < 3) { setErr('Username must be at least 3 characters'); return }
    setBusy(true); setErr(null)
    try {
      const fd = new FormData()
      fd.append('full_name', full_name)
      fd.append('username', username)
      fd.append('instagram_handle', instagram_handle)
      fd.append('bio', bio)
      fd.append('is_discoverable', String(is_discoverable))
      const res = await updateGuestProfile(fd)
      if (res?.error) { setErr(res.error); return }
      onSave({ full_name, username, instagram_handle, bio, is_discoverable })
      onClose()
    } catch { setErr('Failed to save. Try again.') }
    finally { setBusy(false) }
  }

  const usernameColor = usernameState === 'available' ? '#10B981' : usernameState === 'taken' ? '#EF4444' : '#4B5563'
  const usernameIcon = usernameState === 'available' ? '✓' : usernameState === 'taken' ? '✗' : usernameState === 'checking' ? '…' : ''
  const saveDisabled = busy || usernameState === 'taken' || usernameState === 'checking'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', background: '#13151E', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', border: '1px solid rgba(255,255,255,0.08)', animation: 'sheetSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>Edit Profile</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#9CA3AF' }}><X size={16} /></button>
        </div>

        {/* Locked identity fields */}
        <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, marginBottom: 16 }}>
          <p style={{ color: '#4B5563', fontSize: 10, fontWeight: 700, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Lock size={11} /> Identity — locked until OTP verified
          </p>
          {[
            { label: 'Full Name', value: full_name || '—' },
            { label: 'Email', value: email || '—' },
            { label: 'Phone', value: profile.phone || '—' },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 8 }}>
              <p style={{ color: '#4B5563', fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{f.label}</p>
              <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>{f.value}</p>
            </div>
          ))}
        </div>

        {/* Username with live check */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Username</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#4B5563', fontSize: 14, pointerEvents: 'none' }}>@</span>
            <input value={username} onChange={e => handleUsernameChange(e.target.value)} placeholder="yourhandle"
              style={{ ...inputStyle, paddingLeft: 26, borderColor: usernameState === 'available' ? 'rgba(16,185,129,0.3)' : usernameState === 'taken' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)' }} />
            {usernameIcon && (
              <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: usernameColor, fontSize: 13, fontWeight: 700 }}>{usernameIcon}</span>
            )}
          </div>
          {usernameState === 'taken' && <p style={{ color: '#EF4444', fontSize: 11, margin: '4px 0 0' }}>Username taken — try another</p>}
          {usernameState === 'available' && <p style={{ color: '#10B981', fontSize: 11, margin: '4px 0 0' }}>@{username} is available!</p>}
          <p style={{ color: '#4B5563', fontSize: 11, margin: '4px 0 0' }}>Only letters, numbers, underscores. Max 20 chars.</p>
        </div>

        {/* Instagram */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Instagram Handle</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#4B5563', fontSize: 14, pointerEvents: 'none' }}>@</span>
            <input value={instagram_handle} onChange={e => setInstagram(e.target.value.replace('@',''))} placeholder="yourhandle" style={{ ...inputStyle, paddingLeft: 26 }} />
          </div>
          <p style={{ color: '#4B5563', fontSize: 11, margin: '4px 0 0' }}>Optional — helps organizers know you. Full OAuth connect coming soon.</p>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell organizers about yourself..." rows={3}
            style={{ ...inputStyle, resize: 'none' }} />
        </div>

        {/* Discoverable toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
          <div>
            <p style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: '0 0 2px' }}>Discoverable</p>
            <p style={{ color: '#4B5563', fontSize: 12, margin: 0 }}>Let organizers find your profile</p>
          </div>
          <button onClick={() => setDiscoverable(!is_discoverable)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: is_discoverable ? '#1E5EFF' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: is_discoverable ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
          </button>
        </div>

        {err && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 13px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, marginBottom: 14 }}>
            <AlertCircle size={14} color="#F87171" />
            <span style={{ color: '#FCA5A5', fontSize: 13 }}>{err}</span>
          </div>
        )}

        {/* Change password */}
        <button
          onClick={async () => { const r = await sendPasswordReset(); alert(r.error ? r.error : 'Password reset email sent!') }}
          style={{ width: '100%', padding: '12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, background: 'transparent', color: '#9CA3AF', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <KeyRound size={14} /> Change Password
        </button>

        <button
          onClick={handleSave}
          disabled={saveDisabled}
          style={{ width: '100%', padding: '13px', border: 'none', borderRadius: 14, background: saveDisabled ? 'rgba(255,255,255,0.06)' : '#1E5EFF', color: saveDisabled ? '#6B7280' : 'white', fontSize: 15, fontWeight: 700, cursor: saveDisabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' }}
        >
          {busy ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

/* ─── Credit Score Card ──────────────────────────────────────────── */
function CreditScoreCard({ score }: { score: number }) {
  const tier = getCreditTier(score)
  const [fireworks, setFireworks] = useState(false)
  const [animated, setAnimated] = useState(false)
  const prevScore = useRef(score)

  const MILESTONES = [100, 200, 500, 1000]
  const nextMilestone = MILESTONES.find(m => m > score)
  const progress = nextMilestone ? Math.min((score / nextMilestone) * 100, 100) : 100

  useEffect(() => {
    const hitMilestone = MILESTONES.some(m => prevScore.current < m && score >= m)
    if (hitMilestone) {
      setFireworks(true)
      setTimeout(() => setFireworks(false), 4000)
    }
    prevScore.current = score
    setTimeout(() => setAnimated(true), 100)
  }, [score])

  return (
    <>
      <Fireworks active={fireworks} />
      <div style={{ background: 'linear-gradient(135deg,#0F1B3D 0%,#13151E 100%)', border: `1px solid ${tier.border}`, borderRadius: 22, padding: '22px 20px', marginBottom: 16, boxShadow: `0 8px 40px ${tier.bg}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <p style={{ color: '#4B5563', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Social Credits</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ color: 'white', fontSize: 48, fontWeight: 900, fontFamily: 'var(--font-display)', lineHeight: 1, letterSpacing: '-2px' }}>
                {score}
              </span>
              <span style={{ color: '#4B5563', fontSize: 16, fontWeight: 600 }}>pts</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'inline-block', padding: '5px 12px', borderRadius: 20, background: tier.bg, border: `1px solid ${tier.border}`, color: tier.color, fontSize: 12, fontWeight: 800 }}>
              {tier.label}
            </span>
            <button
              onClick={() => { setFireworks(true); setTimeout(() => setFireworks(false), 4000) }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', fontSize: 11 }}
            >
              <Sparkles size={11} /> celebrate
            </button>
          </div>
        </div>
        {nextMilestone && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#4B5563', fontSize: 11 }}>{score} pts</span>
              <span style={{ color: '#4B5563', fontSize: 11 }}>{nextMilestone} pts</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: animated ? `${progress}%` : '0%', background: `linear-gradient(90deg, ${tier.color}, ${tier.color}88)`, borderRadius: 3, transition: 'width 1.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
            </div>
            <p style={{ color: '#4B5563', fontSize: 11, margin: '6px 0 0', textAlign: 'center' }}>
              {nextMilestone - score} pts to next tier
            </p>
          </div>
        )}
        {!nextMilestone && (
          <div style={{ textAlign: 'center', padding: '6px 0 0' }}>
            <span style={{ color: tier.color, fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Award size={14} /> Max tier reached!
            </span>
          </div>
        )}
      </div>
    </>
  )
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function ProfileClient({ profile: initialProfile, email: initialEmail = '', transactions = [] }: {
  profile: Profile; email?: string; transactions?: Transaction[]
}) {
  const [profile, setProfile] = useState(initialProfile)
  const [showEdit, setShowEdit] = useState(false)
  const [showTx, setShowTx] = useState(false)
  const tier = getCreditTier(profile.credit_score)

  const initials = (profile.full_name ?? profile.username ?? 'G').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const txTypeLabel: Record<string, string> = {
    exit_scan: 'Attended event', vip_bonus: 'VIP bonus', first_event: 'First event',
    streak_bonus: 'Streak bonus', no_show_deduction: 'No-show', admin_adjustment: 'Adjustment',
  }

  const stats: { label: string; value: number; color: string; icon: React.ReactNode }[] = [
    { label: 'Attended',  value: profile.total_attended,     color: '#10B981', icon: null },
    { label: 'Streak',    value: profile.attendance_streak,  color: '#FFC745', icon: <Flame size={14} color="#FFC745" /> },
    { label: 'No-shows',  value: profile.total_no_shows,     color: '#EF4444', icon: null },
  ]

  return (
    <>
      <div style={{ padding: '16px' }}>
        {/* Avatar + name card */}
        <div style={{ background: '#13151E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, padding: '20px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="" style={{ width: 64, height: 64, borderRadius: 20, objectFit: 'cover', border: `2px solid ${tier.border}` }} />
            : <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg,${tier.bg.replace('0.1','0.5')},#080A10)`, border: `2px solid ${tier.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tier.color, fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                {initials}
              </div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: '0 0 2px', fontFamily: 'var(--font-display)', letterSpacing: '-0.4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.full_name ?? 'Tikkit User'}
            </h2>
            {profile.username && <p style={{ color: '#4B5563', fontSize: 13, margin: '0 0 6px' }}>@{profile.username}</p>}
            <span style={{ padding: '3px 9px', borderRadius: 20, background: tier.bg, border: `1px solid ${tier.border}`, color: tier.color, fontSize: 11, fontWeight: 700 }}>{tier.label}</span>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)' }}
          >
            <Edit3 size={13} /> Edit
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {stats.map(stat => (
            <div key={stat.label} style={{ background: '#13151E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px 10px', textAlign: 'center' }}>
              <p style={{ color: stat.color, fontSize: 24, fontWeight: 900, margin: '0 0 2px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                {stat.value}{stat.icon}
              </p>
              <p style={{ color: '#4B5563', fontSize: 11, margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Credit Score */}
        <CreditScoreCard score={profile.credit_score} />

        {/* Transactions */}
        {transactions.length > 0 && (
          <div style={{ background: '#13151E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', marginBottom: 14 }}>
            <button
              onClick={() => setShowTx(!showTx)}
              style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-body)' }}
            >
              <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>Credit History</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#4B5563', fontSize: 12 }}>{transactions.length} entries</span>
                <ChevronRight size={14} color="#4B5563" style={{ transform: showTx ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
            </button>
            {showTx && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {transactions.slice(0, 20).map(tx => (
                  <div key={tx.id} style={{ padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {txTypeLabel[tx.type] ?? tx.type}
                      </p>
                      <p style={{ color: '#4B5563', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.event?.title ?? tx.note ?? '—'}</p>
                    </div>
                    <span style={{ color: tx.amount > 0 ? '#10B981' : '#EF4444', fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-display)', marginLeft: 12, flexShrink: 0 }}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Menu */}
        <div style={{ background: '#13151E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', marginBottom: 24 }}>
          {[
            { icon: <Bell size={16} />, label: 'Notifications', href: '/guest/notifications' },
            profile.instagram_handle
              ? { icon: <Instagram size={16} />, label: `@${profile.instagram_handle}`, href: `https://instagram.com/${profile.instagram_handle}` }
              : { icon: <Instagram size={16} />, label: 'Connect Instagram', href: '#', onClick: () => setShowEdit(true) },
          ].map((item, i) => (
            <a key={i} href={(item as any).href} onClick={(item as any).onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none', color: '#9CA3AF' }}>
              <span style={{ color: '#4B5563' }}>{item.icon}</span>
              <span style={{ flex: 1, fontSize: 14, color: '#D1D5DB' }}>{item.label}</span>
              <ChevronRight size={14} />
            </a>
          ))}
          <button
            onClick={() => signOut()}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', color: '#EF4444', fontSize: 14 }}
          >
            <LogOut size={16} />
            <span style={{ flex: 1, textAlign: 'left' }}>Sign Out</span>
          </button>
        </div>
      </div>

      {showEdit && (
        <EditSheet
          profile={profile}
          email={initialEmail}
          onClose={() => setShowEdit(false)}
          onSave={updates => setProfile(p => ({ ...p, ...updates }))}
        />
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Phone, Mail, Lock, LogOut, Zap, Award, ChevronRight, Check, Eye, EyeOff, Shield, Edit2, Flame } from 'lucide-react'

type Profile = { full_name: string; email: string; phone_number: string | null } | null
type GuestProfile = {
  credit_score: number; total_attended: number; total_no_shows: number
  total_vip_events: number; attendance_streak: number; longest_streak: number
  username: string | null; bio: string | null; city: string | null
  avatar_url: string | null; profile_public: boolean
} | null

function getTier(score: number) {
  if (score >= 1000) return { label: 'Elite',    color: '#FFC745' }
  if (score >= 500)  return { label: 'VIP',      color: '#A855F7' }
  if (score >= 200)  return { label: 'Regular',  color: '#1E5EFF' }
  if (score >= 50)   return { label: 'Rising',   color: '#22C55E' }
  return               { label: 'Newcomer', color: '#6B7280' }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ color: '#4B5563', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px', paddingLeft: 4 }}>{title}</p>
      <div style={{ background: '#13151E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>{children}</div>
    </div>
  )
}

function SettingsRow({ icon: Icon, label, value, onClick, danger = false, last = false }: {
  icon: typeof User; label: string; value?: string; onClick?: () => void; danger?: boolean; last?: boolean
}) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px', background: 'none', border: 'none', cursor: onClick ? 'pointer' : 'default',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)',
      transition: 'background 0.15s', textAlign: 'left',
    }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
    >
      <div style={{ width: 34, height: 34, borderRadius: 10, background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={danger ? '#EF4444' : '#6B7280'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: danger ? '#EF4444' : 'white', fontSize: 14, fontWeight: 500, margin: 0 }}>{label}</p>
        {value && <p style={{ color: '#4B5563', fontSize: 12, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>}
      </div>
      {onClick && <ChevronRight size={16} color={danger ? '#EF4444' : '#4B5563'} />}
    </button>
  )
}

// ── Edit Profile Sheet ────────────────────────────────────────────────────────
function EditProfileSheet({ guestProfile, onClose, onSaved }: { guestProfile: GuestProfile; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient()
  const [username, setUsername] = useState(guestProfile?.username ?? '')
  const [bio, setBio] = useState(guestProfile?.bio ?? '')
  const [city, setCity] = useState(guestProfile?.city ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
      setError('3–20 chars, lowercase, letters/numbers/underscores only')
      return
    }
    setSaving(true)
    const { error: err } = await supabase.from('guest_profiles').update({ username: username || null, bio: bio || null, city: city || null, updated_at: new Date().toISOString() }).eq('id', (await supabase.auth.getUser()).data.user!.id)
    setSaving(false)
    if (err) { setError('Something went wrong. Please try again.'); return }
    onSaved()
    onClose()
  }

  return (
    <Sheet onClose={onClose} title="Edit Profile">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Username" prefix="@">
          <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} placeholder="yourhandle"
            style={{ width: '100%', padding: '11px 12px 11px 28px', background: '#0F1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </Field>
        <Field label="Bio">
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell organizers a bit about yourself..." rows={3}
            style={{ width: '100%', padding: '11px 12px', background: '#0F1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </Field>
        <Field label="City">
          <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Karachi"
            style={{ width: '100%', padding: '11px 12px', background: '#0F1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </Field>
        {error && <p style={{ color: '#FCA5A5', fontSize: 13, margin: 0 }}>{error}</p>}
        <SaveBtn saving={saving} onClick={save} />
      </div>
    </Sheet>
  )
}

// ── Change Phone Sheet ────────────────────────────────────────────────────────
function ChangePhoneSheet({ current, onClose, onSaved }: { current: string | null; onClose: () => void; onSaved: (phone: string) => void }) {
  const supabase = createClient()
  const [phone, setPhone] = useState(current ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!phone.match(/^(\+92|0)[0-9]{10}$/)) {
      setError('Enter a valid Pakistani number e.g. 03001234567')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('profiles').update({ phone_number: phone }).eq('id', user!.id)
    setSaving(false)
    if (err) { setError('Something went wrong. Please try again.'); return }
    onSaved(phone)
    onClose()
  }

  return (
    <Sheet onClose={onClose} title="Phone Number">
      <Field label="Phone">
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="03001234567"
          style={{ width: '100%', padding: '11px 12px', background: '#0F1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      </Field>
      {error && <p style={{ color: '#FCA5A5', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
      <div style={{ marginTop: 14 }}><SaveBtn saving={saving} onClick={save} /></div>
    </Sheet>
  )
}

// ── Change Password Sheet ─────────────────────────────────────────────────────
function ChangePasswordSheet({ onClose }: { onClose: () => void }) {
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setSaving(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (err) { setError('Something went wrong. Please try again.'); return }
    setDone(true)
    setTimeout(onClose, 1500)
  }

  return (
    <Sheet onClose={onClose} title="Change Password">
      {done ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 48, height: 48, background: 'rgba(34,197,94,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Check size={22} color="#22C55E" />
          </div>
          <p style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: 0 }}>Password updated!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="New Password">
            <div style={{ position: 'relative' }}>
              <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters"
                style={{ width: '100%', padding: '11px 40px 11px 12px', background: '#0F1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              <button onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                {show ? <EyeOff size={16} color="#4B5563" /> : <Eye size={16} color="#4B5563" />}
              </button>
            </div>
          </Field>
          <Field label="Confirm Password">
            <input type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password"
              style={{ width: '100%', padding: '11px 12px', background: '#0F1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </Field>
          {error && <p style={{ color: '#FCA5A5', fontSize: 13, margin: 0 }}>{error}</p>}
          <SaveBtn saving={saving} onClick={save} label="Update Password" />
        </div>
      )}
    </Sheet>
  )
}

// ── Shared sheet / field helpers ──────────────────────────────────────────────
function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#13151E', borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,255,255,0.07)', width: '100%', maxWidth: 480, padding: '20px 20px 40px' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '0 auto 16px' }} />
        <p style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 18px' }}>{title}</p>
        {children}
      </div>
    </div>
  )
}

function Field({ label, prefix, children }: { label: string; prefix?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {prefix && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4B5563', fontSize: 14, pointerEvents: 'none' }}>{prefix}</span>}
        {children}
      </div>
    </div>
  )
}

function SaveBtn({ saving, onClick, label = 'Save Changes' }: { saving: boolean; onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} disabled={saving} style={{
      width: '100%', padding: '13px', background: saving ? 'rgba(30,94,255,0.4)' : '#1E5EFF',
      color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
    }}>
      {saving ? 'Saving...' : label}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GuestProfileClient({ userEmail, profile, guestProfile, passCount }: {
  userId: string; userEmail: string
  profile: Profile; guestProfile: GuestProfile; passCount: number
}) {
  const supabase = createClient()
  const router = useRouter()
  const [sheet, setSheet] = useState<'profile' | 'phone' | 'password' | null>(null)
  const [phone, setPhone] = useState(profile?.phone_number ?? null)

  const score = guestProfile?.credit_score ?? 0
  const tier = getTier(score)
  const displayName = profile?.full_name ?? userEmail.split('@')[0]
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const nsRate = guestProfile ? Math.round((guestProfile.total_no_shows / Math.max(1, guestProfile.total_attended + guestProfile.total_no_shows)) * 100) : 0

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div style={{ padding: '20px 18px 8px', fontFamily: 'var(--font-body)' }}>
      {/* Avatar + tier */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${tier.color}25, ${tier.color}08)`, border: `2px solid ${tier.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {guestProfile?.avatar_url ? (
            <Image src={guestProfile.avatar_url} alt={displayName} width={64} height={64} style={{ borderRadius: '50%', objectFit: 'cover', width: '100%', height: '100%' }} />
          ) : (
            <span style={{ color: tier.color, fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{initials}</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', margin: '0 0 2px', letterSpacing: '-0.4px' }}>{displayName}</h2>
          {guestProfile?.username && <p style={{ color: '#4B5563', fontSize: 13, margin: '0 0 6px' }}>@{guestProfile.username}</p>}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: `${tier.color}15`, border: `1px solid ${tier.color}28`, borderRadius: 20 }}>
            <span style={{ color: tier.color, fontSize: 11, fontWeight: 700 }}>{tier.label}</span>
          </div>
        </div>
        <button onClick={() => setSheet('profile')} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Edit2 size={15} color="#6B7280" />
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
        {[
          { icon: Zap,   label: 'Credits',  value: score.toLocaleString(), color: tier.color },
          { icon: Award, label: 'Passes',   value: passCount,              color: '#A855F7'  },
          { icon: Flame, label: 'Streak',   value: guestProfile?.attendance_streak ?? 0,         color: '#F97316' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#13151E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
            <p style={{ color, fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', margin: '0 0 2px', letterSpacing: '-0.3px' }}>{value}</p>
            <p style={{ color: '#4B5563', fontSize: 11, margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Organizer-visible stats */}
      <div style={{ background: '#13151E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Shield size={12} color="#4B5563" />
          <span style={{ color: '#4B5563', fontSize: 12 }}>Public stats — visible to organizers</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: 'Attended',  value: guestProfile?.total_attended ?? 0  },
            { label: 'VIP',       value: guestProfile?.total_vip_events ?? 0 },
            { label: 'No-shows',  value: guestProfile?.total_no_shows ?? 0  },
            { label: 'NS Rate',   value: `${nsRate}%`                        },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ color: '#E5E7EB', fontSize: 16, fontWeight: 700, margin: '0 0 2px' }}>{value}</p>
              <p style={{ color: '#4B5563', fontSize: 11, margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Account settings */}
      <Section title="Account">
        <SettingsRow icon={User}  label="Edit Profile" value={guestProfile?.username ? `@${guestProfile.username}` : 'Set username & bio'} onClick={() => setSheet('profile')} />
        <SettingsRow icon={Mail}  label="Email" value={userEmail} />
        <SettingsRow icon={Phone} label="Phone Number" value={phone ?? 'Not set'} onClick={() => setSheet('phone')} />
        <SettingsRow icon={Lock}  label="Change Password" onClick={() => setSheet('password')} last />
      </Section>

      {/* Sign out */}
      <Section title="Session">
        <SettingsRow icon={LogOut} label="Sign Out" onClick={signOut} danger last />
      </Section>

      {/* Sheets */}
      {sheet === 'profile'  && <EditProfileSheet guestProfile={guestProfile} onClose={() => setSheet(null)} onSaved={() => router.refresh()} />}
      {sheet === 'phone'    && <ChangePhoneSheet current={phone} onClose={() => setSheet(null)} onSaved={p => setPhone(p)} />}
      {sheet === 'password' && <ChangePasswordSheet onClose={() => setSheet(null)} />}
    </div>
  )
}
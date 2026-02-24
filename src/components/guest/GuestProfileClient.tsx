'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Star, Ticket, Zap, Flame, Eye, EyeOff, Check, LogOut, Edit2, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Profile = { full_name: string; email: string } | null
type GuestProfile = {
  credit_score: number
  total_attended: number
  total_no_shows: number
  total_vip_events: number
  attendance_streak: number
  longest_streak: number
  username: string | null
  bio: string | null
  city: string | null
  avatar_url: string | null
  profile_public: boolean
} | null

function getTier(score: number) {
  if (score >= 1000) return { label: 'Elite',    color: '#FFC745', emoji: '👑' }
  if (score >= 500)  return { label: 'VIP',      color: '#A855F7', emoji: '💜' }
  if (score >= 200)  return { label: 'Regular',  color: '#1E5EFF', emoji: '🔵' }
  if (score >= 50)   return { label: 'Rising',   color: '#22C55E', emoji: '🟢' }
  return               { label: 'Newcomer', color: '#6B7280', emoji: '⚪' }
}

function noShowRate(attended: number, noShows: number) {
  if (attended + noShows === 0) return 0
  return Math.round((noShows / (attended + noShows)) * 100)
}

export default function GuestProfileClient({
  userId,
  profile,
  guestProfile,
  passCount,
}: {
  userId: string
  profile: Profile
  guestProfile: GuestProfile
  passCount: number
}) {
  const supabase = createClient()
  const router = useRouter()

  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(guestProfile?.username ?? '')
  const [bio, setBio] = useState(guestProfile?.bio ?? '')
  const [city, setCity] = useState(guestProfile?.city ?? '')
  const [profilePublic, setProfilePublic] = useState(guestProfile?.profile_public ?? true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const score = guestProfile?.credit_score ?? 0
  const tier = getTier(score)
  const nsRate = noShowRate(guestProfile?.total_attended ?? 0, guestProfile?.total_no_shows ?? 0)

  const displayName = profile?.full_name ?? profile?.email?.split('@')[0] ?? 'Guest'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const handleSave = async () => {
    setError(null)
    setSaving(true)

    if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
      setError('Username: 3-20 chars, lowercase, letters/numbers/underscores only')
      setSaving(false)
      return
    }

    const { error: err } = await supabase
      .from('guest_profiles')
      .update({
        username: username.trim() || null,
        bio: bio.trim() || null,
        city: city.trim() || null,
        profile_public: profilePublic,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    setSaving(false)
    if (err) { setError(err.message); return }

    setSaved(true)
    setTimeout(() => { setSaved(false); setEditing(false) }, 1500)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/guest/login')
  }

  return (
    <div style={{ padding: '20px 18px 8px', fontFamily: "'Inter', sans-serif" }}>
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${tier.color}30, ${tier.color}10)`,
          border: `2px solid ${tier.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {guestProfile?.avatar_url ? (
            <img src={guestProfile.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: tier.color, fontSize: 22, fontWeight: 800, fontFamily: 'Poppins, sans-serif' }}>{initials}</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, fontFamily: 'Poppins, sans-serif', margin: '0 0 2px', letterSpacing: '-0.4px' }}>
            {displayName}
          </h2>
          {guestProfile?.username && (
            <p style={{ color: '#4B5563', fontSize: 13, margin: '0 0 4px' }}>@{guestProfile.username}</p>
          )}
          {/* Tier chip */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 20,
            background: `${tier.color}15`, border: `1px solid ${tier.color}30`,
          }}>
            <span style={{ fontSize: 11 }}>{tier.emoji}</span>
            <span style={{ color: tier.color, fontSize: 11, fontWeight: 700 }}>{tier.label}</span>
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            width: 36, height: 36, borderRadius: 10, border: 'none',
            background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Edit2 size={15} color="#6B7280" />
        </button>
      </div>

      {/* Bio */}
      {guestProfile?.bio && !editing && (
        <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>{guestProfile.bio}</p>
      )}

      {/* Stats — organizer-visible card */}
      <div style={{
        background: '#13151E', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: '16px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            Public Stats
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Shield size={11} color="#4B5563" />
            <span style={{ color: '#4B5563', fontSize: 11 }}>Visible to organizers</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { icon: Zap,    label: 'Score',    value: score.toLocaleString(), color: tier.color },
            { icon: Ticket, label: 'Attended', value: guestProfile?.total_attended ?? 0, color: '#9CA3AF' },
            { icon: Star,   label: 'VIP',      value: guestProfile?.total_vip_events ?? 0, color: '#FFC745' },
            { icon: Flame,  label: 'Streak',   value: `${guestProfile?.attendance_streak ?? 0}🔥`, color: '#F97316' },
            { icon: User,   label: 'No-show',  value: `${nsRate}%`, color: nsRate > 20 ? '#EF4444' : '#6B7280' },
            { icon: Ticket, label: 'Passes',   value: passCount, color: '#4F8AFF' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ color: color, fontSize: 17, fontWeight: 800, fontFamily: 'Poppins, sans-serif', margin: '0 0 2px' }}>{value}</p>
              <p style={{ color: '#374151', fontSize: 11, margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{
          background: '#13151E', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '16px', marginBottom: 16,
        }}>
          <p style={{ color: '#9CA3AF', fontSize: 13, fontWeight: 700, margin: '0 0 14px' }}>Edit Profile</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4B5563', fontSize: 14 }}>@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase())}
                  placeholder="yourhandle"
                  style={{ width: '100%', padding: '10px 12px 10px 26px', background: '#0F1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell organizers a bit about yourself..."
                rows={3}
                style={{ width: '100%', padding: '10px 12px', background: '#0F1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Karachi"
                style={{ width: '100%', padding: '10px 12px', background: '#0F1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Profile visibility */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
              <div>
                <p style={{ color: '#E5E7EB', fontSize: 14, margin: '0 0 2px' }}>Public Profile</p>
                <p style={{ color: '#4B5563', fontSize: 12, margin: 0 }}>Organizers can see your stats when approving applications</p>
              </div>
              <button
                onClick={() => setProfilePublic(!profilePublic)}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: profilePublic ? '#1E5EFF' : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.2s',
                  flexShrink: 0, marginLeft: 12,
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%',
                  background: 'white', transition: 'transform 0.2s',
                  transform: profilePublic ? 'translateX(22px)' : 'translateX(2px)',
                }} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#FCA5A5', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '12px', background: saving ? 'rgba(30,94,255,0.4)' : '#1E5EFF',
                color: 'white', border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {saved ? <><Check size={16} /> Saved!</> : saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}

      {/* Account */}
      <div style={{
        background: '#13151E', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: '16px', marginBottom: 16,
      }}>
        <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Account</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <User size={15} color="#4B5563" />
          <span style={{ color: '#6B7280', fontSize: 14 }}>{profile?.email}</span>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        style={{
          width: '100%', padding: '13px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 14, color: '#EF4444', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <LogOut size={15} />
        Sign out
      </button>
    </div>
  )
}
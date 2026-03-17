'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Edit3, Star, Zap, TrendingUp, TrendingDown, Award, LogOut, Bell, Instagram, ChevronRight, X, Check, AlertCircle, Flame, Lock, Sparkles, KeyRound, CalendarDays, MapPin, ChevronDown } from 'lucide-react'
import { updateGuestProfile, signOut, sendPasswordReset } from '@/app/actions/guestProfileActions'
import { getCreditTier } from '@/lib/creditUtils'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'

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
type PastEvent = {
  id: string; status: string; created_at: string
  event: { id: string; title: string; date_start: string | null; cover_image_url: string | null; venue_name: string | null } | null
}

/* ─── Cyberpunk Avatars ──────────────────────────────────────────── */
const CYBER_AVATARS = [
  {
    id: 'cyber:neon-blue',
    label: 'GHOST',
    render: () => (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="64" height="64" rx="16" fill="#050918"/>
        <rect x="8" y="28" width="48" height="24" rx="4" fill="#0D1F4E"/>
        <rect x="10" y="30" width="44" height="20" rx="3" fill="none" stroke="#1E5EFF" strokeWidth="0.8" strokeOpacity="0.6"/>
        <rect x="14" y="34" width="14" height="8" rx="2" fill="#1E5EFF" fillOpacity="0.2"/>
        <rect x="14" y="34" width="14" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="0.8"/>
        <rect x="36" y="34" width="14" height="8" rx="2" fill="#1E5EFF" fillOpacity="0.2"/>
        <rect x="36" y="34" width="14" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="0.8"/>
        <circle cx="21" cy="38" r="2.5" fill="#00D4FF" fillOpacity="0.8"/>
        <circle cx="43" cy="38" r="2.5" fill="#00D4FF" fillOpacity="0.8"/>
        <rect x="24" y="46" width="16" height="2" rx="1" fill="#1E5EFF" fillOpacity="0.5"/>
        <path d="M24 12 L40 12 L44 20 L32 24 L20 20 Z" fill="#0A1530" stroke="#1E5EFF" strokeWidth="0.8"/>
        <path d="M28 16 L36 16" stroke="#00D4FF" strokeWidth="1" strokeOpacity="0.6"/>
        <circle cx="32" cy="9" r="3" fill="#1E5EFF" fillOpacity="0.4" stroke="#00D4FF" strokeWidth="0.8"/>
        <line x1="20" y1="20" x2="16" y2="28" stroke="#1E5EFF" strokeWidth="0.8"/>
        <line x1="44" y1="20" x2="48" y2="28" stroke="#1E5EFF" strokeWidth="0.8"/>
      </svg>
    ),
    color: '#00D4FF',
    bg: '#050918',
  },
  {
    id: 'cyber:crimson',
    label: 'WRAITH',
    render: () => (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="64" height="64" rx="16" fill="#150505"/>
        <circle cx="32" cy="30" r="18" fill="#1A0808" stroke="#EF4444" strokeWidth="0.8" strokeOpacity="0.5"/>
        <path d="M20 26 Q24 22 28 26 Q32 30 36 26 Q40 22 44 26" stroke="#EF4444" strokeWidth="1.5" strokeOpacity="0.9" fill="none"/>
        <rect x="22" y="26" width="8" height="5" rx="1" fill="#EF4444" fillOpacity="0.15"/>
        <rect x="34" y="26" width="8" height="5" rx="1" fill="#EF4444" fillOpacity="0.15"/>
        <circle cx="26" cy="29" r="2" fill="#FF3333"/>
        <circle cx="38" cy="29" r="2" fill="#FF3333"/>
        <path d="M26 37 Q32 40 38 37" stroke="#EF4444" strokeWidth="1" fill="none" strokeOpacity="0.7"/>
        <path d="M14 18 L20 24" stroke="#EF4444" strokeWidth="0.8" strokeOpacity="0.5"/>
        <path d="M50 18 L44 24" stroke="#EF4444" strokeWidth="0.8" strokeOpacity="0.5"/>
        <path d="M32 6 L32 12" stroke="#EF4444" strokeWidth="1" strokeDasharray="2 2"/>
        <path d="M22 50 Q32 56 42 50" stroke="#EF4444" strokeWidth="1" fill="none" strokeOpacity="0.4"/>
        <line x1="16" y1="48" x2="48" y2="48" stroke="#EF4444" strokeWidth="0.5" strokeOpacity="0.3"/>
      </svg>
    ),
    color: '#FF3333',
    bg: '#150505',
  },
  {
    id: 'cyber:chrome',
    label: 'CHROME',
    render: () => (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="64" height="64" rx="16" fill="#0D0D0D"/>
        <polygon points="32,8 50,20 50,44 32,56 14,44 14,20" fill="#181818" stroke="#C0C0C0" strokeWidth="0.8" strokeOpacity="0.5"/>
        <polygon points="32,14 46,23 46,41 32,50 18,41 18,23" fill="none" stroke="#E0E0E0" strokeWidth="0.5" strokeOpacity="0.3"/>
        <rect x="23" y="26" width="8" height="6" rx="1" fill="#C0C0C0" fillOpacity="0.15" stroke="#E0E0E0" strokeWidth="0.8"/>
        <rect x="33" y="26" width="8" height="6" rx="1" fill="#C0C0C0" fillOpacity="0.15" stroke="#E0E0E0" strokeWidth="0.8"/>
        <circle cx="27" cy="29" r="2" fill="#F0F0F0"/>
        <circle cx="37" cy="29" r="2" fill="#F0F0F0"/>
        <line x1="24" y1="36" x2="40" y2="36" stroke="#C0C0C0" strokeWidth="1" strokeOpacity="0.5"/>
        <line x1="28" y1="38" x2="36" y2="38" stroke="#C0C0C0" strokeWidth="0.8" strokeOpacity="0.3"/>
        <rect x="30" y="18" width="4" height="6" rx="1" fill="#C0C0C0" fillOpacity="0.3"/>
      </svg>
    ),
    color: '#E0E0E0',
    bg: '#0D0D0D',
  },
  {
    id: 'cyber:glitch',
    label: 'GLITCH',
    render: () => (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="64" height="64" rx="16" fill="#020A0A"/>
        <rect x="10" y="10" width="44" height="44" rx="6" fill="#041010" stroke="#10B981" strokeWidth="0.5" strokeOpacity="0.4"/>
        <rect x="8" y="27" width="20" height="4" rx="1" fill="#10B981" fillOpacity="0.2"/>
        <rect x="14" y="27" width="20" height="4" rx="1" fill="#00FF88" fillOpacity="0.1"/>
        <rect x="12" y="26" width="8" height="6" rx="1" fill="#10B981" fillOpacity="0.3" stroke="#00FF88" strokeWidth="0.8"/>
        <rect x="36" y="24" width="16" height="8" rx="1" fill="#10B981" fillOpacity="0.15" stroke="#00FF88" strokeWidth="0.8"/>
        <circle cx="16" cy="29" r="2.5" fill="#00FF88"/>
        <rect x="38" y="26" width="12" height="4" rx="0.5" fill="#00FF88" fillOpacity="0.3"/>
        <line x1="38" y1="27.5" x2="50" y2="27.5" stroke="#00FF88" strokeWidth="0.5"/>
        <line x1="38" y1="29" x2="48" y2="29" stroke="#00FF88" strokeWidth="0.5"/>
        <path d="M10 36 L54 36" stroke="#10B981" strokeWidth="0.5" strokeDasharray="3 2"/>
        <rect x="18" y="40" width="28" height="3" rx="1" fill="#10B981" fillOpacity="0.1"/>
        <rect x="18" y="40" width="18" height="3" rx="1" fill="#00FF88" fillOpacity="0.2"/>
        <rect x="20" y="44" width="10" height="2" rx="0.5" fill="#10B981" fillOpacity="0.2"/>
        <rect x="26" y="16" width="20" height="3" rx="1" fill="#10B981" fillOpacity="0.15"/>
        <rect x="26" y="20" width="12" height="2" rx="0.5" fill="#10B981" fillOpacity="0.1"/>
      </svg>
    ),
    color: '#00FF88',
    bg: '#020A0A',
  },
  {
    id: 'cyber:gold',
    label: 'SHOGUN',
    render: () => (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="64" height="64" rx="16" fill="#120A00"/>
        <path d="M32 6 L40 14 L48 14 L48 48 L16 48 L16 14 L24 14 Z" fill="#1A0E00" stroke="#FFC745" strokeWidth="0.8" strokeOpacity="0.6"/>
        <path d="M16 14 L32 8 L48 14" fill="none" stroke="#FFC745" strokeWidth="1"/>
        <rect x="20" y="24" width="10" height="6" rx="2" fill="#FFC745" fillOpacity="0.15" stroke="#FFC745" strokeWidth="0.8"/>
        <rect x="34" y="24" width="10" height="6" rx="2" fill="#FFC745" fillOpacity="0.15" stroke="#FFC745" strokeWidth="0.8"/>
        <circle cx="25" cy="27" r="2" fill="#FFD700"/>
        <circle cx="39" cy="27" r="2" fill="#FFD700"/>
        <path d="M25 36 L39 36" stroke="#FFC745" strokeWidth="0.8" strokeOpacity="0.5"/>
        <path d="M27 38 L37 38" stroke="#FFC745" strokeWidth="0.6" strokeOpacity="0.4"/>
        <path d="M16 48 L16 52 L20 52" stroke="#FFC745" strokeWidth="0.8"/>
        <path d="M48 48 L48 52 L44 52" stroke="#FFC745" strokeWidth="0.8"/>
        <line x1="20" y1="18" x2="44" y2="18" stroke="#FFC745" strokeWidth="0.5" strokeOpacity="0.5"/>
        <circle cx="32" cy="16" r="2" fill="#FFC745" fillOpacity="0.4"/>
      </svg>
    ),
    color: '#FFD700',
    bg: '#120A00',
  },
  {
    id: 'cyber:volt',
    label: 'VOLT',
    render: () => (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="64" height="64" rx="16" fill="#080A00"/>
        <ellipse cx="32" cy="32" rx="22" ry="24" fill="#0F1400" stroke="#AAFF00" strokeWidth="0.6" strokeOpacity="0.4"/>
        <path d="M20 18 L44 18 L48 32 L36 32 L42 48 L22 32 L34 32 Z" fill="#AAFF00" fillOpacity="0.15" stroke="#AAFF00" strokeWidth="0.8"/>
        <circle cx="24" cy="28" r="3" fill="none" stroke="#AAFF00" strokeWidth="1.5"/>
        <circle cx="40" cy="28" r="3" fill="none" stroke="#AAFF00" strokeWidth="1.5"/>
        <circle cx="24" cy="28" r="1" fill="#CCFF00"/>
        <circle cx="40" cy="28" r="1" fill="#CCFF00"/>
        <path d="M27 36 L37 36 L35 40 L29 40 Z" fill="#AAFF00" fillOpacity="0.2" stroke="#AAFF00" strokeWidth="0.6"/>
        <path d="M8 32 L16 32" stroke="#AAFF00" strokeWidth="1" strokeDasharray="2 1"/>
        <path d="M48 32 L56 32" stroke="#AAFF00" strokeWidth="1" strokeDasharray="2 1"/>
      </svg>
    ),
    color: '#CCFF00',
    bg: '#080A00',
  },
  {
    id: 'cyber:violet',
    label: 'PHANTOM',
    render: () => (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="64" height="64" rx="16" fill="#0A0514"/>
        <path d="M32 6 C44 6 54 16 54 30 C54 44 44 58 32 58 C20 58 10 44 10 30 C10 16 20 6 32 6Z" fill="#120920" stroke="#A855F7" strokeWidth="0.6" strokeOpacity="0.4"/>
        <path d="M14 30 C14 30 20 22 32 22 C44 22 50 30 50 30" stroke="#A855F7" strokeWidth="0.8" strokeOpacity="0.5" fill="none"/>
        <rect x="20" y="24" width="10" height="7" rx="2" fill="#A855F7" fillOpacity="0.2" stroke="#D946EF" strokeWidth="0.8"/>
        <rect x="34" y="24" width="10" height="7" rx="2" fill="#A855F7" fillOpacity="0.2" stroke="#D946EF" strokeWidth="0.8"/>
        <circle cx="25" cy="27.5" r="2.5" fill="#D946EF"/>
        <circle cx="39" cy="27.5" r="2.5" fill="#D946EF"/>
        <circle cx="25" cy="27.5" r="1" fill="white"/>
        <circle cx="39" cy="27.5" r="1" fill="white"/>
        <path d="M26 36 Q32 40 38 36" stroke="#A855F7" strokeWidth="1" fill="none"/>
        <path d="M32 6 L32 10" stroke="#D946EF" strokeWidth="1.5"/>
        <circle cx="32" cy="12" r="2" fill="#A855F7" fillOpacity="0.5"/>
      </svg>
    ),
    color: '#D946EF',
    bg: '#0A0514',
  },
  {
    id: 'cyber:ice',
    label: 'ICE',
    render: () => (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="64" height="64" rx="16" fill="#030C14"/>
        <rect x="12" y="12" width="40" height="40" rx="8" fill="#06121E" stroke="#67E8F9" strokeWidth="0.6" strokeOpacity="0.4"/>
        <line x1="32" y1="12" x2="32" y2="52" stroke="#67E8F9" strokeWidth="0.4" strokeOpacity="0.3"/>
        <line x1="12" y1="32" x2="52" y2="32" stroke="#67E8F9" strokeWidth="0.4" strokeOpacity="0.3"/>
        <line x1="12" y1="12" x2="52" y2="52" stroke="#67E8F9" strokeWidth="0.3" strokeOpacity="0.2"/>
        <line x1="52" y1="12" x2="12" y2="52" stroke="#67E8F9" strokeWidth="0.3" strokeOpacity="0.2"/>
        <polygon points="32,18 37,26 32,22 27,26" fill="#67E8F9" fillOpacity="0.3" stroke="#A5F3FC" strokeWidth="0.6"/>
        <rect x="22" y="27" width="8" height="6" rx="1.5" fill="#67E8F9" fillOpacity="0.2" stroke="#A5F3FC" strokeWidth="0.8"/>
        <rect x="34" y="27" width="8" height="6" rx="1.5" fill="#67E8F9" fillOpacity="0.2" stroke="#A5F3FC" strokeWidth="0.8"/>
        <circle cx="26" cy="30" r="2" fill="#A5F3FC"/>
        <circle cx="38" cy="30" r="2" fill="#A5F3FC"/>
        <path d="M26 37 L38 37" stroke="#67E8F9" strokeWidth="1"/>
        <path d="M29 39 L35 39" stroke="#67E8F9" strokeWidth="0.8" strokeOpacity="0.5"/>
        <polygon points="32,44 37,38 32,41 27,38" fill="#67E8F9" fillOpacity="0.2" stroke="#A5F3FC" strokeWidth="0.5"/>
      </svg>
    ),
    color: '#A5F3FC',
    bg: '#030C14',
  },
]

function isCyberAvatar(url: string | null): boolean {
  return !!url && url.startsWith('cyber:')
}
function getCyberAvatar(id: string) {
  return CYBER_AVATARS.find(a => a.id === id)
}

/* ─── Avatar Picker ──────────────────────────────────────────────── */
function AvatarPicker({ current, onSelect, onClose }: {
  current: string | null; onSelect: (id: string) => void; onClose: () => void
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', background: '#0D0F1A', borderRadius: '28px 28px 0 0', padding: '20px 20px 44px', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', width: '100%', maxWidth: 480 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div>
            <h3 style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>Choose Avatar</h3>
            <p style={{ color: '#4B5563', fontSize: 12, margin: '4px 0 0' }}>Cyberpunk-themed — pick your identity</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#9CA3AF' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
          {CYBER_AVATARS.map(avatar => {
            const selected = current === avatar.id
            return (
              <button
                key={avatar.id}
                onClick={() => onSelect(avatar.id)}
                style={{
                  background: selected ? `${avatar.color}20` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${selected ? avatar.color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 14,
                  padding: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.18s',
                  boxShadow: selected ? `0 0 12px ${avatar.color}40` : 'none',
                }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden' }}>
                  {avatar.render()}
                </div>
                <span style={{ color: selected ? avatar.color : '#6B7280', fontSize: 9, fontWeight: 700, letterSpacing: '0.5px' }}>
                  {avatar.label}
                </span>
                {selected && <Check size={10} color={avatar.color} />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Avatar Display ─────────────────────────────────────────────── */
function AvatarDisplay({ url, initials, tier, size = 64 }: { url: string | null; initials: string; tier: any; size?: number }) {
  if (url && isCyberAvatar(url)) {
    const cyberAv = getCyberAvatar(url)
    if (cyberAv) {
      return (
        <div style={{
          width: size, height: size, borderRadius: size * 0.3,
          overflow: 'hidden', border: `2px solid ${cyberAv.color}`,
          flexShrink: 0, boxShadow: `0 0 16px ${cyberAv.color}40`,
        }}>
          {cyberAv.render()}
        </div>
      )
    }
  }
  if (url) {
    return <img src={url} alt="" style={{ width: size, height: size, borderRadius: size * 0.3, objectFit: 'cover', border: `2px solid ${tier.border}`, flexShrink: 0 }} />
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: `linear-gradient(135deg,${tier.bg.replace('0.1','0.5')},#080A10)`,
      border: `2px solid ${tier.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: tier.color, fontSize: size * 0.34, fontWeight: 900,
      fontFamily: 'var(--font-display)', flexShrink: 0,
    }}>
      {initials}
    </div>
  )
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', background: '#13151E', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', border: '1px solid rgba(255,255,255,0.08)', animation: 'sheetSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)', maxHeight: '90vh', overflowY: 'auto', width: '100%', maxWidth: 480 }}>
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
              <span style={{ color: 'white', fontSize: 48, fontWeight: 900, fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-2px' }}>
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

/* ─── Past Events ────────────────────────────────────────────────── */
const GRADIENTS = [
  'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #200122 0%, #6f0000 100%)',
  'linear-gradient(135deg, #1f0033 0%, #0d001a 50%, #2d0050 100%)',
  'linear-gradient(135deg, #001233 0%, #001845 50%, #023e8a 100%)',
]
function eventGradient(id: string) { return GRADIENTS[id.charCodeAt(0) % GRADIENTS.length] }

const statusLabel: Record<string, { label: string; color: string }> = {
  confirmed:       { label: 'Confirmed', color: '#10B981' },
  checked_in:      { label: 'Attended', color: '#1E5EFF' },
  attended:        { label: 'Attended', color: '#1E5EFF' },
  registered:      { label: 'Registered', color: '#A855F7' },
  payment_pending: { label: 'Paying', color: '#FFC745' },
  eoi_approved:    { label: 'Approved', color: '#10B981' },
}

function PastEventsSection({ events }: { events: PastEvent[] }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? events : events.slice(0, 4)

  if (events.length === 0) return null

  return (
    <div style={{ background: '#13151E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', marginBottom: 14 }}>
      <div style={{ padding: '14px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>Past Events</p>
          <p style={{ color: '#4B5563', fontSize: 11, margin: '2px 0 0' }}>{events.length} event{events.length !== 1 ? 's' : ''} attended</p>
        </div>
        <CalendarDays size={16} color="#4B5563" />
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {shown.map(reg => {
          const ev = reg.event
          if (!ev) return null
          const s = statusLabel[reg.status] ?? { label: reg.status, color: '#6B7280' }
          return (
            <div key={reg.id} style={{ display: 'flex', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                background: eventGradient(ev.id),
              }}>
                {ev.cover_image_url && (
                  <img src={ev.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.title}
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {ev.date_start && (
                    <span style={{ color: '#4B5563', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <CalendarDays size={10} />
                      {format(new Date(ev.date_start), 'MMM d, yyyy')}
                    </span>
                  )}
                  {ev.venue_name && (
                    <span style={{ color: '#4B5563', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <MapPin size={10} />
                      {ev.venue_name}
                    </span>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: `${s.color}18`, border: `1px solid ${s.color}30`, borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
      {events.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ width: '100%', padding: '11px', background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'var(--font-body)', borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <ChevronDown size={13} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          {expanded ? 'Show less' : `Show ${events.length - 4} more`}
        </button>
      )}
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function ProfileClient({ profile: initialProfile, email: initialEmail = '', transactions = [], pastEvents = [] }: {
  profile: Profile; email?: string; transactions?: Transaction[]; pastEvents?: PastEvent[]
}) {
  const [profile, setProfile] = useState(initialProfile)
  const [showEdit, setShowEdit] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showTx, setShowTx] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const tier = getCreditTier(profile.credit_score)
  const supabase = createClient()

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

  const handleAvatarSelect = async (avatarId: string) => {
    setAvatarSaving(true)
    const { error } = await supabase.from('profiles').update({ avatar_url: avatarId }).eq('id', profile.id)
    if (!error) {
      setProfile(p => ({ ...p, avatar_url: avatarId }))
    }
    setAvatarSaving(false)
    setShowAvatarPicker(false)
  }

  return (
    <>
      <div style={{ padding: '16px' }}>
        {/* Avatar + name card */}
        <div style={{ background: '#13151E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, padding: '20px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: profile.bio ? 14 : 0 }}>
            {/* Tappable avatar */}
            <button
              onClick={() => setShowAvatarPicker(true)}
              style={{ position: 'relative', background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
            >
              <AvatarDisplay url={profile.avatar_url} initials={initials} tier={tier} size={64} />
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 20, height: 20, borderRadius: '50%',
                background: '#1E5EFF', border: '2px solid #13151E',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Edit3 size={9} color="white" />
              </div>
              {avatarSaving && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: 19, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 16, height: 16, border: '2px solid #1E5EFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                </div>
              )}
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: '0 0 2px', fontFamily: 'var(--font-display)', letterSpacing: '-0.4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.full_name ?? 'Tikkit User'}
              </h2>
              {profile.username && <p style={{ color: '#4B5563', fontSize: 13, margin: '0 0 6px' }}>@{profile.username}</p>}
              <span style={{ padding: '3px 9px', borderRadius: 20, background: tier.bg, border: `1px solid ${tier.border}`, color: tier.color, fontSize: 11, fontWeight: 700 }}>{tier.label}</span>
            </div>
            <button
              onClick={() => setShowEdit(true)}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', flexShrink: 0 }}
            >
              <Edit3 size={13} /> Edit
            </button>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0, lineHeight: 1.5, paddingTop: 4 }}>
              {profile.bio}
            </p>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {stats.map(stat => (
            <div key={stat.label} style={{ background: '#13151E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px 10px', textAlign: 'center' }}>
              <p style={{ color: stat.color, fontSize: 24, fontWeight: 900, margin: '0 0 2px', fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                {stat.value}{stat.icon}
              </p>
              <p style={{ color: '#4B5563', fontSize: 11, margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Credit Score */}
        <CreditScoreCard score={profile.credit_score} />

        {/* Past Events */}
        <PastEventsSection events={pastEvents} />

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

      {showAvatarPicker && (
        <AvatarPicker
          current={profile.avatar_url}
          onSelect={handleAvatarSelect}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}

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

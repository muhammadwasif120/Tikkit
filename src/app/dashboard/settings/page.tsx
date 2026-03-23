'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Lock, Users, Bell, Save, Check,
  Eye, EyeOff, UserPlus, UserMinus, LogIn, LogOut,
  CreditCard, Zap, Flag, Trash2, Link2,
  Copy, ExternalLink, Shield, Crown, AlertCircle,
  Clock, RefreshCw, ChevronDown, Phone, Building2,
  Camera, Loader2, ImageIcon, AtSign, X, ShieldCheck, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { createTeamInvite, revokeTeamInvite, deleteTeamInvite, reactivateTeamInvite } from '@/app/actions/teamActions'
import PaymentAccountsSection from '@/components/settings/PaymentAccountsSection'
import clsx from 'clsx'

type NotifPrefs = {
  guest_signup: boolean
  guest_cancellation: boolean
  entry_scan: boolean
  exit_scan: boolean
  vendor_payment_due: boolean
  event_going_live: boolean
  event_ended: boolean
}

type Profile = {
  id: string
  full_name: string
  email: string
  role: string
  avatar_url: string | null
  phone_number: string | null
  company_name: string | null
  cover_image_url: string | null
  logo_url: string | null
  username: string | null
  notification_preferences: NotifPrefs | null
}

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10 MB
const SLUG_RE = /^[a-z0-9-]+$/

type TeamInvite = {
  id: string
  label: string
  role: 'staff' | 'organizer'
  token: string
  expires_at: string | null
  revoked: boolean
  created_at: string
}

const notifConfig: Record<string, { label: string; description: string; icon: React.ElementType; color: string }> = {
  guest_signup:        { label: 'Guest signs up',     description: 'When a new guest registers for your event',   icon: UserPlus,   color: 'text-green-400' },
  guest_cancellation:  { label: 'Guest cancels',      description: 'When a guest cancels their registration',     icon: UserMinus,  color: 'text-red-400' },
  entry_scan:          { label: 'Guest checks in',    description: 'When a QR code is scanned for entry',         icon: LogIn,      color: 'text-blue-400' },
  exit_scan:           { label: 'Guest checks out',   description: 'When a QR code is scanned for exit',          icon: LogOut,     color: 'text-gray-400' },
  vendor_payment_due:  { label: 'Vendor payment due', description: 'When a vendor invoice is created or overdue', icon: CreditCard, color: 'text-yellow-400' },
  event_going_live:    { label: 'Event goes live',    description: 'When you publish an event',                   icon: Zap,        color: 'text-purple-400' },
  event_ended:         { label: 'Event ends',         description: 'When an event is cancelled or concluded',     icon: Flag,       color: 'text-orange-400' },
}

const EXPIRY_OPTIONS = [
  { value: '24h', label: '24 hours' },
  { value: '7d',  label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: null,  label: 'Never expires' },
]

function getRoleConfig(role: string) {
  if (role === 'organizer') return { label: 'Organizer', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Crown }
  return { label: 'Staff', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Shield }
}

function isExpired(invite: TeamInvite) {
  return !!invite.expires_at && new Date(invite.expires_at) < new Date()
}

function InviteStatus({ invite }: { invite: TeamInvite }) {
  if (invite.revoked) return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">Revoked</span>
  if (isExpired(invite)) return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-400">Expired</span>
  return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">Active</span>
}

export default function SettingsPage() {
  const supabase = createClient()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef  = useRef<HTMLInputElement>(null)

  // Profile
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Branding uploads
  const [brandingOpen, setBrandingOpen] = useState(false)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [logoUrl,  setLogoUrl]  = useState<string | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [logoUploading,  setLogoUploading]  = useState(false)
  const [brandingError,  setBrandingError]  = useState<string | null>(null)

  // Section expand/collapse
  const [profileOpen, setProfileOpen] = useState(false)
  const [teamOpen, setTeamOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)

  // Password (expandable under profile)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaved, setPasswordSaved] = useState(false)

  // (payment accounts are now fetched inside PaymentAccountsSection directly)

  // Team
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [inviteLabel, setInviteLabel] = useState('')
  const [inviteRole, setInviteRole] = useState<'staff' | 'organizer'>('staff')
  const [inviteExpiry, setInviteExpiry] = useState<string | null>('7d')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Notifications
  const [notifications, setNotifications] = useState({
    guest_signup: true, guest_cancellation: true, entry_scan: true,
    exit_scan: false, vendor_payment_due: true, event_going_live: true, event_ended: true,
  })
  const [notifSaved, setNotifSaved] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (prof) {
        setProfile(prof as any)
        setFullName(prof.full_name ?? '')
        setPhoneNumber(prof.phone_number ?? '')
        setCompanyName(prof.company_name ?? '')
        setUsername(prof.username ?? '')
        setCoverUrl(prof.cover_image_url ?? null)
        setLogoUrl(prof.logo_url ?? null)
        if (prof.notification_preferences && typeof prof.notification_preferences === 'object') {
          setNotifications(prev => ({ ...prev, ...(prof.notification_preferences as NotifPrefs) }))
        }
      }

      const { data: inv } = await supabase
        .from('team_invites')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false })
      setInvites((inv as any) ?? [])

      // (payment accounts loaded inside PaymentAccountsSection)
    }
    loadData()
  }, [supabase])

  const saveProfile = async () => {
    if (!profile) return
    // Validate username slug
    const slug = username.trim().toLowerCase()
    if (slug && !SLUG_RE.test(slug)) {
      setUsernameError('Only lowercase letters, numbers and hyphens allowed')
      return
    }
    setUsernameError(null)
    setProfileSaving(true)
    await supabase.from('profiles').update({
      full_name:    fullName,
      phone_number: phoneNumber || null,
      company_name: companyName || null,
      username:     slug || null,
    }).eq('id', profile.id)
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  /* ── Branding upload helpers ─────────────────────────────────── */
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (file.size > MAX_UPLOAD_SIZE) { setBrandingError('Cover image must be under 10 MB'); return }
    setBrandingError(null); setCoverUploading(true)
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `profile-covers/${profile.id}/cover.${ext}`
    await supabase.storage.from('tikkit-uploads').upload(path, file, { upsert: true, contentType: file.type })
    const { data: { publicUrl } } = supabase.storage.from('tikkit-uploads').getPublicUrl(path)
    const url = `${publicUrl}?t=${Date.now()}`
    await supabase.from('profiles').update({ cover_image_url: url }).eq('id', profile.id)
    setCoverUrl(url); setCoverUploading(false)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  const removeCover = async () => {
    if (!profile) return
    await supabase.from('profiles').update({ cover_image_url: null }).eq('id', profile.id)
    setCoverUrl(null)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (file.size > MAX_UPLOAD_SIZE) { setBrandingError('Logo must be under 10 MB'); return }
    setBrandingError(null); setLogoUploading(true)
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `profile-logos/${profile.id}/logo.${ext}`
    await supabase.storage.from('tikkit-uploads').upload(path, file, { upsert: true, contentType: file.type })
    const { data: { publicUrl } } = supabase.storage.from('tikkit-uploads').getPublicUrl(path)
    const url = `${publicUrl}?t=${Date.now()}`
    await supabase.from('profiles').update({ logo_url: url }).eq('id', profile.id)
    setLogoUrl(url); setLogoUploading(false)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const removeLogo = async () => {
    if (!profile) return
    await supabase.from('profiles').update({ logo_url: null }).eq('id', profile.id)
    setLogoUrl(null)
  }

  const savePassword = async () => {
    setPasswordError(null)
    if (!currentPassword) { setPasswordError('Please enter your current password.'); return }
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return }
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters.'); return }
    if (newPassword === currentPassword) { setPasswordError('New password must be different from current password.'); return }

    setPasswordSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setPasswordError('Could not verify your account.'); setPasswordSaving(false); return }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      setPasswordError('Current password is incorrect.')
      setPasswordSaving(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setPasswordSaved(false)
        setPasswordOpen(false)
      }, 2000)
    }
  }

  const createInvite = async () => {
    if (!inviteLabel.trim()) return
    setCreating(true)
    try {
      const invite = await createTeamInvite(inviteLabel.trim(), inviteRole, inviteExpiry)
      setInvites(prev => [invite as any, ...prev])
      setInviteLabel('')
    } catch (e) { console.error(e) }
    setCreating(false)
  }

  const copyLink = (invite: TeamInvite) => {
    const url = `${window.location.origin}/staff/${invite.token}`
    navigator.clipboard.writeText(url)
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const shareWhatsApp = (invite: TeamInvite) => {
    const url = `${window.location.origin}/staff/${invite.token}`
    const text = `You've been invited to Tikkit as ${invite.role} (${invite.label}). Access your dashboard here: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleRevoke      = async (invite: TeamInvite) => { await revokeTeamInvite(invite.id); setInvites(prev => prev.map(i => i.id === invite.id ? { ...i, revoked: true } : i)) }
  const handleReactivate  = async (invite: TeamInvite) => { await reactivateTeamInvite(invite.id); setInvites(prev => prev.map(i => i.id === invite.id ? { ...i, revoked: false } : i)) }
  const handleDelete      = async (id: string) => { await deleteTeamInvite(id); setInvites(prev => prev.filter(i => i.id !== id)) }

  const saveNotifications = async () => {
    setNotifSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ notification_preferences: notifications } as any).eq('id', user.id)
    }
    setNotifSaving(false)
    setNotifSaved(true)
    setTimeout(() => setNotifSaved(false), 3000)
  }

  const activeInvites   = invites.filter(i => !i.revoked && !isExpired(i))
  const inactiveInvites = invites.filter(i => i.revoked || isExpired(i))

  return (
    <div className="max-w-2xl space-y-6">
      {/* Hidden file inputs — HTML hidden attr so space-y-* skips them */}
      <div hidden>
        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} />
        <input ref={logoInputRef}  type="file" accept="image/*" onChange={handleLogoUpload}  />
      </div>

      {/* Profile + Password */}
      <div className="card space-y-5">
        {/* Profile row — always visible, click to expand */}
        <button
          type="button"
          onClick={() => setProfileOpen(!profileOpen)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1E5EFF20] border-2 border-[#1E5EFF33] flex items-center justify-center shrink-0">
              <span className="text-base font-bold text-[#1E5EFF]">{(companyName || fullName)?.charAt(0)?.toUpperCase() ?? 'U'}</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{companyName || fullName || 'Your Name'}</p>
              {companyName && <p className="text-xs text-gray-500 mt-0.5">{fullName}</p>}
              <p className="text-xs text-gray-500">{profile?.email}</p>
            </div>
          </div>
          <ChevronDown className={clsx('w-4 h-4 text-gray-500 transition-transform', profileOpen && 'rotate-180')} />
        </button>

        {/* Expandable edit form */}
        {profileOpen && (
          <div className="border-t border-white/5 pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Full Name</label>
                <input type="text" className="input" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Email Address</label>
                <input type="email" className="input opacity-50 cursor-not-allowed" value={profile?.email ?? ''} disabled />
                <p className="text-xs text-gray-600 mt-1">Email cannot be changed here</p>
              </div>
              <div>
                <label className="label">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type="tel"
                    className="input pl-9"
                    placeholder="+92 300 0000000"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">Company / Organization</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    className="input pl-9"
                    placeholder="e.g. Acme Events"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">Used in guest emails and communications</p>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Profile URL / Username</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    className="input pl-9"
                    placeholder="e.g. janes-events"
                    value={username}
                    onChange={e => { setUsername(e.target.value.toLowerCase()); setUsernameError(null) }}
                  />
                </div>
                {usernameError
                  ? <p className="text-xs text-red-400 mt-1">{usernameError}</p>
                  : <p className="text-xs text-gray-600 mt-1">
                      Public profile URL: <span className="text-gray-400">tikkit.app/organizer/{username || 'your-username'}</span>
                    </p>
                }
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={saveProfile} disabled={profileSaving} className="btn-primary">
                {profileSaved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> {profileSaving ? 'Saving...' : 'Save Profile'}</>}
              </button>
            </div>
          </div>
        )}

        {/* Change Password — expandable */}
        <div className="border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={() => { setPasswordOpen(!passwordOpen); setPasswordError(null); setPasswordSaved(false) }}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-[#FFC74520] flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-[#FFC745]" />
              </div>
              <span className="text-sm font-medium text-white">Change Password</span>
            </div>
            <ChevronDown className={clsx('w-4 h-4 text-gray-500 transition-transform', passwordOpen && 'rotate-180')} />
          </button>

          {passwordOpen && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="label">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              {passwordError && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{passwordError}</div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={savePassword}
                  disabled={passwordSaving || !currentPassword || !newPassword}
                  className="btn-primary"
                >
                  {passwordSaved
                    ? <><Check className="w-4 h-4" /> Updated</>
                    : <><Lock className="w-4 h-4" /> {passwordSaving ? 'Updating...' : 'Update Password'}</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Branding */}
      <div className="card space-y-5">
        <button
          type="button"
          onClick={() => setBrandingOpen(!brandingOpen)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1E5EFF]/10 flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4 text-[#1E5EFF]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Branding</p>
              <p className="text-xs text-gray-500 mt-0.5">Profile cover photo and company logo</p>
            </div>
          </div>
          <ChevronDown className={clsx('w-4 h-4 text-gray-500 transition-transform', brandingOpen && 'rotate-180')} />
        </button>

        {brandingOpen && (
          <div className="border-t border-white/5 pt-4 space-y-5">
            {brandingError && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                {brandingError}
              </div>
            )}

            {/* Cover Photo */}
            <div className="space-y-2">
              <label className="label">Cover Photo</label>
              <p className="text-xs text-gray-600 -mt-1">Displayed as the banner on your public organizer profile</p>
              <div
                className="relative w-full rounded-xl overflow-hidden border border-white/10"
                style={{ height: 120, background: coverUrl ? 'transparent' : '#161820' }}
              >
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-600">
                    <ImageIcon className="w-6 h-6" />
                    <p className="text-xs">No cover photo set</p>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                  {coverUrl && (
                    <button onClick={removeCover}
                      className="flex items-center gap-1 text-xs text-gray-300 hover:text-white bg-black/60 hover:bg-black/80 rounded-lg px-2 py-1 transition-all backdrop-blur-sm">
                      <X size={11} /> Remove
                    </button>
                  )}
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    disabled={coverUploading}
                    className="flex items-center gap-1.5 text-xs text-white bg-black/60 hover:bg-black/80 disabled:opacity-60 rounded-lg px-2.5 py-1 transition-all backdrop-blur-sm"
                  >
                    {coverUploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                    {coverUrl ? 'Change Cover' : 'Upload Cover'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600">Max 10 MB · Recommended 1500 × 500 px</p>
            </div>

            {/* Company Logo */}
            <div className="space-y-2">
              <label className="label">Company Logo</label>
              <p className="text-xs text-gray-600 -mt-1">Shown as your profile badge on events and your public profile</p>
              <div className="flex items-center gap-4">
                <div
                  className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0 flex items-center justify-center"
                  style={{ background: logoUrl ? 'transparent' : '#161820' }}
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      className="flex items-center gap-1.5 text-xs text-white bg-[#1E5EFF] hover:bg-[#1448CC] disabled:opacity-60 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      {logoUploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                      {logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </button>
                    {logoUrl && (
                      <button onClick={removeLogo}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/25 rounded-lg px-3 py-1.5 transition-all">
                        <X size={11} /> Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">Max 10 MB · Square image recommended (1:1)</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Accounts */}
      <PaymentAccountsSection
        open={paymentOpen}
        onToggle={() => setPaymentOpen(!paymentOpen)}
      />

      {/* Team */}
      <div className="card space-y-5">
        <button
          type="button"
          onClick={() => setTeamOpen(!teamOpen)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Team Access</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {activeInvites.length > 0
                  ? `${activeInvites.length} active link${activeInvites.length !== 1 ? 's' : ''}`
                  : 'No active invite links'}
              </p>
            </div>
          </div>
          <ChevronDown className={clsx('w-4 h-4 text-gray-500 transition-transform', teamOpen && 'rotate-180')} />
        </button>

        {teamOpen && (
          <div className="border-t border-white/5 pt-4 space-y-5">

            <div className="grid grid-cols-2 gap-3">
              {[
                { role: 'staff',     desc: 'QR scanner + guest list only' },
                { role: 'organizer', desc: 'Full dashboard access' },
              ].map(({ role, desc }) => {
                const cfg = getRoleConfig(role)
                return (
                  <div key={role} className={clsx('p-3 rounded-lg border', cfg.bg, cfg.border)}>
                    <div className="flex items-center gap-2 mb-1">
                      <cfg.icon className={clsx('w-3.5 h-3.5', cfg.color)} />
                      <span className={clsx('text-xs font-semibold capitalize', cfg.color)}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-white/5 pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Create Invite Link</p>
              <div>
                <label className="label">Label</label>
                <input type="text" className="input" placeholder="e.g. Ali - Door Security"
                  value={inviteLabel} onChange={e => setInviteLabel(e.target.value)} />
                <p className="text-xs text-gray-600 mt-1">A name to identify who this link is for</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Role</label>
                  <select className="input" value={inviteRole} onChange={e => setInviteRole(e.target.value as 'staff' | 'organizer')}>
                    <option value="staff">Staff</option>
                    <option value="organizer">Organizer</option>
                  </select>
                </div>
                <div>
                  <label className="label">Link Expiry</label>
                  <select className="input" value={inviteExpiry ?? ''} onChange={e => setInviteExpiry(e.target.value || null)}>
                    {EXPIRY_OPTIONS.map(o => (
                      <option key={o.value ?? 'never'} value={o.value ?? ''}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={createInvite} disabled={creating || !inviteLabel.trim()} className="btn-primary">
                  {creating ? 'Creating...' : <><Link2 className="w-4 h-4" /> Generate Link</>}
                </button>
              </div>
            </div>

            {activeInvites.length > 0 && (
              <div className="border-t border-white/5 pt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active Links</p>
                {activeInvites.map(invite => {
                  const cfg = getRoleConfig(invite.role)
                  return (
                    <div key={invite.id} className="p-3 rounded-lg bg-brand-charcoal-light border border-white/5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <cfg.icon className={clsx('w-3.5 h-3.5 shrink-0', cfg.color)} />
                          <p className="text-sm font-medium text-white truncate">{invite.label}</p>
                          <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded-full border capitalize shrink-0', cfg.bg, cfg.color, cfg.border)}>
                            {invite.role}
                          </span>
                        </div>
                        <InviteStatus invite={invite} />
                      </div>
                      {invite.expires_at && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          Expires {new Date(invite.expires_at).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button onClick={() => copyLink(invite)}
                          className={clsx('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all',
                            copiedId === invite.id
                              ? 'text-green-400 border-green-500/30 bg-green-500/10'
                              : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20 bg-white/3')}>
                          {copiedId === invite.id ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Link</>}
                        </button>
                        <button onClick={() => shareWhatsApp(invite)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-green-600/30 bg-green-600/10 text-green-400 hover:bg-green-600/20 transition-colors">
                          <ExternalLink className="w-3 h-3" /> WhatsApp
                        </button>
                        <a href={`/staff/${invite.token}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 bg-white/3 transition-colors">
                          <ExternalLink className="w-3 h-3" /> Preview
                        </a>
                        <button onClick={() => handleRevoke(invite)}
                          className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
                          <AlertCircle className="w-3 h-3" /> Revoke
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {inactiveInvites.length > 0 && (
              <div className="border-t border-white/5 pt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Inactive Links</p>
                {inactiveInvites.map(invite => {
                  const cfg = getRoleConfig(invite.role)
                  return (
                    <div key={invite.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-brand-charcoal-light border border-white/5 opacity-60">
                      <div className="flex items-center gap-2 min-w-0">
                        <cfg.icon className={clsx('w-3.5 h-3.5 shrink-0', cfg.color)} />
                        <p className="text-sm text-white truncate">{invite.label}</p>
                        <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded-full border capitalize shrink-0', cfg.bg, cfg.color, cfg.border)}>
                          {invite.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <InviteStatus invite={invite} />
                        {invite.revoked && (
                          <button onClick={() => handleReactivate(invite)} title="Reactivate"
                            className="p-1.5 text-gray-500 hover:text-green-400 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(invite.id)} title="Delete"
                          className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {invites.length === 0 && (
              <div className="text-center py-4">
                <Link2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No invite links yet</p>
                <p className="text-xs text-gray-600 mt-0.5">Create a link above to give someone access</p>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="card space-y-5">
        <button
          type="button"
          onClick={() => setNotifOpen(!notifOpen)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Notification Preferences</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {Object.values(notifications).filter(Boolean).length} of {Object.values(notifications).length} enabled
              </p>
            </div>
          </div>
          <ChevronDown className={clsx('w-4 h-4 text-gray-500 transition-transform', notifOpen && 'rotate-180')} />
        </button>

        {notifOpen && (
          <div className="border-t border-white/5 pt-4 space-y-5">
            <div className="space-y-2">
              {Object.entries(notifConfig).map(([key, config]) => {
                const Icon = config.icon
                const enabled = notifications[key as keyof typeof notifications]
                return (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                      </div>
                      <div>
                        <p className="text-sm text-white">{config.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
                      </div>
                    </div>
                    <button type="button"
                      onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ml-4 ${enabled ? 'bg-[#1E5EFF]' : 'bg-white/10'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end">
              <button onClick={saveNotifications} disabled={notifSaving} className="btn-primary">
                {notifSaved ? <><Check className="w-4 h-4" /> Saved</> : notifSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Preferences</>}
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Verification */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Triple Verification</p>
              <p className="text-xs text-gray-500 mt-0.5">ID, payment & Social Score — completed once</p>
            </div>
          </div>
          <Link href="/dashboard/verify" className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors shrink-0">
            Manage <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
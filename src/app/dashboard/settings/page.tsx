'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  User,
  Lock,
  Users,
  Bell,
  Save,
  Plus,
  Trash2,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react'

type Profile = {
  id: string
  full_name: string
  email: string
  role: string
  avatar_url: string | null
}

type TeamMember = {
  id: string
  full_name: string
  email: string
  role: string
}

export default function SettingsPage() {
  const supabase = createClient()

  // Profile
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaved, setPasswordSaved] = useState(false)

  // Team
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'staff' | 'organizer'>('staff')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSent, setInviteSent] = useState(false)

  // Notifications
  const [notifications, setNotifications] = useState({
    new_guest: true,
    capacity_alert: true,
    waitlist_update: true,
    vendor_invoice: false,
    event_reminder: true,
  })
  const [notifSaved, setNotifSaved] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (prof) {
        setProfile(prof)
        setFullName(prof.full_name)
      }

      const { data: team } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .in('role', ['staff', 'organizer'])

      setTeamMembers(team ?? [])
    }
    loadData()
  }, [])

  const saveProfile = async () => {
    if (!profile) return
    setProfileSaving(true)
    await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', profile.id)
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  const savePassword = async () => {
    setPasswordError(null)
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSaved(true)
      setNewPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
      setTimeout(() => setPasswordSaved(false), 3000)
    }
  }

  const sendInvite = async () => {
    setInviteError(null)
    if (!inviteEmail) return
    setInviting(true)

    // In a real app this would send an invite email via Supabase Admin API
    // For now we simulate the invite
    await new Promise(r => setTimeout(r, 1000))
    setInviting(false)
    setInviteSent(true)
    setInviteEmail('')
    setTimeout(() => setInviteSent(false), 3000)
  }

  const saveNotifications = () => {
    // In production save to a user_preferences table
    setNotifSaved(true)
    setTimeout(() => setNotifSaved(false), 3000)
  }

  const notifLabels: Record<string, string> = {
    new_guest: 'New guest registers',
    capacity_alert: 'Event nearing capacity',
    waitlist_update: 'Waitlist movement',
    vendor_invoice: 'Vendor invoice due',
    event_reminder: 'Event day reminder',
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Settings
        </h2>
        <p className="text-gray-400 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="card space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
            <User className="w-4 h-4 text-brand-blue" />
          </div>
          <h3 className="font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Profile
          </h3>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#1E5EFF20] border-2 border-[#1E5EFF33] flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-[#1E5EFF]">
              {fullName?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{fullName}</p>
            <p className="text-xs text-gray-500 capitalize mt-0.5">{profile?.role}</p>
            <p className="text-xs text-gray-500">{profile?.email}</p>
          </div>
        </div>

        <div>
          <label className="label">Full Name</label>
          <input
            type="text"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Email Address</label>
          <input
            type="email"
            className="input opacity-50 cursor-not-allowed"
            value={profile?.email ?? ''}
            disabled
          />
          <p className="text-xs text-gray-600 mt-1">Email cannot be changed here</p>
        </div>

        <div className="flex justify-end">
          <button onClick={saveProfile} disabled={profileSaving} className="btn-primary">
            {profileSaved ? (
              <><Check className="w-4 h-4" /> Saved</>
            ) : (
              <><Save className="w-4 h-4" /> {profileSaving ? 'Saving...' : 'Save Profile'}</>
            )}
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="card space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#FFC74520] flex items-center justify-center">
            <Lock className="w-4 h-4 text-[#FFC745]" />
          </div>
          <h3 className="font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Change Password
          </h3>
        </div>

        <div>
          <label className="label">New Password</label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              className="input pr-10"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
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
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {passwordError && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {passwordError}
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={savePassword} disabled={passwordSaving || !newPassword} className="btn-primary">
            {passwordSaved ? (
              <><Check className="w-4 h-4" /> Updated</>
            ) : (
              <><Lock className="w-4 h-4" /> {passwordSaving ? 'Updating...' : 'Update Password'}</>
            )}
          </button>
        </div>
      </div>

      {/* Team Members */}
      <div className="card space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Team Members
          </h3>
        </div>

        {/* Existing members */}
        {teamMembers.length > 0 ? (
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-brand-charcoal-light border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <span className="text-xs font-semibold text-purple-400">
                      {member.full_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{member.full_name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-gray capitalize">{member.role}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No team members yet.</p>
        )}

        {/* Invite */}
        <div className="border-t border-white/5 pt-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Invite Member</p>
          <div className="flex gap-2">
            <input
              type="email"
              className="input flex-1"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <select
              className="input w-32"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'staff' | 'organizer')}
            >
              <option value="staff">Staff</option>
              <option value="organizer">Organizer</option>
            </select>
          </div>

          {inviteError && (
            <p className="text-sm text-red-400">{inviteError}</p>
          )}

          <div className="flex justify-end">
            <button onClick={sendInvite} disabled={inviting || !inviteEmail} className="btn-primary">
              {inviteSent ? (
                <><Check className="w-4 h-4" /> Invite Sent</>
              ) : (
                <><Plus className="w-4 h-4" /> {inviting ? 'Sending...' : 'Send Invite'}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Notification Preferences
          </h3>
        </div>

        <div className="space-y-3">
          {Object.entries(notifications).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 rounded-lg bg-brand-charcoal-light border border-white/5"
            >
              <p className="text-sm text-white">{notifLabels[key]}</p>
              <button
                type="button"
                onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  value ? 'bg-[#1E5EFF]' : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    value ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button onClick={saveNotifications} className="btn-primary">
            {notifSaved ? (
              <><Check className="w-4 h-4" /> Saved</>
            ) : (
              <><Save className="w-4 h-4" /> Save Preferences</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
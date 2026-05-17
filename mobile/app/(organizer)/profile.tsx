import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/contexts/AuthContext'
import { updateProfile } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { colors, radius } from '@/theme'

export default function OrganizerProfileScreen() {
  const { profile, refreshProfile, signOut } = useAuth()
  const router = useRouter()

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone,    setPhone]    = useState('')
  const [city,     setCity]     = useState('')
  const [saving,   setSaving]   = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Password change
  const [pwSection, setPwSection] = useState(false)
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving,  setPwSaving]  = useState(false)
  const [pwError,   setPwError]   = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)

  const initial = (profile?.full_name ?? profile?.email ?? '?').charAt(0).toUpperCase()

  const handleSave = async () => {
    setSaveError(null)
    setSaving(true)
    try {
      await updateProfile({ full_name: fullName.trim() || null })
      await refreshProfile()
      setEditing(false)
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setFullName(profile?.full_name ?? '')
    setPhone('')
    setCity('')
    setSaveError(null)
    setEditing(false)
  }

  const handleChangePassword = async () => {
    setPwError(null)
    if (newPw.length < 8) return setPwError('Password must be at least 8 characters')
    if (newPw !== confirmPw) return setPwError('Passwords do not match')
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwSaving(false)
    if (error) return setPwError(error.message)
    setPwSuccess(true)
    setNewPw('')
    setConfirmPw('')
    setTimeout(() => setPwSuccess(false), 3000)
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ])
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Avatar / Hero */}
          <View style={s.hero}>
            <View style={s.avatar}>
              <Text style={s.avatarInitial}>{initial}</Text>
            </View>
            <Text style={s.name}>{profile?.full_name ?? 'Organizer'}</Text>
            {profile?.username && <Text style={s.username}>@{profile.username}</Text>}
            <Text style={s.email}>{profile?.email}</Text>
            <View style={s.roleBadge}>
              <Ionicons name="shield-checkmark" size={12} color={colors.blue} />
              <Text style={s.roleText}>{(profile?.role ?? 'organizer').toUpperCase()}</Text>
            </View>
          </View>

          {/* ── Profile Section ── */}
          <SectionLabel>Profile</SectionLabel>
          <View style={s.card}>
            {!editing ? (
              <>
                <InfoRow icon="person-outline" label="Full Name" value={profile?.full_name} />
                <Divider />
                <InfoRow icon="call-outline" label="Phone" value={undefined} />
                <Divider />
                <InfoRow icon="location-outline" label="City" value={undefined} />
                <Divider />
                <TouchableOpacity style={s.editRow} onPress={() => setEditing(true)} activeOpacity={0.7}>
                  <Ionicons name="pencil-outline" size={15} color={colors.blue} />
                  <Text style={s.editRowText}>Edit Profile</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {saveError && (
                  <View style={s.errorBanner}>
                    <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                    <Text style={s.errorText}>{saveError}</Text>
                  </View>
                )}
                <EditField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
                <EditField label="Phone" value={phone} onChangeText={setPhone} placeholder="+92 300 000 0000" keyboardType="phone-pad" />
                <EditField label="City" value={city} onChangeText={setCity} placeholder="e.g. Karachi" />
                <View style={s.editActions}>
                  <TouchableOpacity style={s.cancelBtn} onPress={handleCancelEdit} activeOpacity={0.7}>
                    <Text style={s.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.saveBtn, saving && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.8}
                  >
                    {saving
                      ? <ActivityIndicator size="small" color={colors.white} />
                      : <Text style={s.saveBtnText}>Save</Text>
                    }
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* ── Security Section ── */}
          <SectionLabel>Security</SectionLabel>
          <View style={s.card}>
            <TouchableOpacity style={s.editRow} onPress={() => setPwSection(v => !v)} activeOpacity={0.7}>
              <Ionicons name="lock-closed-outline" size={15} color={colors.textSecondary} />
              <Text style={[s.editRowText, { color: colors.textPrimary }]}>Change Password</Text>
              <Ionicons name={pwSection ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            {pwSection && (
              <View style={s.pwForm}>
                <Divider />
                {pwError && (
                  <View style={[s.errorBanner, { marginTop: 8 }]}>
                    <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                    <Text style={s.errorText}>{pwError}</Text>
                  </View>
                )}
                {pwSuccess && (
                  <View style={[s.errorBanner, { backgroundColor: colors.successSubtle, borderColor: colors.success + '33', marginTop: 8 }]}>
                    <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                    <Text style={[s.errorText, { color: colors.success }]}>Password updated successfully</Text>
                  </View>
                )}
                <EditField label="New Password" value={newPw} onChangeText={setNewPw} placeholder="Min. 8 characters" secureTextEntry />
                <EditField label="Confirm Password" value={confirmPw} onChangeText={setConfirmPw} placeholder="Repeat new password" secureTextEntry />
                <TouchableOpacity
                  style={[s.saveBtn, { marginTop: 4 }, pwSaving && { opacity: 0.6 }]}
                  onPress={handleChangePassword}
                  disabled={pwSaving}
                  activeOpacity={0.8}
                >
                  {pwSaving
                    ? <ActivityIndicator size="small" color={colors.white} />
                    : <Text style={s.saveBtnText}>Update Password</Text>
                  }
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Tools ── */}
          <SectionLabel>Tools</SectionLabel>
          <View style={s.card}>
            <NavRow icon="business-outline" label="Vendors & Invoices" color={colors.gold}
              onPress={() => router.push('/(organizer)/vendors')} />
            <Divider />
            <NavRow icon="shield-checkmark-outline" label="ID Verification" color={colors.success}
              onPress={() => router.push('/(organizer)/verify')} />
            <Divider />
            <NavRow icon="chatbubble-ellipses-outline" label="Support Chat" color={colors.indigo}
              onPress={() => router.push('/(organizer)/messages')} />
            <Divider />
            <NavRow icon="time-outline" label="Approvals" color={colors.warning}
              onPress={() => router.push('/(organizer)/approvals')} />
            <Divider />
            <NavRow icon="terminal-outline" label="Command Center" color={colors.indigo}
              onPress={() => router.push('/(organizer)/command')} />
          </View>

          {/* ── Account ── */}
          <SectionLabel>Account</SectionLabel>
          <View style={s.card}>
            <InfoRow icon="mail-outline" label="Email" value={profile?.email} />
            <Divider />
            <InfoRow icon="calendar-outline" label="Role" value={profile?.role} />
          </View>

          <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={s.signOutText}>Sign Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={s.sectionLabel}>{children}</Text>
  )
}

function Divider() {
  return <View style={s.divider} />
}

function NavRow({ icon, label, color, onPress }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void
}) {
  return (
    <TouchableOpacity style={s.navRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.navRowIcon, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={s.navRowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  )
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string | null }) {
  return (
    <View style={s.infoRow}>
      <Ionicons name={icon} size={15} color={colors.textMuted} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value ?? '—'}</Text>
      </View>
    </View>
  )
}

function EditField({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry }: {
  label: string
  value: string
  onChangeText: (t: string) => void
  placeholder?: string
  keyboardType?: any
  secureTextEntry?: boolean
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  scroll: { paddingBottom: 48 },

  hero: { alignItems: 'center', paddingVertical: 28 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.blueSubtle,
    borderWidth: 2, borderColor: colors.blue,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarInitial: { color: colors.blue, fontSize: 32, fontFamily: 'Poppins_700Bold' },
  name: { color: colors.textPrimary, fontSize: 20, fontFamily: 'Poppins_600SemiBold' },
  username: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  email: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.blueSubtle, borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 5, marginTop: 10,
    borderWidth: 1, borderColor: colors.blueBorder,
  },
  roleText: { color: colors.blue, fontSize: 11, fontFamily: 'DMSans_500Medium', fontWeight: '700', letterSpacing: 0.5 },

  sectionLabel: {
    color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_500Medium',
    letterSpacing: 1, textTransform: 'uppercase',
    marginHorizontal: 16, marginTop: 20, marginBottom: 8,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16, padding: 16,
  },

  infoRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  infoLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },
  infoValue: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular' },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  navRowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  navRowLabel: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },

  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  editRowText: { color: colors.blue, fontSize: 14, fontFamily: 'DMSans_500Medium' },

  editActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: {
    flex: 1, backgroundColor: colors.surface2,
    borderRadius: radius.md, paddingVertical: 11,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  cancelBtnText: { color: colors.textSecondary, fontFamily: 'DMSans_500Medium', fontSize: 14 },
  saveBtn: {
    flex: 1, backgroundColor: colors.blue,
    borderRadius: radius.md, paddingVertical: 11,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.white, fontFamily: 'DMSans_500Medium', fontSize: 14, fontWeight: '700' },

  fieldWrap: { marginBottom: 10 },
  fieldLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_500Medium', marginBottom: 4 },
  input: {
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10,
    color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular',
  },

  pwForm: { gap: 0 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.errorSubtle, borderRadius: radius.sm,
    padding: 10, marginBottom: 8, borderWidth: 1, borderColor: colors.error + '33',
  },
  errorText: { color: colors.error, fontSize: 12, fontFamily: 'DMSans_400Regular', flex: 1 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginTop: 16, padding: 14,
    backgroundColor: colors.errorSubtle, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.error + '33',
  },
  signOutText: { color: colors.error, fontFamily: 'DMSans_500Medium', fontSize: 15, fontWeight: '700' },
})

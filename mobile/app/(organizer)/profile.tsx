import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/contexts/AuthContext'
import { getProfile, updateProfile } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { colors, radius } from '@/theme'

/* ─── Notification config ────────────────────────────────────────────────── */
type NotifKey = 'guest_signup' | 'guest_cancellation' | 'entry_scan' | 'exit_scan' | 'vendor_payment_due' | 'event_going_live' | 'event_ended'

const NOTIF_CONFIG: Array<{ key: NotifKey; label: string; sub: string; icon: string; color: string }> = [
  { key: 'guest_signup',       label: 'Guest signs up',     sub: 'When a new guest registers',             icon: 'person-add-outline',    color: colors.success },
  { key: 'guest_cancellation', label: 'Guest cancels',      sub: 'When a guest cancels their registration', icon: 'person-remove-outline', color: colors.error },
  { key: 'entry_scan',         label: 'Guest checks in',    sub: 'When a QR code is scanned for entry',    icon: 'log-in-outline',        color: colors.blue },
  { key: 'exit_scan',          label: 'Guest checks out',   sub: 'When a QR code is scanned for exit',     icon: 'log-out-outline',       color: colors.textMuted },
  { key: 'vendor_payment_due', label: 'Vendor payment due', sub: 'When a vendor invoice is created/overdue',icon: 'card-outline',          color: colors.warning },
  { key: 'event_going_live',   label: 'Event goes live',    sub: 'When you publish an event',              icon: 'flash-outline',         color: colors.indigo },
  { key: 'event_ended',        label: 'Event ends',         sub: 'When an event concludes or is cancelled', icon: 'flag-outline',          color: '#F97316' },
]

const DEFAULT_NOTIF_PREFS: Record<NotifKey, boolean> = {
  guest_signup: true, guest_cancellation: true, entry_scan: true,
  exit_scan: false, vendor_payment_due: true, event_going_live: true, event_ended: true,
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: string }) {
  return <Text style={s.sectionLabel}>{children}</Text>
}

function Divider() { return <View style={s.divider} /> }

function NavRow({ icon, label, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.navRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.navIcon, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={s.navLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' } as any} />
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

function EditField({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, prefix }: {
  label: string; value: string; onChangeText: (t: string) => void
  placeholder?: string; keyboardType?: any; secureTextEntry?: boolean; prefix?: string
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.fieldInputRow}>
        {prefix && <Text style={s.fieldPrefix}>{prefix}</Text>}
        <TextInput
          style={[s.input, !!prefix && { paddingLeft: 2 }]}
          value={value} onChangeText={onChangeText}
          placeholder={placeholder} placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType} secureTextEntry={secureTextEntry}
          autoCapitalize={prefix ? 'none' : 'words'}
        />
      </View>
    </View>
  )
}

/* ─── Main screen ────────────────────────────────────────────────────────── */
export default function OrganizerProfileScreen() {
  const { profile: authProfile, refreshProfile, signOut } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [serverProfile, setServerProfile] = useState<any>(null)

  /* edit */
  const [editing,     setEditing]     = useState(false)
  const [fullName,    setFullName]     = useState('')
  const [phone,       setPhone]        = useState('')
  const [city,        setCity]         = useState('')
  const [companyName, setCompanyName]  = useState('')
  const [username,    setUsername]     = useState('')
  const [saving,      setSaving]       = useState(false)
  const [saveError,   setSaveError]    = useState<string | null>(null)

  /* password */
  const [pwOpen,    setPwOpen]    = useState(false)
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwBusy,    setPwBusy]    = useState(false)
  const [pwMsg,     setPwMsg]     = useState<{ ok: boolean; text: string } | null>(null)

  /* notifications */
  const [notifOpen,    setNotifOpen]    = useState(false)
  const [notifPrefs,   setNotifPrefs]   = useState<Record<NotifKey, boolean>>(DEFAULT_NOTIF_PREFS)
  const [notifSaving,  setNotifSaving]  = useState(false)
  const [notifSaved,   setNotifSaved]   = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await getProfile()
      setServerProfile(res.profile)
      const p = res.profile ?? {}
      setFullName(p.full_name ?? '')
      setPhone(p.phone_number ?? '')
      setCity(p.city ?? '')
      setCompanyName(p.company_name ?? '')
      setUsername(p.username ?? '')
      if (p.notification_preferences && typeof p.notification_preferences === 'object') {
        setNotifPrefs(prev => ({ ...prev, ...(p.notification_preferences as any) }))
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const displayProfile = serverProfile ?? authProfile
  const initial = ((displayProfile?.full_name ?? displayProfile?.email ?? '?').charAt(0) || '?').toUpperCase()

  /* ── Save profile ── */
  const handleSave = async () => {
    setSaveError(null); setSaving(true)
    try {
      await updateProfile({
        full_name: fullName.trim() || null,
        phone_number: phone.trim() || null,
        city: city.trim() || null,
        company_name: companyName.trim() || null,
        username: username.trim() || null,
      })
      await refreshProfile()
      await load()
      setEditing(false)
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleCancelEdit = () => {
    const p = serverProfile ?? {}
    setFullName(p.full_name ?? '')
    setPhone(p.phone_number ?? '')
    setCity(p.city ?? '')
    setCompanyName(p.company_name ?? '')
    setUsername(p.username ?? '')
    setSaveError(null); setEditing(false)
  }

  /* ── Password ── */
  const handleChangePassword = async () => {
    setPwMsg(null)
    if (newPw.length < 8) return setPwMsg({ ok: false, text: 'At least 8 characters required' })
    if (newPw !== confirmPw) return setPwMsg({ ok: false, text: 'Passwords do not match' })
    setPwBusy(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwBusy(false)
    if (error) return setPwMsg({ ok: false, text: error.message })
    setPwMsg({ ok: true, text: 'Password updated!' })
    setNewPw(''); setConfirmPw('')
    setTimeout(() => { setPwOpen(false); setPwMsg(null) }, 1500)
  }

  /* ── Notifications ── */
  const toggleNotif = (key: NotifKey) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }))
    setNotifSaved(false)
  }

  const saveNotifPrefs = async () => {
    setNotifSaving(true)
    try {
      await updateProfile({ notification_preferences: notifPrefs })
      setNotifSaved(true)
    } catch { /* silent */ }
    setNotifSaving(false)
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Hero ── */}
          <LinearGradient
            colors={['#0D1F3C', '#080D1A', colors.pageBg]}
            style={s.hero}
          >
            <View style={s.avatar}>
              <Text style={s.avatarInitial}>{initial}</Text>
            </View>
            <Text style={s.name}>{displayProfile?.full_name ?? 'Organizer'}</Text>
            {displayProfile?.username && <Text style={s.username}>@{displayProfile.username}</Text>}
            <Text style={s.email}>{displayProfile?.email}</Text>
            <View style={s.roleBadge}>
              <Ionicons name="shield-checkmark" size={12} color={colors.blue} />
              <Text style={s.roleText}>{(displayProfile?.role ?? 'organizer').toUpperCase()}</Text>
            </View>
          </LinearGradient>

          {/* ── Profile ── */}
          <SectionLabel>Profile</SectionLabel>
          <View style={s.card}>
            {loading ? (
              <ActivityIndicator color={colors.blue} size="small" />
            ) : !editing ? (
              <>
                <InfoRow icon="person-outline" label="Full Name" value={displayProfile?.full_name} />
                <Divider />
                <InfoRow icon="business-outline" label="Company / Org" value={serverProfile?.company_name} />
                <Divider />
                <InfoRow icon="at-outline" label="Username" value={serverProfile?.username ? `@${serverProfile.username}` : null} />
                <Divider />
                <InfoRow icon="call-outline" label="Phone" value={serverProfile?.phone_number} />
                <Divider />
                <InfoRow icon="location-outline" label="City" value={serverProfile?.city} />
                <Divider />
                <TouchableOpacity style={s.editRow} onPress={() => setEditing(true)} activeOpacity={0.7}>
                  <Ionicons name="pencil-outline" size={15} color={colors.blue} />
                  <Text style={s.editRowText}>Edit Profile</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {saveError && (
                  <View style={[s.msgBanner, s.msgBannerError]}>
                    <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                    <Text style={[s.msgBannerText, { color: colors.error }]}>{saveError}</Text>
                  </View>
                )}
                <EditField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your full name" />
                <EditField label="Company / Organisation" value={companyName} onChangeText={setCompanyName} placeholder="Your company name" />
                <EditField label="Username" value={username} onChangeText={setUsername} placeholder="yourhandle" prefix="@" />
                <EditField label="Phone" value={phone} onChangeText={setPhone} placeholder="+92 300 000 0000" keyboardType="phone-pad" />
                <EditField label="City" value={city} onChangeText={setCity} placeholder="e.g. Karachi" />
                <View style={s.editActions}>
                  <TouchableOpacity style={s.cancelBtn} onPress={handleCancelEdit} activeOpacity={0.7}>
                    <Text style={s.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
                    {saving ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={s.saveBtnText}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* ── Security ── */}
          <SectionLabel>Security</SectionLabel>
          <View style={s.card}>
            <TouchableOpacity style={s.editRow} onPress={() => setPwOpen(v => !v)} activeOpacity={0.7}>
              <Ionicons name="lock-closed-outline" size={15} color={colors.textSecondary} />
              <Text style={[s.editRowText, { color: colors.textPrimary }]}>Change Password</Text>
              <Ionicons name={pwOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} style={{ marginLeft: 'auto' } as any} />
            </TouchableOpacity>
            {pwOpen && (
              <View style={{ marginTop: 12, gap: 0 }}>
                <Divider />
                {pwMsg && (
                  <View style={[s.msgBanner, pwMsg.ok ? s.msgBannerOk : s.msgBannerError, { marginTop: 10 }]}>
                    <Ionicons name={pwMsg.ok ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={14} color={pwMsg.ok ? colors.success : colors.error} />
                    <Text style={[s.msgBannerText, { color: pwMsg.ok ? colors.success : colors.error }]}>{pwMsg.text}</Text>
                  </View>
                )}
                <EditField label="New Password" value={newPw} onChangeText={setNewPw} placeholder="Min. 8 characters" secureTextEntry />
                <EditField label="Confirm Password" value={confirmPw} onChangeText={setConfirmPw} placeholder="Repeat new password" secureTextEntry />
                <TouchableOpacity style={[s.saveBtn, { marginTop: 4 }, pwBusy && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={pwBusy} activeOpacity={0.8}>
                  {pwBusy ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={s.saveBtnText}>Update Password</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Notification Preferences ── */}
          <SectionLabel>Notifications</SectionLabel>
          <View style={s.card}>
            <TouchableOpacity style={s.editRow} onPress={() => setNotifOpen(v => !v)} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={15} color={colors.textSecondary} />
              <Text style={[s.editRowText, { color: colors.textPrimary }]}>
                Notification Preferences
              </Text>
              <Text style={s.notifCount}>
                {Object.values(notifPrefs).filter(Boolean).length}/{NOTIF_CONFIG.length}
              </Text>
              <Ionicons name={notifOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} style={{ marginLeft: 6 } as any} />
            </TouchableOpacity>

            {notifOpen && (
              <View style={{ marginTop: 12 }}>
                <Divider />
                {NOTIF_CONFIG.map((cfg, i) => (
                  <View key={cfg.key}>
                    <View style={s.notifRow}>
                      <View style={[s.notifIcon, { backgroundColor: cfg.color + '1A' }]}>
                        <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.notifLabel}>{cfg.label}</Text>
                        <Text style={s.notifSub}>{cfg.sub}</Text>
                      </View>
                      <Switch
                        value={notifPrefs[cfg.key]}
                        onValueChange={() => toggleNotif(cfg.key)}
                        trackColor={{ false: colors.surface2, true: colors.blue }}
                        thumbColor={colors.white}
                      />
                    </View>
                    {i < NOTIF_CONFIG.length - 1 && <Divider />}
                  </View>
                ))}
                <TouchableOpacity style={[s.saveBtn, { marginTop: 12 }, notifSaving && { opacity: 0.6 }]} onPress={saveNotifPrefs} disabled={notifSaving}>
                  {notifSaving
                    ? <ActivityIndicator size="small" color={colors.white} />
                    : notifSaved
                      ? <><Ionicons name="checkmark" size={15} color={colors.white} /><Text style={s.saveBtnText}>Saved</Text></>
                      : <Text style={s.saveBtnText}>Save Preferences</Text>
                  }
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Tools ── */}
          <SectionLabel>Tools</SectionLabel>
          <View style={s.card}>
            <NavRow icon="business-outline" label="Vendors & Invoices" color={colors.gold} onPress={() => router.push('/(organizer)/vendors')} />
            <Divider />
            <NavRow icon="shield-checkmark-outline" label="ID Verification" color={colors.success} onPress={() => router.push('/(organizer)/verify')} />
            <Divider />
            <NavRow icon="chatbubble-ellipses-outline" label="Support Chat" color={colors.indigo} onPress={() => router.push('/(organizer)/messages')} />
            <Divider />
            <NavRow icon="time-outline" label="Approvals" color={colors.warning} onPress={() => router.push('/(organizer)/approvals')} />
            <Divider />
            <NavRow icon="terminal-outline" label="Command Center" color={colors.indigo} onPress={() => router.push('/(organizer)/command')} />
          </View>

          {/* ── Account ── */}
          <SectionLabel>Account</SectionLabel>
          <View style={s.card}>
            <InfoRow icon="mail-outline" label="Email" value={displayProfile?.email} />
            <Divider />
            <InfoRow icon="calendar-outline" label="Role" value={displayProfile?.role} />
            <Divider />
            <TouchableOpacity style={s.editRow} onPress={() => Alert.alert('Report a Problem', 'Email us at support@tikkit.xyz and we\'ll respond within 24 hours.')} activeOpacity={0.7}>
              <Ionicons name="flag-outline" size={15} color={colors.textSecondary} />
              <Text style={[s.editRowText, { color: colors.textPrimary }]}>Report a Problem</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: 'auto' } as any} />
            </TouchableOpacity>
          </View>

          {/* ── Sign out ── */}
          <TouchableOpacity
            style={s.signOutBtn}
            onPress={() => Alert.alert('Sign Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: signOut },
            ])}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={s.signOutText}>Sign Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  scroll: { paddingBottom: 48 },

  hero: { alignItems: 'center', paddingVertical: 28 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.blueSubtle, borderWidth: 2, borderColor: colors.blue, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarInitial: { color: colors.blue, fontSize: 32, fontFamily: 'Poppins_700Bold' },
  name: { color: colors.textPrimary, fontSize: 20, fontFamily: 'Poppins_600SemiBold' },
  username: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  email: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.blueSubtle, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10, borderWidth: 1, borderColor: colors.blueBorder },
  roleText: { color: colors.blue, fontSize: 11, fontFamily: 'DMSans_500Medium', fontWeight: '700', letterSpacing: 0.5 },

  sectionLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_500Medium', letterSpacing: 1, textTransform: 'uppercase', marginHorizontal: 16, marginTop: 20, marginBottom: 8 },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginHorizontal: 16, padding: 16 },

  infoRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  infoLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },
  infoValue: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular' },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  navIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  navLabel: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },

  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  editRowText: { color: colors.blue, fontSize: 14, fontFamily: 'DMSans_500Medium' },

  editActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { color: colors.textSecondary, fontFamily: 'DMSans_500Medium', fontSize: 14 },
  saveBtn: { flex: 1, backgroundColor: colors.blue, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  saveBtnText: { color: colors.white, fontFamily: 'DMSans_500Medium', fontSize: 14, fontWeight: '700' },

  fieldWrap: { marginBottom: 10 },
  fieldLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_500Medium', marginBottom: 4 },
  fieldInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12 },
  fieldPrefix: { color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular' },
  input: { flex: 1, backgroundColor: 'transparent', paddingVertical: 10, color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular' },

  msgBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.sm, padding: 10, marginBottom: 8, borderWidth: 1 },
  msgBannerError: { backgroundColor: colors.errorSubtle, borderColor: colors.error + '33' },
  msgBannerOk: { backgroundColor: colors.successSubtle, borderColor: colors.success + '33' },
  msgBannerText: { fontSize: 12, fontFamily: 'DMSans_400Regular', flex: 1 },

  notifCount: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginLeft: 'auto' as any },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  notifIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  notifLabel: { color: colors.textPrimary, fontSize: 13, fontFamily: 'DMSans_500Medium' },
  notifSub: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 1 },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 16, padding: 14, backgroundColor: colors.errorSubtle, borderRadius: radius.md, borderWidth: 1, borderColor: colors.error + '33' },
  signOutText: { color: colors.error, fontFamily: 'DMSans_500Medium', fontSize: 15, fontWeight: '700' },
})

import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Alert, Switch, Modal, Pressable,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/contexts/AuthContext'
import { colors, radius } from '@/theme'
import { getProfile, updateProfile } from '@/lib/api'
import { supabase } from '@/lib/supabase'

/* ─── Credit tier helper ─────────────────────────────────────────────────── */
function creditTier(score: number) {
  if (score >= 1000) return { label: 'Elite',  color: '#F59E0B' }
  if (score >= 500)  return { label: 'Gold',   color: '#EAB308' }
  if (score >= 200)  return { label: 'Silver', color: '#94A3B8' }
  if (score >= 100)  return { label: 'Bronze', color: '#B45309' }
  return { label: 'Member', color: colors.textMuted }
}

/* ─── Shared sub-components ─────────────────────────────────────────────── */
function Field({ label, value, onChangeText, prefix, multiline, secureTextEntry, keyboardType, autoCapitalize, placeholder }: {
  label: string; value: string; onChangeText: (v: string) => void
  prefix?: string; multiline?: boolean; secureTextEntry?: boolean
  keyboardType?: any; autoCapitalize?: any; placeholder?: string
}) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <View style={[f.inputRow, multiline && { alignItems: 'flex-start' }]}>
        {prefix && <Text style={f.prefix}>{prefix}</Text>}
        <TextInput
          style={[f.input, multiline && { minHeight: 72, textAlignVertical: 'top', paddingTop: 10 }]}
          value={value} onChangeText={onChangeText}
          placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry} keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'} multiline={multiline}
        />
      </View>
    </View>
  )
}
const f = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_500Medium' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface2, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12,
  },
  prefix: { color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular' },
  input: { flex: 1, color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular', paddingVertical: 11 },
})

function InfoRow({ icon, value, placeholder }: { icon: string; value?: string | null; placeholder?: string }) {
  const present = !!value
  if (!present && !placeholder) return null
  return (
    <View style={ir.row}>
      <Ionicons name={icon as any} size={15} color={present ? colors.textMuted : colors.border} />
      <Text style={[ir.text, !present && { color: colors.border }]} numberOfLines={3}>{value ?? placeholder}</Text>
    </View>
  )
}
const ir = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 5 },
  text: { color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_400Regular', flex: 1 },
})

function ToggleRow({ label, sub, value, onToggle }: { label: string; sub?: string; value: boolean; onToggle: () => void }) {
  return (
    <View style={tr.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={tr.label}>{label}</Text>
        {sub && <Text style={tr.sub}>{sub}</Text>}
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: colors.surface2, true: colors.blue }} thumbColor={colors.white} />
    </View>
  )
}
const tr = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  label: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  sub: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 1 },
})

function MenuRow({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={mr.row} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={[mr.label, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: 'auto' } as any} />
    </TouchableOpacity>
  )
}
const mr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  label: { fontSize: 14, fontFamily: 'DMSans_500Medium' },
})

/* ─── Delete confirm modal ─────────────────────────────────────────────── */
function DeleteModal({ onClose, onConfirm, busy }: { onClose: () => void; onConfirm: () => void; busy: boolean }) {
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={dm.backdrop} onPress={busy ? undefined : onClose} />
      <View style={dm.box}>
        <Ionicons name="warning-outline" size={36} color={colors.error} />
        <Text style={dm.title}>Delete Account</Text>
        <Text style={dm.body}>
          This will permanently erase your personal data. Your event history will be anonymised.
          {'\n\n'}This action cannot be undone.
        </Text>
        <TouchableOpacity style={[dm.btn, dm.danger, busy && { opacity: 0.6 }]} onPress={onConfirm} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={dm.btnText}>Delete My Account</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[dm.btn, { backgroundColor: colors.surface2 }]} onPress={onClose} disabled={busy}>
          <Text style={[dm.btnText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}
const dm = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)' },
  box: {
    position: 'absolute', top: '50%', left: 20, right: 20,
    transform: [{ translateY: -190 }],
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, padding: 24, gap: 12, alignItems: 'center',
  },
  title: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  body: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 20 },
  btn: { width: '100%', alignItems: 'center', paddingVertical: 13, borderRadius: radius.md },
  danger: { backgroundColor: colors.error },
  btnText: { color: colors.white, fontSize: 14, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
})

/* ─── Main screen ────────────────────────────────────────────────────────── */
type NotifPrefs = { registration_updates: boolean; payment_reminders: boolean; event_reminders: boolean }
const DEFAULT_NOTIFS: NotifPrefs = { registration_updates: true, payment_reminders: true, event_reminders: true }

export default function GuestProfileScreen() {
  const { profile: authProfile, signOut } = useAuth()

  const [loading, setLoading] = useState(true)
  const [serverData, setServerData] = useState<any>(null)

  /* edit form state */
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [instagram, setInstagram] = useState('')
  const [discoverable, setDiscoverable] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  /* password */
  const [pwOpen, setPwOpen] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  /* notifications */
  const [notifs, setNotifs] = useState<NotifPrefs>(DEFAULT_NOTIFS)
  const [notifSaving, setNotifSaving] = useState(false)

  /* delete */
  const [showDelete, setShowDelete] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await getProfile()
      setServerData(res)
      const p = res.profile ?? {}
      const g = res.guest_extras ?? {}
      setFullName(p.full_name ?? '')
      setPhone(p.phone_number ?? '')
      setUsername(p.username ?? '')
      setBio(g.bio ?? '')
      setInstagram(g.instagram_handle ?? '')
      setDiscoverable(g.is_discoverable ?? true)
      if (g.notification_prefs) setNotifs({ ...DEFAULT_NOTIFS, ...g.notification_prefs })
    } catch { /* silent */ }
  }, [])

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  /* ── Save profile ── */
  const save = async () => {
    if (!fullName.trim()) return setEditError('Name is required')
    if (username && username.length < 3) return setEditError('Username must be at least 3 characters')
    setSaving(true); setEditError(null)
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone_number: phone.trim() || null,
        username: username.trim() || null,
        bio: bio.trim() || null,
        instagram_handle: instagram.trim().replace(/^@/, '') || null,
        is_discoverable: discoverable,
      })
      await load()
      setEditing(false)
    } catch (e: any) {
      setEditError(e.message ?? 'Save failed')
    } finally { setSaving(false) }
  }

  /* ── Notification toggle ── */
  const toggleNotif = async (key: keyof NotifPrefs) => {
    const updated = { ...notifs, [key]: !notifs[key] }
    setNotifs(updated)
    setNotifSaving(true)
    try { await updateProfile({ notification_prefs: updated }) } catch { /* silent */ }
    setNotifSaving(false)
  }

  /* ── Password change ── */
  const changePassword = async () => {
    if (newPw.length < 8) return setPwMsg({ ok: false, text: 'At least 8 characters required' })
    if (newPw !== confirmPw) return setPwMsg({ ok: false, text: "Passwords don't match" })
    setPwBusy(true); setPwMsg(null)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwBusy(false)
    if (error) { setPwMsg({ ok: false, text: error.message }) }
    else {
      setPwMsg({ ok: true, text: 'Password updated!' })
      setNewPw(''); setConfirmPw('')
      setTimeout(() => { setPwOpen(false); setPwMsg(null) }, 1500)
    }
  }

  /* ── Delete account ── */
  const handleDelete = async () => {
    setDeleteBusy(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? 'https://tikkit.xyz'}/api/mobile/profile`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      await signOut()
    } catch {
      setDeleteBusy(false)
      Alert.alert('Error', 'Failed to delete account. Please try again.')
    }
  }

  if (loading) {
    return <View style={s.centered}><ActivityIndicator color={colors.blue} size="large" /></View>
  }

  const p = serverData?.profile ?? authProfile
  const g = serverData?.guest_extras ?? {}
  const tier = creditTier(g.social_credits ?? 0)
  const initials = ((p?.full_name ?? 'G').split(' ').map((w: string) => w[0]).join('').slice(0, 2) || 'G').toUpperCase()

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Hero ─────────────────────────────────────── */}
        <View style={s.hero}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.heroName}>{p?.full_name ?? 'Guest'}</Text>
          {p?.username && <Text style={s.heroUsername}>@{p.username}</Text>}
          <View style={[s.tierBadge, { backgroundColor: tier.color + '22', borderColor: tier.color + '55' }]}>
            <Text style={[s.tierText, { color: tier.color }]}>{tier.label}</Text>
          </View>
        </View>

        {/* ── Stats bar ────────────────────────────────── */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>{g.attended_count ?? 0}</Text>
            <Text style={s.statLabel}>Attended</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.stat}>
            <Text style={s.statNum}>{g.social_credits ?? 0}</Text>
            <Text style={s.statLabel}>Credits</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.stat}>
            <Text style={s.statNum}>{g.active_count ?? 0}</Text>
            <Text style={s.statLabel}>Active</Text>
          </View>
        </View>

        {/* ── Profile ──────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>PROFILE</Text>
          {editing ? (
            <View style={{ gap: 12 }}>
              <Field label="Full Name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
              <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+92 300 0000000" />
              <Field label="Username" value={username} onChangeText={setUsername} prefix="@" autoCapitalize="none" placeholder="yourhandle" />
              <Field label="Bio" value={bio} onChangeText={setBio} multiline placeholder="Tell people about yourself…" />
              <Field label="Instagram" value={instagram} onChangeText={setInstagram} prefix="@" autoCapitalize="none" placeholder="yourinstagram" />
              <ToggleRow label="Discoverable" sub="Let organizers find your profile" value={discoverable} onToggle={() => setDiscoverable(v => !v)} />
              {editError && (
                <View style={s.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                  <Text style={s.errorText}>{editError}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: colors.surface2 }]} onPress={() => { setEditing(false); setEditError(null) }}>
                  <Text style={[s.btnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, { flex: 1 }, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
                  {saving ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={s.btnText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <InfoRow icon="person-outline" value={p?.full_name} />
              <InfoRow icon="mail-outline" value={p?.email} />
              <InfoRow icon="call-outline" value={p?.phone_number} placeholder="Phone not set" />
              <InfoRow icon="at-outline" value={p?.username ? `@${p.username}` : null} placeholder="Username not set" />
              {g.bio ? <InfoRow icon="document-text-outline" value={g.bio} /> : null}
              {g.instagram_handle ? <InfoRow icon="logo-instagram" value={`@${g.instagram_handle}`} /> : null}
              <TouchableOpacity style={[s.btn, { marginTop: 12 }]} onPress={() => setEditing(true)}>
                <Ionicons name="pencil-outline" size={15} color={colors.white} />
                <Text style={s.btnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Change password ───────────────────────────── */}
        <View style={s.card}>
          <TouchableOpacity style={s.expandRow} onPress={() => setPwOpen(v => !v)}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
            <Text style={s.expandLabel}>Change Password</Text>
            <Ionicons name={pwOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} style={{ marginLeft: 'auto' } as any} />
          </TouchableOpacity>
          {pwOpen && (
            <View style={{ gap: 10, marginTop: 14 }}>
              <Field label="New Password" value={newPw} onChangeText={setNewPw} secureTextEntry placeholder="8+ characters" />
              <Field label="Confirm Password" value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholder="Repeat password" />
              {pwMsg && <Text style={{ color: pwMsg.ok ? colors.success : colors.error, fontSize: 12, fontFamily: 'DMSans_400Regular' }}>{pwMsg.text}</Text>}
              <TouchableOpacity style={[s.btn, pwBusy && { opacity: 0.6 }]} onPress={changePassword} disabled={pwBusy}>
                {pwBusy ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={s.btnText}>Update Password</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Notifications ─────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>NOTIFICATIONS</Text>
          <ToggleRow label="Registration updates" sub="Approvals, rejections, check-ins" value={notifs.registration_updates} onToggle={() => toggleNotif('registration_updates')} />
          <View style={s.divider} />
          <ToggleRow label="Payment reminders" sub="When payment is due or confirmed" value={notifs.payment_reminders} onToggle={() => toggleNotif('payment_reminders')} />
          <View style={s.divider} />
          <ToggleRow label="Event reminders" sub="24 hours before your events" value={notifs.event_reminders} onToggle={() => toggleNotif('event_reminders')} />
          {notifSaving && <Text style={s.savingText}>Saving…</Text>}
        </View>

        {/* ── Account ───────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>ACCOUNT</Text>
          <MenuRow icon="shield-checkmark-outline" label="Verification" color={colors.success}
            onPress={() => Alert.alert('Verification', 'Full ID verification is available at tikkit.xyz/guest/profile')} />
          <View style={s.divider} />
          <MenuRow icon="flag-outline" label="Report a Problem" color={colors.textSecondary}
            onPress={() => Alert.alert('Report a Problem', 'Email us at support@tikkit.xyz and we\'ll respond within 24 hours.')} />
          <View style={s.divider} />
          <MenuRow icon="trash-outline" label="Delete Account" color={colors.error} onPress={() => setShowDelete(true)} />
        </View>

        {/* ── Sign out ──────────────────────────────────── */}
        <TouchableOpacity style={s.signOutBtn} onPress={signOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {showDelete && (
        <DeleteModal onClose={() => setShowDelete(false)} onConfirm={handleDelete} busy={deleteBusy} />
      )}
    </SafeAreaView>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  centered: { flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' },
  body: { padding: 16, paddingBottom: 48, gap: 12 },

  hero: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.blueBorder },
  avatarText: { color: colors.white, fontSize: 28, fontFamily: 'Poppins_700Bold' },
  heroName: { color: colors.textPrimary, fontSize: 22, fontFamily: 'Poppins_700Bold', marginTop: 4 },
  heroUsername: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular' },
  tierBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1, marginTop: 4 },
  tierText: { fontSize: 11, fontFamily: 'DMSans_500Medium', fontWeight: '700', letterSpacing: 0.5 },

  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16 },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { color: colors.textPrimary, fontSize: 22, fontFamily: 'Poppins_700Bold' },
  statLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },
  statDiv: { width: 1, height: 36, backgroundColor: colors.border },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16 },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_500Medium', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },

  expandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  expandLabel: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },

  divider: { height: 1, backgroundColor: colors.border },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { color: colors.error, fontSize: 12, fontFamily: 'DMSans_400Regular', flex: 1 },
  savingText: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular', textAlign: 'right', marginTop: 4 },

  btn: { backgroundColor: colors.blue, borderRadius: radius.md, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { color: colors.white, fontSize: 14, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.error + '44', backgroundColor: colors.error + '11', padding: 14 },
  signOutText: { color: colors.error, fontSize: 15, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
})

import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/contexts/AuthContext'
import { updateProfile } from '@/lib/api'
import { colors, radius } from '@/theme'

export default function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [saving, setSaving] = useState(false)

  const initial = (profile?.full_name ?? profile?.email ?? '?').charAt(0).toUpperCase()

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({ full_name: fullName })
      await refreshProfile()
      setEditing(false)
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not save profile')
    } finally {
      setSaving(false)
    }
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
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatar}>
            <Text style={s.avatarInitial}>{initial}</Text>
          </View>
          <Text style={s.name}>{profile?.full_name ?? 'Guest'}</Text>
          <Text style={s.email}>{profile?.email}</Text>
        </View>

        {/* Personal info card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Personal Info</Text>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)} style={s.editBtn}>
                <Ionicons name="pencil-outline" size={14} color={colors.blue} />
                <Text style={s.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <Field label="Full Name" editing={editing} value={fullName} onEdit={setFullName} display={profile?.full_name} />
          <Field label="Phone" editing={editing} value={phone} onEdit={setPhone} display={undefined} keyboard="phone-pad" />
          <Field label="City" editing={editing} value={city} onEdit={setCity} display={undefined} />

          {editing && (
            <View style={s.editActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={colors.white} size="small" />
                  : <Text style={s.saveText}>Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Menu */}
        <View style={s.card}>
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push('/(guest)/notifications')}
          />
        </View>

        {/* Sign out */}
        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

function Field({
  label, editing, value, onEdit, display, keyboard,
}: {
  label: string
  editing: boolean
  value: string
  onEdit: (v: string) => void
  display?: string | null
  keyboard?: 'phone-pad' | 'default'
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {editing
        ? (
          <TextInput
            style={s.fieldInput}
            value={value}
            onChangeText={onEdit}
            keyboardType={keyboard ?? 'default'}
            placeholderTextColor={colors.textMuted}
          />
        )
        : <Text style={s.fieldValue}>{display ?? '—'}</Text>
      }
    </View>
  )
}

function MenuItem({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={s.menuIcon}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
      </View>
      <Text style={s.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  scroll: { paddingBottom: 32 },

  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.blueSubtle,
    borderWidth: 2, borderColor: colors.blue,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitial: { color: colors.blue, fontSize: 32, fontFamily: 'Poppins_700Bold' },
  name: { color: colors.textPrimary, fontSize: 20, fontFamily: 'Poppins_600SemiBold' },
  email: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 4 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  cityText: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16, marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  cardTitle: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_500Medium', letterSpacing: 1.5, textTransform: 'uppercase' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { color: colors.blue, fontSize: 13, fontFamily: 'DMSans_500Medium' },

  field: { marginBottom: 16 },
  fieldLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_500Medium', marginBottom: 6 },
  fieldValue: { color: colors.textPrimary, fontSize: 15, fontFamily: 'DMSans_400Regular' },
  fieldInput: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10,
    color: colors.textPrimary, fontSize: 15, fontFamily: 'DMSans_400Regular',
  },

  editActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, padding: 12, borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { color: colors.textSecondary, fontFamily: 'DMSans_500Medium', fontSize: 14 },
  saveBtn: {
    flex: 1, padding: 12, borderRadius: radius.md,
    backgroundColor: colors.blue, alignItems: 'center',
  },
  saveText: { color: colors.white, fontFamily: 'DMSans_500Medium', fontSize: 14, fontWeight: '700' },

  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 4,
  },
  menuIcon: {
    width: 32, height: 32, borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { color: colors.textPrimary, fontSize: 15, fontFamily: 'DMSans_400Regular', flex: 1 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginTop: 8, padding: 14,
    backgroundColor: colors.errorSubtle,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.error + '33',
  },
  signOutText: { color: colors.error, fontFamily: 'DMSans_500Medium', fontSize: 15, fontWeight: '700' },
})

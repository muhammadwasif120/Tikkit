import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { addGuest } from '@/lib/api'
import { colors, radius } from '@/theme'

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

export default function AddGuestScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [phone,     setPhone]     = useState('')
  const [gender,    setGender]    = useState('')
  const [isVip,     setIsVip]     = useState(false)
  const [waitlist,  setWaitlist]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [addAnother, setAddAnother] = useState(false)

  const reset = () => {
    setFullName(''); setEmail(''); setPhone(''); setGender('')
    setIsVip(false); setWaitlist(false)
  }

  const handleSubmit = async (another: boolean) => {
    setError(null)
    if (!fullName.trim()) return setError('Full name is required')
    setSaving(true)
    try {
      await addGuest(eventId!, {
        full_name: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        gender: gender || undefined,
        is_vip: isVip,
        waitlist,
      })
      if (another) {
        reset()
        Alert.alert('Guest Added', `${fullName.trim()} has been added. Fill in the next guest.`)
      } else {
        Alert.alert('Guest Added', `${fullName.trim()} has been added to the event.`, [
          { text: 'OK', onPress: () => router.back() },
        ])
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to add guest')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Add Guest</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {error && (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <SectionLabel>Guest Details</SectionLabel>

          <Field label="Full Name *">
            <TextInput style={s.input} value={fullName} onChangeText={setFullName} placeholder="e.g. Ahmed Khan" placeholderTextColor={colors.textMuted} />
          </Field>
          <Field label="Email">
            <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="guest@email.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
          </Field>
          <Field label="Phone">
            <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="+92 300 000 0000" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
          </Field>

          <SectionLabel>Gender</SectionLabel>
          <View style={s.genderGrid}>
            {GENDERS.map(g => (
              <TouchableOpacity
                key={g}
                style={[s.genderPill, gender === g && s.genderPillActive]}
                onPress={() => setGender(gender === g ? '' : g)}
              >
                <Text style={[s.genderText, gender === g && s.genderTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <SectionLabel>Access Level</SectionLabel>
          <ToggleCard
            label="VIP Guest"
            desc="Mark as VIP — gold badge, priority access"
            value={isVip}
            onChange={setIsVip}
            color={colors.gold}
          />
          <ToggleCard
            label="Waitlist"
            desc="Place on waitlist instead of direct admission"
            value={waitlist}
            onChange={setWaitlist}
            color={colors.warning}
          />

          <View style={s.submitRow}>
            <TouchableOpacity
              style={[s.addAnotherBtn, saving && { opacity: 0.6 }]}
              onPress={() => handleSubmit(true)}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator size="small" color={colors.blue} />
                : <Text style={s.addAnotherText}>Save & Add Another</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.addBtn, saving && { opacity: 0.6 }]}
              onPress={() => handleSubmit(false)}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator size="small" color={colors.white} />
                : <>
                  <Ionicons name="person-add-outline" size={18} color={colors.white} />
                  <Text style={s.addBtnText}>Add Guest</Text>
                </>
              }
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={s.sectionLabel}>{children}</Text>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  )
}

function ToggleCard({ label, desc, value, onChange, color }: {
  label: string; desc: string; value: boolean; onChange: (v: boolean) => void; color: string
}) {
  return (
    <TouchableOpacity
      style={[s.toggleCard, value && { borderColor: color + '55' }]}
      onPress={() => onChange(!value)}
      activeOpacity={0.8}
    >
      <View style={{ flex: 1 }}>
        <Text style={[s.toggleLabel, value && { color }]}>{label}</Text>
        <Text style={s.toggleDesc}>{desc}</Text>
      </View>
      <View style={[s.toggleDot, { backgroundColor: value ? color : colors.surface2, borderColor: value ? color : colors.border }]}>
        {value && <Ionicons name="checkmark" size={12} color={colors.white} />}
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { flex: 1, color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },

  scroll: { padding: 16, paddingBottom: 48, gap: 0 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.errorSubtle, borderRadius: radius.md,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.error + '33',
  },
  errorText: { color: colors.error, fontSize: 13, fontFamily: 'DMSans_400Regular', flex: 1 },

  sectionLabel: {
    color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_500Medium',
    letterSpacing: 1, textTransform: 'uppercase', marginTop: 20, marginBottom: 10,
  },

  field: { marginBottom: 12 },
  fieldLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_500Medium', marginBottom: 4 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular',
  },

  genderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  genderPill: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.full,
  },
  genderPillActive: { backgroundColor: colors.blueSubtle, borderColor: colors.blueBorder },
  genderText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular' },
  genderTextActive: { color: colors.blue },

  toggleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 14, marginBottom: 8,
  },
  toggleLabel: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium', marginBottom: 2 },
  toggleDesc: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  toggleDot: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  submitRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  addAnotherBtn: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  addAnotherText: { color: colors.blue, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  addBtn: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.blue, borderRadius: radius.md, paddingVertical: 14,
  },
  addBtnText: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_600SemiBold', fontWeight: '700' },
})

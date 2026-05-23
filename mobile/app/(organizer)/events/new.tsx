import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Switch,
} from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { createEvent, CreateEventPayload } from '@/lib/api'
import { colors, radius } from '@/theme'

type RegMode = 'open' | 'expression_of_interest' | 'invite_only'

const REG_MODES: { value: RegMode; label: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'open',                   label: 'Open',         desc: 'Anyone can register instantly',         icon: 'globe-outline' },
  { value: 'expression_of_interest', label: 'Apply',        desc: 'Guests apply, you approve each one',    icon: 'document-text-outline' },
  { value: 'invite_only',            label: 'Invite Only',  desc: 'You manually add guests',               icon: 'lock-closed-outline' },
]

export default function NewEventScreen() {
  const router = useRouter()

  const [title,            setTitle]            = useState('')
  const [description,      setDescription]      = useState('')
  const [dateStart,        setDateStart]        = useState('')
  const [dateEnd,          setDateEnd]          = useState('')
  const [venueName,        setVenueName]        = useState('')
  const [venueAddress,     setVenueAddress]     = useState('')
  const [venueCity,        setVenueCity]        = useState('')
  const [capacity,         setCapacity]         = useState('')
  const [ticketPrice,      setTicketPrice]      = useState('')
  const [regMode,          setRegMode]          = useState<RegMode>('open')
  const [publishNow,       setPublishNow]       = useState(false)

  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState<string | null>(null)

  const handleSave = async () => {
    setError(null)
    if (!title.trim()) return setError('Event title is required')
    if (!dateStart) return setError('Start date and time is required')

    setLoading(true)
    try {
      const payload: CreateEventPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        date_start: new Date(dateStart.replace(' ', 'T')).toISOString(),
        date_end: dateEnd ? new Date(dateEnd.replace(' ', 'T')).toISOString() : undefined,
        venue_name: venueName.trim() || undefined,
        venue_address: venueAddress.trim() || undefined,
        venue_city: venueCity.trim() || undefined,
        capacity: capacity || undefined,
        ticket_price: ticketPrice || undefined,
        registration_mode: regMode,
        status: publishNow ? 'published' : 'draft',
      }
      const { event } = await createEvent(payload)
      Alert.alert(
        publishNow ? 'Event Published!' : 'Draft Saved',
        `"${event.title}" has been ${publishNow ? 'published' : 'saved as a draft'}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (err: any) {
      setError(err.message ?? 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.navTitle}>New Event</Text>
        <TouchableOpacity
          style={[s.saveBtn, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color={colors.white} />
            : <Text style={s.saveBtnText}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {error && (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Basics ── */}
          <SectionLabel>Event Details</SectionLabel>

          <Field label="Event Title *">
            <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="e.g. Rooftop Night Karachi" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="Description">
            <TextInput
              style={[s.input, s.multiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell guests what to expect..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Field>

          {/* ── Date & Time ── */}
          <SectionLabel>Date & Time</SectionLabel>

          <Field label="Start Date & Time *" hint="Format: YYYY-MM-DD HH:MM">
            <TextInput style={s.input} value={dateStart} onChangeText={setDateStart} placeholder="2025-12-31 20:00" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="End Date & Time (optional)" hint="Format: YYYY-MM-DD HH:MM">
            <TextInput style={s.input} value={dateEnd} onChangeText={setDateEnd} placeholder="2026-01-01 02:00" placeholderTextColor={colors.textMuted} />
          </Field>

          {/* ── Venue ── */}
          <SectionLabel>Venue</SectionLabel>

          <Field label="Venue Name">
            <TextInput style={s.input} value={venueName} onChangeText={setVenueName} placeholder="e.g. DHA Rooftop" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="Venue Address">
            <TextInput style={s.input} value={venueAddress} onChangeText={setVenueAddress} placeholder="Full address" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="City">
            <TextInput style={s.input} value={venueCity} onChangeText={setVenueCity} placeholder="e.g. Lahore" placeholderTextColor={colors.textMuted} />
          </Field>

          {/* ── Capacity & Pricing ── */}
          <SectionLabel>Capacity & Pricing</SectionLabel>

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Field label="Capacity">
                <TextInput style={s.input} value={capacity} onChangeText={setCapacity} placeholder="100" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Ticket Price (PKR)">
                <TextInput style={s.input} value={ticketPrice} onChangeText={setTicketPrice} placeholder="0 = Free" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
              </Field>
            </View>
          </View>

          {/* ── Registration Mode ── */}
          <SectionLabel>Registration Mode</SectionLabel>

          {REG_MODES.map(m => (
            <TouchableOpacity
              key={m.value}
              style={[s.modeCard, regMode === m.value && s.modeCardActive]}
              onPress={() => setRegMode(m.value)}
              activeOpacity={0.75}
            >
              <View style={[s.modeIcon, regMode === m.value && { backgroundColor: colors.blueSubtle }]}>
                <Ionicons name={m.icon} size={18} color={regMode === m.value ? colors.blue : colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.modeLabel, regMode === m.value && { color: colors.blue }]}>{m.label}</Text>
                <Text style={s.modeDesc}>{m.desc}</Text>
              </View>
              {regMode === m.value && <Ionicons name="checkmark-circle" size={20} color={colors.blue} />}
            </TouchableOpacity>
          ))}

          {/* ── Publish ── */}
          <SectionLabel>Publishing</SectionLabel>

          <View style={s.publishRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.publishLabel}>Publish immediately</Text>
              <Text style={s.publishSub}>Off = saved as draft, visible only to you</Text>
            </View>
            <Switch
              value={publishNow}
              onValueChange={setPublishNow}
              trackColor={{ false: colors.surface2, true: colors.blueSubtle }}
              thumbColor={publishNow ? colors.blue : colors.textMuted}
            />
          </View>

          <TouchableOpacity
            style={[s.createBtn, { backgroundColor: publishNow ? colors.blue : colors.surface2 }, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.white} size="small" />
              : <>
                <Ionicons name={publishNow ? 'rocket-outline' : 'save-outline'} size={18} color={publishNow ? colors.white : colors.textSecondary} />
                <Text style={[s.createBtnText, !publishNow && { color: colors.textSecondary }]}>
                  {publishNow ? 'Publish Event' : 'Save as Draft'}
                </Text>
              </>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={s.sectionLabel}>{children}</Text>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {hint && <Text style={s.fieldHint}>{hint}</Text>}
      {children}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { flex: 1, color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  saveBtn: {
    backgroundColor: colors.blue, borderRadius: radius.md,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  saveBtnText: { color: colors.white, fontSize: 14, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  scroll: { padding: 16, paddingBottom: 48, gap: 0 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.errorSubtle, borderRadius: radius.md,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.error + '33',
  },
  errorText: { color: colors.error, fontSize: 13, fontFamily: 'DMSans_400Regular', flex: 1 },

  sectionLabel: {
    color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_500Medium',
    letterSpacing: 1, textTransform: 'uppercase',
    marginTop: 24, marginBottom: 10,
  },

  field: { marginBottom: 12 },
  fieldLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_500Medium', marginBottom: 4 },
  fieldHint: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular', marginBottom: 4 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular',
  },
  multiline: { height: 100, paddingTop: 12 },

  row: { flexDirection: 'row', gap: 12 },

  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 14, marginBottom: 8,
  },
  modeCardActive: { borderColor: colors.blueBorder, backgroundColor: 'rgba(30,94,255,0.04)' },
  modeIcon: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  modeLabel: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium', marginBottom: 2 },
  modeDesc: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },

  publishRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 16, marginBottom: 16,
  },
  publishLabel: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  publishSub: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },

  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: radius.md, paddingVertical: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  createBtnText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold', fontWeight: '700' },
})

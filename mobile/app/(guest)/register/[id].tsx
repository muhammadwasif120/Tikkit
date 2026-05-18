import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { getEvent, registerForEvent, EventDetail } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { colors, radius } from '@/theme'

/* ─── Focused input component ─────────────────────────────────────────────── */
function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  required,
  icon,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: any
  autoCapitalize?: any
  required?: boolean
  icon: keyof typeof Ionicons.glyphMap
}) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={fi.wrap}>
      <Text style={fi.label}>
        {label}{required && <Text style={fi.req}> *</Text>}
      </Text>
      <View style={[
        fi.inputRow,
        focused && fi.inputRowFocused,
        !focused && value.length > 0 && fi.inputRowFilled,
      ]}>
        <View style={[fi.iconWrap, focused && fi.iconWrapFocused]}>
          <Ionicons name={icon} size={15} color={focused ? colors.blue : colors.textMuted} />
        </View>
        <TextInput
          style={fi.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {!focused && value.length > 0 && (
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
        )}
      </View>
    </View>
  )
}

const fi = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_500Medium',
  },
  req: { color: colors.blue },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    paddingRight: 12,
  },
  inputRowFocused: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSubtle,
  },
  inputRowFilled: {
    borderColor: colors.success + '50',
  },
  iconWrap: {
    width: 44, height: 48,
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: colors.border,
  },
  iconWrapFocused: {
    borderRightColor: colors.blueBorder,
  },
  input: {
    flex: 1, color: colors.textPrimary,
    fontSize: 15, fontFamily: 'DMSans_400Regular',
    paddingVertical: 13,
  },
})

/* ─── Main screen ─────────────────────────────────────────────────────────── */
export default function RegisterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { profile } = useAuth()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState(profile?.full_name ?? '')
  const [email, setEmail] = useState(profile?.email ?? '')
  const [phone, setPhone] = useState('')
  const [selectedDays, setSelectedDays] = useState<string[]>([])

  useEffect(() => {
    if (!id) return
    getEvent(id).then(({ event: e }) => setEvent(e))
      .finally(() => setLoading(false))
  }, [id])

  const toggleDay = (ticketId: string) => {
    setSelectedDays(prev =>
      prev.includes(ticketId) ? prev.filter(d => d !== ticketId) : [...prev, ticketId]
    )
  }

  const isEOI = event?.registration_mode === 'expression_of_interest'

  const submit = async () => {
    if (!name.trim() || !email.trim()) return Alert.alert('Required', 'Name and email are required')
    if (event?.ticket_types?.length && selectedDays.length === 0)
      return Alert.alert('Select days', 'Please select at least one day')
    setSubmitting(true)
    try {
      const result = await registerForEvent({
        eventId: id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        ticketDays: event?.ticket_types?.length ? selectedDays : null,
      })
      router.replace({
        pathname: '/(guest)/register/success',
        params: {
          status: result.status,
          title: event?.title ?? '',
        },
      })
    } catch (err: any) {
      Alert.alert('Registration failed', err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <View style={s.centered}><ActivityIndicator color={colors.blue} size="large" /></View>
  }

  const isFormValid = name.trim().length > 0 && email.trim().length > 0

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.navTitle}>{isEOI ? 'Apply' : 'Register'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

        {/* Event summary */}
        {event && (
          <View style={s.eventCard}>
            <View style={s.eventCardTop}>
              <View style={s.eventIconWrap}>
                <Ionicons name="calendar-outline" size={16} color={colors.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.eventTitle} numberOfLines={2}>{event.title}</Text>
                <Text style={s.eventMeta}>
                  {format(new Date(event.date_start), 'EEE, d MMM yyyy · h:mm a')}
                </Text>
              </View>
              {event.ticket_price && event.ticket_price > 0 && (
                <View style={s.priceTag}>
                  <Text style={s.priceTagText}>Rs. {event.ticket_price.toLocaleString()}</Text>
                </View>
              )}
            </View>

            {isEOI && (
              <View style={s.applicationNote}>
                <Ionicons name="document-text-outline" size={14} color="#A855F7" />
                <Text style={s.applicationNoteText}>
                  This event requires an application — the organizer will review and approve registrations
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Form */}
        <View style={s.formCard}>
          <View style={s.formHeader}>
            <Text style={s.formTitle}>YOUR DETAILS</Text>
            <Text style={s.formSub}>Fields marked * are required</Text>
          </View>

          <FormField
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            autoCapitalize="words"
            required
            icon="person-outline"
          />

          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            required
            icon="mail-outline"
          />

          <FormField
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="+92 300 0000000"
            keyboardType="phone-pad"
            autoCapitalize="none"
            icon="call-outline"
          />
        </View>

        {/* Day selection */}
        {event?.ticket_types && event.ticket_types.length > 0 && (
          <View style={s.formCard}>
            <View style={s.formHeader}>
              <Text style={s.formTitle}>SELECT DAYS</Text>
              <Text style={s.formSub}>{selectedDays.length} of {event.ticket_types.length} selected</Text>
            </View>
            {event.ticket_types.map(tt => {
              const selected = selectedDays.includes(tt.id)
              return (
                <TouchableOpacity
                  key={tt.id}
                  style={[s.dayRow, selected && s.dayRowActive]}
                  onPress={() => toggleDay(tt.id)}
                  activeOpacity={0.7}
                >
                  <View style={[s.checkbox, selected && s.checkboxActive]}>
                    {selected && <Ionicons name="checkmark" size={14} color={colors.white} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.dayTitle, selected && { color: colors.blue }]}>Day {tt.day}</Text>
                    <Text style={s.dayDate}>{format(new Date(tt.date), 'EEEE, d MMMM')}</Text>
                  </View>
                  {tt.ticket_price > 0 && (
                    <Text style={[s.dayPrice, selected && { color: colors.blue }]}>
                      Rs. {tt.ticket_price.toLocaleString()}
                    </Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[
            s.submitBtn,
            isEOI && s.submitBtnEOI,
            (!isFormValid || submitting) && s.submitBtnDisabled,
          ]}
          onPress={submit}
          disabled={!isFormValid || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Ionicons
                name={isEOI ? 'document-text-outline' : 'checkmark-circle-outline'}
                size={18}
                color={colors.white}
              />
              <Text style={s.submitText}>
                {isEOI ? 'Submit Application' : 'Complete Registration'}
              </Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  centered: { flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' },

  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  navTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },

  body: { padding: 16, paddingBottom: 48, gap: 12 },

  // Event card
  eventCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10,
  },
  eventCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  eventIconWrap: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.blueSubtle,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  eventTitle: {
    color: colors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginBottom: 2,
  },
  eventMeta: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  priceTag: {
    backgroundColor: colors.blueSubtle, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.blueBorder,
  },
  priceTagText: { color: colors.blue, fontSize: 13, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  applicationNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(168,85,247,0.08)', borderRadius: radius.sm,
    padding: 10,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)',
  },
  applicationNoteText: {
    color: '#A855F7', fontSize: 12, fontFamily: 'DMSans_400Regular', flex: 1, lineHeight: 17,
  },

  // Form card
  formCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 16, gap: 16,
  },
  formHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  formTitle: {
    color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_500Medium',
    letterSpacing: 1.5,
  },
  formSub: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_400Regular' },

  // Day selection
  dayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    padding: 12, backgroundColor: colors.surface2,
  },
  dayRowActive: {
    borderColor: colors.blueBorder, backgroundColor: colors.blueSubtle,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  checkboxActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  dayTitle: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  dayDate: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  dayPrice: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_500Medium' },

  // Submit
  submitBtn: {
    backgroundColor: colors.blue, borderRadius: radius.md,
    paddingVertical: 16, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnEOI: {
    backgroundColor: '#A855F7',
    shadowColor: '#A855F7',
  },
  submitBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold', fontWeight: '700',
  },
})

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

  const submit = async () => {
    if (!name.trim() || !email.trim()) return Alert.alert('Required', 'Name and email are required')
    if (event?.ticket_types?.length && selectedDays.length === 0) return Alert.alert('Select days', 'Please select at least one day')
    setSubmitting(true)
    try {
      const result = await registerForEvent({
        eventId: id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        ticketDays: event?.ticket_types?.length ? selectedDays : null,
      })
      Alert.alert(
        result.status === 'approved' ? 'Registered!' : 'Application Submitted',
        result.status === 'approved'
          ? 'You are registered. Check your Tickets tab for your QR code.'
          : 'Your application is pending review. We will notify you.',
        [{ text: 'OK', onPress: () => router.replace('/(guest)/tickets') }]
      )
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <View style={s.centered}><ActivityIndicator color={colors.blue} size="large" /></View>
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Register</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

        {/* Event summary */}
        {event && (
          <View style={s.eventCard}>
            <Text style={s.eventTitle}>{event.title}</Text>
            <View style={s.eventMeta}>
              <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
              <Text style={s.eventMetaText}>{format(new Date(event.date_start), 'EEE, d MMM yyyy · h:mm a')}</Text>
            </View>
            {event.ticket_price && (
              <View style={s.eventMeta}>
                <Ionicons name="pricetag-outline" size={13} color={colors.textMuted} />
                <Text style={s.eventMetaText}>Rs. {event.ticket_price.toLocaleString()}</Text>
              </View>
            )}
            {event.registration_mode === 'application' && (
              <View style={s.applicationNote}>
                <Ionicons name="information-circle-outline" size={14} color={colors.indigo} />
                <Text style={s.applicationNoteText}>This event requires approval — your application will be reviewed</Text>
              </View>
            )}
          </View>
        )}

        {/* Form */}
        <View style={s.formCard}>
          <Text style={s.formTitle}>Your Details</Text>

          <View style={s.field}>
            <Text style={s.label}>Full Name *</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Email *</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Phone</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+92 300 0000000"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Day selection */}
        {event?.ticket_types && event.ticket_types.length > 0 && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>Select Days *</Text>
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
                    <Text style={[s.dayTitle, selected && s.dayTitleActive]}>Day {tt.day}</Text>
                    <Text style={s.dayDate}>{format(new Date(tt.date), 'EEEE, d MMMM')}</Text>
                  </View>
                  {tt.ticket_price > 0 && (
                    <Text style={s.dayPrice}>Rs. {tt.ticket_price.toLocaleString()}</Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={submit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color={colors.white} size="small" />
            : <>
              <Text style={s.submitText}>Submit Registration</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </>
          }
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

  body: { padding: 16, paddingBottom: 40, gap: 12 },

  eventCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 16, gap: 6,
  },
  eventTitle: { color: colors.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventMetaText: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  applicationNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.indigoSubtle, borderRadius: radius.sm,
    padding: 10, marginTop: 6,
  },
  applicationNoteText: { color: colors.indigo, fontSize: 12, fontFamily: 'DMSans_400Regular', flex: 1 },

  formCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 16, gap: 14,
  },
  formTitle: {
    color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_500Medium',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },

  field: { gap: 6 },
  label: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_500Medium' },
  input: {
    backgroundColor: colors.surface2, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    color: colors.textPrimary, fontSize: 15, fontFamily: 'DMSans_400Regular',
  },

  dayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 12,
  },
  dayRowActive: { borderColor: colors.blueBorder, backgroundColor: colors.blueSubtle },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  dayTitle: { color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  dayTitleActive: { color: colors.blue },
  dayDate: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  dayPrice: { color: colors.blue, fontSize: 13, fontFamily: 'DMSans_500Medium' },

  submitBtn: {
    backgroundColor: colors.blue, borderRadius: radius.md,
    padding: 15, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  submitText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold', fontWeight: '700' },
})

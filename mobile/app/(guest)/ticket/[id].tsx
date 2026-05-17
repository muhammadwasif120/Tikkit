import {
  View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import QRCode from 'react-native-qrcode-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { getTickets, Ticket } from '@/lib/api'
import { colors, radius, getEventGradient } from '@/theme'

export default function QRTicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [darkQR, setDarkQR] = useState(false)

  useEffect(() => {
    getTickets().then(({ tickets }) => {
      const found = tickets.find(t => t.id === id) ?? null
      setTicket(found)
      if (!found) Alert.alert('Not found', 'Ticket not found')
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
    )
  }

  if (!ticket) return null

  const event = ticket.events
  const gradient = getEventGradient(ticket.id)
  const isCheckedIn = ticket.status === 'checked_in' || ticket.status === 'attended'
  const isApproved = ticket.status === 'approved' || isCheckedIn

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* Nav bar */}
      <View style={s.nav}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Your Ticket</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          {/* Gradient header */}
          <LinearGradient colors={gradient as [string, string]} style={s.cardHeader} start={[0, 0]} end={[1, 1]}>
            <Text style={s.eventTitle} numberOfLines={2}>{event?.title ?? 'Event'}</Text>
            {event?.date_start && (
              <Text style={s.eventDate}>
                {format(new Date(event.date_start), 'EEE, d MMM yyyy · h:mm a')}
              </Text>
            )}
            {event?.venue_name && (
              <View style={s.venueRow}>
                <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={s.eventVenue}>{event.venue_name}</Text>
              </View>
            )}
          </LinearGradient>

          {/* Tear divider */}
          <View style={s.tearRow}>
            <View style={s.tearCircleL} />
            <View style={s.tearDashes} />
            <View style={s.tearCircleR} />
          </View>

          {/* Guest info */}
          <View style={s.guestSection}>
            <View style={s.guestRow}>
              <View>
                <Text style={s.guestLabel}>Guest</Text>
                <Text style={s.guestName}>{ticket.name ?? ticket.email}</Text>
                <Text style={s.guestEmail}>{ticket.email}</Text>
              </View>
              {ticket.is_vip && (
                <View style={s.vipBadge}>
                  <Ionicons name="star" size={12} color={colors.gold} />
                  <Text style={s.vipText}>VIP</Text>
                </View>
              )}
            </View>

            {ticket.ticket_days && ticket.ticket_days.length > 0 && (
              <View style={s.daysWrap}>
                <Text style={s.daysLabel}>Days</Text>
                <View style={s.daysList}>
                  {ticket.ticket_days.map(d => (
                    <View key={d} style={s.dayBadge}>
                      <Text style={s.dayText}>{d}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Tear divider */}
          <View style={s.tearRow}>
            <View style={s.tearCircleL} />
            <View style={s.tearDashes} />
            <View style={s.tearCircleR} />
          </View>

          {/* QR Code */}
          <View style={s.qrSection}>
            {ticket.qr_token && isApproved ? (
              <>
                <TouchableOpacity
                  style={[s.qrContainer, darkQR && s.qrContainerDark]}
                  onPress={() => setDarkQR(v => !v)}
                  activeOpacity={0.9}
                >
                  <QRCode
                    value={ticket.qr_token}
                    size={200}
                    backgroundColor={darkQR ? '#0a0a0a' : '#ffffff'}
                    color={darkQR ? '#ffffff' : '#0a0a0a'}
                  />
                </TouchableOpacity>
                <View style={s.qrHintRow}>
                  <Ionicons name="sunny-outline" size={13} color={colors.textMuted} />
                  <Text style={s.qrHint}>Tap to toggle brightness · Show at venue entrance</Text>
                </View>
              </>
            ) : (
              <View style={s.qrPending}>
                <Ionicons name="time-outline" size={36} color={colors.textMuted} />
                <Text style={s.qrPendingTitle}>QR Not Available</Text>
                <Text style={s.qrPendingText}>
                  {ticket.status === 'pending'
                    ? 'Your registration is pending approval'
                    : 'QR code will appear once your registration is confirmed'}
                </Text>
              </View>
            )}
          </View>

          {/* Tear divider */}
          <View style={s.tearRow}>
            <View style={s.tearCircleL} />
            <View style={s.tearDashes} />
            <View style={s.tearCircleR} />
          </View>

          {/* Status row */}
          <View style={[s.statusRow, {
            backgroundColor: isCheckedIn ? colors.successSubtle : colors.blueSubtle,
          }]}>
            <Ionicons
              name={isCheckedIn ? 'checkmark-circle' : 'ticket'}
              size={18}
              color={isCheckedIn ? colors.success : colors.blue}
            />
            <Text style={[s.statusText, { color: isCheckedIn ? colors.success : colors.blue }]}>
              {isCheckedIn ? 'Checked In' : ticket.status === 'pending' ? 'Pending Approval' : 'Registered'}
            </Text>
          </View>
        </View>

        <View style={s.offlineNote}>
          <Ionicons name="wifi-outline" size={13} color={colors.textMuted} />
          <Text style={s.offlineText}>QR code is cached — works offline</Text>
        </View>
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
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  navTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },

  body: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    width: '100%', overflow: 'hidden',
  },

  cardHeader: { padding: 20, gap: 4 },
  eventTitle: { color: colors.white, fontSize: 20, fontFamily: 'Poppins_700Bold' },
  eventDate: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'DMSans_400Regular' },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventVenue: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'DMSans_400Regular' },

  tearRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.pageBg,
  },
  tearCircleL: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.pageBg, marginLeft: -10,
  },
  tearDashes: {
    flex: 1, height: 1,
    borderWidth: 1, borderColor: colors.border,
    borderStyle: 'dashed',
  },
  tearCircleR: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.pageBg, marginRight: -10,
  },

  guestSection: { padding: 16 },
  guestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  guestLabel: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_500Medium', letterSpacing: 0.5, marginBottom: 3 },
  guestName: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  guestEmail: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  vipBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,199,69,0.15)',
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.gold + '44',
  },
  vipText: { color: colors.gold, fontSize: 11, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  daysWrap: { marginTop: 12 },
  daysLabel: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_500Medium', marginBottom: 6 },
  daysList: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayBadge: {
    backgroundColor: colors.blueSubtle,
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  dayText: { color: colors.blue, fontSize: 11, fontFamily: 'DMSans_500Medium' },

  qrSection: { padding: 20, alignItems: 'center', gap: 12 },
  qrContainer: {
    padding: 14, backgroundColor: colors.white,
    borderRadius: radius.lg,
  },
  qrContainerDark: { backgroundColor: '#0a0a0a' },
  qrHintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qrHint: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },

  qrPending: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  qrPendingTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  qrPendingText: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', textAlign: 'center', maxWidth: 240 },

  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  statusText: { fontSize: 14, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  offlineNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, opacity: 0.6,
  },
  offlineText: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },
})

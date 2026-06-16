import {
  View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView,
  TouchableOpacity, Animated, Dimensions,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import QRCode from 'react-native-qrcode-svg'
import { LinearGradient } from 'expo-linear-gradient'
import * as SecureStore from 'expo-secure-store'
import { getTickets, Ticket } from '@/lib/api'
import { colors, radius, getEventGradient } from '@/theme'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_W = Math.min(SCREEN_W - 32, 380)
const QR_SIZE = Math.min(CARD_W - 80, 220)

const QR_CACHE_KEY = (id: string) => `qr_ticket_${id}`

export default function QRTicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [ticket, setTicket]     = useState<Ticket | null>(null)
  const [loading, setLoading]   = useState(true)
  const [darkQR, setDarkQR]     = useState(false)
  const [fromCache, setFromCache] = useState(false)

  // Pulsing glow animation
  const glowAnim = useRef(new Animated.Value(0.35)).current
  const glowLoop = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      // 1. Show cached ticket immediately so QR is visible offline
      // Hoist `hasCached` outside the try so the network step can reference it
      let hasCached = false
      try {
        const cached = await SecureStore.getItemAsync(QR_CACHE_KEY(id))
        if (cached) {
          hasCached = true
          setTicket(JSON.parse(cached))
          setFromCache(true)
          setLoading(false)  // unblock UI straight away
        }
      } catch { /* ignore */ }

      // 2. Fetch fresh data from API and update cache
      try {
        const { tickets } = await getTickets()
        const found = tickets.find(t => t.id === id) ?? null
        if (found) {
          setTicket(found)
          setFromCache(false)
          await SecureStore.setItemAsync(QR_CACHE_KEY(id), JSON.stringify(found))
        } else if (!hasCached) {
          // Not in API and nothing in cache — genuinely missing
          Alert.alert('Not found', 'Ticket not found')
        }
      } catch {
        // Network failed — already showing cached version, nothing to do
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.35, duration: 2000, useNativeDriver: true }),
      ])
    )
    glowLoop.current = loop
    loop.start()
    return () => loop.stop()
  }, [])

  if (loading && !ticket) {
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
  const isPending = ticket.status === 'pending'

  const statusConfig = isCheckedIn
    ? { color: colors.success, bg: colors.successSubtle, icon: 'checkmark-circle' as const, label: 'Checked In' }
    : isApproved
    ? { color: colors.blue, bg: colors.blueSubtle, icon: 'ticket' as const, label: 'Ready to Scan' }
    : isPending
    ? { color: colors.warning, bg: colors.warningSubtle, icon: 'time-outline' as const, label: 'Pending Approval' }
    : { color: colors.textMuted, bg: colors.surface2, icon: 'ellipse-outline' as const, label: ticket.status }

  const glowColor = isCheckedIn ? colors.success : colors.blue

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />

      {/* Nav */}
      <View style={[s.nav, { paddingTop: 4 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        {fromCache && (
          <View style={s.offlinePill}>
            <Ionicons name="cloud-offline-outline" size={11} color={colors.warning} />
            <Text style={s.offlinePillText}>Offline</Text>
          </View>
        )}
        <Text style={s.navTitle}>Your Ticket</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Ticket card ── */}
        <View style={s.card}>

          {/* Gradient header */}
          <LinearGradient
            colors={gradient as [string, string]}
            style={s.cardHeader}
            start={[0, 0]} end={[1, 1]}
          >
            {/* Event category chip */}
            <View style={s.headerChip}>
              <Ionicons name="ticket-outline" size={11} color="rgba(255,255,255,0.8)" />
              <Text style={s.headerChipText}>EVENT TICKET</Text>
            </View>

            <Text style={s.eventTitle} numberOfLines={2}>{event?.title ?? 'Event'}</Text>

            <View style={s.headerMeta}>
              {event?.date_start && (
                <View style={s.headerMetaRow}>
                  <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={s.headerMetaText}>
                    {format(new Date(event.date_start), 'EEE, d MMM yyyy · h:mm a')}
                  </Text>
                </View>
              )}
              {event?.venue_name && (
                <View style={s.headerMetaRow}>
                  <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={s.headerMetaText}>{event.venue_name}</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Tear divider */}
          <TearDivider />

          {/* Guest info */}
          <View style={s.guestSection}>
            <View style={s.guestRow}>
              {/* Initials avatar */}
              <View style={s.guestAvatar}>
                <Text style={s.guestAvatarText}>
                  {(ticket.name ?? ticket.email ?? '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.guestLabel}>GUEST</Text>
                <Text style={s.guestName} numberOfLines={1}>{ticket.name ?? ticket.email}</Text>
                {ticket.name && <Text style={s.guestEmail} numberOfLines={1}>{ticket.email}</Text>}
              </View>
              {ticket.is_vip && (
                <View style={s.vipBadge}>
                  <Ionicons name="star" size={11} color={colors.gold} />
                  <Text style={s.vipText}>VIP</Text>
                </View>
              )}
            </View>

            {ticket.ticket_days && ticket.ticket_days.length > 0 && (
              <View style={s.daysWrap}>
                <Text style={s.daysLabel}>DAYS</Text>
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
          <TearDivider />

          {/* QR Section */}
          <View style={s.qrSection}>
            {ticket.qr_token && isApproved ? (
              <>
                <Text style={s.qrLabel}>SCAN TO ENTER</Text>

                {/* Pulsing glow + QR */}
                <TouchableOpacity onPress={() => setDarkQR(v => !v)} activeOpacity={0.92}>
                  <View style={s.qrOuterWrap}>
                    {/* Glow layer */}
                    <Animated.View
                      style={[
                        s.qrGlow,
                        {
                          opacity: glowAnim,
                          shadowColor: glowColor,
                          borderColor: glowColor + '60',
                        },
                      ]}
                    />
                    {/* QR container */}
                    <View style={[s.qrBox, darkQR && s.qrBoxDark]}>
                      <QRCode
                        value={ticket.qr_token}
                        size={QR_SIZE}
                        backgroundColor={darkQR ? '#0a0a0a' : '#ffffff'}
                        color={darkQR ? '#ffffff' : '#0a0a0a'}
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={s.qrHintRow}>
                  <Ionicons name="phone-portrait-outline" size={12} color={colors.textMuted} />
                  <Text style={s.qrHint}>Tap to invert • Show at entrance</Text>
                </View>
              </>
            ) : (
              <View style={s.qrPending}>
                <View style={s.qrPendingIcon}>
                  <Ionicons name="time-outline" size={32} color={colors.warning} />
                </View>
                <Text style={s.qrPendingTitle}>QR Not Yet Available</Text>
                <Text style={s.qrPendingText}>
                  {isPending
                    ? 'Your registration is pending organizer approval'
                    : 'QR code will appear once your registration is confirmed'}
                </Text>
              </View>
            )}
          </View>

          {/* Tear divider */}
          <TearDivider />

          {/* Status footer */}
          <View style={[s.statusRow, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon} size={18} color={statusConfig.color} />
            <Text style={[s.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            <View style={{ flex: 1 }} />
            {isCheckedIn && (
              <View style={s.checkedBadge}>
                <Ionicons name="checkmark" size={12} color={colors.success} />
                <Text style={s.checkedBadgeText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Offline note */}
        <View style={s.offlineNote}>
          <Ionicons name="cloud-offline-outline" size={13} color={colors.textMuted} />
          <Text style={s.offlineText}>QR cached — works without internet</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function TearDivider() {
  return (
    <View style={s.tearRow}>
      <View style={s.tearCircleL} />
      <View style={s.tearDash} />
      <View style={s.tearCircleR} />
    </View>
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
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  navTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },

  body: { paddingHorizontal: 16, alignItems: 'center' },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    width: CARD_W,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },

  // Gradient header
  cardHeader: {
    padding: 20, paddingBottom: 22, gap: 6,
  },
  headerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3,
    marginBottom: 8,
  },
  headerChipText: {
    color: 'rgba(255,255,255,0.8)', fontSize: 9,
    fontFamily: 'DMSans_500Medium', fontWeight: '700', letterSpacing: 1.5,
  },
  eventTitle: {
    color: colors.white, fontSize: 22, fontFamily: 'Poppins_700Bold',
    lineHeight: 28, letterSpacing: -0.2,
  },
  headerMeta: { gap: 5, marginTop: 4 },
  headerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerMetaText: {
    color: 'rgba(255,255,255,0.75)', fontSize: 12,
    fontFamily: 'DMSans_400Regular',
  },

  // Tear
  tearRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.pageBg,
  },
  tearCircleL: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.pageBg, marginLeft: -10,
  },
  tearDash: {
    flex: 1, height: 1,
    borderWidth: 1, borderColor: colors.border,
    borderStyle: 'dashed',
  },
  tearCircleR: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.pageBg, marginRight: -10,
  },

  // Guest section
  guestSection: { padding: 18, gap: 12 },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guestAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.blueSubtle,
    borderWidth: 2, borderColor: colors.blueBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  guestAvatarText: { color: colors.blue, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  guestLabel: {
    color: colors.textMuted, fontSize: 9, fontFamily: 'DMSans_500Medium',
    letterSpacing: 1.5, marginBottom: 2,
  },
  guestName: { color: colors.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  guestEmail: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  vipBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.gold + '18',
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.gold + '40',
  },
  vipText: { color: colors.gold, fontSize: 11, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  daysWrap: { gap: 6 },
  daysLabel: {
    color: colors.textMuted, fontSize: 9, fontFamily: 'DMSans_500Medium', letterSpacing: 1.5,
  },
  daysList: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayBadge: {
    backgroundColor: colors.blueSubtle,
    borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.blueBorder,
  },
  dayText: { color: colors.blue, fontSize: 12, fontFamily: 'DMSans_500Medium' },

  // QR section
  qrSection: { padding: 24, alignItems: 'center', gap: 16 },
  qrLabel: {
    color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_500Medium',
    letterSpacing: 2, textTransform: 'uppercase',
  },

  // Glow wrapper
  qrOuterWrap: {
    alignItems: 'center', justifyContent: 'center',
    padding: 8,
  },
  qrGlow: {
    position: 'absolute',
    width: QR_SIZE + 60,
    height: QR_SIZE + 60,
    borderRadius: radius.xl + 4,
    backgroundColor: 'transparent',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 24,
  },
  qrBox: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  qrBoxDark: { backgroundColor: '#0a0a0a' },

  qrHintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qrHint: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },

  // Pending state
  qrPending: { alignItems: 'center', gap: 12, paddingVertical: 16 },
  qrPendingIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.warningSubtle,
    borderWidth: 1, borderColor: colors.warning + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  qrPendingTitle: { color: colors.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  qrPendingText: {
    color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular',
    textAlign: 'center', maxWidth: 250, lineHeight: 19,
  },

  // Status footer
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 18, paddingVertical: 14,
  },
  statusText: { fontSize: 14, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  checkedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.successSubtle,
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.success + '40',
  },
  checkedBadgeText: { color: colors.success, fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  // Offline note
  offlineNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 20, opacity: 0.55,
  },
  offlineText: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },

  // Offline nav pill
  offlinePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.warningSubtle,
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.warning + '40',
  },
  offlinePillText: { color: colors.warning, fontSize: 10, fontFamily: 'DMSans_500Medium' },
})

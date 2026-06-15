import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, RefreshControl, Dimensions,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { getTickets, Ticket } from '@/lib/api'
import { colors, radius, getEventGradient } from '@/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'

const { width: SCREEN_W } = Dimensions.get('window')

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:      { label: 'Pending',     color: colors.warning,       bg: colors.warningSubtle },
  invited:      { label: 'Invited',     color: colors.indigo,        bg: colors.indigoSubtle },
  confirmed:    { label: 'Confirmed',   color: colors.success,       bg: colors.successSubtle },
  registered:   { label: 'Registered',  color: colors.blue,          bg: colors.blueSubtle },
  approved:     { label: 'Approved',    color: colors.success,       bg: colors.successSubtle },
  checked_in:   { label: 'Checked In',  color: colors.success,       bg: colors.successSubtle },
  checked_out:  { label: 'Checked Out', color: colors.textSecondary, bg: 'rgba(107,114,128,0.1)' },
  attended:     { label: 'Attended',    color: colors.textSecondary, bg: 'rgba(156,163,175,0.1)' },
  no_show:      { label: 'No Show',     color: colors.error,         bg: colors.errorSubtle },
  cancelled:    { label: 'Cancelled',   color: colors.error,         bg: colors.errorSubtle },
}

/* ─── Skeleton loader ────────────────────────────────────────────────────── */
function TicketSkeleton() {
  return (
    <View style={s.card}>
      <Skeleton height={160} borderRadius={0} />
      {/* Tear row */}
      <View style={s.tearRow}>
        <View style={s.tearCircleL} />
        <View style={s.tearDashes} />
        <View style={s.tearCircleR} />
      </View>
      <View style={s.cardBody}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Skeleton width="60%" height={18} />
          <Skeleton width={80} height={22} borderRadius={radius.full} />
        </View>
        <Skeleton width="45%" height={13} style={{ marginBottom: 8 }} />
        <Skeleton width="55%" height={13} style={{ marginBottom: 14 }} />
        <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 14 }} />
        <Skeleton width="40%" height={13} />
      </View>
    </View>
  )
}

/* ─── Main screen ─────────────────────────────────────────────────────────── */
export default function TicketsScreen() {
  const router = useRouter()
  const toast = useToast()
  const [tickets,    setTickets]    = useState<Ticket[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const { tickets: t } = await getTickets()
      setTickets(t)
    } catch (e: any) {
      toast.show({ type: 'error', message: e?.message || 'Couldn\'t load tickets. Pull down to retry.' })
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <View style={s.header}>
        <Text style={s.heading}>My Tickets</Text>
        {!loading && (
          <Text style={s.subheading}>
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {loading ? (
        <View style={s.skeletonList}>
          <TicketSkeleton />
          <TicketSkeleton />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={t => t.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="ticket-outline" size={28} color={colors.textMuted} />
              </View>
              <Text style={s.emptyTitle}>No tickets yet</Text>
              <Text style={s.emptyText}>Register for an event to see your tickets here</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/(guest)/explore')}>
                <Text style={s.emptyBtnText}>Explore Events</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TicketCard ticket={item} onPress={() => router.push(`/(guest)/ticket/${item.id}`)} />
          )}
        />
      )}
    </SafeAreaView>
  )
}

/* ─── Ticket card ─────────────────────────────────────────────────────────── */
function TicketCard({ ticket, onPress }: { ticket: Ticket; onPress: () => void }) {
  const status   = STATUS[ticket.status] ?? { label: ticket.status, color: colors.textMuted, bg: colors.surface2 }
  const gradient = getEventGradient(ticket.id)
  const eventDate = ticket.events?.date_start
    ? format(new Date(ticket.events.date_start), 'EEE, d MMM yyyy · h:mm a')
    : null
  const isActive = ['confirmed', 'approved', 'registered', 'checked_in'].includes(ticket.status)

  return (
    <TouchableOpacity style={[s.card, isActive && s.cardActive]} onPress={onPress} activeOpacity={0.8}>

      {/* Hero image with gradient scrim + title overlay */}
      <View style={s.heroWrap}>
        {ticket.events?.cover_image_url ? (
          <Image source={{ uri: ticket.events.cover_image_url }} style={s.heroImg} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={gradient as [string, string]}
            style={s.heroImg}
            start={[0, 0]} end={[1, 1]}
          >
            <Text style={s.heroInitial}>{(ticket.events?.title ?? 'T').charAt(0)}</Text>
          </LinearGradient>
        )}

        {/* Gradient scrim so text is legible on photos */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={s.heroScrim}
          start={[0, 0.4]} end={[0, 1]}
        />

        {/* Status badge — top right */}
        <View style={[s.heroBadge, { backgroundColor: status.bg, borderColor: status.color + '50' }]}>
          <View style={[s.heroBadgeDot, { backgroundColor: status.color }]} />
          <Text style={[s.heroBadgeText, { color: status.color }]}>{status.label}</Text>
        </View>

        {/* Event title overlay */}
        <Text style={s.heroTitle} numberOfLines={2}>{ticket.events?.title ?? 'Event'}</Text>
      </View>

      {/* Tear / perforation divider */}
      <View style={s.tearRow}>
        <View style={s.tearCircleL} />
        <View style={s.tearDashes} />
        <View style={s.tearCircleR} />
      </View>

      {/* Ticket body */}
      <View style={s.cardBody}>
        {eventDate && (
          <View style={s.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
            <Text style={s.metaText}>{eventDate}</Text>
          </View>
        )}
        {ticket.events?.venue_name && (
          <View style={s.metaRow}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={s.metaText}>{ticket.events.venue_name}</Text>
          </View>
        )}

        {/* Show Ticket CTA */}
        <TouchableOpacity
          style={[s.showTicketBtn, isActive && { backgroundColor: colors.blue, borderColor: colors.blue }]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Ionicons
            name="qr-code-outline"
            size={16}
            color={isActive ? colors.white : colors.textSecondary}
          />
          <Text style={[s.showTicketText, isActive && { color: colors.white }]}>
            Show Ticket
          </Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={isActive ? colors.white + 'BB' : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  heading: { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold' },
  subheading: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },

  skeletonList: { paddingHorizontal: 16, gap: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  cardActive: {
    borderColor: colors.blue + '44',
  },

  // Hero
  heroWrap: { width: '100%', height: 160, position: 'relative' },
  heroImg: {
    width: '100%', height: 160,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  heroInitial: { color: colors.white, fontSize: 42, fontFamily: 'Poppins_700Bold', opacity: 0.9 },
  heroScrim: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 90,
  },
  heroBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.full, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: colors.surface,
  },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  heroBadgeText: { fontSize: 11, fontFamily: 'DMSans_500Medium', fontWeight: '600' },
  heroTitle: {
    position: 'absolute', bottom: 12, left: 14, right: 80,
    color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },

  // Tear divider
  tearRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: -1, backgroundColor: colors.pageBg,
  },
  tearCircleL: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.pageBg, marginLeft: -10,
  },
  tearDashes: {
    flex: 1, height: 1,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  tearCircleR: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.pageBg, marginRight: -10,
  },

  // Body
  cardBody: { padding: 14, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular' },

  // Show Ticket button
  showTicketBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginTop: 10, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 11,
    backgroundColor: colors.surface2,
  },
  showTicketText: {
    flex: 1,
    color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_500Medium',
  },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  emptyText: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 19 },
  emptyBtn: {
    backgroundColor: colors.blue, borderRadius: radius.md,
    paddingHorizontal: 24, paddingVertical: 11, marginTop: 6,
  },
  emptyBtnText: { color: colors.white, fontSize: 14, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
})

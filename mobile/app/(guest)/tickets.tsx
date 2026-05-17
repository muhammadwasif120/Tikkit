import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, RefreshControl,
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

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: colors.warning, bg: colors.warningSubtle },
  invited: { label: 'Invited', color: colors.indigo, bg: colors.indigoSubtle },
  confirmed: { label: 'Confirmed', color: colors.success, bg: colors.successSubtle },
  registered: { label: 'Registered', color: colors.blue, bg: colors.blueSubtle },
  approved: { label: 'Approved', color: colors.success, bg: colors.successSubtle },
  checked_in: { label: 'Checked In', color: colors.success, bg: colors.successSubtle },
  checked_out: { label: 'Checked Out', color: colors.textSecondary, bg: 'rgba(107,114,128,0.1)' },
  attended: { label: 'Attended', color: colors.textSecondary, bg: 'rgba(156,163,175,0.1)' },
  no_show: { label: 'No Show', color: colors.error, bg: colors.errorSubtle },
  cancelled: { label: 'Cancelled', color: colors.error, bg: colors.errorSubtle },
}

export default function TicketsScreen() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const { tickets: t } = await getTickets()
      setTickets(t)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <View style={s.header}>
        <Text style={s.heading}>My Tickets</Text>
        <Text style={s.subheading}>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</Text>
      </View>

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
          </View>
        }
        renderItem={({ item }) => <TicketCard ticket={item} onPress={() => router.push(`/(guest)/ticket/${item.id}`)} />}
      />
    </SafeAreaView>
  )
}

function TicketCard({ ticket, onPress }: { ticket: Ticket; onPress: () => void }) {
  const status = STATUS[ticket.status] ?? { label: ticket.status, color: colors.textMuted, bg: colors.surface2 }
  const gradient = getEventGradient(ticket.id)
  const eventDate = ticket.events?.date_start
    ? format(new Date(ticket.events.date_start), 'EEE, d MMM yyyy · h:mm a')
    : null

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      {/* Card header with gradient or image */}
      {ticket.events?.cover_image_url
        ? (
          <Image source={{ uri: ticket.events.cover_image_url }} style={s.cardImg} />
        )
        : (
          <LinearGradient colors={gradient as [string, string]} style={s.cardImg} start={[0, 0]} end={[1, 1]}>
            <Text style={s.cardImgInitial}>
              {(ticket.events?.title ?? 'T').charAt(0)}
            </Text>
          </LinearGradient>
        )
      }

      {/* Tear / perforation divider */}
      <View style={s.tearRow}>
        <View style={s.tearCircleL} />
        <View style={s.tearDashes} />
        <View style={s.tearCircleR} />
      </View>

      {/* Ticket body */}
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <Text style={s.cardTitle} numberOfLines={2}>{ticket.events?.title ?? 'Event'}</Text>
          <View style={[s.badge, { backgroundColor: status.bg }]}>
            <Text style={[s.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

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

        <View style={s.qrRow}>
          <Ionicons name="qr-code-outline" size={15} color={colors.blue} />
          <Text style={s.qrText}>View QR Ticket</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.blue} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  centered: { flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  heading: { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold' },
  subheading: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 16 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  cardImg: {
    width: '100%', height: 110,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  cardImgInitial: { color: colors.white, fontSize: 36, fontFamily: 'Poppins_700Bold' },

  tearRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: -1, backgroundColor: colors.pageBg,
  },
  tearCircleL: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.pageBg,
    marginLeft: -10,
  },
  tearDashes: {
    flex: 1, height: 1,
    borderWidth: 1, borderColor: colors.border,
    borderStyle: 'dashed',
  },
  tearCircleR: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.pageBg,
    marginRight: -10,
  },

  cardBody: { padding: 14 },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: 8, marginBottom: 10,
  },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '600' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metaText: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular' },

  qrRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  qrText: { color: colors.blue, fontSize: 13, fontFamily: 'DMSans_500Medium', flex: 1 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  emptyText: { color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center' },
})

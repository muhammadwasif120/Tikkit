import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Image, ScrollView,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { format } from 'date-fns'
import { getOrganizerEvents, OrganizerEvent } from '@/lib/api'
import { colors, radius, getEventGradient } from '@/theme'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'

const STATUS_TABS = ['all', 'published', 'draft', 'ended', 'archived', 'cancelled'] as const
type StatusTab = typeof STATUS_TABS[number]

const TAB_LABELS: Record<StatusTab, string> = {
  all: 'All',
  published: 'Live',
  draft: 'Draft',
  ended: 'Ended',
  archived: 'Archived',
  cancelled: 'Cancelled',
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: 'Live',      color: colors.success,   bg: colors.successSubtle },
  draft:     { label: 'Draft',     color: colors.warning,   bg: colors.warningSubtle },
  ended:     { label: 'Ended',     color: colors.textMuted, bg: 'rgba(107,114,128,0.10)' },
  archived:  { label: 'Archived',  color: colors.textMuted, bg: 'rgba(107,114,128,0.08)' },
  cancelled: { label: 'Cancelled', color: colors.error,     bg: colors.errorSubtle },
}

function EventCardSkeleton() {
  return (
    <View style={s.card}>
      <Skeleton height={160} style={{ borderRadius: 0 }} />
      <View style={{ padding: 14, gap: 8 }}>
        <Skeleton height={18} width="70%" style={{ borderRadius: radius.sm }} />
        <Skeleton height={13} width="50%" style={{ borderRadius: radius.sm }} />
        <View style={s.cardFooter}>
          <Skeleton height={13} width={120} style={{ borderRadius: radius.sm }} />
          <Skeleton height={13} width={40}  style={{ borderRadius: radius.sm }} />
        </View>
      </View>
    </View>
  )
}

export default function OrganizerEventsScreen() {
  const router = useRouter()
  const toast = useToast()
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<StatusTab>('all')

  const load = useCallback(async (status?: string) => {
    try {
      const { events: e } = await getOrganizerEvents(status === 'all' ? undefined : status)
      setEvents(e)
    } catch (e: any) {
      toast.show({ type: 'error', message: e?.message || 'Couldn\'t load events. Pull down to retry.' })
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    load(activeTab).finally(() => setLoading(false))
  }, [activeTab])

  const onRefresh = async () => {
    setRefreshing(true)
    await load(activeTab)
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.heading}>My Events</Text>
          {!loading && (
            <Text style={s.subheading}>{events.length} event{events.length !== 1 ? 's' : ''}</Text>
          )}
        </View>
        <TouchableOpacity
          style={s.createBtn}
          onPress={() => router.push('/(organizer)/events/new')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={s.createBtnText}>New Event</Text>
        </TouchableOpacity>
      </View>

      {/* Status tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabsScroll}
        contentContainerStyle={s.tabs}
      >
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            {tab === 'published' && <View style={s.liveDot} />}
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {TAB_LABELS[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ScrollView
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
        >
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </ScrollView>
      ) : (
        <FlatList
          data={events}
          keyExtractor={e => e.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <LinearGradient
                colors={[colors.blue + '25', 'transparent']}
                style={s.emptyIconCircle}
              >
                <Ionicons name="calendar-outline" size={28} color={colors.blue} />
              </LinearGradient>
              <Text style={s.emptyTitle}>
                {activeTab === 'all' ? 'No events yet' : `No ${TAB_LABELS[activeTab].toLowerCase()} events`}
              </Text>
              <Text style={s.emptyBody}>
                {activeTab === 'all'
                  ? 'Create your first event to start accepting registrations'
                  : 'Events in this status will appear here'}
              </Text>
              {activeTab === 'all' && (
                <TouchableOpacity
                  style={s.emptyBtn}
                  onPress={() => router.push('/(organizer)/events/new')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={16} color={colors.white} />
                  <Text style={s.emptyBtnText}>Create Event</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => router.push(`/(organizer)/events/${item.id}`)}
              onEdit={() => router.push(`/(organizer)/events/${item.id}/edit`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}

/* ─── Event Card ─────────────────────────────────────────────────────────── */
function EventCard({ event, onPress, onEdit }: {
  event: OrganizerEvent; onPress: () => void; onEdit: () => void
}) {
  const status = STATUS_META[event.status] ?? { label: event.status, color: colors.textMuted, bg: colors.surface2 }
  const gradient = getEventGradient(event.id)

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      {/* Image area — 160px tall */}
      <View style={s.cardImgWrap}>
        {event.cover_image_url
          ? (
            <Image
              source={{ uri: event.cover_image_url }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          )
          : (
            <LinearGradient
              colors={gradient as [string, string]}
              style={[StyleSheet.absoluteFillObject, s.cardImgCenter]}
              start={[0, 0]} end={[1, 1]}
            >
              <Text style={s.cardImgInitial}>{event.title.charAt(0)}</Text>
            </LinearGradient>
          )
        }

        {/* Gradient scrim */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.78)']}
          style={StyleSheet.absoluteFillObject}
          start={[0, 0.3]} end={[0, 1]}
        />

        {/* Status badge — floating top-right */}
        <View style={[s.statusBadge, { backgroundColor: status.bg, borderColor: status.color + '55' }]}>
          {event.status === 'published' && <View style={[s.statusDot, { backgroundColor: status.color }]} />}
          <Text style={[s.statusText, { color: status.color }]}>{status.label}</Text>
        </View>

        {/* Title + date overlaid at bottom of image */}
        <View style={s.cardImgContent}>
          <Text style={s.cardTitle} numberOfLines={2}>{event.title}</Text>
          <View style={s.metaRow}>
            <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.6)" />
            <Text style={s.metaText}>{format(new Date(event.date_start), 'EEE, d MMM yyyy')}</Text>
            {event.venue_city ? (
              <>
                <Text style={s.metaDot}>·</Text>
                <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.6)" />
                <Text style={s.metaText}>{event.venue_city}</Text>
              </>
            ) : null}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={s.cardFooter}>
        <View style={s.regRow}>
          <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
          <Text style={s.regText}>{event.registration_count} registrations</Text>
        </View>
        <TouchableOpacity style={s.editBtn} onPress={onEdit} activeOpacity={0.7}>
          <Ionicons name="pencil-outline" size={13} color={colors.blue} />
          <Text style={s.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  heading: { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold' },
  subheading: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.blue, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  createBtnText: { color: colors.white, fontSize: 13, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  tabsScroll: { flexGrow: 0, marginBottom: 10 },
  tabs: { paddingHorizontal: 16, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.full,
  },
  tabActive: { backgroundColor: colors.blueSubtle, borderColor: colors.blueBorder },
  tabText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_500Medium' },
  tabTextActive: { color: colors.blue },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: 4 },

  list: { padding: 16, gap: 12, paddingBottom: 32 },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  cardImgWrap: { height: 160, overflow: 'hidden', position: 'relative' },
  cardImgCenter: { alignItems: 'center', justifyContent: 'center' },
  cardImgInitial: { color: 'rgba(255,255,255,0.55)', fontSize: 44, fontFamily: 'Poppins_700Bold' },
  statusBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.full, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '600' },
  cardImgContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  cardTitle: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 4, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'DMSans_400Regular' },
  metaDot: { color: 'rgba(255,255,255,0.35)', fontSize: 12 },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  regRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  regText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { color: colors.blue, fontSize: 12, fontFamily: 'DMSans_500Medium' },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  emptyBody: {
    color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular',
    textAlign: 'center', maxWidth: 240, lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.blue, borderRadius: radius.md,
    paddingHorizontal: 16, paddingVertical: 10, marginTop: 6,
  },
  emptyBtnText: { color: colors.white, fontSize: 14, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
})

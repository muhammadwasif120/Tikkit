import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Image, ScrollView, Animated,
} from 'react-native'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { getOrganizerEvents, OrganizerEvent } from '@/lib/api'
import { colors, radius, getEventGradient } from '@/theme'
import { LinearGradient } from 'expo-linear-gradient'

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
  published: { label: 'Live', color: colors.success, bg: colors.successSubtle },
  draft: { label: 'Draft', color: colors.warning, bg: colors.warningSubtle },
  ended: { label: 'Ended', color: colors.textMuted, bg: 'rgba(107,114,128,0.1)' },
  archived: { label: 'Archived', color: colors.textMuted, bg: 'rgba(107,114,128,0.08)' },
  cancelled: { label: 'Cancelled', color: colors.error, bg: colors.errorSubtle },
}

export default function OrganizerEventsScreen() {
  const router = useRouter()
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<StatusTab>('all')

  const load = useCallback(async (status?: string) => {
    try {
      const { events: e } = await getOrganizerEvents(status === 'all' ? undefined : status)
      setEvents(e)
    } catch { /* silent */ }
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
      <View style={s.header}>
        <View>
          <Text style={s.heading}>My Events</Text>
          <Text style={s.subheading}>{events.length} event{events.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={s.createBtn} onPress={() => router.push('/(organizer)/events/new')} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={s.createBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Status tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabs}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            {tab === 'published' && (
              <View style={s.liveDot} />
            )}
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {TAB_LABELS[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading
        ? <ActivityIndicator color={colors.blue} style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={events}
            keyExtractor={e => e.id}
            contentContainerStyle={s.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="calendar-outline" size={36} color={colors.textMuted} />
                <Text style={s.emptyText}>No events</Text>
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
        )
      }
    </SafeAreaView>
  )
}

function EventCard({ event, onPress, onEdit }: { event: OrganizerEvent; onPress: () => void; onEdit: () => void }) {
  const status = STATUS_META[event.status] ?? { label: event.status, color: colors.textMuted, bg: colors.surface2 }
  const gradient = getEventGradient(event.id)

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      {event.cover_image_url
        ? <Image source={{ uri: event.cover_image_url }} style={s.cardImg} />
        : (
          <LinearGradient colors={gradient as [string, string]} style={s.cardImg} start={[0, 0]} end={[1, 1]}>
            <Text style={s.cardImgInitial}>{event.title.charAt(0)}</Text>
          </LinearGradient>
        )
      }
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <Text style={s.cardTitle} numberOfLines={1}>{event.title}</Text>
          <View style={[s.badge, { backgroundColor: status.bg, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            {event.status === 'published' && <View style={s.liveDotCard} />}
            <Text style={[s.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={s.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={s.metaText}>{format(new Date(event.date_start), 'EEE, d MMM yyyy')}</Text>
        </View>
        {event.venue_city && (
          <View style={s.metaRow}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={s.metaText}>{event.venue_city}</Text>
          </View>
        )}
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
      </View>
    </TouchableOpacity>
  )
}

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
  createBtnText: { color: colors.white, fontSize: 14, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  tabsScroll: { flexGrow: 0, marginBottom: 8 },
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
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: 2 },
  liveDotCard: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.success },

  list: { padding: 16, gap: 12, paddingBottom: 32 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  cardImg: {
    width: '100%', height: 100,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  cardImgInitial: { color: colors.white, fontSize: 32, fontFamily: 'Poppins_700Bold' },
  cardBody: { padding: 14 },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, marginLeft: 8 },
  badgeText: { fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  metaText: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  regRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  regText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular' },
  capText: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { color: colors.blue, fontSize: 12, fontFamily: 'DMSans_500Medium' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: colors.textMuted, fontSize: 16, fontFamily: 'DMSans_400Regular' },
})

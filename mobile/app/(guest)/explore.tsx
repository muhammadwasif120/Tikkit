import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { format, isToday, isThisWeek } from 'date-fns'
import { getEvents, getTickets, EventSummary, addFavourite, removeFavourite } from '@/lib/api'
import { colors, radius, getEventGradient } from '@/theme'
import { LinearGradient } from 'expo-linear-gradient'

// Correct slugs matching the DB exactly (20260313_categories_behaviours.sql)
const CATEGORIES = [
  { label: 'All',              slug: '',                icon: '✨' },
  { label: 'Music',            slug: 'music',           icon: '🎵' },
  { label: 'Tech',             slug: 'tech',            icon: '💻' },
  { label: 'Art & Culture',    slug: 'art-culture',     icon: '🎨' },
  { label: 'Sports',           slug: 'sports',          icon: '⚽' },
  { label: 'Food & Drink',     slug: 'food-drink',      icon: '🍔' },
  { label: 'Business',         slug: 'business',        icon: '💼' },
  { label: 'Fashion',          slug: 'fashion',         icon: '👗' },
  { label: 'Networking',       slug: 'networking',      icon: '🤝' },
  { label: 'Education',        slug: 'education',       icon: '📚' },
  { label: 'Gaming',           slug: 'gaming',          icon: '🎮' },
  { label: 'Health',           slug: 'health-wellness', icon: '💪' },
  { label: 'Comedy',           slug: 'comedy',          icon: '😂' },
  { label: 'Social',           slug: 'social',          icon: '🥳' },
  { label: 'Charity',          slug: 'charity',         icon: '❤️' },
]

const REG_MODE: Record<string, { label: string; color: string; bg: string }> = {
  open:                   { label: 'REGISTER',    color: colors.blue,   bg: colors.blueSubtle },
  expression_of_interest: { label: 'APPLY',       color: '#A855F7',     bg: 'rgba(168,85,247,0.1)' },
  invite_only:            { label: 'INVITE ONLY', color: colors.textMuted, bg: 'rgba(107,114,128,0.1)' },
}

type MyTicket = { eventId: string; status: string }

function groupEvents(events: EventSummary[]) {
  const today: EventSummary[] = []
  const thisWeek: EventSummary[] = []
  const comingUp: EventSummary[] = []
  for (const e of events) {
    const d = new Date(e.date_start)
    if (isToday(d)) today.push(e)
    else if (isThisWeek(d, { weekStartsOn: 1 })) thisWeek.push(e)
    else comingUp.push(e)
  }
  return { today, thisWeek, comingUp }
}

export default function ExploreScreen() {
  const router = useRouter()
  const [events, setEvents] = useState<EventSummary[]>([])
  const [myTickets, setMyTickets] = useState<MyTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [favourites, setFavourites] = useState<Set<string>>(new Set())

  const fetchEvents = useCallback(async (p = 0, cat = category, q = search) => {
    try {
      const res = await getEvents(p, cat || undefined, q || undefined)
      if (p === 0) setEvents(res.events)
      else setEvents(prev => [...prev, ...res.events])
      setHasMore(res.events.length === res.limit)
      setPage(p)
    } catch { /* silent */ }
  }, [category, search])

  const fetchMyTickets = useCallback(async () => {
    try {
      const { tickets } = await getTickets()
      setMyTickets(tickets.map(t => ({ eventId: t.events?.id ?? '', status: t.status })))
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchEvents(0, category, search), fetchMyTickets()])
      .finally(() => setLoading(false))
  }, [category, search])

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchEvents(0), fetchMyTickets()])
    setRefreshing(false)
  }

  const onLoadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    await fetchEvents(page + 1)
    setLoadingMore(false)
  }

  const toggleFav = async (eventId: string) => {
    const isFav = favourites.has(eventId)
    // Optimistic
    setFavourites(prev => {
      const next = new Set(prev)
      isFav ? next.delete(eventId) : next.add(eventId)
      return next
    })
    try {
      if (isFav) await removeFavourite('event', eventId)
      else await addFavourite('event', eventId)
    } catch {
      // Revert
      setFavourites(prev => {
        const next = new Set(prev)
        isFav ? next.add(eventId) : next.delete(eventId)
        return next
      })
    }
  }

  // My events: events from myTickets that are upcoming
  const myUpcoming = myTickets
    .filter(t => t.status !== 'cancelled' && t.status !== 'rejected')
    .map(t => events.find(e => e.id === t.eventId))
    .filter(Boolean) as EventSummary[]

  const { today, thisWeek, comingUp } = groupEvents(events)

  const renderSection = (title: string, icon: keyof typeof Ionicons.glyphMap, iconColor: string, sectionEvents: EventSummary[]) => {
    if (!sectionEvents.length) return null
    return (
      <View key={title} style={s.section}>
        <View style={s.sectionHeadRow}>
          <Ionicons name={icon} size={13} color={iconColor} />
          <Text style={[s.sectionTitle, { color: iconColor }]}>{title.toUpperCase()}</Text>
        </View>
        {sectionEvents.map(e => (
          <EventRow
            key={e.id}
            event={e}
            isFav={favourites.has(e.id)}
            onPress={() => router.push(`/(guest)/event/${e.id}`)}
            onFav={() => toggleFav(e.id)}
          />
        ))}
      </View>
    )
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Explore</Text>
          <Text style={s.headerSub}>Discover events near you</Text>
        </View>
        <View style={s.logoMark}>
          <Text style={s.logoLetter}>T</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search events, venues, organizers…"
            placeholderTextColor={colors.textMuted}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={() => setSearch(searchInput)}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchInput(''); setSearch('') }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category pills with emojis */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.pills}
        contentContainerStyle={s.pillsContent}
      >
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.slug}
            style={[s.pill, category === c.slug && s.pillActive]}
            onPress={() => setCategory(c.slug)}
            activeOpacity={0.7}
          >
            <Text style={s.pillEmoji}>{c.icon}</Text>
            <Text style={[s.pillText, category === c.slug && s.pillTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading
        ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={colors.blue} size="large" />
          </View>
        )
        : (
          <FlatList
            data={[]}
            keyExtractor={() => 'list'}
            renderItem={null}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={
              <View style={s.listContent}>

                {/* My Events strip */}
                {myUpcoming.length > 0 && (
                  <View style={s.myEventsSection}>
                    <View style={s.myEventsHeader}>
                      <Text style={s.myEventsTitle}>My Events</Text>
                      <TouchableOpacity onPress={() => router.push('/(guest)/tickets')}>
                        <Text style={s.myEventsSeeAll}>See All →</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.myEventsScroll}>
                      {myUpcoming.slice(0, 6).map(e => {
                        const ticket = myTickets.find(t => t.eventId === e.id)
                        const statusDot = ticket?.status === 'approved' || ticket?.status === 'confirmed' ? colors.success
                          : ticket?.status === 'pending' ? colors.warning
                          : ticket?.status === 'rejected' ? colors.error
                          : colors.indigo
                        const gradient = getEventGradient(e.id)
                        return (
                          <TouchableOpacity
                            key={e.id}
                            style={s.myEventCard}
                            onPress={() => router.push(`/(guest)/event/${e.id}`)}
                            activeOpacity={0.8}
                          >
                            {e.cover_image_url
                              ? <Image source={{ uri: e.cover_image_url }} style={s.myEventImg} />
                              : <LinearGradient colors={gradient as [string, string]} style={s.myEventImg} start={[0, 0]} end={[1, 1]} />
                            }
                            <View style={[s.myEventDot, { backgroundColor: statusDot }]} />
                            <View style={s.myEventInfo}>
                              <Text style={s.myEventTitle} numberOfLines={1}>{e.title}</Text>
                              <Text style={s.myEventDate}>{format(new Date(e.date_start), 'd MMM')}</Text>
                            </View>
                          </TouchableOpacity>
                        )
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Event groups */}
                {events.length === 0
                  ? (
                    <View style={s.emptyWrap}>
                      <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
                      <Text style={s.emptyTitle}>No events found</Text>
                      <Text style={s.emptyText}>Try a different category or search term</Text>
                    </View>
                  )
                  : <>
                    {renderSection('Today', 'flame-outline', '#FF6B35', today)}
                    {renderSection('This Week', 'flash-outline', colors.gold, thisWeek)}
                    {renderSection('Coming Up', 'star-outline', colors.indigo, comingUp)}
                  </>
                }
              </View>
            }
            ListFooterComponent={loadingMore
              ? <ActivityIndicator color={colors.blue} style={{ margin: 16 }} />
              : null
            }
          />
        )}
    </SafeAreaView>
  )
}

function EventRow({
  event, isFav, onPress, onFav,
}: {
  event: EventSummary
  isFav: boolean
  onPress: () => void
  onFav: () => void
}) {
  const d = new Date(event.date_start)
  const day = format(d, 'EEE').toUpperCase()
  const num = format(d, 'd')
  const mon = format(d, 'MMM').toUpperCase()
  const time = format(d, 'h:mm a')
  const price = event.ticket_price ? `Rs. ${event.ticket_price.toLocaleString()}` : 'Free'
  const gradient = getEventGradient(event.id)
  const regMode = event.registration_mode ? REG_MODE[event.registration_mode] : REG_MODE.open
  const catColor = event.event_categories?.color ?? colors.indigo

  return (
    <TouchableOpacity style={s.eventRow} onPress={onPress} activeOpacity={0.8}>
      {/* Date column */}
      <View style={s.dateCol}>
        <Text style={s.dateDay}>{day}</Text>
        <Text style={s.dateNum}>{num}</Text>
        <Text style={s.dateMon}>{mon}</Text>
      </View>

      {/* Thumbnail */}
      {event.cover_image_url
        ? <Image source={{ uri: event.cover_image_url }} style={s.thumb} />
        : (
          <LinearGradient colors={gradient as [string, string]} style={s.thumb} start={[0, 0]} end={[1, 1]}>
            <Text style={s.thumbInitial}>{event.title.charAt(0)}</Text>
          </LinearGradient>
        )
      }

      {/* Info */}
      <View style={s.eventInfo}>
        <Text style={s.eventTitle} numberOfLines={1}>{event.title}</Text>

        {/* Organizer in italic indigo */}
        {event.profiles?.full_name && (
          <Text style={s.eventOrganizer} numberOfLines={1}>{event.profiles.full_name}</Text>
        )}

        <View style={s.eventMeta}>
          <Ionicons name="time-outline" size={11} color={colors.textMuted} />
          <Text style={s.eventMetaText}>{time}</Text>
          {event.venue_city && (
            <>
              <Text style={s.eventMetaDot}>·</Text>
              <Ionicons name="location-outline" size={11} color={colors.textMuted} />
              <Text style={s.eventMetaText}>{event.venue_city}</Text>
            </>
          )}
        </View>

        <View style={s.eventFooter}>
          {/* Category badge */}
          {event.event_categories && (
            <View style={[s.catBadge, { backgroundColor: catColor + '22' }]}>
              <Text style={s.catIcon}>{event.event_categories.icon ?? ''}</Text>
              <Text style={[s.catBadgeText, { color: catColor }]}>{event.event_categories.name}</Text>
            </View>
          )}
          {/* Registration mode */}
          {regMode && (
            <View style={[s.modeBadge, { backgroundColor: regMode.bg }]}>
              <Text style={[s.modeBadgeText, { color: regMode.color }]}>{regMode.label}</Text>
            </View>
          )}
        </View>

        <Text style={s.priceText}>{price}</Text>
      </View>

      {/* Heart */}
      <TouchableOpacity onPress={onFav} style={s.heartBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons
          name={isFav ? 'heart' : 'heart-outline'}
          size={18}
          color={isFav ? colors.error : colors.textMuted}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold' },
  headerSub: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  logoMark: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center',
  },
  logoLetter: { color: colors.white, fontSize: 18, fontFamily: 'Poppins_700Bold' },

  searchRow: { paddingHorizontal: 16, marginBottom: 12 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: {
    flex: 1, color: colors.textPrimary, fontSize: 14,
    fontFamily: 'DMSans_400Regular',
  },

  pills: { flexGrow: 0, marginBottom: 8 },
  pillsContent: { paddingHorizontal: 16, gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.full,
  },
  pillActive: { backgroundColor: colors.blueSubtle, borderColor: colors.blueBorder },
  pillEmoji: { fontSize: 13 },
  pillText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_500Medium' },
  pillTextActive: { color: colors.blue },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listContent: { paddingBottom: 24 },

  // My Events strip
  myEventsSection: { marginBottom: 20 },
  myEventsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 10,
  },
  myEventsTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  myEventsSeeAll: { color: colors.blue, fontSize: 12, fontFamily: 'DMSans_500Medium' },
  myEventsScroll: { paddingHorizontal: 16, gap: 10 },
  myEventCard: {
    width: 120,
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  myEventImg: { width: '100%', height: 72, backgroundColor: colors.surface2 },
  myEventDot: {
    position: 'absolute', top: 6, right: 6,
    width: 9, height: 9, borderRadius: 5,
    borderWidth: 1.5, borderColor: colors.pageBg,
  },
  myEventInfo: { padding: 8 },
  myEventTitle: { color: colors.textPrimary, fontSize: 11, fontFamily: 'DMSans_500Medium' },
  myEventDate: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_400Regular', marginTop: 2 },

  // Event sections
  section: { marginBottom: 20 },
  sectionHeadRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 10, fontFamily: 'DMSans_500Medium', letterSpacing: 1.5,
  },

  eventRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: 12,
  },

  dateCol: { width: 36, alignItems: 'center' },
  dateDay: { color: colors.indigo, fontSize: 9, fontFamily: 'DMSans_500Medium', letterSpacing: 0.5 },
  dateNum: { color: colors.textPrimary, fontSize: 20, fontFamily: 'Poppins_700Bold', lineHeight: 24 },
  dateMon: { color: colors.textMuted, fontSize: 9, fontFamily: 'DMSans_500Medium', letterSpacing: 0.5 },

  thumb: {
    width: 68, height: 68, borderRadius: radius.md,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbInitial: { color: colors.white, fontSize: 22, fontFamily: 'Poppins_700Bold' },

  eventInfo: { flex: 1 },
  eventTitle: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium', marginBottom: 2 },
  eventOrganizer: { color: colors.indigo, fontSize: 11, fontFamily: 'DMSans_400Regular', fontStyle: 'italic', marginBottom: 4 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  eventMetaText: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },
  eventMetaDot: { color: colors.textMuted, fontSize: 11 },
  eventFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },

  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: radius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  catIcon: { fontSize: 10 },
  catBadgeText: { fontSize: 9, fontFamily: 'DMSans_500Medium', fontWeight: '600' },

  modeBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  modeBadgeText: { fontSize: 9, fontFamily: 'DMSans_500Medium', fontWeight: '700', letterSpacing: 0.3 },

  priceText: { color: colors.blue, fontSize: 12, fontFamily: 'DMSans_500Medium' },

  heartBtn: { padding: 4 },

  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  emptyText: { color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular' },
})

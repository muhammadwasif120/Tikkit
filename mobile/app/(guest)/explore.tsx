import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, ScrollView,
  RefreshControl, Dimensions,
} from 'react-native'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { format, isToday, isThisWeek } from 'date-fns'
import { getEvents, getTickets, EventSummary, addFavourite, removeFavourite } from '@/lib/api'
import { colors, radius, getEventGradient } from '@/theme'
import { LinearGradient } from 'expo-linear-gradient'
import * as SecureStore from 'expo-secure-store'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Skeleton } from '@/components/Skeleton'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_W = SCREEN_W - 32   // 16px margin each side

const CATEGORIES = [
  { label: 'All',           slug: '',                icon: '✨' },
  { label: 'Music',         slug: 'music',           icon: '🎵' },
  { label: 'Tech',          slug: 'tech',            icon: '💻' },
  { label: 'Art & Culture', slug: 'art-culture',     icon: '🎨' },
  { label: 'Sports',        slug: 'sports',          icon: '⚽' },
  { label: 'Food & Drink',  slug: 'food-drink',      icon: '🍔' },
  { label: 'Business',      slug: 'business',        icon: '💼' },
  { label: 'Fashion',       slug: 'fashion',         icon: '👗' },
  { label: 'Networking',    slug: 'networking',      icon: '🤝' },
  { label: 'Education',     slug: 'education',       icon: '📚' },
  { label: 'Gaming',        slug: 'gaming',          icon: '🎮' },
  { label: 'Health',        slug: 'health-wellness', icon: '💪' },
  { label: 'Comedy',        slug: 'comedy',          icon: '😂' },
  { label: 'Social',        slug: 'social',          icon: '🥳' },
  { label: 'Charity',       slug: 'charity',         icon: '❤️' },
]

const REG_MODE: Record<string, { label: string; color: string; bg: string }> = {
  open:                   { label: 'REGISTER',    color: colors.blue,      bg: colors.blueSubtle },
  expression_of_interest: { label: 'APPLY',       color: '#A855F7',        bg: 'rgba(168,85,247,0.15)' },
  invite_only:            { label: 'INVITE ONLY', color: colors.textMuted, bg: 'rgba(107,114,128,0.15)' },
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

/* ─── Main screen ─────────────────────────────────────────────────────────── */
export default function ExploreScreen() {
  const router = useRouter()
  const { user } = useAuth()
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

  // ── Seed pending interests from signup into the behaviour engine ──────────
  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const raw = await SecureStore.getItemAsync('pending_interests')
        if (!raw) return
        const slugs: string[] = JSON.parse(raw)
        if (!slugs.length) return

        // Look up category IDs from slugs
        const { data: cats } = await (supabase as any)
          .from('event_categories')
          .select('id, slug')
          .in('slug', slugs)

        if (!cats?.length) return

        // Seed a score for each selected category
        await Promise.all(
          (cats as { id: string; slug: string }[]).map(cat =>
            (supabase as any).rpc('upsert_category_score', {
              p_user_id: user.id,
              p_category_id: cat.id,
              p_delta: 3,        // 3pts per selected interest (same as organiser_visit weight)
            })
          )
        )

        // Done — clear so it never runs again
        await SecureStore.deleteItemAsync('pending_interests')
      } catch {
        /* silent — non-critical */
      }
    })()
  }, [user?.id])

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
    setFavourites(prev => {
      const next = new Set(prev)
      isFav ? next.delete(eventId) : next.add(eventId)
      return next
    })
    try {
      if (isFav) await removeFavourite('event', eventId)
      else await addFavourite('event', eventId)
    } catch {
      setFavourites(prev => {
        const next = new Set(prev)
        isFav ? next.add(eventId) : next.delete(eventId)
        return next
      })
    }
  }

  // My events: upcoming only (exclude cancelled/rejected)
  const myUpcoming = myTickets
    .filter(t => t.status !== 'cancelled' && t.status !== 'rejected')
    .map(t => events.find(e => e.id === t.eventId))
    .filter(Boolean) as EventSummary[]

  // Featured = first 5 events from the list (preferably with cover images)
  const withImage = events.filter(e => e.cover_image_url)
  const featured = (withImage.length >= 3 ? withImage : events).slice(0, 5)

  const { today, thisWeek, comingUp } = groupEvents(events)

  const renderSection = (
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    iconColor: string,
    sectionEvents: EventSummary[],
  ) => {
    if (!sectionEvents.length) return null
    return (
      <View key={title} style={s.section}>
        <View style={s.sectionHeadRow}>
          <Ionicons name={icon} size={14} color={iconColor} />
          <Text style={[s.sectionTitle, { color: iconColor }]}>{title.toUpperCase()}</Text>
        </View>
        {sectionEvents.map(e => (
          <EventCard
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

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Explore</Text>
          <Text style={s.headerSub}>Discover events near you</Text>
        </View>
        <View style={s.logoMark}>
          <Text style={s.logoLetter}>T</Text>
        </View>
      </View>

      {/* ── Search ── */}
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

      {/* ── Category pills ── */}
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

      {loading ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {/* Carousel skeleton */}
          <Skeleton height={200} borderRadius={16} style={{ marginBottom: 20 }} />
          {/* Event card skeletons */}
          {[0, 1, 2].map(i => (
            <View key={i} style={{ marginBottom: 14 }}>
              <Skeleton height={180} borderRadius={12} style={{ marginBottom: 8 }} />
              <Skeleton width="70%" height={16} style={{ marginBottom: 6 }} />
              <Skeleton width="45%" height={13} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          renderItem={() => null}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <View style={s.listContent}>

              {/* ── Hero Carousel ── */}
              {featured.length > 0 && !search && !category && (
                <FeaturedCarousel
                  events={featured}
                  favourites={favourites}
                  onPress={id => router.push(`/(guest)/event/${id}`)}
                  onFav={toggleFav}
                />
              )}

              {/* ── My Events strip ── */}
              {myUpcoming.length > 0 && (
                <View style={s.mySection}>
                  <View style={s.mySectionHeader}>
                    <View style={s.mySectionTitleRow}>
                      <Ionicons name="ticket-outline" size={14} color={colors.blue} />
                      <Text style={s.mySectionTitle}>My Events</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(guest)/registrations')}>
                      <Text style={s.mySeeAll}>View All →</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.myScroll}
                  >
                    {myUpcoming.slice(0, 6).map(e => {
                      const ticket = myTickets.find(t => t.eventId === e.id)
                      const statusConfig = ticket?.status === 'approved' || ticket?.status === 'confirmed'
                        ? { color: colors.success, label: 'Confirmed' }
                        : ticket?.status === 'pending'
                        ? { color: colors.warning, label: 'Pending' }
                        : ticket?.status === 'rejected'
                        ? { color: colors.error, label: 'Rejected' }
                        : { color: colors.indigo, label: 'Applied' }
                      const gradient = getEventGradient(e.id)

                      return (
                        <TouchableOpacity
                          key={e.id}
                          style={s.myCard}
                          onPress={() => router.push(`/(guest)/event/${e.id}`)}
                          activeOpacity={0.85}
                        >
                          {e.cover_image_url
                            ? <Image source={{ uri: e.cover_image_url }} style={s.myCardImg} />
                            : <LinearGradient colors={gradient as [string, string]} style={s.myCardImg} start={[0, 0]} end={[1, 1]} />
                          }
                          {/* Status pill */}
                          <View style={[s.myStatusPill, { backgroundColor: statusConfig.color + '22', borderColor: statusConfig.color + '44' }]}>
                            <View style={[s.myStatusDot, { backgroundColor: statusConfig.color }]} />
                            <Text style={[s.myStatusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                          </View>
                          <View style={s.myCardInfo}>
                            <Text style={s.myCardTitle} numberOfLines={2}>{e.title}</Text>
                            <Text style={s.myCardDate}>{format(new Date(e.date_start), 'd MMM · h:mm a')}</Text>
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                </View>
              )}

              {/* ── Event sections ── */}
              {events.length === 0 ? (
                <View style={s.emptyWrap}>
                  <View style={s.emptyIcon}>
                    <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
                  </View>
                  <Text style={s.emptyTitle}>No events found</Text>
                  <Text style={s.emptyText}>Try a different category or search term</Text>
                </View>
              ) : (
                <>
                  {renderSection('Today', 'flame-outline', '#FF6B35', today)}
                  {renderSection('This Week', 'flash-outline', colors.gold, thisWeek)}
                  {renderSection('Coming Up', 'star-outline', colors.indigo, comingUp)}
                </>
              )}
            </View>
          }
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator color={colors.blue} style={{ margin: 20 }} />
              : null
          }
        />
      )}
    </SafeAreaView>
  )
}

/* ─── Featured Carousel ───────────────────────────────────────────────────── */
function FeaturedCarousel({
  events,
  favourites,
  onPress,
  onFav,
}: {
  events: EventSummary[]
  favourites: Set<string>
  onPress: (id: string) => void
  onFav: (id: string) => void
}) {
  const [dotPage, setDotPage] = useState(0)
  const listRef = useRef<FlatList>(null)
  const pageRef = useRef(0)

  useEffect(() => {
    if (events.length <= 1) return
    const timer = setInterval(() => {
      const next = (pageRef.current + 1) % events.length
      listRef.current?.scrollToOffset({ offset: next * SCREEN_W, animated: true })
      pageRef.current = next
      setDotPage(next)
    }, 4500)
    return () => clearInterval(timer)
  }, [events.length])

  return (
    <View style={s.carousel}>
      <FlatList
        ref={listRef}
        data={events}
        keyExtractor={e => e.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={({ nativeEvent }) => {
          const idx = Math.round(nativeEvent.contentOffset.x / SCREEN_W)
          if (idx !== pageRef.current) {
            pageRef.current = idx
            setDotPage(idx)
          }
        }}
        renderItem={({ item: e }) => {
          const gradient = getEventGradient(e.id)
          const isFav = favourites.has(e.id)
          const regMode = e.registration_mode ? REG_MODE[e.registration_mode] : REG_MODE.open
          const price = e.ticket_price ? `Rs. ${e.ticket_price.toLocaleString()}` : 'Free'
          const dateStr = format(new Date(e.date_start), 'EEE d MMM · h:mm a')
          const catColor = e.event_categories?.color ?? colors.indigo

          return (
            <TouchableOpacity
              style={s.carouselSlide}
              onPress={() => onPress(e.id)}
              activeOpacity={0.97}
            >
              {/* Background image / gradient */}
              {e.cover_image_url
                ? <Image source={{ uri: e.cover_image_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                : <LinearGradient colors={gradient as [string, string]} style={StyleSheet.absoluteFillObject} start={[0, 0]} end={[1, 1]} />
              }

              {/* Scrim — top to bottom */}
              <LinearGradient
                colors={['rgba(8,10,16,0.15)', 'rgba(8,10,16,0.9)']}
                style={StyleSheet.absoluteFillObject}
                start={[0, 0]} end={[0, 1]}
              />

              {/* Heart */}
              <TouchableOpacity
                style={s.carouselHeart}
                onPress={() => onFav(e.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFav ? colors.error : 'rgba(255,255,255,0.9)'}
                />
              </TouchableOpacity>

              {/* Bottom content */}
              <View style={s.carouselContent}>
                {/* Category + reg mode badges */}
                <View style={s.carouselBadgeRow}>
                  {e.event_categories && (
                    <View style={[s.carouselCatBadge, { backgroundColor: catColor + '25' }]}>
                      <Text style={s.carouselCatEmoji}>{e.event_categories.icon ?? ''}</Text>
                      <Text style={[s.carouselCatText, { color: catColor }]}>{e.event_categories.name}</Text>
                    </View>
                  )}
                  <View style={[s.carouselModeBadge, { backgroundColor: regMode.bg }]}>
                    <Text style={[s.carouselModeText, { color: regMode.color }]}>{regMode.label}</Text>
                  </View>
                </View>

                <Text style={s.carouselTitle} numberOfLines={2}>{e.title}</Text>

                {e.profiles?.full_name && (
                  <Text style={s.carouselOrg}>by {e.profiles.full_name}</Text>
                )}

                <View style={s.carouselMeta}>
                  <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.55)" />
                  <Text style={s.carouselDate}>{dateStr}</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={[s.carouselPrice, { color: e.ticket_price ? colors.gold : colors.success }]}>
                    {price}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )
        }}
      />

      {/* Pagination dots */}
      {events.length > 1 && (
        <View style={s.dots}>
          {events.map((_, i) => (
            <View key={i} style={[s.dot, i === dotPage && s.dotActive]} />
          ))}
        </View>
      )}
    </View>
  )
}

/* ─── Event Card ──────────────────────────────────────────────────────────── */
function EventCard({
  event, isFav, onPress, onFav,
}: {
  event: EventSummary
  isFav: boolean
  onPress: () => void
  onFav: () => void
}) {
  const d = new Date(event.date_start)
  const dateStr = format(d, 'EEE d MMM')
  const timeStr = format(d, 'h:mm a')
  const price = event.ticket_price ? `Rs. ${event.ticket_price.toLocaleString()}` : 'Free'
  const gradient = getEventGradient(event.id)
  const regMode = event.registration_mode ? REG_MODE[event.registration_mode] : REG_MODE.open
  const catColor = event.event_categories?.color ?? colors.indigo

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}>
      {/* ── Image area ── */}
      <View style={s.cardImgWrap}>
        {event.cover_image_url
          ? <Image source={{ uri: event.cover_image_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          : (
            <LinearGradient
              colors={gradient as [string, string]}
              style={StyleSheet.absoluteFillObject}
              start={[0, 0]} end={[1, 1]}
            >
              <View style={s.cardImgPlaceholder}>
                <Text style={s.cardImgInitial}>{event.title.charAt(0)}</Text>
              </View>
            </LinearGradient>
          )
        }

        {/* Gradient scrim — bottom heavy */}
        <LinearGradient
          colors={['transparent', 'rgba(8,10,16,0.98)']}
          style={StyleSheet.absoluteFillObject}
          start={[0, 0.25]} end={[0, 1]}
        />

        {/* Top-left: category badge */}
        <View style={s.cardTopLeft}>
          {event.event_categories && (
            <View style={[s.cardCatBadge, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
              <Text style={s.cardCatEmoji}>{event.event_categories.icon ?? ''}</Text>
              <Text style={[s.cardCatText, { color: catColor }]}>{event.event_categories.name}</Text>
            </View>
          )}
        </View>

        {/* Top-right: heart + reg mode */}
        <View style={s.cardTopRight}>
          <TouchableOpacity
            style={s.cardHeart}
            onPress={onFav}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={18}
              color={isFav ? colors.error : 'rgba(255,255,255,0.85)'}
            />
          </TouchableOpacity>
          {regMode && (
            <View style={[s.cardModeBadge, { backgroundColor: regMode.bg }]}>
              <Text style={[s.cardModeText, { color: regMode.color }]}>{regMode.label}</Text>
            </View>
          )}
        </View>

        {/* Bottom info — overlaid on gradient */}
        <View style={s.cardInfo}>
          <Text style={s.cardTitle} numberOfLines={2}>{event.title}</Text>

          {event.profiles?.full_name && (
            <Text style={s.cardOrganizer} numberOfLines={1}>
              by {event.profiles.full_name}
            </Text>
          )}

          <View style={s.cardMetaRow}>
            <View style={s.cardMetaLeft}>
              <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.5)" />
              <Text style={s.cardMetaText}>{dateStr}</Text>
              <Text style={s.cardMetaDot}>·</Text>
              <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.5)" />
              <Text style={s.cardMetaText}>{timeStr}</Text>
              {event.venue_city && (
                <>
                  <Text style={s.cardMetaDot}>·</Text>
                  <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.5)" />
                  <Text style={s.cardMetaText}>{event.venue_city}</Text>
                </>
              )}
            </View>
            <Text style={[s.cardPrice, { color: event.ticket_price ? colors.blue : colors.success }]}>
              {price}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  // Header
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

  // Search
  searchRow: { paddingHorizontal: 16, marginBottom: 10 },
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

  // Category pills
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
  listContent: { paddingBottom: 32 },

  // ── Carousel ────────────────────────────────────────────────────────────────
  carousel: { marginBottom: 24 },
  carouselSlide: {
    width: SCREEN_W, height: 260,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  carouselHeart: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20, width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  carouselContent: {
    paddingHorizontal: 18, paddingBottom: 18, gap: 3,
  },
  carouselBadgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6,
  },
  carouselCatBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  carouselCatEmoji: { fontSize: 10 },
  carouselCatText: { fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '600' },
  carouselModeBadge: {
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  carouselModeText: { fontSize: 9, fontFamily: 'DMSans_500Medium', fontWeight: '700', letterSpacing: 0.5 },
  carouselTitle: {
    color: colors.white, fontSize: 22, fontFamily: 'Poppins_700Bold',
    lineHeight: 28, letterSpacing: -0.3,
  },
  carouselOrg: {
    color: 'rgba(255,255,255,0.6)', fontSize: 12,
    fontFamily: 'DMSans_400Regular', fontStyle: 'italic', marginBottom: 4,
  },
  carouselMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2,
  },
  carouselDate: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'DMSans_400Regular' },
  carouselPrice: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  // Dots
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, paddingTop: 10 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.surface3 },
  dotActive: { width: 20, height: 5, borderRadius: 3, backgroundColor: colors.blue },

  // ── My Events strip ─────────────────────────────────────────────────────────
  mySection: { marginBottom: 24 },
  mySectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 12,
  },
  mySectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mySectionTitle: {
    color: colors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold',
  },
  mySeeAll: { color: colors.blue, fontSize: 12, fontFamily: 'DMSans_500Medium' },
  myScroll: { paddingHorizontal: 16, gap: 10 },

  myCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  myCardImg: {
    width: '100%', height: 88,
    backgroundColor: colors.surface2,
  },
  myStatusPill: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1,
  },
  myStatusDot: { width: 5, height: 5, borderRadius: 3 },
  myStatusText: { fontSize: 9, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  myCardInfo: { padding: 10 },
  myCardTitle: {
    color: colors.textPrimary, fontSize: 11, fontFamily: 'DMSans_500Medium',
    lineHeight: 15, marginBottom: 3,
  },
  myCardDate: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_400Regular' },

  // ── Event sections ───────────────────────────────────────────────────────────
  section: { marginBottom: 24 },
  sectionHeadRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, marginBottom: 10,
  },
  sectionTitle: { fontSize: 10, fontFamily: 'DMSans_500Medium', letterSpacing: 1.5 },

  // ── Event Card ───────────────────────────────────────────────────────────────
  card: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardImgWrap: {
    width: CARD_W, height: 200,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  cardImgPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  cardImgInitial: { color: 'rgba(255,255,255,0.7)', fontSize: 56, fontFamily: 'Poppins_700Bold' },

  cardTopLeft: {
    position: 'absolute', top: 12, left: 12,
  },
  cardCatBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  cardCatEmoji: { fontSize: 10 },
  cardCatText: { fontSize: 9, fontFamily: 'DMSans_500Medium', fontWeight: '600' },

  cardTopRight: {
    position: 'absolute', top: 10, right: 10,
    alignItems: 'flex-end', gap: 6,
  },
  cardHeart: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16, width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  cardModeBadge: {
    borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2,
  },
  cardModeText: { fontSize: 9, fontFamily: 'DMSans_500Medium', fontWeight: '700', letterSpacing: 0.3 },

  cardInfo: {
    padding: 14, gap: 3,
  },
  cardTitle: {
    color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold', lineHeight: 21,
  },
  cardOrganizer: {
    color: 'rgba(255,255,255,0.5)', fontSize: 11,
    fontFamily: 'DMSans_400Regular', fontStyle: 'italic', marginBottom: 4,
  },
  cardMetaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 2,
  },
  cardMetaLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1, flexWrap: 'wrap',
  },
  cardMetaText: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'DMSans_400Regular' },
  cardMetaDot: { color: 'rgba(255,255,255,0.25)', fontSize: 11 },
  cardPrice: { fontSize: 13, fontFamily: 'DMSans_500Medium', fontWeight: '700', marginLeft: 8 },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 80, paddingBottom: 40, gap: 12 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  emptyText: { color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular' },
})

import {
  View, Text, StyleSheet, ScrollView, Image,
  RefreshControl, TouchableOpacity,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { format } from 'date-fns'
import { getOrganizerStats, getOrganizerEvents, OrganizerEvent, OrganizerStats } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { colors, radius, getEventGradient } from '@/theme'
import { Skeleton } from '@/components/Skeleton'

export default function OrganizerDashboard() {
  const { profile } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<OrganizerStats | null>(null)
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        getOrganizerStats(),
        getOrganizerEvents(),
      ])
      setStats(statsRes.stats)
      setEvents(eventsRes.events)
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

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Organizer'

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Premium Hero ── */}
        <LinearGradient
          colors={['#0D1F3C', '#080D1A', colors.pageBg]}
          start={[0, 0]} end={[0, 1]}
          style={s.hero}
        >
          <View style={s.heroGlow} pointerEvents="none" />
          <View style={s.heroContent}>
            <View style={{ flex: 1 }}>
              <Text style={s.heroEyebrow}>TIKKIT ORGANIZER</Text>
              <Text style={s.heroTitle}>Hey, {firstName} 👋</Text>
              <Text style={s.heroSub}>
                {loading
                  ? 'Loading your dashboard…'
                  : `${stats?.totalEvents ?? 0} event${(stats?.totalEvents ?? 0) !== 1 ? 's' : ''} · ${stats?.totalGuests ?? 0} guests total`
                }
              </Text>
            </View>
            <View style={s.heroAvatar}>
              <Text style={s.heroAvatarText}>{firstName.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Pending Approvals Banner ── */}
        {!loading && stats && stats.pendingApprovals > 0 && (
          <TouchableOpacity
            style={s.pendingBanner}
            onPress={() => router.push('/(organizer)/approvals')}
            activeOpacity={0.8}
          >
            <View style={s.pendingPulse} />
            <Text style={s.pendingText}>
              {stats.pendingApprovals} registration{stats.pendingApprovals !== 1 ? 's' : ''} awaiting review
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.warning} />
          </TouchableOpacity>
        )}

        {/* ── Stats Grid ── */}
        {loading ? (
          <View style={s.statsGrid}>
            <View style={s.statsRow}>
              <View style={{ flex: 1 }}><Skeleton height={90} style={{ borderRadius: radius.lg }} /></View>
              <View style={{ flex: 1 }}><Skeleton height={90} style={{ borderRadius: radius.lg }} /></View>
            </View>
            <View style={s.statsRow}>
              <View style={{ flex: 1 }}><Skeleton height={90} style={{ borderRadius: radius.lg }} /></View>
              <View style={{ flex: 1 }}><Skeleton height={90} style={{ borderRadius: radius.lg }} /></View>
            </View>
          </View>
        ) : (
          <View style={s.statsGrid}>
            <View style={s.statsRow}>
              <PremiumStatCard label="Total Events"  value={stats?.totalEvents ?? 0}        icon="calendar-outline"          color={colors.blue}    />
              <PremiumStatCard label="Total Guests"  value={stats?.totalGuests ?? 0}         icon="people-outline"            color={colors.success} />
            </View>
            <View style={s.statsRow}>
              <PremiumStatCard
                label="Pending"
                value={stats?.pendingApprovals ?? 0}
                icon="time-outline"
                color={stats?.pendingApprovals ? colors.warning : colors.textMuted}
                onPress={stats?.pendingApprovals ? () => router.push('/(organizer)/approvals') : undefined}
              />
              <PremiumStatCard label="Checked In"   value={stats?.checkedInToday ?? 0}      icon="checkmark-circle-outline"  color={colors.indigo}  />
            </View>
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { marginBottom: 12 }]}>Quick Actions</Text>
          <View style={s.quickGrid}>
            <QuickAction icon="time-outline"                label="Approvals"  color={colors.warning}       badge={stats?.pendingApprovals} onPress={() => router.push('/(organizer)/approvals')} />
            <QuickAction icon="terminal-outline"            label="Command"    color={colors.indigo}                                         onPress={() => router.push('/(organizer)/command')} />
            <QuickAction icon="qr-code-outline"             label="Scanner"    color={colors.success}                                        onPress={() => router.push('/(organizer)/scan')} />
            <QuickAction icon="bar-chart-outline"           label="Analytics"  color={colors.blue}                                           onPress={() => router.push('/(organizer)/analytics')} />
            <QuickAction icon="business-outline"            label="Vendors"    color={colors.gold}                                           onPress={() => router.push('/(organizer)/vendors')} />
            <QuickAction icon="shield-checkmark-outline"    label="Verify"     color={colors.success}                                        onPress={() => router.push('/(organizer)/verify')} />
            <QuickAction icon="chatbubble-ellipses-outline" label="Support"    color={colors.indigo}                                         onPress={() => router.push('/(organizer)/messages')} />
            <QuickAction icon="person-outline"              label="Profile"    color={colors.textSecondary}                                  onPress={() => router.push('/(organizer)/profile')} />
          </View>
        </View>

        {/* ── Recent Events ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent Events</Text>
            <TouchableOpacity onPress={() => router.push('/(organizer)/events')}>
              <Text style={s.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <>
              <Skeleton height={120} style={{ borderRadius: radius.lg, marginBottom: 10 }} />
              <Skeleton height={120} style={{ borderRadius: radius.lg, marginBottom: 10 }} />
              <Skeleton height={120} style={{ borderRadius: radius.lg }} />
            </>
          ) : events.length === 0 ? (
            <View style={s.empty}>
              <LinearGradient
                colors={[colors.blue + '25', 'transparent']}
                style={s.emptyIconCircle}
              >
                <Ionicons name="calendar-outline" size={28} color={colors.blue} />
              </LinearGradient>
              <Text style={s.emptyTitle}>No events yet</Text>
              <Text style={s.emptyBody}>Create your first event to start accepting registrations</Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => router.push('/(organizer)/events/new')}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={16} color={colors.white} />
                <Text style={s.emptyBtnText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            events.slice(0, 5).map(event => (
              <DashboardEventCard
                key={event.id}
                event={event}
                onPress={() => router.push(`/(organizer)/events/${event.id}`)}
              />
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

/* ─── Premium Stat Card ──────────────────────────────────────────────────── */
function PremiumStatCard({
  label, value, icon, color, onPress,
}: {
  label: string; value: number; icon: keyof typeof Ionicons.glyphMap
  color: string; onPress?: () => void
}) {
  return (
    <TouchableOpacity
      style={{ flex: 1 }}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <LinearGradient
        colors={[color + '22', color + '0A', 'transparent'] as [string, string, string]}
        start={[0, 0]} end={[1.4, 1.4]}
        style={s.statCard}
      >
        <View style={s.statCardTop}>
          <View style={[s.statIcon, { backgroundColor: color + '22' }]}>
            <Ionicons name={icon} size={15} color={color} />
          </View>
          {onPress && value > 0 && (
            <Ionicons name="chevron-forward" size={13} color={color + '90'} />
          )}
        </View>
        <Text style={[s.statValue, { color }]}>
          {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
        </Text>
        <Text style={s.statLabel}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  )
}

/* ─── Dashboard Event Card ───────────────────────────────────────────────── */
function DashboardEventCard({ event, onPress }: { event: OrganizerEvent; onPress: () => void }) {
  const gradient = getEventGradient(event.id)
  const statusColor = event.status === 'published' ? colors.success
    : event.status === 'draft' ? colors.warning
    : colors.textMuted

  return (
    <TouchableOpacity style={s.eventCard} onPress={onPress} activeOpacity={0.8}>
      {/* Cover image or gradient placeholder */}
      {event.cover_image_url
        ? <Image source={{ uri: event.cover_image_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        : (
          <LinearGradient
            colors={gradient as [string, string]}
            style={[StyleSheet.absoluteFillObject, s.eventImgCenter]}
            start={[0, 0]} end={[1, 1]}
          >
            <Text style={s.eventImgInitial}>{event.title.charAt(0)}</Text>
          </LinearGradient>
        )
      }
      {/* Gradient scrim */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={StyleSheet.absoluteFillObject}
        start={[0, 0]} end={[0, 1]}
      />
      {/* Status badge */}
      <View style={[s.eventStatusBadge, { borderColor: statusColor + '55' }]}>
        {event.status === 'published' && <View style={[s.liveDot, { backgroundColor: statusColor }]} />}
        <Text style={[s.eventStatusText, { color: statusColor }]}>
          {event.status === 'published' ? 'Live' : event.status === 'draft' ? 'Draft' : event.status}
        </Text>
      </View>
      {/* Content overlay */}
      <View style={s.eventOverlay}>
        <Text style={s.eventTitle} numberOfLines={1}>{event.title}</Text>
        <View style={s.eventMetaRow}>
          <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.55)" />
          <Text style={s.eventMetaText}>{format(new Date(event.date_start), 'd MMM yyyy')}</Text>
          {event.venue_city ? (
            <>
              <Text style={s.eventMetaDot}>·</Text>
              <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.55)" />
              <Text style={s.eventMetaText}>{event.venue_city}</Text>
            </>
          ) : null}
          <Text style={s.eventMetaDot}>·</Text>
          <Ionicons name="people-outline" size={11} color="rgba(255,255,255,0.55)" />
          <Text style={s.eventMetaText}>{event.registration_count} regs</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

/* ─── Quick Action ───────────────────────────────────────────────────────── */
function QuickAction({
  icon, label, color, onPress, badge,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; color: string
  onPress: () => void; badge?: number
}) {
  return (
    <TouchableOpacity style={s.quickCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.quickIcon, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={20} color={color} />
        {badge ? (
          <View style={[s.quickBadge, { backgroundColor: color }]}>
            <Text style={s.quickBadgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={s.quickLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  // Hero
  hero: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 26, overflow: 'hidden' },
  heroGlow: {
    position: 'absolute', top: -60, left: -40,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: colors.blue + '18',
  },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroEyebrow: {
    color: colors.blue + 'BB', fontSize: 10, fontFamily: 'DMSans_500Medium',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6,
  },
  heroTitle: { color: colors.textPrimary, fontSize: 24, fontFamily: 'Poppins_700Bold', lineHeight: 30 },
  heroSub: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 4 },
  heroAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.blue + '30',
    borderWidth: 2, borderColor: colors.blue + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  heroAvatarText: { color: colors.blue, fontSize: 20, fontFamily: 'Poppins_700Bold' },

  // Pending banner
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.warningSubtle,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.warning + '33',
    marginHorizontal: 16, marginTop: 12,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  pendingPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning },
  pendingText: { color: colors.warning, fontSize: 13, fontFamily: 'DMSans_500Medium', flex: 1 },

  // Stats grid
  statsGrid: { paddingHorizontal: 16, paddingTop: 20, gap: 10, marginBottom: 4 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14, gap: 2,
  },
  statCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  statIcon: { width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 28, fontFamily: 'Poppins_700Bold', lineHeight: 34 },
  statLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 2 },

  // Section layout
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  seeAll: { color: colors.blue, fontSize: 13, fontFamily: 'DMSans_500Medium' },

  // Quick actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    width: '22%', flexGrow: 1,
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 12, alignItems: 'center', gap: 6,
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  quickBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  quickBadgeText: { color: colors.white, fontSize: 9, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  quickLabel: { color: colors.textSecondary, fontSize: 11, fontFamily: 'DMSans_500Medium' },

  // Event cards
  eventCard: {
    height: 120, borderRadius: radius.lg, overflow: 'hidden',
    backgroundColor: colors.surface2,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 10,
  },
  eventImgCenter: { alignItems: 'center', justifyContent: 'center' },
  eventImgInitial: { color: 'rgba(255,255,255,0.55)', fontSize: 38, fontFamily: 'Poppins_700Bold' },
  eventStatusBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.full, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  eventStatusText: { fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '600' },
  eventOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  eventTitle: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  eventMetaText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'DMSans_400Regular' },
  eventMetaDot: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },

  // Empty state
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
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

import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  RefreshControl, TouchableOpacity,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { getOrganizerStats, getOrganizerEvents, OrganizerEvent, OrganizerStats } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { colors, radius, getEventGradient } from '@/theme'
import { StatCard } from '@/components/ui'

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
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Hey, {profile?.full_name?.split(' ')[0] ?? 'Organizer'} 👋</Text>
            <Text style={s.greetingSub}>Here's what's happening across your events</Text>
          </View>
          <View style={s.logoMark}>
            <Text style={s.logoLetter}>T</Text>
          </View>
        </View>

        {/* Pending approvals banner (if any) */}
        {stats && stats.pendingApprovals > 0 && (
          <TouchableOpacity
            style={s.pendingBanner}
            onPress={() => router.push('/(organizer)/approvals')}
            activeOpacity={0.8}
          >
            <View style={s.pendingBannerDot} />
            <Text style={s.pendingBannerText}>
              {stats.pendingApprovals} registration{stats.pendingApprovals !== 1 ? 's' : ''} awaiting your review
            </Text>
            <Ionicons name="chevron-forward" size={15} color={colors.warning} />
          </TouchableOpacity>
        )}

        {/* Stats grid — matches web: Total Events, Total Guests, Pending Approvals, Checked In Today */}
        <View style={s.statsGrid}>
          <View style={s.statsRow}>
            <StatCard
              label="Total Events"
              value={stats?.totalEvents ?? 0}
              icon="calendar-outline"
              accentColor={colors.blue}
            />
            <StatCard
              label="Total Guests"
              value={stats?.totalGuests ?? 0}
              icon="people-outline"
              accentColor={colors.success}
            />
          </View>
          <View style={s.statsRow}>
            <StatCard
              label="Pending Approvals"
              value={stats?.pendingApprovals ?? 0}
              icon="time-outline"
              accentColor={colors.warning}
            />
            <StatCard
              label="Checked In Today"
              value={stats?.checkedInToday ?? 0}
              icon="checkmark-circle-outline"
              accentColor={colors.indigo}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.quickGrid}>
            <QuickAction
              icon="time-outline"
              label="Approvals"
              color={colors.warning}
              badge={stats?.pendingApprovals ?? 0}
              onPress={() => router.push('/(organizer)/approvals')}
            />
            <QuickAction
              icon="terminal-outline"
              label="Command"
              color={colors.indigo}
              onPress={() => router.push('/(organizer)/command')}
            />
            <QuickAction
              icon="qr-code-outline"
              label="Scanner"
              color={colors.success}
              onPress={() => router.push('/(organizer)/scan')}
            />
            <QuickAction
              icon="bar-chart-outline"
              label="Analytics"
              color={colors.blue}
              onPress={() => router.push('/(organizer)/analytics')}
            />
            <QuickAction
              icon="business-outline"
              label="Vendors"
              color={colors.gold}
              onPress={() => router.push('/(organizer)/vendors')}
            />
            <QuickAction
              icon="shield-checkmark-outline"
              label="Verify"
              color={colors.success}
              onPress={() => router.push('/(organizer)/verify')}
            />
            <QuickAction
              icon="chatbubble-ellipses-outline"
              label="Support"
              color={colors.indigo}
              onPress={() => router.push('/(organizer)/messages')}
            />
            <QuickAction
              icon="person-outline"
              label="Profile"
              color={colors.textSecondary}
              onPress={() => router.push('/(organizer)/profile')}
            />
          </View>
        </View>

        {/* Recent / Upcoming Events */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent Events</Text>
            <TouchableOpacity onPress={() => router.push('/(organizer)/events')}>
              <Text style={s.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {events.length === 0
            ? (
              <View style={s.empty}>
                <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
                <Text style={s.emptyText}>No events yet</Text>
              </View>
            )
            : events.slice(0, 6).map(event => (
              <TouchableOpacity
                key={event.id}
                style={s.eventRow}
                onPress={() => router.push(`/(organizer)/events/${event.id}`)}
                activeOpacity={0.8}
              >
                <View style={[s.eventColorBar, { backgroundColor: getEventGradient(event.id)[0] }]} />
                <View style={s.eventInfo}>
                  <Text style={s.eventTitle} numberOfLines={1}>{event.title}</Text>
                  <Text style={s.eventMeta}>
                    {format(new Date(event.date_start), 'd MMM yyyy')}
                    {event.venue_city ? ` · ${event.venue_city}` : ''}
                  </Text>
                </View>
                <View style={s.eventRight}>
                  <Text style={s.eventRegs}>{event.registration_count}</Text>
                  <Text style={s.eventRegsLabel}>regs</Text>
                </View>
                <View style={[s.statusDot, {
                  backgroundColor: event.status === 'published' ? colors.success
                    : event.status === 'draft' ? colors.warning
                    : colors.textMuted,
                }]} />
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function QuickAction({
  icon, label, color, onPress, badge,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  color: string
  onPress: () => void
  badge?: number
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  centered: { flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  greeting: { color: colors.textPrimary, fontSize: 22, fontFamily: 'Poppins_700Bold' },
  greetingSub: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  logoMark: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center',
  },
  logoLetter: { color: colors.white, fontSize: 18, fontFamily: 'Poppins_700Bold' },

  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.warningSubtle,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.warning + '44',
    marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  pendingBannerDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning,
  },
  pendingBannerText: { color: colors.warning, fontSize: 13, fontFamily: 'DMSans_500Medium', flex: 1 },

  statsGrid: { paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10 },

  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  seeAll: { color: colors.blue, fontSize: 13, fontFamily: 'DMSans_500Medium' },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    width: '22%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 12, alignItems: 'center', gap: 6,
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  quickBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  quickBadgeText: { color: colors.white, fontSize: 9, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  quickLabel: { color: colors.textSecondary, fontSize: 11, fontFamily: 'DMSans_500Medium' },

  eventRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    marginBottom: 8, overflow: 'hidden',
  },
  eventColorBar: { width: 4, alignSelf: 'stretch', minHeight: 60 },
  eventInfo: { flex: 1, paddingVertical: 12, paddingRight: 4 },
  eventTitle: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  eventMeta: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  eventRight: { alignItems: 'center', paddingHorizontal: 4 },
  eventRegs: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  eventRegsLabel: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_400Regular' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: colors.textMuted, fontSize: 15, fontFamily: 'DMSans_400Regular' },
})

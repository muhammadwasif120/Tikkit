import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { format } from 'date-fns'
import { getOrganizerAnalytics, OrganizerAnalytics, AnalyticsEvent } from '@/lib/api'
import { colors, radius } from '@/theme'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'

function fmt(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function fmtPKR(n: number) {
  if (n >= 1000000) return `PKR ${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `PKR ${(n / 1000).toFixed(0)}K`
  return `PKR ${n.toLocaleString()}`
}

function AnalyticsSkeleton() {
  return (
    <>
      <View style={s.summaryGrid}>
        <View style={{ width: '47.5%' }}><Skeleton height={100} style={{ borderRadius: radius.lg }} /></View>
        <View style={{ width: '47.5%' }}><Skeleton height={100} style={{ borderRadius: radius.lg }} /></View>
        <View style={{ width: '47.5%' }}><Skeleton height={100} style={{ borderRadius: radius.lg }} /></View>
        <View style={{ width: '47.5%' }}><Skeleton height={100} style={{ borderRadius: radius.lg }} /></View>
      </View>
      <View style={{ paddingHorizontal: 16, gap: 10, marginTop: 16 }}>
        <Skeleton height={100} style={{ borderRadius: radius.lg }} />
        <Skeleton height={100} style={{ borderRadius: radius.lg }} />
        <Skeleton height={100} style={{ borderRadius: radius.lg }} />
      </View>
    </>
  )
}

export default function AnalyticsScreen() {
  const router = useRouter()
  const toast = useToast()
  const [data, setData] = useState<OrganizerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const { analytics } = await getOrganizerAnalytics()
      setData(analytics)
    } catch (e: any) {
      toast.show({ type: 'error', message: e?.message || 'Couldn\'t load analytics. Pull down to retry.' })
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
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.heading}>Analytics</Text>
          <Text style={s.subheading}>Performance across all your events</Text>
        </View>

        {loading ? (
          <AnalyticsSkeleton />
        ) : !data ? (
          <View style={s.empty}>
            <LinearGradient colors={[colors.blue + '25', 'transparent']} style={s.emptyIconCircle}>
              <Ionicons name="bar-chart-outline" size={28} color={colors.blue} />
            </LinearGradient>
            <Text style={s.emptyTitle}>No data yet</Text>
            <Text style={s.emptyBody}>Publish your first event to start seeing analytics</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/(organizer)/events/new')} accessibilityLabel="Create your first event">
              <Ionicons name="add" size={16} color={colors.white} />
              <Text style={s.emptyBtnText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Summary Cards ── */}
            <View style={s.summaryGrid}>
              <PremiumSummaryCard
                label="Total Revenue"
                value={fmtPKR(data.totalRevenue)}
                icon="cash-outline"
                color={colors.success}
              />
              <PremiumSummaryCard
                label="Total Guests"
                value={fmt(data.totalGuests)}
                icon="people-outline"
                color={colors.blue}
              />
              <PremiumSummaryCard
                label="Avg Fill Rate"
                value={`${data.avgFillRate}%`}
                icon="trending-up-outline"
                color={colors.indigo}
              />
              <PremiumSummaryCard
                label="Total Events"
                value={String(data.events.length)}
                icon="calendar-outline"
                color={colors.gold}
              />
            </View>

            {/* ── Per-event breakdown ── */}
            <Text style={s.sectionLabel}>Event Breakdown</Text>

            {data.events.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="calendar-outline" size={36} color={colors.textMuted} />
                <Text style={s.emptyTitle}>No events yet</Text>
              </View>
            ) : (
              data.events.map(event => (
                <EventAnalyticsRow
                  key={event.id}
                  event={event}
                  onPress={() => router.push(`/(organizer)/registrations/${event.id}`)}
                />
              ))
            )}

            <View style={{ height: 32 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

/* ─── Premium Summary Card ───────────────────────────────────────────────── */
function PremiumSummaryCard({ label, value, icon, color }: {
  label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string
}) {
  return (
    <LinearGradient
      colors={[color + '22', color + '0A', 'transparent'] as [string, string, string]}
      start={[0, 0]} end={[1.4, 1.4]}
      style={s.summaryCard}
    >
      <View style={[s.summaryIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[s.summaryValue, { color }]}>{value}</Text>
      <Text style={s.summaryLabel}>{label}</Text>
    </LinearGradient>
  )
}

/* ─── Event Analytics Row ────────────────────────────────────────────────── */
function EventAnalyticsRow({ event, onPress }: { event: AnalyticsEvent; onPress: () => void }) {
  const statusColor = event.status === 'published' ? colors.success
    : event.status === 'draft' ? colors.warning
    : colors.textMuted

  return (
    <TouchableOpacity style={s.eventRow} onPress={onPress} activeOpacity={0.8}>
      <View style={s.eventRowTop}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={s.eventTitle} numberOfLines={1}>{event.title}</Text>
          <View style={s.eventMeta}>
            <View style={[s.statusDot, { backgroundColor: statusColor }]} />
            <Text style={s.eventMetaText}>{format(new Date(event.date_start), 'd MMM yyyy')}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>

      <View style={s.metricsRow}>
        <Metric label="Guests"     value={String(event.guestCount)}                                icon="people-outline"            color={colors.blue}   />
        <Metric label="Checked In" value={String(event.checkedIn)}                                 icon="checkmark-circle-outline"  color={colors.success}/>
        <Metric label="Revenue"    value={event.revenue > 0 ? fmtPKR(event.revenue) : 'Free'}      icon="cash-outline"              color={colors.indigo} />
        {event.fillRate !== null && (
          <Metric label="Fill Rate" value={`${event.fillRate}%`} icon="trending-up-outline" color={colors.gold} />
        )}
      </View>
    </TouchableOpacity>
  )
}

function Metric({ label, value, icon, color }: {
  label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string
}) {
  return (
    <View style={s.metric}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[s.metricValue, { color }]}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  heading: { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold' },
  subheading: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },

  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10, marginBottom: 4,
  },
  summaryCard: {
    width: '47.5%',
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14, gap: 4,
  },
  summaryIcon: {
    width: 32, height: 32, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  summaryValue: { fontSize: 22, fontFamily: 'Poppins_700Bold', lineHeight: 28 },
  summaryLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 2 },

  sectionLabel: {
    color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_500Medium',
    letterSpacing: 1, textTransform: 'uppercase',
    marginHorizontal: 16, marginTop: 24, marginBottom: 12,
  },

  eventRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16, marginBottom: 10,
    padding: 14,
  },
  eventRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  eventTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: 'DMSans_500Medium' },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  eventMetaText: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },

  metricsRow: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: 10,
  },
  metric: { flex: 1, alignItems: 'center', gap: 3 },
  metricValue: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  metricLabel: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_400Regular' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
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
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 6,
  },
  emptyBtnText: { color: colors.white, fontFamily: 'DMSans_500Medium', fontSize: 14, fontWeight: '700' },
})

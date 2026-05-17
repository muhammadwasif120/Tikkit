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
import { getOrganizerAnalytics, OrganizerAnalytics, AnalyticsEvent } from '@/lib/api'
import { colors, radius } from '@/theme'

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

export default function AnalyticsScreen() {
  const router = useRouter()
  const [data, setData] = useState<OrganizerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const { analytics } = await getOrganizerAnalytics()
      setData(analytics)
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

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Text style={s.heading}>Analytics</Text>
          <Text style={s.subheading}>Performance across all your events</Text>
        </View>

        {loading
          ? <ActivityIndicator color={colors.blue} style={{ marginTop: 40 }} />
          : !data
          ? (
            <View style={s.empty}>
              <Ionicons name="bar-chart-outline" size={40} color={colors.textMuted} />
              <Text style={s.emptyText}>No data available</Text>
            </View>
          )
          : (
            <>
              {/* Summary cards */}
              <View style={s.summaryGrid}>
                <SummaryCard label="Total Revenue" value={fmtPKR(data.totalRevenue)} icon="cash-outline" color={colors.success} />
                <SummaryCard label="Total Guests" value={fmt(data.totalGuests)} icon="people-outline" color={colors.blue} />
                <SummaryCard label="Avg Fill Rate" value={`${data.avgFillRate}%`} icon="trending-up-outline" color={colors.indigo} />
                <SummaryCard label="Total Events" value={String(data.events.length)} icon="calendar-outline" color={colors.gold} />
              </View>

              {/* Per-event breakdown */}
              <SectionLabel>Event Breakdown</SectionLabel>

              {data.events.length === 0
                ? (
                  <View style={s.empty}>
                    <Ionicons name="calendar-outline" size={36} color={colors.textMuted} />
                    <Text style={s.emptyText}>No events yet</Text>
                  </View>
                )
                : data.events.map(event => (
                  <EventAnalyticsRow
                    key={event.id}
                    event={event}
                    onPress={() => router.push(`/(organizer)/registrations/${event.id}`)}
                  />
                ))
              }
            </>
          )
        }
      </ScrollView>
    </SafeAreaView>
  )
}

function SummaryCard({ label, value, icon, color }: {
  label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string
}) {
  return (
    <View style={[s.summaryCard, { borderLeftColor: color }]}>
      <View style={[s.summaryIcon, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={s.summaryValue}>{value}</Text>
      <Text style={s.summaryLabel}>{label}</Text>
    </View>
  )
}

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
        <Metric label="Guests" value={String(event.guestCount)} icon="people-outline" color={colors.blue} />
        <Metric label="Checked In" value={String(event.checkedIn)} icon="checkmark-circle-outline" color={colors.success} />
        <Metric label="Revenue" value={event.revenue > 0 ? fmtPKR(event.revenue) : 'Free'} icon="cash-outline" color={colors.indigo} />
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
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  )
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={s.sectionLabel}>{children}</Text>
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  heading: { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold' },
  subheading: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },

  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10, marginBottom: 8,
  },
  summaryCard: {
    width: '47.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 3,
    padding: 14, gap: 6,
  },
  summaryIcon: {
    width: 32, height: 32, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryValue: { color: colors.textPrimary, fontSize: 20, fontFamily: 'Poppins_700Bold' },
  summaryLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },

  sectionLabel: {
    color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_500Medium',
    letterSpacing: 1, textTransform: 'uppercase',
    marginHorizontal: 16, marginTop: 20, marginBottom: 10,
  },

  eventRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16, marginBottom: 10,
    padding: 14,
  },
  eventRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  eventTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: 'DMSans_500Medium' },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  eventMetaText: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },

  metricsRow: {
    flexDirection: 'row', gap: 0,
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: 10,
  },
  metric: { flex: 1, alignItems: 'center', gap: 3 },
  metricValue: { color: colors.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  metricLabel: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_400Regular' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { color: colors.textMuted, fontSize: 15, fontFamily: 'DMSans_400Regular' },
})

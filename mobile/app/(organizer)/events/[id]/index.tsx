import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  RefreshControl, TouchableOpacity, Alert,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { getOrganizerEventDetail, OrganizerEventDetail } from '@/lib/api'
import { colors, radius } from '@/theme'

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: 'LIVE',      color: colors.success, bg: colors.successSubtle },
  draft:     { label: 'DRAFT',     color: colors.warning, bg: colors.warningSubtle },
  ended:     { label: 'ENDED',     color: colors.textMuted, bg: 'rgba(107,114,128,0.1)' },
  archived:  { label: 'ARCHIVED',  color: colors.textMuted, bg: 'rgba(107,114,128,0.08)' },
  cancelled: { label: 'CANCELLED', color: colors.error,   bg: colors.errorSubtle },
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<OrganizerEventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const { event: e } = await getOrganizerEventDetail(id!)
      setEvent(e)
    } catch { /* silent */ }
  }, [id])

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar style="light" />
        <View style={s.navBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ActivityIndicator color={colors.blue} style={{ marginTop: 40 }} />
      </SafeAreaView>
    )
  }

  if (!event) return null

  const statusMeta = STATUS_META[event.status] ?? { label: event.status.toUpperCase(), color: colors.textMuted, bg: colors.surface2 }
  const fillPct = event.capacity
    ? Math.min(100, Math.round(((event as any).registration_count / Number(event.capacity)) * 100))
    : 0
  const isLive = event.status === 'published'
  const regMode = { open: 'Open Registration', expression_of_interest: 'Apply to Join', invite_only: 'Invite Only' }[event.registration_mode] ?? event.registration_mode

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* Nav */}
      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.navTitle} numberOfLines={1}>{event.title}</Text>
        <TouchableOpacity style={s.editNavBtn} onPress={() => router.push(`/(organizer)/events/${id}/edit`)}>
          <Ionicons name="pencil-outline" size={16} color={colors.blue} />
          <Text style={s.editNavBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Status + Title */}
        <View style={s.heroCard}>
          <View style={s.heroTop}>
            <View style={[s.statusBadge, { backgroundColor: statusMeta.bg }]}>
              {isLive && <View style={s.liveDot} />}
              <Text style={[s.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
            </View>
            <Text style={s.heroMode}>{regMode}</Text>
          </View>
          <Text style={s.heroTitle}>{event.title}</Text>
          {(event as any).description && (
            <Text style={s.heroDesc} numberOfLines={3}>{(event as any).description}</Text>
          )}
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <StatBox label="Guests" value={String(event.registration_count)} icon="people-outline" color={colors.blue} />
          <StatBox label="Checked In" value={String(event.checked_in_count)} icon="checkmark-circle-outline" color={colors.success} />
          <StatBox label="Pending" value={String(event.pending_approvals)} icon="time-outline" color={colors.warning} />
          {event.capacity && <StatBox label="Capacity" value={String(event.capacity)} icon="layers-outline" color={colors.indigo} />}
        </View>

        {/* Capacity bar */}
        {event.capacity && (
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <Text style={s.cardLabel}>Fill Rate</Text>
              <Text style={s.fillPct}>{fillPct}%</Text>
            </View>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${fillPct}%` as any, backgroundColor: fillPct > 80 ? colors.warning : colors.blue }]} />
            </View>
            <Text style={s.barMeta}>{event.registration_count} / {event.capacity} registered</Text>
          </View>
        )}

        {/* Date & Venue */}
        <View style={s.card}>
          <Text style={s.cardSectionLabel}>Date & Venue</Text>
          <InfoRow icon="calendar-outline" label="Start" value={format(new Date((event as any).date_start), 'EEE, d MMM yyyy · h:mm a')} />
          {(event as any).date_end && (
            <InfoRow icon="calendar-clear-outline" label="End" value={format(new Date((event as any).date_end), 'EEE, d MMM yyyy · h:mm a')} />
          )}
          {(event as any).venue_name && <InfoRow icon="business-outline" label="Venue" value={(event as any).venue_name} />}
          {(event as any).venue_address && <InfoRow icon="location-outline" label="Address" value={(event as any).venue_address} />}
          {(event as any).venue_city && <InfoRow icon="map-outline" label="City" value={(event as any).venue_city} />}
          {(event as any).ticket_price && <InfoRow icon="pricetag-outline" label="Price" value={`PKR ${Number((event as any).ticket_price).toLocaleString()}`} />}
        </View>

        {/* Action buttons */}
        <Text style={s.actionsLabel}>MANAGEMENT</Text>
        <View style={s.actionsGrid}>
          <ActionCard icon="people-outline" label="Registrations" color={colors.blue}
            onPress={() => router.push(`/(organizer)/registrations/${id}`)} />
          <ActionCard icon="person-add-outline" label="Add Guest" color={colors.success}
            onPress={() => router.push(`/(organizer)/events/${id}/guests/add`)} />
          <ActionCard icon="time-outline" label="Approvals" color={colors.warning}
            badge={event.pending_approvals > 0 ? event.pending_approvals : undefined}
            onPress={() => router.push('/(organizer)/approvals')} />
          <ActionCard icon="terminal-outline" label="Command" color={colors.indigo}
            onPress={() => router.push(`/(organizer)/command/${id}`)} />
          <ActionCard icon="qr-code-outline" label="Scanner" color={colors.success}
            onPress={() => router.push('/(organizer)/scan')} />
          <ActionCard icon="bar-chart-outline" label="Analytics" color={colors.gold}
            onPress={() => router.push('/(organizer)/analytics')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function StatBox({ label, value, icon, color }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={[s.statBox, { borderLeftColor: color }]}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  )
}

function ActionCard({ icon, label, color, onPress, badge }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void; badge?: number
}) {
  return (
    <TouchableOpacity style={s.actionCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.actionIcon, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={20} color={color} />
        {badge ? (
          <View style={[s.actionBadge, { backgroundColor: color }]}>
            <Text style={s.actionBadgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={s.actionLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { flex: 1, color: colors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  editNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.blueSubtle, borderRadius: radius.md, borderWidth: 1, borderColor: colors.blueBorder },
  editNavBtnText: { color: colors.blue, fontSize: 13, fontFamily: 'DMSans_500Medium' },

  scroll: { padding: 16, gap: 12, paddingBottom: 40 },

  heroCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 16,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  statusText: { fontSize: 11, fontFamily: 'DMSans_500Medium', fontWeight: '700', letterSpacing: 0.5 },
  heroMode: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },
  heroTitle: { color: colors.textPrimary, fontSize: 22, fontFamily: 'Poppins_700Bold', marginBottom: 6 },
  heroDesc: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 20 },

  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3,
    padding: 12, gap: 4,
  },
  statValue: { color: colors.textPrimary, fontSize: 20, fontFamily: 'Poppins_700Bold' },
  statLabel: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_400Regular' },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_500Medium', textTransform: 'uppercase', letterSpacing: 1 },
  fillPct: { color: colors.textPrimary, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  barTrack: { height: 6, backgroundColor: colors.surface2, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barMeta: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },

  cardSectionLabel: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_500Medium', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoLabel: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', width: 56 },
  infoValue: { color: colors.textPrimary, fontSize: 13, fontFamily: 'DMSans_400Regular', flex: 1 },

  actionsLabel: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_500Medium', letterSpacing: 1, marginTop: 4 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '30.5%',
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, alignItems: 'center', gap: 8,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  actionBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  actionBadgeText: { color: colors.white, fontSize: 9, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  actionLabel: { color: colors.textSecondary, fontSize: 11, fontFamily: 'DMSans_500Medium', textAlign: 'center' },
})

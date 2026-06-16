import {
  View, Text, StyleSheet, ScrollView, Image,
  RefreshControl, TouchableOpacity,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { format } from 'date-fns'
import { getOrganizerEventDetail, OrganizerEventDetail } from '@/lib/api'
import { colors, radius, getEventGradient } from '@/theme'
import { Skeleton } from '@/components/Skeleton'

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
  const [error, setError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setError(false)
    try {
      const { event: e } = await getOrganizerEventDetail(id!)
      if (!e) { setError(true); return }
      setEvent(e)
    } catch {
      setError(true)
    }
  }, [id])

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  /* ── Nav bar — always visible ── */
  const NavBar = ({ title }: { title?: string }) => (
    <View style={s.navBar}>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
      </TouchableOpacity>
      {title ? (
        <Text style={s.navTitle} numberOfLines={1}>{title}</Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {event && (
        <TouchableOpacity
          style={s.editNavBtn}
          onPress={() => router.push(`/(organizer)/events/${id}/edit`)}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.blue} />
          <Text style={s.editNavBtnText}>Edit</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar style="light" />
        <NavBar />
        <Skeleton height={210} style={{ borderRadius: 0 }} />
        <View style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={{ flex: 1 }}>
                <Skeleton height={76} style={{ borderRadius: radius.lg }} />
              </View>
            ))}
          </View>
          <Skeleton height={110} style={{ borderRadius: radius.lg }} />
          <Skeleton height={150} style={{ borderRadius: radius.lg }} />
        </View>
      </SafeAreaView>
    )
  }

  /* ── Error state ── */
  if (error || !event) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar style="light" />
        <NavBar title="Event" />
        <View style={s.errorState}>
          <LinearGradient
            colors={[colors.error + '25', 'transparent']}
            style={s.errorIconCircle}
          >
            <Ionicons name="alert-circle-outline" size={28} color={colors.error} />
          </LinearGradient>
          <Text style={s.errorTitle}>Event not found</Text>
          <Text style={s.errorBody}>
            This event may have been deleted or you don't have access to it.
          </Text>
          <TouchableOpacity style={s.errorBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={s.errorBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const statusMeta = STATUS_META[event.status] ?? { label: event.status.toUpperCase(), color: colors.textMuted, bg: colors.surface2 }
  const fillPct = event.capacity
    ? Math.min(100, Math.round(((event as any).registration_count / Number(event.capacity)) * 100))
    : 0
  const isLive = event.status === 'published'
  const regMode = {
    open: 'Open Registration',
    expression_of_interest: 'Apply to Join',
    invite_only: 'Invite Only',
  }[event.registration_mode] ?? event.registration_mode
  const gradient = getEventGradient(id ?? '')

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <NavBar title={event.title} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cover Image Hero ── */}
        <View style={s.heroImgWrap}>
          {(event as any).cover_image_url
            ? (
              <Image
                source={{ uri: (event as any).cover_image_url }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
            )
            : (
              <LinearGradient
                colors={gradient as [string, string]}
                style={[StyleSheet.absoluteFillObject, s.heroGradCenter]}
                start={[0, 0]} end={[1, 1]}
              >
                <Text style={s.heroInitial}>{event.title.charAt(0)}</Text>
              </LinearGradient>
            )
          }
          {/* Gradient scrim */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.88)']}
            style={StyleSheet.absoluteFillObject}
            start={[0, 0.3]} end={[0, 1]}
          />
          {/* Status badge */}
          <View style={[s.heroStatusBadge, { borderColor: statusMeta.color + '55' }]}>
            {isLive && <View style={[s.liveDot, { backgroundColor: statusMeta.color }]} />}
            <Text style={[s.heroStatusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
          </View>
          {/* Content overlay at bottom */}
          <View style={s.heroOverlay}>
            <Text style={s.heroTitle} numberOfLines={2}>{event.title}</Text>
            <View style={s.heroMetaRow}>
              <Text style={s.heroMode}>{regMode}</Text>
              {(event as any).venue_city && (
                <>
                  <Text style={s.heroMetaDot}>·</Text>
                  <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.6)" />
                  <Text style={s.heroMeta}>{(event as any).venue_city}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={s.scroll}>
          {/* Description (if any) */}
          {(event as any).description && (
            <View style={s.descCard}>
              <Text style={s.descText} numberOfLines={4}>{(event as any).description}</Text>
            </View>
          )}

          {/* ── Premium Stats Row ── */}
          <View style={s.statsRow}>
            <PremiumStatBox
              label="Guests"
              value={String(event.registration_count)}
              icon="people-outline"
              color={colors.blue}
            />
            <PremiumStatBox
              label="Checked In"
              value={String(event.checked_in_count)}
              icon="checkmark-circle-outline"
              color={colors.success}
            />
            <PremiumStatBox
              label="Pending"
              value={String(event.pending_approvals)}
              icon="time-outline"
              color={event.pending_approvals > 0 ? colors.warning : colors.textMuted}
            />
            {event.capacity && (
              <PremiumStatBox
                label="Capacity"
                value={String(event.capacity)}
                icon="layers-outline"
                color={colors.indigo}
              />
            )}
          </View>

          {/* Fill Rate Bar */}
          {event.capacity && (
            <View style={s.card}>
              <View style={s.cardHeaderRow}>
                <Text style={s.cardLabel}>Fill Rate</Text>
                <Text style={[s.fillPct, { color: fillPct > 80 ? colors.warning : colors.blue }]}>
                  {fillPct}%
                </Text>
              </View>
              <View style={s.barTrack}>
                <View
                  style={[s.barFill, {
                    width: `${fillPct}%` as any,
                    backgroundColor: fillPct > 80 ? colors.warning : colors.blue,
                  }]}
                />
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
            {(event as any).ticket_price && (
              <InfoRow icon="pricetag-outline" label="Price" value={`PKR ${Number((event as any).ticket_price).toLocaleString()}`} />
            )}
          </View>

          {/* Management Actions */}
          <Text style={s.actionsLabel}>MANAGEMENT</Text>
          <View style={s.actionsGrid}>
            <ActionCard icon="people-outline"   label="Registrations" color={colors.blue}
              onPress={() => router.push(`/(organizer)/registrations/${id}`)} />
            <ActionCard icon="person-add-outline" label="Add Guest"  color={colors.success}
              onPress={() => router.push(`/(organizer)/events/${id}/guests/add`)} />
            <ActionCard icon="time-outline"      label="Approvals"   color={colors.warning}
              badge={event.pending_approvals > 0 ? event.pending_approvals : undefined}
              onPress={() => router.push('/(organizer)/approvals')} />
            <ActionCard icon="terminal-outline"  label="Command"     color={colors.indigo}
              onPress={() => router.push(`/(organizer)/command/${id}`)} />
            <ActionCard icon="qr-code-outline"   label="Scanner"     color={colors.success}
              onPress={() => router.push('/(organizer)/scan')} />
            <ActionCard icon="bar-chart-outline" label="Analytics"   color={colors.gold}
              onPress={() => router.push('/(organizer)/analytics')} />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

/* ─── Premium Stat Box ───────────────────────────────────────────────────── */
function PremiumStatBox({ label, value, icon, color }: {
  label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string
}) {
  return (
    <LinearGradient
      colors={[color + '22', color + '0A', 'transparent'] as [string, string, string]}
      start={[0, 0]} end={[1.4, 1.4]}
      style={s.statBox}
    >
      <View style={[s.statIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={13} color={color} />
      </View>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </LinearGradient>
  )
}

/* ─── Info Row ───────────────────────────────────────────────────────────── */
function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  )
}

/* ─── Action Card ────────────────────────────────────────────────────────── */
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

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { flex: 1, color: colors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  editNavBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: colors.blueSubtle, borderRadius: radius.md, borderWidth: 1, borderColor: colors.blueBorder,
  },
  editNavBtnText: { color: colors.blue, fontSize: 13, fontFamily: 'DMSans_500Medium' },

  // Hero image
  heroImgWrap: { height: 210, overflow: 'hidden', position: 'relative' },
  heroGradCenter: { alignItems: 'center', justifyContent: 'center' },
  heroInitial: { color: 'rgba(255,255,255,0.55)', fontSize: 56, fontFamily: 'Poppins_700Bold' },
  heroStatusBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.full, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  heroStatusText: { fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '700', letterSpacing: 0.5 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  heroTitle: { color: colors.white, fontSize: 20, fontFamily: 'Poppins_700Bold', marginBottom: 4, lineHeight: 26 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMode: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'DMSans_400Regular' },
  heroMeta: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'DMSans_400Regular' },
  heroMetaDot: { color: 'rgba(255,255,255,0.35)', fontSize: 12 },

  scroll: { padding: 16, gap: 12 },

  descCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 14,
  },
  descText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 20 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 10, gap: 2,
  },
  statIcon: { width: 26, height: 26, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 18, fontFamily: 'Poppins_700Bold', lineHeight: 22 },
  statLabel: { color: colors.textMuted, fontSize: 9, fontFamily: 'DMSans_400Regular', marginTop: 1 },

  // Fill rate card
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_500Medium', textTransform: 'uppercase', letterSpacing: 1 },
  fillPct: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  barTrack: { height: 6, backgroundColor: colors.surface2, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barMeta: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },

  cardSectionLabel: {
    color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_500Medium',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoLabel: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', width: 56 },
  infoValue: { color: colors.textPrimary, fontSize: 13, fontFamily: 'DMSans_400Regular', flex: 1 },

  // Action grid
  actionsLabel: {
    color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_500Medium',
    letterSpacing: 1, textTransform: 'uppercase', marginTop: 4,
  },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '30.5%', flexGrow: 1,
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

  // Error state
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  errorIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  errorTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  errorBody: {
    color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular',
    textAlign: 'center', lineHeight: 20, maxWidth: 260,
  },
  errorBtn: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 4,
  },
  errorBtnText: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
})

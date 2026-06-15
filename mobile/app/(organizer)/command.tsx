import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Image,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'
import { getOrganizerEvents, OrganizerEvent } from '@/lib/api'
import { colors, radius, getEventGradient } from '@/theme'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function CommandSkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[0, 1, 2].map(i => (
        <View key={i} style={[s.card, { overflow: 'hidden' }]}>
          <Skeleton height={150} style={{ borderRadius: 0 }} />
          <View style={{ padding: 14, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton height={16} width={160} style={{ borderRadius: 8 }} />
              <Skeleton height={22} width={52} style={{ borderRadius: radius.full }} />
            </View>
            <Skeleton height={12} width={140} style={{ borderRadius: 6 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
              <Skeleton height={12} width={100} style={{ borderRadius: 6 }} />
              <Skeleton height={12} width={50} style={{ borderRadius: 6 }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}

/* ─── Screen ─────────────────────────────────────────────────────────────── */
export default function CommandHubScreen() {
  const router = useRouter()
  const toast = useToast()
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const { events: e } = await getOrganizerEvents()
      setEvents(e)
    } catch (e: any) {
      toast.show({ type: 'error', message: e?.message || 'Couldn\'t load events. Pull down to retry.' })
    }
  }, [])

  useEffect(() => { load().finally(() => setLoading(false)) }, [])
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      <View style={s.header}>
        <View>
          <Text style={s.heading}>Command Center</Text>
          <Text style={s.subheading}>Real-time event management</Text>
        </View>
      </View>

      {/* How it works strip */}
      <View style={s.howItWorks}>
        <HowCard icon="people-outline"           title="Manage Attendees" desc="Approve registrations and payments in one tap" />
        <View style={s.howDivider} />
        <HowCard icon="shield-checkmark-outline" title="Verify Guests"    desc="ID, payment, and Social Score badges" />
        <View style={s.howDivider} />
        <HowCard icon="chatbubbles-outline"       title="Live Chat"        desc="Broadcast messages to all attendees" />
      </View>

      {loading ? (
        <CommandSkeleton />
      ) : (
        <FlatList
          data={events}
          keyExtractor={e => e.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <LinearGradient
                colors={[colors.indigo + '25', 'transparent']}
                style={s.emptyIconCircle}
              >
                <Ionicons name="terminal-outline" size={28} color={colors.indigo} />
              </LinearGradient>
              <Text style={s.emptyTitle}>No events yet</Text>
              <Text style={s.emptyBody}>Create an event to access the Command Center</Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => router.push('/(organizer)/events/new')}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={16} color={colors.white} />
                <Text style={s.emptyBtnText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <CommandEventCard
              event={item}
              onPress={() => router.push(`/(organizer)/command/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function HowCard({ icon, title, desc }: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }) {
  return (
    <View style={s.howCard}>
      <Ionicons name={icon} size={18} color={colors.blue} />
      <Text style={s.howTitle}>{title}</Text>
      <Text style={s.howDesc}>{desc}</Text>
    </View>
  )
}

function CommandEventCard({ event, onPress }: { event: OrganizerEvent; onPress: () => void }) {
  const isLive = event.status === 'published'
  const gradient = getEventGradient(event.id)

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      {/* Thumb — 150px, full-width */}
      <View style={s.cardThumbWrap}>
        {event.cover_image_url
          ? <Image source={{ uri: event.cover_image_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          : (
            <LinearGradient colors={gradient as [string, string]} style={StyleSheet.absoluteFillObject} start={[0, 0]} end={[1, 1]}>
              <Text style={s.cardInitial}>{event.title.charAt(0)}</Text>
            </LinearGradient>
          )
        }
        {/* Status badge top-right */}
        <View style={[s.statusBadge, isLive ? s.liveBadge : s.draftBadge]}>
          {isLive && <View style={s.livePulse} />}
          <Text style={[s.statusBadgeText, { color: isLive ? colors.success : colors.warning }]}>
            {isLive ? 'LIVE' : event.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={1}>{event.title}</Text>
        <View style={s.cardMeta}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={s.cardMetaText}>{format(new Date(event.date_start), 'd MMM yyyy · h:mm a')}</Text>
        </View>
        <View style={s.cardFooter}>
          <View style={s.regChip}>
            <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
            <Text style={s.regChipText}>{event.registration_count} registered</Text>
          </View>
          <View style={s.enterBtn}>
            <Text style={s.enterBtnText}>Enter</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.blue} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  heading:    { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold' },
  subheading: { color: colors.textMuted,   fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },

  howItWorks: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14,
  },
  howCard:    { flex: 1, alignItems: 'center', gap: 4 },
  howDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 8 },
  howTitle:   { color: colors.textPrimary, fontSize: 11, fontFamily: 'DMSans_500Medium', textAlign: 'center' },
  howDesc:    { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 13 },

  list: { padding: 16, gap: 12, paddingBottom: 32 },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  cardThumbWrap: {
    width: '100%', height: 150,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  cardInitial: { color: colors.white, fontSize: 42, fontFamily: 'Poppins_700Bold' },

  statusBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1,
  },
  liveBadge:  { backgroundColor: colors.successSubtle, borderColor: colors.success + '44' },
  draftBadge: { backgroundColor: colors.warningSubtle, borderColor: colors.warning + '44' },
  livePulse:  { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  statusBadgeText: { fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  cardBody:   { padding: 14 },
  cardTitle:  { color: colors.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 6 },
  cardMeta:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  cardMetaText: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  regChip:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  regChipText: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  enterBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  enterBtnText: { color: colors.blue, fontSize: 13, fontFamily: 'DMSans_500Medium' },

  empty:          { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32, gap: 10 },
  emptyIconCircle:{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:     { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  emptyBody:      { color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 20 },
  emptyBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.blue, borderRadius: radius.md, paddingHorizontal: 20, paddingVertical: 10, marginTop: 6 },
  emptyBtnText:   { color: colors.white, fontFamily: 'DMSans_500Medium', fontSize: 14, fontWeight: '700' },
})

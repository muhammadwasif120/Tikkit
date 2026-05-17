import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Image,
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

export default function CommandHubScreen() {
  const router = useRouter()
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const { events: e } = await getOrganizerEvents()
      setEvents(e)
    } catch { /* silent */ }
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
        <HowCard icon="people-outline" title="Manage Attendees" desc="Approve registrations and payments in one tap" />
        <View style={s.howDivider} />
        <HowCard icon="shield-checkmark-outline" title="Verify Guests" desc="ID, payment, and Social Score badges" />
        <View style={s.howDivider} />
        <HowCard icon="chatbubbles-outline" title="Live Chat" desc="Broadcast messages to all attendees" />
      </View>

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
                <Ionicons name="terminal-outline" size={40} color={colors.textMuted} />
                <Text style={s.emptyTitle}>No events yet</Text>
                <Text style={s.emptyText}>Create an event to access the Command Center</Text>
              </View>
            }
            renderItem={({ item }) => <CommandEventCard event={item} onPress={() => router.push(`/(organizer)/command/${item.id}`)} />}
          />
        )
      }
    </SafeAreaView>
  )
}

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
      {event.cover_image_url
        ? <Image source={{ uri: event.cover_image_url }} style={s.cardThumb} />
        : (
          <LinearGradient colors={gradient as [string, string]} style={s.cardThumb} start={[0, 0]} end={[1, 1]}>
            <Text style={s.cardInitial}>{event.title.charAt(0)}</Text>
          </LinearGradient>
        )
      }
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <Text style={s.cardTitle} numberOfLines={1}>{event.title}</Text>
          {isLive
            ? (
              <View style={s.liveBadge}>
                <View style={s.livePulse} />
                <Text style={s.liveBadgeText}>LIVE</Text>
              </View>
            )
            : (
              <View style={s.draftBadge}>
                <Text style={s.draftBadgeText}>{event.status.toUpperCase()}</Text>
              </View>
            )
          }
        </View>
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  heading: { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold' },
  subheading: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },

  howItWorks: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14,
  },
  howCard: { flex: 1, alignItems: 'center', gap: 4 },
  howDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 8 },
  howTitle: { color: colors.textPrimary, fontSize: 11, fontFamily: 'DMSans_500Medium', textAlign: 'center' },
  howDesc: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 13 },

  list: { padding: 16, gap: 12, paddingBottom: 32 },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  cardThumb: {
    width: '100%', height: 110, backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInitial: { color: colors.white, fontSize: 36, fontFamily: 'Poppins_700Bold' },
  cardBody: { padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold', flex: 1, marginRight: 8 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.successSubtle, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: colors.success + '44',
  },
  livePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  liveBadgeText: { color: colors.success, fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  draftBadge: {
    backgroundColor: colors.warningSubtle, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: colors.warning + '44',
  },
  draftBadgeText: { color: colors.warning, fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  cardMetaText: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  regChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  regChipText: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  enterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  enterBtnText: { color: colors.blue, fontSize: 13, fontFamily: 'DMSans_500Medium' },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  emptyText: { color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center' },
})

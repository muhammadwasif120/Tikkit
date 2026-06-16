import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import { getNotifications, markNotificationsRead, AppNotification } from '@/lib/api'
import { colors, radius } from '@/theme'
import { useToast } from '@/components/Toast'

/* ─── Semantic type config ────────────────────────────────────────────────── */
type NotifMeta = {
  icon: keyof typeof Ionicons.glyphMap
  color: string
  bg: string
  borderColor: string
}

const TYPE_META: Record<string, NotifMeta> = {
  registration_approved: {
    icon: 'checkmark-circle',
    color: colors.success,
    bg: colors.successSubtle,
    borderColor: colors.success + '40',
  },
  registration_rejected: {
    icon: 'close-circle',
    color: colors.error,
    bg: colors.errorSubtle,
    borderColor: colors.error + '40',
  },
  payment_confirmed: {
    icon: 'card',
    color: colors.success,
    bg: colors.successSubtle,
    borderColor: colors.success + '40',
  },
  payment_reminder: {
    icon: 'card-outline',
    color: colors.warning,
    bg: colors.warningSubtle,
    borderColor: colors.warning + '40',
  },
  event_reminder: {
    icon: 'calendar',
    color: colors.blue,
    bg: colors.blueSubtle,
    borderColor: colors.blueBorder,
  },
  event_cancelled: {
    icon: 'ban-outline',
    color: colors.error,
    bg: colors.errorSubtle,
    borderColor: colors.error + '40',
  },
  waitlist_promoted: {
    icon: 'arrow-up-circle',
    color: '#A855F7',
    bg: 'rgba(168,85,247,0.1)',
    borderColor: 'rgba(168,85,247,0.3)',
  },
  general: {
    icon: 'notifications',
    color: colors.blue,
    bg: colors.blueSubtle,
    borderColor: colors.blueBorder,
  },
}

function getNotifMeta(type: string): NotifMeta {
  return TYPE_META[type] ?? TYPE_META.general
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true })
  }
  if (isYesterday(date)) return `Yesterday · ${format(date, 'h:mm a')}`
  return format(date, 'd MMM · h:mm a')
}

/* ─── Main screen ─────────────────────────────────────────────────────────── */
export default function NotificationsScreen() {
  const router = useRouter()
  const toast = useToast()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const { notifications: n } = await getNotifications()
      setNotifications(n)
      await markNotificationsRead()
    } catch (e: any) {
      toast.show({ type: 'error', message: e?.message || 'Couldn\'t load notifications. Pull down to retry.' })
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

  const unread = notifications.filter(n => !n.read_at).length

  if (loading) {
    return <View style={s.centered}><ActivityIndicator color={colors.blue} /></View>
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={s.navTitle}>Notifications</Text>
          {unread > 0 && (
            <Text style={s.navSub}>{unread} unread</Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={28} color={colors.textMuted} />
            </View>
            <Text style={s.emptyTitle}>All caught up</Text>
            <Text style={s.emptyText}>No notifications yet — we'll alert you on approvals, reminders, and more</Text>
          </View>
        }
        renderItem={({ item }) => <NotifCard notif={item} />}
      />
    </SafeAreaView>
  )
}

/* ─── Notification card ───────────────────────────────────────────────────── */
function NotifCard({ notif }: { notif: AppNotification }) {
  const isUnread = !notif.read_at
  const meta = getNotifMeta(notif.type)

  return (
    <View style={[s.card, isUnread && { borderColor: meta.borderColor }]}>
      {/* Left accent bar — matches type color */}
      {isUnread && <View style={[s.accentBar, { backgroundColor: meta.color }]} />}

      {/* Icon circle */}
      <View style={[s.iconWrap, { backgroundColor: meta.bg, borderColor: meta.borderColor }]}>
        <Ionicons name={meta.icon} size={18} color={meta.color} />
      </View>

      {/* Content */}
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <Text style={s.cardTitle} numberOfLines={1}>{notif.title}</Text>
          {isUnread && <View style={[s.dot, { backgroundColor: meta.color }]} />}
        </View>
        <Text style={s.cardText} numberOfLines={3}>{notif.body}</Text>
        <Text style={s.cardTime}>{formatTimestamp(notif.created_at)}</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  centered: { flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' },

  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  navTitle: {
    color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold', textAlign: 'center',
  },
  navSub: {
    color: colors.blue, fontSize: 11, fontFamily: 'DMSans_500Medium', textAlign: 'center', marginTop: 1,
  },

  list: { padding: 16, gap: 8, paddingBottom: 32 },

  card: {
    flexDirection: 'row', gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 14, overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    borderWidth: 1,
  },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: {
    color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium', flex: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  cardText: {
    color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 19,
  },
  cardTime: {
    color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 6,
  },

  empty: {
    alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12,
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  emptyText: {
    color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular',
    textAlign: 'center', lineHeight: 20,
  },
})

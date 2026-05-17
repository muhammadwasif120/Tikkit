import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { getNotifications, markNotificationsRead, AppNotification } from '@/lib/api'
import { colors, radius } from '@/theme'

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  registration_approved: 'checkmark-circle',
  registration_rejected: 'close-circle',
  payment_reminder: 'card',
  event_reminder: 'calendar',
  general: 'notifications',
}

export default function NotificationsScreen() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const { notifications: n } = await getNotifications()
      setNotifications(n)
      await markNotificationsRead()
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
    return <View style={s.centered}><ActivityIndicator color={colors.blue} /></View>
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Notifications</Text>
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
            <Text style={s.emptyTitle}>No notifications</Text>
            <Text style={s.emptyText}>You're all caught up</Text>
          </View>
        }
        renderItem={({ item }) => <NotifCard notif={item} />}
      />
    </SafeAreaView>
  )
}

function NotifCard({ notif }: { notif: AppNotification }) {
  const isUnread = !notif.read_at
  const icon = TYPE_ICON[notif.type] ?? 'notifications-outline'

  return (
    <View style={[s.card, isUnread && s.cardUnread]}>
      {isUnread && <View style={s.unreadBar} />}
      <View style={[s.iconWrap, { backgroundColor: colors.blueSubtle }]}>
        <Ionicons name={icon} size={18} color={colors.blue} />
      </View>
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <Text style={s.cardTitle}>{notif.title}</Text>
          {isUnread && <View style={s.dot} />}
        </View>
        <Text style={s.cardText}>{notif.body}</Text>
        <Text style={s.cardTime}>{format(new Date(notif.created_at), 'd MMM · h:mm a')}</Text>
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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  navTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },

  list: { padding: 16, gap: 8, paddingBottom: 32 },

  card: {
    flexDirection: 'row', gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 14, overflow: 'hidden',
  },
  cardUnread: { borderColor: colors.blueBorder },
  unreadBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 3, backgroundColor: colors.blue,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium', flex: 1 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.blue },
  cardText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 19 },
  cardTime: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 6 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  emptyText: { color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular' },
})

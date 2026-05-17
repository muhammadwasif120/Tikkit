import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, ScrollView,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { getOrganizerRegistrations, updateRegistration, Registration } from '@/lib/api'
import { colors, radius } from '@/theme'

const STATUS_TABS = ['pending', 'approved', 'all', 'rejected'] as const
type StatusTab = typeof STATUS_TABS[number]

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: colors.warning, bg: colors.warningSubtle },
  approved: { label: 'Approved', color: colors.success, bg: colors.successSubtle },
  rejected: { label: 'Rejected', color: colors.error, bg: colors.errorSubtle },
  cancelled: { label: 'Cancelled', color: colors.textMuted, bg: 'rgba(107,114,128,0.1)' },
}

const PAYMENT_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Payment Due', color: colors.warning, bg: colors.warningSubtle },
  submitted: { label: 'Payment Submitted', color: colors.indigo, bg: colors.indigoSubtle },
  confirmed: { label: 'Payment Confirmed', color: colors.success, bg: colors.successSubtle },
}

export default function RegistrationsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>()
  const router = useRouter()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<StatusTab>('pending')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async (status: StatusTab) => {
    if (!eventId) return
    try {
      const { registrations: r } = await getOrganizerRegistrations(
        eventId,
        status === 'all' ? undefined : status
      )
      setRegistrations(r)
    } catch { /* silent */ }
  }, [eventId])

  useEffect(() => {
    setLoading(true)
    load(activeTab).finally(() => setLoading(false))
  }, [activeTab])

  const onRefresh = async () => {
    setRefreshing(true)
    await load(activeTab)
    setRefreshing(false)
  }

  const handleAction = (regId: string, action: 'approve' | 'reject', name: string) => {
    Alert.alert(
      action === 'approve' ? 'Approve Registration' : 'Reject Registration',
      `${action === 'approve' ? 'Approve' : 'Reject'} ${name}'s registration?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'approve' ? 'Approve' : 'Reject',
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
            setUpdating(regId)
            try {
              await updateRegistration(regId, action)
              await load(activeTab)
            } catch (err: any) {
              Alert.alert('Error', err.message)
            } finally {
              setUpdating(null)
            }
          },
        },
      ]
    )
  }

  const pendingCount = registrations.filter(r => r.status === 'pending').length

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.navTitle}>Registrations</Text>
          <Text style={s.navSub}>{registrations.length} total</Text>
        </View>
        {pendingCount > 0 && (
          <View style={s.pendingBadge}>
            <Text style={s.pendingBadgeText}>{pendingCount} pending</Text>
          </View>
        )}
      </View>

      {/* Status tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabs}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading
        ? <ActivityIndicator color={colors.blue} style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={registrations}
            keyExtractor={r => r.id}
            contentContainerStyle={s.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="people-outline" size={36} color={colors.textMuted} />
                <Text style={s.emptyText}>No registrations</Text>
              </View>
            }
            renderItem={({ item }) => {
              const status = STATUS_META[item.status] ?? { label: item.status, color: colors.textMuted, bg: colors.surface2 }
              const paymentBadge = item.payment_status && item.payment_status !== 'not_required'
                ? PAYMENT_META[item.payment_status] ?? null
                : null
              return (
                <View style={s.card}>
                  <View style={s.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardName}>{item.full_name}</Text>
                      <Text style={s.cardEmail}>{item.email}</Text>
                      {item.phone && <Text style={s.cardPhone}>{item.phone}</Text>}
                    </View>
                    <View style={s.badgeStack}>
                      <View style={[s.badge, { backgroundColor: status.bg }]}>
                        <Text style={[s.badgeText, { color: status.color }]}>{status.label}</Text>
                      </View>
                      {paymentBadge && (
                        <View style={[s.badge, { backgroundColor: paymentBadge.bg }]}>
                          <Text style={[s.badgeText, { color: paymentBadge.color }]}>{paymentBadge.label}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={s.cardMeta}>
                    <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                    <Text style={s.cardMetaText}>
                      {format(new Date(item.created_at), 'd MMM yyyy · h:mm a')}
                    </Text>
                    {item.ticket_days && item.ticket_days.length > 0 && (
                      <>
                        <Text style={s.cardMetaDot}>·</Text>
                        <Text style={s.cardMetaText}>Days: {item.ticket_days.join(', ')}</Text>
                      </>
                    )}
                  </View>

                  {item.status === 'pending' && (
                    <View style={s.actions}>
                      <TouchableOpacity
                        style={[s.actionBtn, s.rejectBtn, updating === item.id && { opacity: 0.5 }]}
                        onPress={() => handleAction(item.id, 'reject', item.full_name)}
                        disabled={updating === item.id}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={16} color={colors.error} />
                        <Text style={[s.actionText, { color: colors.error }]}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.actionBtn, s.approveBtn, updating === item.id && { opacity: 0.5 }]}
                        onPress={() => handleAction(item.id, 'approve', item.full_name)}
                        disabled={updating === item.id}
                        activeOpacity={0.7}
                      >
                        {updating === item.id
                          ? <ActivityIndicator size="small" color={colors.white} />
                          : <>
                            <Ionicons name="checkmark" size={16} color={colors.white} />
                            <Text style={s.approveBtnText}>Approve</Text>
                          </>
                        }
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )
            }}
          />
        )
      }
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  nav: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  navTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  navSub: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  pendingBadge: {
    backgroundColor: colors.warningSubtle,
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  pendingBadgeText: { color: colors.warning, fontSize: 11, fontFamily: 'DMSans_500Medium' },

  tabsScroll: { flexGrow: 0, marginBottom: 4 },
  tabs: { paddingHorizontal: 16, gap: 8 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.full,
  },
  tabActive: { backgroundColor: colors.blueSubtle, borderColor: colors.blueBorder },
  tabText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_500Medium' },
  tabTextActive: { color: colors.blue },

  list: { padding: 16, gap: 10, paddingBottom: 32 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 14, gap: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  badgeStack: { alignItems: 'flex-end', gap: 4 },
  cardName: { color: colors.textPrimary, fontSize: 15, fontFamily: 'DMSans_500Medium' },
  cardEmail: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  cardPhone: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, marginLeft: 8 },
  badgeText: { fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '600' },

  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },
  cardMetaDot: { color: colors.textMuted, fontSize: 11 },

  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 10, borderRadius: radius.sm, borderWidth: 1,
  },
  rejectBtn: { borderColor: colors.error + '44', backgroundColor: colors.errorSubtle },
  approveBtn: { backgroundColor: colors.blue, borderColor: 'transparent' },
  actionText: { fontFamily: 'DMSans_500Medium', fontSize: 14, fontWeight: '600' },
  approveBtnText: { color: colors.white, fontFamily: 'DMSans_500Medium', fontSize: 14, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: colors.textMuted, fontSize: 15, fontFamily: 'DMSans_400Regular' },
})

import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, ScrollView, TextInput,
} from 'react-native'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { format } from 'date-fns'
import { getOrganizerRegistrations, updateRegistration, Registration } from '@/lib/api'
import { colors, radius } from '@/theme'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'

const STATUS_TABS = ['pending', 'approved', 'all', 'rejected'] as const
type StatusTab = typeof STATUS_TABS[number]

type UpdatingState = { id: string; action: 'approve' | 'reject' } | null

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: colors.warning, bg: colors.warningSubtle },
  approved:  { label: 'Approved',  color: colors.success, bg: colors.successSubtle },
  rejected:  { label: 'Rejected',  color: colors.error,   bg: colors.errorSubtle   },
  cancelled: { label: 'Cancelled', color: colors.textMuted, bg: 'rgba(107,114,128,0.1)' },
}

const PAYMENT_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Payment Due',       color: colors.warning, bg: colors.warningSubtle },
  submitted: { label: 'Payment Submitted', color: colors.indigo,  bg: colors.indigoSubtle  },
  confirmed: { label: 'Payment Confirmed', color: colors.success, bg: colors.successSubtle },
}

const EMPTY_META: Record<StatusTab, { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; body: string }> = {
  pending:  { icon: 'time-outline',         color: colors.warning, title: 'No pending registrations', body: 'New registrations will appear here for review'   },
  approved: { icon: 'checkmark-circle-outline', color: colors.success, title: 'No approved registrations', body: 'Approved guests will show up here'            },
  rejected: { icon: 'close-circle-outline',  color: colors.error,   title: 'No rejected registrations', body: 'Rejected registrations will appear here'        },
  all:      { icon: 'people-outline',        color: colors.blue,    title: 'No registrations yet',     body: 'Registrations for this event will appear here'   },
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function RegSkeleton() {
  return (
    <View style={{ padding: 16, gap: 10 }}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton height={14} width={160} style={{ borderRadius: 7 }} />
              <Skeleton height={12} width={200} style={{ borderRadius: 6 }} />
            </View>
            <Skeleton height={22} width={70} style={{ borderRadius: radius.full }} />
          </View>
          <Skeleton height={11} width={180} style={{ borderRadius: 5, marginTop: 4 }} />
        </View>
      ))}
    </View>
  )
}

/* ─── Screen ─────────────────────────────────────────────────────────────── */
export default function RegistrationsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>()
  const router = useRouter()
  const toast = useToast()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab]   = useState<StatusTab>('pending')
  const [updating, setUpdating]     = useState<UpdatingState>(null)
  const [search, setSearch]         = useState('')

  const load = useCallback(async (status: StatusTab) => {
    if (!eventId) return
    try {
      const { registrations: r } = await getOrganizerRegistrations(
        eventId,
        status === 'all' ? undefined : status,
      )
      setRegistrations(r)
    } catch (e: any) {
      toast.show({ type: 'error', message: e?.message || 'Couldn\'t load registrations. Pull down to retry.' })
    }
  }, [eventId])

  useEffect(() => {
    setLoading(true)
    setSearch('')
    load(activeTab).finally(() => setLoading(false))
  }, [activeTab])

  const onRefresh = async () => {
    setRefreshing(true)
    await load(activeTab)
    setRefreshing(false)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return registrations
    return registrations.filter(r =>
      r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    )
  }, [registrations, search])

  const pendingCount = registrations.filter(r => r.status === 'pending').length

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
            setUpdating({ id: regId, action })
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

  const empty = EMPTY_META[activeTab]

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabsScroll}
        contentContainerStyle={s.tabs}
      >
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

      {/* Search bar */}
      {!loading && registrations.length > 0 && (
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name or email…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {loading ? (
        <RegSkeleton />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={r => r.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <LinearGradient
                colors={[empty.color + '25', 'transparent']}
                style={s.emptyIconCircle}
              >
                <Ionicons name={search ? 'search-outline' : empty.icon} size={28} color={search ? colors.textMuted : empty.color} />
              </LinearGradient>
              <Text style={s.emptyTitle}>
                {search ? 'No results found' : empty.title}
              </Text>
              <Text style={s.emptyBody}>
                {search ? `No registrations match "${search}"` : empty.body}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const status = STATUS_META[item.status] ?? { label: item.status, color: colors.textMuted, bg: colors.surface2 }
            const paymentBadge = item.payment_status && item.payment_status !== 'not_required'
              ? PAYMENT_META[item.payment_status] ?? null
              : null
            const isUpdatingApprove = updating?.id === item.id && updating?.action === 'approve'
            const isUpdatingReject  = updating?.id === item.id && updating?.action === 'reject'
            const isUpdating = isUpdatingApprove || isUpdatingReject

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
                    {/* Reject */}
                    <TouchableOpacity
                      style={[s.actionBtn, s.rejectBtn, isUpdating && { opacity: 0.5 }]}
                      onPress={() => handleAction(item.id, 'reject', item.full_name)}
                      disabled={isUpdating}
                      activeOpacity={0.7}
                    >
                      {isUpdatingReject
                        ? <ActivityIndicator size="small" color={colors.error} />
                        : <>
                          <Ionicons name="close" size={16} color={colors.error} />
                          <Text style={[s.actionText, { color: colors.error }]}>Reject</Text>
                        </>
                      }
                    </TouchableOpacity>

                    {/* Approve */}
                    <TouchableOpacity
                      style={[s.actionBtn, s.approveBtn, isUpdating && { opacity: 0.5 }]}
                      onPress={() => handleAction(item.id, 'approve', item.full_name)}
                      disabled={isUpdating}
                      activeOpacity={0.7}
                    >
                      {isUpdatingApprove
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
      )}
    </SafeAreaView>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  nav: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  navTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  navSub:   { color: colors.textMuted,   fontSize: 12, fontFamily: 'DMSans_400Regular'   },
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
  tabActive:     { backgroundColor: colors.blueSubtle, borderColor: colors.blueBorder },
  tabText:       { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_500Medium' },
  tabTextActive: { color: colors.blue },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8, marginTop: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, height: 40,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: colors.textPrimary, fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    height: 40,
  },

  list: { padding: 16, gap: 10, paddingBottom: 32 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14, gap: 8,
  },
  cardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  badgeStack: { alignItems: 'flex-end', gap: 4 },
  cardName:  { color: colors.textPrimary,   fontSize: 15, fontFamily: 'DMSans_500Medium'   },
  cardEmail: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  cardPhone: { color: colors.textMuted,     fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, marginLeft: 8 },
  badgeText: { fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '600' },

  cardMeta:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },
  cardMetaDot:  { color: colors.textMuted, fontSize: 11 },

  actions:   { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 10, borderRadius: radius.sm, borderWidth: 1,
    minHeight: 40,
  },
  rejectBtn:      { borderColor: colors.error + '44', backgroundColor: colors.errorSubtle },
  approveBtn:     { backgroundColor: colors.blue, borderColor: 'transparent'             },
  actionText:     { fontFamily: 'DMSans_500Medium', fontSize: 14, fontWeight: '600'       },
  approveBtnText: { color: colors.white, fontFamily: 'DMSans_500Medium', fontSize: 14, fontWeight: '700' },

  emptyWrap:       { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32, gap: 10 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:      { color: colors.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  emptyBody:       { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 20 },
})

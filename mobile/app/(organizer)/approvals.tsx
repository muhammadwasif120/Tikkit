import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, TextInput,
  Alert, Modal,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { format } from 'date-fns'
import { Skeleton } from '@/components/Skeleton'
import {
  getApprovals, submitApprovalAction,
  ApprovalRegistration, ApprovalEvent,
} from '@/lib/api'
import { colors, radius } from '@/theme'

type Filter = 'pending' | 'payment' | 'approved' | 'rejected' | 'all'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'payment', label: 'Payment Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
]

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: colors.warning, bg: colors.warningSubtle },
  approved: { label: 'Approved', color: colors.success, bg: colors.successSubtle },
  rejected: { label: 'Declined', color: colors.error, bg: colors.errorSubtle },
}

const PAYMENT_META: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Payment Submitted', color: colors.indigo },
  pending:   { label: 'Awaiting Payment',  color: colors.warning },
  confirmed: { label: 'Payment Confirmed', color: colors.success },
  rejected:  { label: 'Payment Rejected',  color: colors.error },
}

export default function ApprovalsScreen() {
  const [filter, setFilter] = useState<Filter>('pending')
  const [registrations, setRegistrations] = useState<ApprovalRegistration[]>([])
  const [events, setEvents] = useState<ApprovalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ApprovalRegistration | null>(null)
  const [acting, setActing] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  const load = useCallback(async (f: Filter) => {
    try {
      const { registrations: r, events: e } = await getApprovals(f)
      setRegistrations(r)
      setEvents(e)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    setLoading(true)
    load(filter).finally(() => setLoading(false))
  }, [filter])

  const onRefresh = async () => {
    setRefreshing(true)
    await load(filter)
    setRefreshing(false)
  }

  const eventMap = Object.fromEntries(events.map(e => [e.id, e]))

  const filtered = registrations.filter(r => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
  })

  const handleAction = async (action: 'approve' | 'reject' | 'confirm_payment' | 'reject_payment', notes?: string) => {
    if (!selected) return
    setActing(true)
    try {
      await submitApprovalAction(selected.id, action, notes)
      setSelected(null)
      setShowRejectInput(false)
      setRejectNotes('')
      await load(filter)
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Action failed')
    } finally {
      setActing(false)
    }
  }

  const pendingCount = registrations.filter(r => r.status === 'pending').length

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      <View style={s.header}>
        <View>
          <Text style={s.heading}>Approvals</Text>
          {pendingCount > 0 && (
            <Text style={s.subheading}>{pendingCount} awaiting review</Text>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabs}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.tab, filter === f.key && s.tabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.tabText, filter === f.key && s.tabTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email…"
          placeholderTextColor={colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading
        ? (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <Skeleton height={38} width={38} style={{ borderRadius: 19 }} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton height={14} width="55%" style={{ borderRadius: 6 }} />
                    <Skeleton height={12} width="70%" style={{ borderRadius: 6 }} />
                  </View>
                  <Skeleton height={22} width={60} style={{ borderRadius: radius.full }} />
                </View>
                <Skeleton height={12} width="45%" style={{ borderRadius: 6 }} />
              </View>
            ))}
          </ScrollView>
        )
        : (
          <FlatList
            data={filtered}
            keyExtractor={r => r.id}
            contentContainerStyle={s.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
            ListEmptyComponent={
              <View style={s.empty}>
                <LinearGradient
                  colors={[
                    filter === 'pending' ? colors.warning + '25' : colors.blue + '25',
                    'transparent',
                  ] as [string, string]}
                  style={s.emptyIconCircle}
                >
                  <Ionicons
                    name={filter === 'pending' ? 'time-outline' : filter === 'approved' ? 'checkmark-circle-outline' : 'checkmark-done-outline'}
                    size={28}
                    color={filter === 'pending' ? colors.warning : filter === 'approved' ? colors.success : colors.blue}
                  />
                </LinearGradient>
                <Text style={s.emptyTitle}>
                  {filter === 'pending' ? 'All caught up!' : `No ${filter} registrations`}
                </Text>
                <Text style={s.emptyText}>
                  {filter === 'pending'
                    ? 'No applications are waiting for your review right now'
                    : 'Registrations with this status will appear here'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const event = eventMap[item.event_id]
              const statusMeta = STATUS_META[item.status] ?? { label: item.status, color: colors.textMuted, bg: colors.surface2 }
              const paymentMeta = item.payment_status ? PAYMENT_META[item.payment_status] : null

              return (
                <TouchableOpacity style={s.card} onPress={() => setSelected(item)} activeOpacity={0.8}>
                  <View style={s.cardTop}>
                    <View style={s.avatar}>
                      <Text style={s.avatarLetter}>{item.full_name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardName}>{item.full_name}</Text>
                      <Text style={s.cardEmail} numberOfLines={1}>{item.email}</Text>
                      {event && <Text style={s.cardEvent} numberOfLines={1}>{event.title}</Text>}
                    </View>
                    <View style={[s.badge, { backgroundColor: statusMeta.bg }]}>
                      <Text style={[s.badgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                    </View>
                  </View>
                  <View style={s.cardBottom}>
                    <Text style={s.cardDate}>{format(new Date(item.created_at), 'd MMM yyyy · h:mm a')}</Text>
                    {paymentMeta && (
                      <Text style={[s.paymentLabel, { color: paymentMeta.color }]}>{paymentMeta.label}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        )
      }

      {/* Detail / Action Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setSelected(null); setShowRejectInput(false); setRejectNotes('') }}>
        {selected && (
          <SafeAreaView style={s.modal}>
            <View style={s.modalNav}>
              <TouchableOpacity style={s.closeBtn} onPress={() => { setSelected(null); setShowRejectInput(false); setRejectNotes('') }}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={s.modalTitle}>Registration Details</Text>
              <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={s.modalContent} showsVerticalScrollIndicator={false}>
              {/* Applicant info */}
              <View style={s.detailCard}>
                <Text style={s.detailSectionLabel}>Applicant</Text>
                <DetailRow label="Name" value={selected.full_name} />
                <DetailRow label="Email" value={selected.email} />
                {selected.phone && <DetailRow label="Phone" value={selected.phone} />}
                <DetailRow label="Applied" value={format(new Date(selected.created_at), 'd MMM yyyy · h:mm a')} />
                {selected.reviewed_at && <DetailRow label="Reviewed" value={format(new Date(selected.reviewed_at), 'd MMM yyyy')} />}
              </View>

              {/* Event */}
              {eventMap[selected.event_id] && (
                <View style={s.detailCard}>
                  <Text style={s.detailSectionLabel}>Event</Text>
                  <DetailRow label="Event" value={eventMap[selected.event_id].title} />
                  <DetailRow label="Mode" value={eventMap[selected.event_id].registration_mode} />
                  {selected.reference_code_entered && (
                    <DetailRow label="Ref Code" value={selected.reference_code_entered} />
                  )}
                </View>
              )}

              {/* Payment */}
              {selected.payment_status && (
                <View style={s.detailCard}>
                  <Text style={s.detailSectionLabel}>Payment</Text>
                  <DetailRow label="Status" value={selected.payment_status} />
                  {selected.payment_screenshot_url && (
                    <View style={s.screenshotNote}>
                      <Ionicons name="image-outline" size={14} color={colors.indigo} />
                      <Text style={s.screenshotNoteText}>Payment screenshot attached</Text>
                    </View>
                  )}
                </View>
              )}

              {selected.notes && (
                <View style={s.detailCard}>
                  <Text style={s.detailSectionLabel}>Notes</Text>
                  <Text style={s.notesText}>{selected.notes}</Text>
                </View>
              )}

              {/* Actions */}
              {showRejectInput && (
                <View style={s.rejectInputWrap}>
                  <Text style={s.rejectInputLabel}>Rejection reason (optional)</Text>
                  <TextInput
                    style={s.rejectInput}
                    value={rejectNotes}
                    onChangeText={setRejectNotes}
                    placeholder="Explain why this registration was declined…"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <View style={s.actionRow}>
                    <TouchableOpacity style={s.cancelBtn} onPress={() => setShowRejectInput(false)}>
                      <Text style={s.cancelBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.rejectBtn, acting && { opacity: 0.6 }]}
                      onPress={() => handleAction(
                        selected.status === 'approved' && selected.payment_status === 'submitted'
                          ? 'reject_payment' : 'reject',
                        rejectNotes
                      )}
                      disabled={acting}
                    >
                      {acting ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={s.rejectBtnText}>Confirm Rejection</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {!showRejectInput && (
                <View style={s.actions}>
                  {/* Pending EOI → approve or reject */}
                  {selected.status === 'pending' && (
                    <>
                      <ActionButton
                        label="Approve" icon="checkmark-circle-outline" color={colors.success}
                        onPress={() => handleAction('approve')} loading={acting}
                      />
                      <ActionButton
                        label="Decline" icon="close-circle-outline" color={colors.error}
                        onPress={() => setShowRejectInput(true)} loading={false}
                      />
                    </>
                  )}

                  {/* Approved + payment submitted → confirm or reject payment */}
                  {selected.status === 'approved' && selected.payment_status === 'submitted' && (
                    <>
                      <ActionButton
                        label="Confirm Payment" icon="card-outline" color={colors.success}
                        onPress={() => handleAction('confirm_payment')} loading={acting}
                      />
                      <ActionButton
                        label="Reject Payment" icon="close-circle-outline" color={colors.error}
                        onPress={() => setShowRejectInput(true)} loading={false}
                      />
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  )
}

function ActionButton({ label, icon, color, onPress, loading }: {
  label: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void; loading: boolean
}) {
  return (
    <TouchableOpacity
      style={[s.actionBtn, { backgroundColor: color + '1A', borderColor: color + '44' }, loading && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator size="small" color={color} />
        : <Ionicons name={icon} size={18} color={color} />
      }
      <Text style={[s.actionBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  heading: { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold' },
  subheading: { color: colors.warning, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },

  tabsScroll: { flexGrow: 0, marginBottom: 8 },
  tabs: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full },
  tabActive: { backgroundColor: colors.blueSubtle, borderColor: colors.blueBorder },
  tabText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_500Medium' },
  tabTextActive: { color: colors.blue },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, marginHorizontal: 16, paddingHorizontal: 12,
    paddingVertical: 10, marginBottom: 8,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular' },

  list: { padding: 16, gap: 10, paddingBottom: 32 },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 14,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.blueSubtle, alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { color: colors.blue, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  cardName: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  cardEmail: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  cardEvent: { color: colors.blue, fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontSize: 11, fontFamily: 'DMSans_500Medium', fontWeight: '600' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },
  paymentLabel: { fontSize: 11, fontFamily: 'DMSans_500Medium', fontWeight: '600' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  emptyText: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', textAlign: 'center', maxWidth: 240, lineHeight: 20 },

  // Modal
  modal: { flex: 1, backgroundColor: colors.pageBg },
  modalNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  modalContent: { padding: 16, gap: 12, paddingBottom: 40 },

  detailCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10,
  },
  detailSectionLabel: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_500Medium', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailLabel: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  detailValue: { color: colors.textPrimary, fontSize: 13, fontFamily: 'DMSans_500Medium', flex: 1, textAlign: 'right' },

  screenshotNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  screenshotNoteText: { color: colors.indigo, fontSize: 12, fontFamily: 'DMSans_400Regular' },

  notesText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 20 },

  rejectInputWrap: { gap: 10 },
  rejectInputLabel: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_500Medium' },
  rejectInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 12, color: colors.textPrimary,
    fontSize: 14, fontFamily: 'DMSans_400Regular', height: 80,
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, backgroundColor: colors.surface2, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingVertical: 12, alignItems: 'center',
  },
  cancelBtnText: { color: colors.textSecondary, fontFamily: 'DMSans_500Medium', fontSize: 14 },
  rejectBtn: {
    flex: 2, backgroundColor: colors.error + '1A', borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.error + '44', paddingVertical: 12, alignItems: 'center',
  },
  rejectBtnText: { color: colors.error, fontFamily: 'DMSans_500Medium', fontSize: 14, fontWeight: '700' },

  actions: { gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: radius.md, borderWidth: 1, paddingVertical: 14,
  },
  actionBtnText: { fontSize: 15, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
})

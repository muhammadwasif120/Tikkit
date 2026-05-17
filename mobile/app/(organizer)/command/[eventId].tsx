import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  RefreshControl, TouchableOpacity, FlatList, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import {
  getCommandCenter, commandUpdateStatus, commandSendMessage,
  CommandAttendee, CommandMessage, CommandEvent,
} from '@/lib/api'
import { colors, radius } from '@/theme'

type Tab = 'attendees' | 'chat'

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pending',  color: colors.warning,  bg: colors.warningSubtle },
  approved: { label: 'Approved', color: colors.success,  bg: colors.successSubtle },
  rejected: { label: 'Declined', color: colors.error,    bg: colors.errorSubtle },
}

export default function CommandEventScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>()
  const router = useRouter()

  const [tab, setTab] = useState<Tab>('attendees')
  const [event, setEvent] = useState<CommandEvent | null>(null)
  const [attendees, setAttendees] = useState<CommandAttendee[]>([])
  const [messages, setMessages] = useState<CommandMessage[]>([])
  const [stats, setStats] = useState({ totalAttendees: 0, approvedCount: 0, pendingCount: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [acting, setActing] = useState<string | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await getCommandCenter(eventId!)
      setEvent(data.event)
      setAttendees(data.attendees)
      setMessages(data.messages)
      setStats(data.stats)
    } catch { /* silent */ }
  }, [eventId])

  useEffect(() => { load().finally(() => setLoading(false)) }, [])
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const handleAction = async (registrationId: string, action: 'approve' | 'reject' | 'confirm_payment') => {
    setActing(registrationId)
    try {
      await commandUpdateStatus(eventId!, registrationId, action)
      await load()
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Action failed')
    } finally {
      setActing(null)
    }
  }

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return
    setSendingMsg(true)
    try {
      const { message } = await commandSendMessage(eventId!, chatMessage.trim())
      setMessages(prev => [...prev, message])
      setChatMessage('')
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to send message')
    } finally {
      setSendingMsg(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar style="light" />
        <View style={s.nav}><TouchableOpacity style={s.backBtn} onPress={() => router.back()}><Ionicons name="arrow-back" size={20} color={colors.textPrimary} /></TouchableOpacity></View>
        <ActivityIndicator color={colors.blue} style={{ marginTop: 40 }} />
      </SafeAreaView>
    )
  }

  const isLive = event?.status === 'published'

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.navTitle} numberOfLines={1}>{event?.title ?? 'Command Center'}</Text>
          {event && <Text style={s.navSub}>{format(new Date(event.date_start), 'd MMM yyyy')}</Text>}
        </View>
        {isLive && (
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <Text style={s.liveBadgeText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Stats strip */}
      <View style={s.statsStrip}>
        <StatChip label="Total" value={stats.totalAttendees} color={colors.blue} />
        <StatChip label="Approved" value={stats.approvedCount} color={colors.success} />
        <StatChip label="Pending" value={stats.pendingCount} color={colors.warning} />
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        <TouchableOpacity style={[s.tabBtn, tab === 'attendees' && s.tabBtnActive]} onPress={() => setTab('attendees')}>
          <Ionicons name="people-outline" size={16} color={tab === 'attendees' ? colors.blue : colors.textMuted} />
          <Text style={[s.tabBtnText, tab === 'attendees' && s.tabBtnTextActive]}>Attendees</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === 'chat' && s.tabBtnActive]} onPress={() => setTab('chat')}>
          <Ionicons name="chatbubbles-outline" size={16} color={tab === 'chat' ? colors.blue : colors.textMuted} />
          <Text style={[s.tabBtnText, tab === 'chat' && s.tabBtnTextActive]}>Chat</Text>
        </TouchableOpacity>
      </View>

      {tab === 'attendees' && (
        <FlatList
          data={attendees}
          keyExtractor={a => a.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="people-outline" size={36} color={colors.textMuted} />
              <Text style={s.emptyText}>No attendees yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const sm = STATUS_META[item.status] ?? { label: item.status, color: colors.textMuted, bg: colors.surface2 }
            const isActing = acting === item.id
            return (
              <View style={s.attendeeCard}>
                <View style={s.attendeeTop}>
                  <View style={s.attendeeAvatar}>
                    <Text style={s.attendeeAvatarText}>{item.full_name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.attendeeName}>{item.full_name}</Text>
                    <Text style={s.attendeeEmail} numberOfLines={1}>{item.email}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: sm.bg }]}>
                    <Text style={[s.badgeText, { color: sm.color }]}>{sm.label}</Text>
                  </View>
                </View>

                {/* Action buttons for pending */}
                {item.status === 'pending' && (
                  <View style={s.attendeeActions}>
                    <TouchableOpacity
                      style={[s.actionBtn, { backgroundColor: colors.successSubtle, borderColor: colors.success + '44' }]}
                      onPress={() => handleAction(item.id, 'approve')}
                      disabled={!!acting}
                    >
                      {isActing ? <ActivityIndicator size="small" color={colors.success} /> : <Ionicons name="checkmark" size={14} color={colors.success} />}
                      <Text style={[s.actionBtnText, { color: colors.success }]}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.actionBtn, { backgroundColor: colors.errorSubtle, borderColor: colors.error + '44' }]}
                      onPress={() => handleAction(item.id, 'reject')}
                      disabled={!!acting}
                    >
                      {isActing ? <ActivityIndicator size="small" color={colors.error} /> : <Ionicons name="close" size={14} color={colors.error} />}
                      <Text style={[s.actionBtnText, { color: colors.error }]}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Payment submitted */}
                {item.status === 'approved' && item.payment_status === 'submitted' && (
                  <View style={s.attendeeActions}>
                    <View style={[s.paymentNote, { flex: 1 }]}>
                      <Ionicons name="card-outline" size={13} color={colors.indigo} />
                      <Text style={s.paymentNoteText}>Payment screenshot submitted</Text>
                    </View>
                    <TouchableOpacity
                      style={[s.actionBtn, { backgroundColor: colors.successSubtle, borderColor: colors.success + '44' }]}
                      onPress={() => handleAction(item.id, 'confirm_payment')}
                      disabled={!!acting}
                    >
                      {isActing ? <ActivityIndicator size="small" color={colors.success} /> : <Text style={[s.actionBtnText, { color: colors.success }]}>Confirm</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )
          }}
        />
      )}

      {tab === 'chat' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={s.chatList}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
          >
            {messages.length === 0 && (
              <View style={s.empty}>
                <Ionicons name="chatbubbles-outline" size={36} color={colors.textMuted} />
                <Text style={s.emptyText}>No messages yet</Text>
                <Text style={s.emptySubtext}>Send a broadcast message to all attendees</Text>
              </View>
            )}
            {messages.map(msg => (
              <View key={msg.id} style={[s.msgBubble, msg.role === 'organizer' && s.msgBubbleOrg]}>
                <Text style={[s.msgSender, msg.role === 'organizer' && { color: colors.blue }]}>{msg.sender_name}</Text>
                <Text style={s.msgText}>{msg.message}</Text>
                <Text style={s.msgTime}>{format(new Date(msg.created_at), 'h:mm a')}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={s.chatInput}>
            <TextInput
              style={s.chatTextInput}
              value={chatMessage}
              onChangeText={setChatMessage}
              placeholder="Send a message to all attendees…"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <TouchableOpacity
              style={[s.sendBtn, (!chatMessage.trim() || sendingMsg) && { opacity: 0.4 }]}
              onPress={handleSendMessage}
              disabled={!chatMessage.trim() || sendingMsg}
            >
              {sendingMsg
                ? <ActivityIndicator size="small" color={colors.white} />
                : <Ionicons name="send" size={18} color={colors.white} />
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[s.statChip, { borderLeftColor: color }]}>
      <Text style={s.statChipValue}>{value}</Text>
      <Text style={s.statChipLabel}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { color: colors.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  navSub: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.successSubtle, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.success + '44',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  liveBadgeText: { color: colors.success, fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  statsStrip: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8,
  },
  statChip: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3,
    padding: 10, alignItems: 'center',
  },
  statChipValue: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  statChipLabel: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_400Regular' },

  tabBar: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 8,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 4, gap: 4,
  },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: radius.sm },
  tabBtnActive: { backgroundColor: colors.blueSubtle },
  tabBtnText: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_500Medium' },
  tabBtnTextActive: { color: colors.blue },

  list: { padding: 16, gap: 10, paddingBottom: 32 },

  attendeeCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 14,
  },
  attendeeTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 0 },
  attendeeAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.blueSubtle, alignItems: 'center', justifyContent: 'center',
  },
  attendeeAvatarText: { color: colors.blue, fontSize: 14, fontFamily: 'Poppins_700Bold' },
  attendeeName: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  attendeeEmail: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '600' },

  attendeeActions: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, borderRadius: radius.sm, borderWidth: 1, paddingVertical: 8,
  },
  actionBtnText: { fontSize: 13, fontFamily: 'DMSans_500Medium', fontWeight: '600' },
  paymentNote: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  paymentNoteText: { color: colors.indigo, fontSize: 11, fontFamily: 'DMSans_400Regular' },

  chatList: { padding: 16, gap: 12, paddingBottom: 16 },
  msgBubble: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 12,
    maxWidth: '85%', alignSelf: 'flex-start',
  },
  msgBubbleOrg: {
    backgroundColor: colors.blueSubtle, borderColor: colors.blueBorder,
    alignSelf: 'flex-end',
  },
  msgSender: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_500Medium', marginBottom: 4 },
  msgText: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 20 },
  msgTime: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_400Regular', marginTop: 4, textAlign: 'right' },

  chatInput: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  chatTextInput: {
    flex: 1, backgroundColor: colors.surface2, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100,
    color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center',
  },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: colors.textPrimary, fontSize: 16, fontFamily: 'DMSans_500Medium' },
  emptySubtext: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', textAlign: 'center' },
})

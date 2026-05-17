import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format, isToday, isYesterday } from 'date-fns'
import { getGuestChat, sendGuestChatMessage, ChatMessage } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { colors, radius } from '@/theme'

function fmtTime(iso: string) {
  const d = new Date(iso)
  const time = format(d, 'h:mm a')
  if (isToday(d)) return time
  if (isYesterday(d)) return `Yesterday · ${time}`
  return `${format(d, 'd MMM')} · ${time}`
}

function DateDivider({ label }: { label: string }) {
  return (
    <View style={s.dateDivider}>
      <View style={s.dateLine} />
      <Text style={s.dateLabel}>{label}</Text>
      <View style={s.dateLine} />
    </View>
  )
}

function MessageBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  return (
    <View style={[s.msgRow, isMe && s.msgRowMe]}>
      {!isMe && (
        <View style={s.avatar}>
          <Ionicons name="person" size={14} color={colors.textMuted} />
        </View>
      )}
      <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
        {!isMe && (
          <Text style={s.senderName}>{msg.sender_name}</Text>
        )}
        <Text style={[s.msgText, isMe && s.msgTextMe]}>{msg.message}</Text>
        <Text style={[s.msgTime, isMe && s.msgTimeMe]}>{fmtTime(msg.created_at)}</Text>
      </View>
    </View>
  )
}

export default function GuestChatScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [eventTitle, setEventTitle] = useState('')
  const [organizerName, setOrganizerName] = useState('Organizer')
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<FlatList>(null)

  const load = useCallback(async () => {
    if (!eventId) return
    try {
      const { messages: msgs, event } = await getGuestChat(eventId)
      setMessages(msgs)
      setEventTitle(event.title)
      setOrganizerName(event.organizer_name ?? 'Organizer')
    } catch { /* silent */ }
  }, [eventId])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100)
    }
  }, [messages.length])

  // Real-time subscription via Supabase
  useEffect(() => {
    if (!eventId || !userId) return

    const channel = (supabase as any)
      .channel(`guest-chat-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_chats', filter: `event_id=eq.${eventId}` },
        (payload: any) => {
          const msg = payload.new as any
          // Skip our own messages — already optimistically added
          if (msg.user_id === userId) return
          // Only show organizer messages
          if (msg.role !== 'organizer') return
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, {
              ...msg,
              sender_name: organizerName,
              is_mine: false,
            }]
          })
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId, userId, organizerName])

  const send = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return
    setSending(true)
    setInput('')

    // Optimistic UI
    const tempId = `temp-${Date.now()}`
    const optimistic: ChatMessage = {
      id: tempId,
      user_id: userId ?? '',
      role: 'guest',
      message: trimmed,
      created_at: new Date().toISOString(),
      sender_name: 'You',
      is_mine: true,
    }
    setMessages(prev => [...prev, optimistic])
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)

    try {
      const { message: sent } = await sendGuestChatMessage(eventId, trimmed)
      // Replace temp with real message
      setMessages(prev => prev.map(m => m.id === tempId ? { ...sent, is_mine: true } : m))
    } catch (e: any) {
      // Revert optimistic
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setInput(trimmed)
    } finally {
      setSending(false)
    }
  }

  // Group messages with date dividers
  const grouped = messages.reduce<Array<ChatMessage | { type: 'divider'; label: string; key: string }>>((acc, msg) => {
    const d = new Date(msg.created_at)
    let label = ''
    if (isToday(d)) label = 'Today'
    else if (isYesterday(d)) label = 'Yesterday'
    else label = format(d, 'EEEE, d MMMM')

    const lastDivider = [...acc].reverse().find(item => 'type' in item && item.type === 'divider') as any
    if (!lastDivider || lastDivider.label !== label) {
      acc.push({ type: 'divider', label, key: `div-${msg.id}` })
    }
    acc.push(msg)
    return acc
  }, [])

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle} numberOfLines={1}>{eventTitle || 'Chat'}</Text>
          <View style={s.onlineRow}>
            <View style={s.onlineDot} />
            <Text style={s.headerSub}>{organizerName} · Live chat</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator color={colors.blue} size="large" />
          </View>
        ) : messages.length === 0 ? (
          <View style={s.emptyWrap}>
            <View style={s.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={32} color={colors.textMuted} />
            </View>
            <Text style={s.emptyTitle}>Start the conversation</Text>
            <Text style={s.emptyText}>
              Message the organizer if you have any questions about the event.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={grouped}
            keyExtractor={item => ('id' in item ? item.id : (item as any).key)}
            contentContainerStyle={s.msgList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              if ('type' in item && item.type === 'divider') {
                return <DateDivider label={item.label} />
              }
              const msg = item as ChatMessage
              return <MessageBubble msg={msg} isMe={msg.is_mine ?? msg.user_id === userId} />
            }}
          />
        )}

        {/* Input bar */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnDisabled]}
            onPress={send}
            disabled={!input.trim() || sending}
          >
            {sending
              ? <ActivityIndicator color={colors.white} size="small" />
              : <Ionicons name="send" size={18} color={colors.white} />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  headerInfo: { flex: 1 },
  headerTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  headerSub: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  onlineDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success,
    shadowColor: colors.success, shadowOpacity: 0.8, shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
  },

  msgList: { padding: 16, gap: 4, paddingBottom: 8 },

  dateDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  dateLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dateLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 2 },
  msgRowMe: { flexDirection: 'row-reverse' },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  bubble: {
    maxWidth: '78%', borderRadius: 16, padding: 10, gap: 3,
  },
  bubbleThem: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: colors.blue,
    borderBottomRightRadius: 4,
  },

  senderName: { color: colors.blue, fontSize: 10, fontFamily: 'DMSans_500Medium', marginBottom: 2 },
  msgText: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 20 },
  msgTextMe: { color: colors.white },
  msgTime: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_400Regular', alignSelf: 'flex-end' },
  msgTimeMe: { color: 'rgba(255,255,255,0.6)' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  emptyText: { color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 21 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1, minHeight: 40, maxHeight: 120,
    backgroundColor: colors.surface2, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
    color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
})

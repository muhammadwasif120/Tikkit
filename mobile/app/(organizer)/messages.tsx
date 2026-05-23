import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  RefreshControl, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native'
import { useState, useEffect, useCallback, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { format } from 'date-fns'
import { Skeleton } from '@/components/Skeleton'
import { getSupportMessages, sendSupportMessage, SupportMessage } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { colors, radius } from '@/theme'

export default function MessagesScreen() {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const load = useCallback(async () => {
    try {
      const { messages: m } = await getSupportMessages()
      setMessages(m)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  // Real-time: listen for new messages on this user's thread
  useEffect(() => {
    const channel = (supabase as any)
      .channel('support_messages_rt')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages' },
        (payload: any) => {
          const msg = payload.new as SupportMessage
          setMessages(prev => {
            // Deduplicate (the optimistic send already added the user's own message)
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const handleSend = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      const { message } = await sendSupportMessage(text.trim())
      setMessages(prev => [...prev, message])
      setText('')
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar style="light" />
        <View style={s.navBar}>
          <Text style={s.navTitle}>Support Chat</Text>
          <Text style={s.navSub}>We typically reply within a few hours</Text>
        </View>
        <View style={{ padding: 16, gap: 10 }}>
          {/* Intro card skeleton */}
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Skeleton height={48} width={48} style={{ borderRadius: 24 }} />
            <Skeleton height={16} width={110} style={{ borderRadius: 8 }} />
            <Skeleton height={13} width={240} style={{ borderRadius: 6 }} />
            <Skeleton height={13} width={200} style={{ borderRadius: 6 }} />
          </View>
          {/* Bubble skeletons */}
          <Skeleton height={52} width="55%" style={{ borderRadius: radius.md, alignSelf: 'flex-start' }} />
          <Skeleton height={40} width="45%" style={{ borderRadius: radius.md, alignSelf: 'flex-end' }} />
          <Skeleton height={64} width="65%" style={{ borderRadius: radius.md, alignSelf: 'flex-start' }} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      <View style={s.navBar}>
        <View>
          <Text style={s.navTitle}>Support Chat</Text>
          <Text style={s.navSub}>We typically reply within a few hours</Text>
        </View>
        <View style={s.supportBadge}>
          <View style={s.supportDot} />
          <Text style={s.supportBadgeText}>Online</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.chatList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {/* Intro card */}
          <View style={s.introCard}>
            <LinearGradient colors={[colors.blue + '30', 'transparent']} style={s.introIcon}>
              <Ionicons name="headset-outline" size={24} color={colors.blue} />
            </LinearGradient>
            <Text style={s.introTitle}>Tikkit Support</Text>
            <Text style={s.introDesc}>
              Hey! Send us a message and we'll get back to you as soon as possible. We're here to help with your events, payouts, and anything else.
            </Text>
          </View>

          {messages.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="chatbubble-ellipses-outline" size={36} color={colors.textMuted} />
              <Text style={s.emptyText}>No messages yet</Text>
              <Text style={s.emptySubtext}>Ask us anything about your events</Text>
            </View>
          ) : (
            messages.map(msg => (
              <View
                key={msg.id}
                style={[
                  s.bubble,
                  msg.sender === 'user' ? s.bubbleUser : s.bubbleSupport,
                ]}
              >
                {msg.sender !== 'user' && (
                  <Text style={s.bubbleSender}>Tikkit Support</Text>
                )}
                <Text style={[s.bubbleText, msg.sender === 'user' && s.bubbleTextUser]}>
                  {msg.message}
                </Text>
                <Text style={[s.bubbleTime, msg.sender === 'user' && { color: colors.blue + 'AA' }]}>
                  {format(new Date(msg.created_at), 'h:mm a')}
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        {/* Input */}
        <View style={s.inputRow}>
          <TextInput
            style={s.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Type your message…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color={colors.white} />
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

  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  navTitle: { color: colors.textPrimary, fontSize: 22, fontFamily: 'Poppins_700Bold' },
  navSub: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  supportBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.successSubtle, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.success + '44',
  },
  supportDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  supportBadgeText: { color: colors.success, fontSize: 11, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  chatList: { padding: 16, gap: 10, paddingBottom: 16 },

  introCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 20,
    alignItems: 'center', gap: 10, marginBottom: 8,
  },
  introIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.blueSubtle, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.blueBorder,
  },
  introTitle: { color: colors.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  introDesc: {
    color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular',
    lineHeight: 20, textAlign: 'center',
  },

  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { color: colors.textPrimary, fontSize: 16, fontFamily: 'DMSans_500Medium' },
  emptySubtext: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', textAlign: 'center' },

  bubble: {
    borderRadius: radius.md, padding: 12, maxWidth: '80%', borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: colors.blueSubtle, borderColor: colors.blueBorder,
    alignSelf: 'flex-end',
  },
  bubbleSupport: {
    backgroundColor: colors.surface, borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  bubbleSender: {
    color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_500Medium', marginBottom: 4,
  },
  bubbleText: {
    color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 20,
  },
  bubbleTextUser: { color: colors.blue },
  bubbleTime: {
    color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_400Regular',
    marginTop: 4, textAlign: 'right',
  },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  textInput: {
    flex: 1, backgroundColor: colors.surface2, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100,
    color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center',
  },
})

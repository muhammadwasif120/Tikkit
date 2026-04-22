'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendGuestMessage, getGuestChatMessages } from '@/app/actions/commandActions'
import { sendSupportMessage } from '@/app/actions/supportActions'
import { Send, Loader2, ArrowLeft, Globe, Lock, MessageSquare, ShieldCheck } from 'lucide-react'
import type { ChatMessage } from '@/types/verification'
import type { SupportMessage } from '@/app/actions/supportActions'

const SUPPORT_ID = '__support__'

type Thread = {
  eventId: string
  eventTitle: string
  coverImageUrl: string | null
  dateStart: string | null
  organizerName: string
  lastMessage: { text: string; createdAt: string; role: string } | null
  status: string
}

function fmtMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function fmtListTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString('en-PK', { weekday: 'short' })
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
}

export default function MessagesClient({
  threads,
  userId,
  initialMessages,
  initialSupportMessages = [],
}: {
  threads: Thread[]
  userId: string
  initialMessages: Record<string, ChatMessage[]>
  initialSupportMessages?: SupportMessage[]
}) {
  const [selectedId, setSelectedId] = useState<string | null>(SUPPORT_ID)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')
  const [messagesByEvent, setMessagesByEvent] = useState<Record<string, ChatMessage[]>>(initialMessages)
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>(initialSupportMessages)
  const [loadingThread, setLoadingThread] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [lastRead, setLastRead] = useState<Record<string, string>>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const stored: Record<string, string> = {}
    for (const t of threads) {
      const val = localStorage.getItem(`chat_read_${t.eventId}`)
      if (val) stored[t.eventId] = val
    }
    // Support thread last-read
    const supportRead = localStorage.getItem(`chat_read_${SUPPORT_ID}`)
    if (supportRead) stored[SUPPORT_ID] = supportRead
    setLastRead(stored)
  }, [threads])

  useEffect(() => {
    if (!selectedId) return
    const now = new Date().toISOString()
    localStorage.setItem(`chat_read_${selectedId}`, now)
    setLastRead(prev => ({ ...prev, [selectedId]: now }))
  }, [selectedId])

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messagesByEvent, supportMessages, selectedId])

  useEffect(() => {
    if (selectedId === SUPPORT_ID) {
      import('@/app/actions/supportActions').then(m => m.markSupportMessagesRead().catch(console.error))
    }
  }, [selectedId])

  useEffect(() => {
    if (!threads.length) return
    const threadMap = Object.fromEntries(threads.map(t => [t.eventId, t]))
    const channels = threads.map(t =>
      (supabase as any)
        .channel(`guest-inbox-${t.eventId}-${userId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'event_chats',
          filter: `event_id=eq.${t.eventId}`,
        }, (payload: any) => {
          const msg = payload.new as any
          const isOwn = msg.user_id === userId
          const isOrgBroadcast = msg.role === 'organizer' && !msg.recipient_user_id
          const isPrivateToMe = msg.role === 'organizer' && msg.recipient_user_id === userId
          if (!isOwn && !isOrgBroadcast && !isPrivateToMe) return
          const senderName = isOwn ? 'You' : (threadMap[t.eventId]?.organizerName ?? 'Organizer')
          setMessagesByEvent(prev => ({
            ...prev,
            [t.eventId]: [...(prev[t.eventId] ?? []), { ...msg, sender_name: senderName, sender_avatar: null }],
          }))
        })
        .subscribe()
    )

    // Realtime for support messages
    const supportChannel = (supabase as any)
      .channel(`support-messages-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'support_messages',
        filter: `user_id=eq.${userId}`,
      }, (payload: any) => {
        const msg = payload.new as SupportMessage
        setSupportMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      })
      .subscribe()

    return () => {
      channels.forEach(c => supabase.removeChannel(c))
      supabase.removeChannel(supportChannel)
    }
  }, [threads, userId, supabase])

  const selectThread = async (eventId: string) => {
    setSelectedId(eventId)
    setMobileView('thread')
    if (eventId === SUPPORT_ID) return
    if (!messagesByEvent[eventId]) {
      setLoadingThread(true)
      const result = await getGuestChatMessages(eventId)
      setMessagesByEvent(prev => ({ ...prev, [eventId]: result.messages ?? [] }))
      setLoadingThread(false)
    }
  }

  const handleSend = async () => {
    if (!selectedId || !input.trim() || sending) return
    setSending(true)
    setSendError(null)
    const text = input.trim()
    setInput('')

    if (selectedId === SUPPORT_ID) {
      const result = await sendSupportMessage(text)
      if (result.error) {
        setSendError(result.error)
        setInput(text)
      } else {
        // Optimistic update — realtime will also fire
        const optimistic: SupportMessage = {
          id: `opt-${Date.now()}`,
          user_id: userId,
          user_name: 'You',
          user_type: 'attendee',
          message: text,
          sender: 'user',
          created_at: new Date().toISOString(),
        }
        setSupportMessages(prev => [...prev, optimistic])
      }
    } else {
      const result = await sendGuestMessage(selectedId, text)
      if (result.error) {
        setSendError(result.error)
        setInput(text)
      }
    }
    setSending(false)
  }

  const hasUnread = (eventId: string, role?: string, lastMsgAt?: string) => {
    if (!lastMsgAt || role !== 'organizer') return false
    const readAt = lastRead[eventId]
    if (!readAt) return true
    return new Date(lastMsgAt) > new Date(readAt)
  }

  const hasSupportUnread = () => {
    const lastMsg = supportMessages[supportMessages.length - 1]
    if (!lastMsg || lastMsg.sender !== 'admin') return false
    const readAt = lastRead[SUPPORT_ID]
    if (!readAt) return true
    return new Date(lastMsg.created_at) > new Date(readAt)
  }

  const selectedThread = selectedId !== SUPPORT_ID ? threads.find(t => t.eventId === selectedId) : null
  const currentMessages = selectedId && selectedId !== SUPPORT_ID ? (messagesByEvent[selectedId] ?? []) : []
  const isSupport = selectedId === SUPPORT_ID

  // Support last message for list display
  const supportLastMsg = supportMessages[supportMessages.length - 1]

  /* ── Empty state ────────────────────────────────────────────── */
  if (threads.length === 0 && supportMessages.length === 0 && !selectedId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12, padding: 24 }}>
        <MessageSquare size={48} color="var(--brand-blue)" style={{ opacity: 0.15 }} />
        <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>No conversations yet</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, textAlign: 'center' }}>Register for events to chat with organizers, or use TIKKIT X Support below.</p>
        <button
          onClick={() => { setSelectedId(SUPPORT_ID); setMobileView('thread') }}
          style={{ marginTop: 8, background: 'rgba(var(--brand-blue-rgb),0.12)', border: '1px solid rgba(var(--brand-blue-rgb),0.3)', borderRadius: 10, padding: '10px 20px', color: 'var(--brand-blue)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)' }}
        >
          <ShieldCheck size={14} /> Open TIKKIT X Support
        </button>
      </div>
    )
  }

  /* ── Thread list ─────────────────────────────────────────────── */
  const ThreadList = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--guest-border)', flexShrink: 0 }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>Messages</h2>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* TIKKIT X Support thread — always pinned at top */}
        {(() => {
          const active = selectedId === SUPPORT_ID
          const unread = hasSupportUnread()
          return (
            <button
              onClick={() => selectThread(SUPPORT_ID)}
              style={{
                display: 'flex', gap: 12, padding: '14px 16px', width: '100%',
                background: active ? 'rgba(var(--brand-blue-rgb),0.07)' : 'rgba(var(--brand-blue-rgb),0.03)',
                border: 'none', borderBottom: '2px solid var(--guest-border)',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s', alignItems: 'center',
              }}
            >
              <div style={{
                width: 50, height: 50, borderRadius: 13, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(var(--brand-blue-rgb),0.25), rgba(var(--brand-blue-rgb),0.1))',
                border: '1px solid rgba(var(--brand-blue-rgb),0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldCheck size={22} color="var(--brand-blue)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 800, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: 8 }}>
                    TIKKIT X Support
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {supportLastMsg && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{fmtListTime(supportLastMsg.created_at)}</span>}
                    {unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-blue)', flexShrink: 0, boxShadow: '0 0 6px rgba(var(--brand-blue-rgb),0.8)' }} />}
                  </div>
                </div>
                <p style={{ color: 'var(--brand-blue)', fontSize: 11, margin: '0 0 3px', fontWeight: 600, opacity: 0.75 }}>Official Support</p>
                {supportLastMsg ? (
                  <p style={{ color: unread ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: unread ? 600 : 400 }}>
                    {supportLastMsg.sender === 'admin' ? '🛡️ ' : 'You: '}{supportLastMsg.message}
                  </p>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0, fontStyle: 'italic' }}>Tap to contact support</p>
                )}
              </div>
            </button>
          )
        })()}

        {/* Event threads */}
        {threads.map(t => {
          const active = t.eventId === selectedId
          const unread = hasUnread(t.eventId, t.lastMessage?.role, t.lastMessage?.createdAt)
          return (
            <button
              key={t.eventId}
              onClick={() => selectThread(t.eventId)}
              style={{
                display: 'flex', gap: 12, padding: '14px 16px', width: '100%',
                background: active ? 'rgba(var(--brand-blue-rgb),0.07)' : 'transparent',
                border: 'none', borderBottom: '1px solid var(--guest-border)',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s', alignItems: 'center',
              }}
            >
              <div style={{
                width: 50, height: 50, borderRadius: 13, flexShrink: 0,
                background: t.coverImageUrl ? `url(${t.coverImageUrl}) center/cover` : 'var(--surface-card-2)',
                border: '1px solid var(--guest-border)',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: unread ? 800 : 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: 8 }}>
                    {t.eventTitle}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {t.lastMessage && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{fmtListTime(t.lastMessage.createdAt)}</span>}
                    {unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-blue)', flexShrink: 0, boxShadow: '0 0 6px rgba(var(--brand-blue-rgb),0.8)' }} />}
                  </div>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.organizerName}
                </p>
                {t.lastMessage ? (
                  <p style={{ color: unread ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: unread ? 600 : 400 }}>
                    {t.lastMessage.role === 'organizer' ? '📢 ' : 'You: '}
                    {t.lastMessage.text}
                  </p>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0, fontStyle: 'italic' }}>No messages yet</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )

  /* ── Support chat thread ──────────────────────────────────────── */
  const SupportThread = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--guest-border)', flexShrink: 0, background: 'var(--surface-card)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => setMobileView('list')} className="md:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, rgba(var(--brand-blue-rgb),0.25), rgba(var(--brand-blue-rgb),0.1))', border: '1px solid rgba(var(--brand-blue-rgb),0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={18} color="var(--brand-blue)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, margin: 0 }}>TIKKIT X Support</p>
          <p style={{ color: 'var(--brand-blue)', fontSize: 11, margin: '1px 0 0', opacity: 0.8 }}>Official Support Channel</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'thin', scrollbarColor: 'var(--guest-border) transparent' }}>
        {supportMessages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '40px 20px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(var(--brand-blue-rgb),0.1)', border: '1px solid rgba(var(--brand-blue-rgb),0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={26} color="var(--brand-blue)" />
            </div>
            <p style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, margin: 0, textAlign: 'center' }}>TIKKIT X Support</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', margin: 0, maxWidth: 280, lineHeight: 1.5 }}>
              Send us a message and our team will respond as soon as possible. We're here to help!
            </p>
          </div>
        ) : supportMessages.map(msg => {
          const isMe = msg.sender === 'user'
          const label = isMe ? 'You' : 'TIKKIT Support'
          const initials = isMe ? 'ME' : 'TX'
          return (
            <div key={msg.id} style={{ display: 'flex', gap: 8, maxWidth: '80%', alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: isMe ? 'rgba(var(--brand-blue-rgb),0.2)' : 'rgba(239,68,68,0.15)', border: `1px solid ${isMe ? 'rgba(var(--brand-blue-rgb),0.3)' : 'rgba(239,68,68,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: isMe ? 'var(--brand-blue)' : '#F87171' }}>
                {initials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, margin: 0, textAlign: isMe ? 'right' : 'left' }}>{label}</p>
                <div style={{ padding: '8px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word', background: isMe ? 'rgba(var(--brand-blue-rgb),0.18)' : 'var(--surface-card-2)', border: `1px solid ${isMe ? 'rgba(var(--brand-blue-rgb),0.25)' : 'var(--guest-border)'}`, color: isMe ? '#C7D6FF' : 'var(--text-primary)' }}>
                  {msg.message}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 9, margin: 0, textAlign: isMe ? 'right' : 'left' }}>{fmtMsgTime(msg.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid var(--guest-border)', background: 'var(--surface-card)', flexShrink: 0 }}>
        {sendError && <p style={{ color: '#F87171', fontSize: 12, padding: '6px 14px 0', margin: 0 }}>⚠ {sendError}</p>}
        <div style={{ padding: '12px 14px calc(12px + env(safe-area-inset-bottom))', display: 'flex', gap: 8, alignItems: 'center' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Message TIKKIT Support…"
            rows={1}
            style={{ flex: 1, background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)', borderRadius: 10, padding: '9px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', resize: 'none', minHeight: 38, maxHeight: 100, fontFamily: 'var(--font-body)' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--brand-blue)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !input.trim() || sending ? 0.4 : 1, flexShrink: 0 }}
          >
            {sending ? <Loader2 size={15} color="white" className="animate-spin" /> : <Send size={15} color="white" />}
          </button>
        </div>
      </div>
    </div>
  )

  /* ── Event chat thread ───────────────────────────────────────── */
  const ChatThread = selectedThread ? (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--guest-border)', flexShrink: 0, background: 'var(--surface-card)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => setMobileView('list')} className="md:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: selectedThread.coverImageUrl ? `url(${selectedThread.coverImageUrl}) center/cover` : 'var(--surface-card-2)', border: '1px solid var(--guest-border)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedThread.eventTitle}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '1px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.6)', flexShrink: 0 }} />
            {selectedThread.organizerName} · Live chat
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'thin', scrollbarColor: 'var(--guest-border) transparent' }}>
        {loadingThread ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={24} color="var(--brand-blue)" className="animate-spin" />
          </div>
        ) : currentMessages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '40px 20px' }}>
            <div style={{ fontSize: 36 }}>💬</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', margin: 0 }}>No messages yet.<br />Send a message to the organizer.</p>
          </div>
        ) : (
          currentMessages.map(msg => {
            const isMe = msg.user_id === userId
            const initials = (msg.sender_name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div key={msg.id} style={{ display: 'flex', gap: 8, maxWidth: '80%', alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: isMe ? 'rgba(var(--brand-blue-rgb),0.2)' : 'rgba(168,85,247,0.15)', border: `1px solid ${isMe ? 'rgba(var(--brand-blue-rgb),0.3)' : 'rgba(168,85,247,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: isMe ? 'var(--brand-blue)' : '#A855F7' }}>
                  {initials}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, margin: 0, textAlign: isMe ? 'right' : 'left' }}>{msg.sender_name}</p>
                  {!isMe && msg.role === 'organizer' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100, marginBottom: 2, width: 'fit-content', ...(msg.recipient_user_id ? { background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#C084FC' } : { background: 'rgba(var(--brand-blue-rgb),0.1)', border: '1px solid rgba(var(--brand-blue-rgb),0.2)', color: '#6B9FFF' }) }}>
                      {msg.recipient_user_id ? <><Lock size={8} /> Private</> : <><Globe size={8} /> Broadcast</>}
                    </div>
                  )}
                  <div style={{ padding: '8px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word', background: isMe ? 'rgba(var(--brand-blue-rgb),0.18)' : 'var(--surface-card-2)', border: `1px solid ${isMe ? 'rgba(var(--brand-blue-rgb),0.25)' : 'var(--guest-border)'}`, color: isMe ? '#C7D6FF' : 'var(--text-primary)' }}>
                    {msg.message}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 9, margin: 0, textAlign: isMe ? 'right' : 'left' }}>{fmtMsgTime(msg.created_at)}</p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid var(--guest-border)', background: 'var(--surface-card)', flexShrink: 0 }}>
        {sendError && <p style={{ color: '#F87171', fontSize: 12, padding: '6px 14px 0', margin: 0 }}>⚠ {sendError}</p>}
        <div style={{ padding: '12px 14px calc(12px + env(safe-area-inset-bottom))', display: 'flex', gap: 8, alignItems: 'center' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={`Message ${selectedThread.organizerName}…`}
            rows={1}
            style={{ flex: 1, background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)', borderRadius: 10, padding: '9px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', resize: 'none', minHeight: 38, maxHeight: 100, fontFamily: 'var(--font-body)' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--brand-blue)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !input.trim() || sending ? 0.4 : 1, flexShrink: 0 }}
          >
            {sending ? <Loader2 size={15} color="white" className="animate-spin" /> : <Send size={15} color="white" />}
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'var(--text-muted)' }}>
      <MessageSquare size={36} style={{ opacity: 0.2 }} />
      <p style={{ fontSize: 13, margin: 0 }}>Select a conversation</p>
    </div>
  )

  const ActiveThread = isSupport ? SupportThread : ChatThread

  return (
    <>
      {/* ── Mobile: list or thread ── */}
      <div className="md:hidden flex flex-col" style={{ height: 'calc(100svh - 152px - env(safe-area-inset-bottom))', overflow: 'hidden' }}>
        {mobileView === 'list' ? ThreadList : ActiveThread}
      </div>

      {/* ── Desktop: two-panel ── */}
      <div className="hidden md:flex" style={{ height: 'calc(100vh - 24px)', overflow: 'hidden' }}>
        <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--guest-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {ThreadList}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {ActiveThread}
        </div>
      </div>
    </>
  )
}

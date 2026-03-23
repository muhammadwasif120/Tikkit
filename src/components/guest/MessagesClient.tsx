'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendGuestMessage, getGuestChatMessages } from '@/app/actions/commandActions'
import { Send, Loader2, ArrowLeft, Globe, Lock, MessageSquare } from 'lucide-react'
import type { ChatMessage } from '@/types/verification'

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
}: {
  threads: Thread[]
  userId: string
  initialMessages: Record<string, ChatMessage[]>
}) {
  const [selectedId, setSelectedId] = useState<string | null>(threads[0]?.eventId ?? null)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')
  const [messagesByEvent, setMessagesByEvent] = useState<Record<string, ChatMessage[]>>(initialMessages)
  const [loadingThread, setLoadingThread] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [lastRead, setLastRead] = useState<Record<string, string>>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load last-read timestamps from localStorage
  useEffect(() => {
    const stored: Record<string, string> = {}
    for (const t of threads) {
      const val = localStorage.getItem(`chat_read_${t.eventId}`)
      if (val) stored[t.eventId] = val
    }
    setLastRead(stored)
  }, [])

  // Mark selected thread as read
  useEffect(() => {
    if (!selectedId) return
    const now = new Date().toISOString()
    localStorage.setItem(`chat_read_${selectedId}`, now)
    setLastRead(prev => ({ ...prev, [selectedId]: now }))
  }, [selectedId])

  // Scroll to bottom when messages or selected thread changes
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messagesByEvent, selectedId])

  // Realtime subscription for all event threads
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
    return () => { channels.forEach(c => supabase.removeChannel(c)) }
  }, [threads, userId])

  const selectThread = async (eventId: string) => {
    setSelectedId(eventId)
    setMobileView('thread')
    // Lazy-load messages if not yet fetched
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
    const result = await sendGuestMessage(selectedId, text)
    if (result.error) {
      setSendError(result.error)
      setInput(text) // restore message
    }
    setSending(false)
  }

  const hasUnread = (t: Thread) => {
    if (!t.lastMessage || t.lastMessage.role !== 'organizer') return false
    const readAt = lastRead[t.eventId]
    if (!readAt) return true
    return new Date(t.lastMessage.createdAt) > new Date(readAt)
  }

  const selectedThread = threads.find(t => t.eventId === selectedId)
  const currentMessages = selectedId ? (messagesByEvent[selectedId] ?? []) : []

  /* ── Empty state ────────────────────────────────────────────── */
  if (threads.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12, padding: 24 }}>
        <MessageSquare size={48} color="#1E5EFF" style={{ opacity: 0.15 }} />
        <p style={{ color: '#9CA3AF', fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>No conversations yet</p>
        <p style={{ color: '#4B5563', fontSize: 13, margin: 0, textAlign: 'center' }}>Register for events to chat with organizers.</p>
      </div>
    )
  }

  /* ── Thread list ─────────────────────────────────────────────── */
  const ThreadList = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>Messages</h2>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {threads.map(t => {
          const active = t.eventId === selectedId
          const unread = hasUnread(t)
          return (
            <button
              key={t.eventId}
              onClick={() => selectThread(t.eventId)}
              style={{
                display: 'flex', gap: 12, padding: '14px 16px', width: '100%',
                background: active ? 'rgba(30,94,255,0.07)' : 'transparent',
                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s', alignItems: 'center',
              }}
            >
              {/* Cover thumbnail */}
              <div style={{
                width: 50, height: 50, borderRadius: 13, flexShrink: 0,
                background: t.coverImageUrl
                  ? `url(${t.coverImageUrl}) center/cover`
                  : 'linear-gradient(135deg,#1a1a2e,#0f3460)',
                border: '1px solid rgba(255,255,255,0.08)',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                  <p style={{
                    color: 'white', fontSize: 14, fontWeight: unread ? 800 : 600,
                    margin: 0, overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', flex: 1, paddingRight: 8,
                  }}>
                    {t.eventTitle}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {t.lastMessage && (
                      <span style={{ color: '#4B5563', fontSize: 10 }}>
                        {fmtListTime(t.lastMessage.createdAt)}
                      </span>
                    )}
                    {unread && (
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#1E5EFF', flexShrink: 0,
                        boxShadow: '0 0 6px rgba(30,94,255,0.8)',
                      }} />
                    )}
                  </div>
                </div>
                <p style={{ color: '#6B7280', fontSize: 11, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.organizerName}
                </p>
                {t.lastMessage ? (
                  <p style={{
                    color: unread ? '#9CA3AF' : '#4B5563', fontSize: 12, margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontWeight: unread ? 600 : 400,
                  }}>
                    {t.lastMessage.role === 'organizer' ? '📢 ' : 'You: '}
                    {t.lastMessage.text}
                  </p>
                ) : (
                  <p style={{ color: '#374151', fontSize: 12, margin: 0, fontStyle: 'italic' }}>No messages yet</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )

  /* ── Chat thread ─────────────────────────────────────────────── */
  const ChatThread = selectedThread ? (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
        background: 'rgba(13,15,24,0.95)', backdropFilter: 'blur(12px)',
      }}>
        <button
          onClick={() => setMobileView('list')}
          className="md:hidden"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF', display: 'flex' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: selectedThread.coverImageUrl
            ? `url(${selectedThread.coverImageUrl}) center/cover`
            : 'linear-gradient(135deg,#1a1a2e,#0f3460)',
          border: '1px solid rgba(255,255,255,0.08)',
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedThread.eventTitle}
          </p>
          <p style={{ color: '#4B5563', fontSize: 11, margin: '1px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.6)', flexShrink: 0 }} />
            {selectedThread.organizerName} · Live chat
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: 10,
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent',
      }}>
        {loadingThread ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={24} color="#1E5EFF" className="animate-spin" />
          </div>
        ) : currentMessages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '40px 20px' }}>
            <div style={{ fontSize: 36 }}>💬</div>
            <p style={{ color: '#374151', fontSize: 14, textAlign: 'center', margin: 0 }}>
              No messages yet.<br />Send a message to the organizer.
            </p>
          </div>
        ) : (
          currentMessages.map(msg => {
            const isMe = msg.user_id === userId
            const initials = (msg.sender_name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div key={msg.id} style={{
                display: 'flex', gap: 8, maxWidth: '80%',
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                flexDirection: isMe ? 'row-reverse' : 'row',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: isMe ? 'rgba(30,94,255,0.2)' : 'rgba(168,85,247,0.15)',
                  border: `1px solid ${isMe ? 'rgba(30,94,255,0.3)' : 'rgba(168,85,247,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: isMe ? '#1E5EFF' : '#A855F7',
                }}>
                  {initials}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <p style={{ color: '#4B5563', fontSize: 10, fontWeight: 600, margin: 0, textAlign: isMe ? 'right' : 'left' }}>
                    {msg.sender_name}
                  </p>
                  {!isMe && msg.role === 'organizer' && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
                      marginBottom: 2, width: 'fit-content',
                      ...(msg.recipient_user_id
                        ? { background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#C084FC' }
                        : { background: 'rgba(30,94,255,0.1)', border: '1px solid rgba(30,94,255,0.2)', color: '#6B9FFF' }
                      ),
                    }}>
                      {msg.recipient_user_id
                        ? <><Lock size={8} /> Private</>
                        : <><Globe size={8} /> Broadcast</>
                      }
                    </div>
                  )}
                  <div style={{
                    padding: '8px 12px', borderRadius: 12, fontSize: 13,
                    lineHeight: 1.5, wordBreak: 'break-word',
                    background: isMe ? 'rgba(30,94,255,0.18)' : '#151722',
                    border: `1px solid ${isMe ? 'rgba(30,94,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    color: isMe ? '#C7D6FF' : '#E5E7EB',
                  }}>
                    {msg.message}
                  </div>
                  <p style={{ color: '#374151', fontSize: 9, margin: 0, textAlign: isMe ? 'right' : 'left' }}>
                    {fmtMsgTime(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,15,24,0.95)', flexShrink: 0 }}>
        {sendError && (
          <p style={{ color: '#F87171', fontSize: 12, padding: '6px 14px 0', margin: 0 }}>⚠ {sendError}</p>
        )}
        <div style={{ padding: '12px 14px calc(12px + env(safe-area-inset-bottom))', display: 'flex', gap: 8, alignItems: 'center' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={`Message ${selectedThread.organizerName}…`}
            rows={1}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '9px 14px', color: 'white', fontSize: 13,
              outline: 'none', resize: 'none', minHeight: 38, maxHeight: 100,
              fontFamily: 'var(--font-body)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width: 36, height: 36, borderRadius: 10, background: '#1E5EFF',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              opacity: !input.trim() || sending ? 0.4 : 1, flexShrink: 0,
            }}
          >
            {sending
              ? <Loader2 size={15} color="white" className="animate-spin" />
              : <Send size={15} color="white" />
            }
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: '#4B5563' }}>
      <MessageSquare size={36} style={{ opacity: 0.2 }} />
      <p style={{ fontSize: 13, margin: 0 }}>Select a conversation</p>
    </div>
  )

  return (
    <>
      {/* ── Mobile: list or thread ── */}
      <div
        className="md:hidden"
        style={{ height: 'calc(100svh - 76px - env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {mobileView === 'list' ? ThreadList : ChatThread}
      </div>

      {/* ── Desktop: two-panel ── */}
      <div
        className="hidden md:flex"
        style={{ height: 'calc(100vh - 24px)', overflow: 'hidden' }}
      >
        <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {ThreadList}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {ChatThread}
        </div>
      </div>
    </>
  )
}

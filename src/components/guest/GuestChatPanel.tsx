'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendGuestMessage } from '@/app/actions/commandActions'
import { Send, Loader2, ArrowLeft, Lock, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ChatMessage } from '@/types/verification'

interface Props {
  eventId: string
  eventTitle: string
  organizerName: string | null
  initialMessages: ChatMessage[]
  userId: string
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function GuestChatPanel({ eventId, eventTitle, organizerName, initialMessages, userId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = (supabase as any)
      .channel(`guest-chat-${eventId}-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_chats', filter: `event_id=eq.${eventId}` },
        (payload: any) => {
          const msg = payload.new as any
          if (msg.user_id === userId) {
            setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, { ...msg, sender_name: 'You', sender_avatar: null }])
            return
          }
          if (msg.role === 'organizer') {
            if (msg.recipient_user_id !== null && msg.recipient_user_id !== undefined && msg.recipient_user_id !== userId) return
            setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, { ...msg, sender_name: organizerName ?? 'Organizer', sender_avatar: null }])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId, userId, organizerName, supabase])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return
    setSending(true)
    setInput('')
    const result = await sendGuestMessage(eventId, trimmed)
    setSending(false)
    if (result.error) {
      console.error('Chat error:', result.error)
      setInput(trimmed)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100svh', background: 'var(--guest-bg)', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: 'calc(14px + env(safe-area-inset-top)) 16px 14px',
        background: 'var(--surface-card)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--guest-border)',
        flexShrink: 0,
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eventTitle}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '1px 0 0' }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22C55E', marginRight: 5, boxShadow: '0 0 6px rgba(34,197,94,0.6)', verticalAlign: 'middle' }} />
            {organizerName ?? 'Organizer'} · Live chat
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'thin', scrollbarColor: 'var(--guest-border) transparent' }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '40px 20px' }}>
            <div style={{ fontSize: 40 }}>💬</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', margin: 0 }}>
              No messages yet.<br />Send a message to the organizer.
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.user_id === userId
            const initials = (msg.sender_name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div key={msg.id} style={{ display: 'flex', gap: 8, maxWidth: '85%', alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: isMe ? 'rgba(var(--brand-blue-rgb),0.2)' : 'rgba(168,85,247,0.15)',
                  border: `1px solid ${isMe ? 'rgba(var(--brand-blue-rgb),0.3)' : 'rgba(168,85,247,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800,
                  color: isMe ? 'var(--brand-blue)' : '#A855F7',
                }}>
                  {initials}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, margin: 0, textAlign: isMe ? 'right' : 'left' }}>{msg.sender_name}</p>
                  {!isMe && msg.role === 'organizer' && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
                      marginBottom: 4, width: 'fit-content',
                      ...(msg.recipient_user_id
                        ? { background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#C084FC' }
                        : { background: 'rgba(var(--brand-blue-rgb),0.1)', border: '1px solid rgba(var(--brand-blue-rgb),0.2)', color: '#6B9FFF' }
                      ),
                    }}>
                      {msg.recipient_user_id
                        ? <><Lock size={8} /> Private reply</>
                        : <><Globe size={8} /> Broadcast</>
                      }
                    </div>
                  )}
                  <div style={{
                    padding: '8px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                    wordBreak: 'break-word',
                    background: isMe ? 'rgba(var(--brand-blue-rgb),0.18)' : 'var(--surface-card-2)',
                    border: `1px solid ${isMe ? 'rgba(var(--brand-blue-rgb),0.25)' : 'var(--guest-border)'}`,
                    color: isMe ? '#C7D6FF' : 'var(--text-primary)',
                  }}>
                    {msg.message}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 9, margin: 0, textAlign: isMe ? 'right' : 'left' }}>{fmtTime(msg.created_at)}</p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 14px calc(12px + env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--guest-border)',
        display: 'flex', gap: 8, alignItems: 'center',
        background: 'var(--surface-card)', flexShrink: 0,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message the organizer..."
          rows={1}
          style={{
            flex: 1, background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)',
            borderRadius: 10, padding: '9px 14px', color: 'var(--text-primary)', fontSize: 13,
            outline: 'none', resize: 'none', minHeight: 38, maxHeight: 100,
            fontFamily: 'var(--font-body)',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--brand-blue)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: !input.trim() || sending ? 0.4 : 1, flexShrink: 0,
          }}
        >
          {sending ? <Loader2 size={15} color="white" className="animate-spin" /> : <Send size={15} color="white" />}
        </button>
      </div>
    </div>
  )
}

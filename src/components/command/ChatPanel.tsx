'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendCommandMessage } from '@/app/actions/commandActions'
import { Send, Loader2 } from 'lucide-react'
import type { ChatMessage } from '@/types/verification'

interface Props {
  eventId: string
  initialMessages: ChatMessage[]
  organizerName: string
}

const CSS = `
  .cp-wrap {
    display:flex; flex-direction:column; height:100%;
    background:#0C0E16; border-radius:18px;
    border:1px solid rgba(255,255,255,0.07);
    overflow:hidden;
  }
  .cp-header {
    padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.06);
    display:flex; align-items:center; gap:10px; flex-shrink:0;
  }
  .cp-header-dot {
    width:8px; height:8px; border-radius:50%; background:#22C55E;
    box-shadow:0 0 8px rgba(34,197,94,0.6);
    animation:cpPulse 2s infinite;
  }
  @keyframes cpPulse {
    0%,100% { opacity:1; }
    50%      { opacity:0.45; }
  }
  .cp-title { color:white; font-size:14px; font-weight:700; margin:0; font-family:var(--font-display); }
  .cp-sub   { color:#4B5563; font-size:11px; margin:0; }

  .cp-messages { flex:1; overflow-y:auto; padding:14px 16px; display:flex; flex-direction:column; gap:10px; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.08) transparent; }

  .cp-msg { display:flex; gap:9px; max-width:88%; }
  .cp-msg.mine { align-self:flex-end; flex-direction:row-reverse; }
  .cp-msg-avatar {
    width:28px; height:28px; border-radius:50%; flex-shrink:0;
    background:rgba(30,94,255,0.2); border:1px solid rgba(30,94,255,0.3);
    display:flex; align-items:center; justify-content:center;
    font-size:10px; font-weight:800; color:#1E5EFF;
  }
  .cp-msg-avatar.org { background:rgba(168,85,247,0.15); border-color:rgba(168,85,247,0.3); color:#A855F7; }
  .cp-msg-body { display:flex; flex-direction:column; gap:3px; }
  .cp-msg-name { font-size:10px; font-weight:600; color:#4B5563; }
  .cp-msg-name.mine { text-align:right; }
  .cp-msg-bubble {
    padding:8px 12px; border-radius:12px; font-size:13px; line-height:1.5; color:#E5E7EB;
    background:#151722; border:1px solid rgba(255,255,255,0.06);
    word-break:break-word;
  }
  .cp-msg.mine .cp-msg-bubble {
    background:rgba(30,94,255,0.18); border-color:rgba(30,94,255,0.25); color:#C7D6FF;
  }
  .cp-msg-time { font-size:9px; color:#374151; }
  .cp-msg-time.mine { text-align:right; }

  .cp-input-wrap {
    padding:12px 14px; border-top:1px solid rgba(255,255,255,0.06);
    display:flex; gap:8px; align-items:center; flex-shrink:0;
  }
  .cp-input {
    flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
    border-radius:10px; padding:9px 14px; color:white; font-size:13px;
    outline:none; resize:none; min-height:38px; max-height:100px;
    font-family:var(--font-body);
    transition:border-color 0.15s;
  }
  .cp-input::placeholder { color:#374151; }
  .cp-input:focus { border-color:rgba(30,94,255,0.35); }
  .cp-send {
    width:36px; height:36px; border-radius:10px;
    background:#1E5EFF; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:opacity 0.15s, transform 0.15s; flex-shrink:0;
  }
  .cp-send:hover:not(:disabled) { opacity:0.85; transform:scale(1.05); }
  .cp-send:disabled { opacity:0.4; cursor:not-allowed; }

  .cp-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:24px; }
  .cp-empty-icon { font-size:32px; }
  .cp-empty-text { color:#374151; font-size:13px; text-align:center; }
`

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function ChatPanel({ eventId, initialMessages, organizerName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    const channel = (supabase as any)
      .channel(`event-command-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_chats', filter: `event_id=eq.${eventId}` },
        (payload: any) => {
          const msg = payload.new as ChatMessage
          setMessages(prev => {
            // Avoid duplicates (our own sent message may arrive via realtime too)
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, { ...msg, sender_name: msg.sender_name ?? 'Guest', sender_avatar: null }]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return

    setSending(true)
    setInput('')

    const result = await sendCommandMessage(eventId, trimmed)
    setSending(false)

    if (result.error) {
      console.error('Chat send error:', result.error)
      setInput(trimmed) // restore on failure
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="cp-wrap">
        {/* Header */}
        <div className="cp-header">
          <div className="cp-header-dot" />
          <div>
            <p className="cp-title">Command Channel</p>
            <p className="cp-sub">Live chat · purged 72h after event ends</p>
          </div>
        </div>

        {/* Messages */}
        {messages.length === 0 ? (
          <div className="cp-empty">
            <div className="cp-empty-icon">💬</div>
            <p className="cp-empty-text">No messages yet.<br />Start the conversation with attendees.</p>
          </div>
        ) : (
          <div className="cp-messages">
            {messages.map(msg => {
              const isOrg = msg.role === 'organizer'
              const initials = (msg.sender_name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
              return (
                <div key={msg.id} className={`cp-msg${isOrg ? ' mine' : ''}`}>
                  <div className={`cp-msg-avatar${isOrg ? ' org' : ''}`}>{initials}</div>
                  <div className="cp-msg-body">
                    <p className={`cp-msg-name${isOrg ? ' mine' : ''}`}>{msg.sender_name ?? 'Guest'}</p>
                    <div className="cp-msg-bubble">{msg.message}</div>
                    <p className={`cp-msg-time${isOrg ? ' mine' : ''}`}>{fmtTime(msg.created_at)}</p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input */}
        <div className="cp-input-wrap">
          <textarea
            className="cp-input"
            placeholder="Message attendees..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button className="cp-send" onClick={handleSend} disabled={!input.trim() || sending}>
            {sending ? <Loader2 size={15} color="white" className="animate-spin" /> : <Send size={15} color="white" />}
          </button>
        </div>
      </div>
    </>
  )
}

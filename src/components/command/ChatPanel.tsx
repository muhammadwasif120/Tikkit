'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendCommandMessage } from '@/app/actions/commandActions'
import { Send, Loader2, MessageSquare, Globe, Lock, X } from 'lucide-react'
import type { ChatMessage } from '@/types/verification'

interface Props {
  eventId: string
  initialMessages: ChatMessage[]
  organizerName: string
}

interface ReplyTo {
  userId: string
  name: string
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const CSS = `
  .cp-wrap {
    display:flex; flex-direction:column; width:100%; height:100%;
    background:var(--guest-surface); border-radius:18px;
    border:1px solid var(--guest-border); overflow:hidden;
  }

  /* Header */
  .cp-header {
    padding:13px 16px; border-bottom:1px solid var(--guest-border);
    display:flex; align-items:center; gap:10px; flex-shrink:0;
  }
  .cp-header-dot {
    width:8px; height:8px; border-radius:50%; background:#22C55E;
    box-shadow:0 0 8px rgba(34,197,94,0.6); animation:cpPulse 2s infinite; flex-shrink:0;
  }
  @keyframes cpPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  .cp-title { color:var(--text-primary); font-size:13px; font-weight:700; margin:0; font-family:var(--font-display); }
  .cp-sub   { color:var(--text-muted); font-size:10px; margin:0; }

  /* Messages */
  .cp-messages {
    flex:1; overflow-y:auto; padding:14px;
    display:flex; flex-direction:column; gap:6px;
    scrollbar-width:thin; scrollbar-color:var(--guest-border) transparent;
  }

  /* Message wrapper — for hover actions */
  .cp-msg-wrap { display:flex; flex-direction:column; }
  .cp-msg-wrap.mine { align-items:flex-end; }

  /* Message rows */
  .cp-msg { display:flex; gap:8px; max-width:90%; align-items:flex-end; }
  .cp-msg.mine { flex-direction:row-reverse; }

  .cp-avatar {
    width:26px; height:26px; border-radius:50%; flex-shrink:0;
    background:rgba(30,94,255,0.18); border:1px solid rgba(30,94,255,0.28);
    display:flex; align-items:center; justify-content:center;
    font-size:9px; font-weight:800; color:#818CF8;
  }
  .cp-avatar.org {
    background:rgba(168,85,247,0.18); border-color:rgba(168,85,247,0.3); color:#A855F7;
  }

  .cp-body { display:flex; flex-direction:column; gap:2px; }
  .cp-name { font-size:10px; font-weight:600; color:var(--text-muted); margin:0 0 3px; }
  .cp-name.mine { text-align:right; }

  /* Broadcast / private badge on organizer messages */
  .cp-badge {
    display:inline-flex; align-items:center; gap:4px;
    font-size:9px; font-weight:700; letter-spacing:0.04em;
    padding:2px 7px; border-radius:100px; margin-bottom:4px; width:fit-content;
  }
  .cp-badge.broadcast {
    background:rgba(30,94,255,0.12); border:1px solid rgba(30,94,255,0.2); color:#6B9FFF;
  }
  .cp-badge.private {
    background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.2); color:#C084FC;
  }
  .cp-badge.mine { align-self:flex-end; }

  .cp-bubble {
    padding:8px 12px; border-radius:14px; font-size:13px; line-height:1.5; color:var(--text-primary);
    background:var(--guest-surface-2); border:1px solid var(--guest-border);
    word-break:break-word;
  }
  .cp-bubble.mine {
    background:linear-gradient(135deg,rgba(168,85,247,0.22),rgba(30,94,255,0.18));
    border-color:rgba(168,85,247,0.25); color:#D9C8FF;
    border-radius:14px 4px 14px 14px;
  }
  .cp-msg:not(.mine) .cp-bubble { border-radius:4px 14px 14px 14px; }

  .cp-time { font-size:9px; color:var(--text-muted); margin:2px 0 0; }
  .cp-time.mine { text-align:right; }

  /* Per-message reply action — visible on hover */
  .cp-actions {
    display:flex; gap:5px; margin-top:5px; margin-left:34px;
    opacity:0; transition:opacity 0.15s;
  }
  .cp-msg-wrap:hover .cp-actions { opacity:1; }
  .cp-action-btn {
    display:inline-flex; align-items:center; gap:4px;
    padding:3px 8px; border-radius:8px; font-size:10px; font-weight:700;
    cursor:pointer; border:none; transition:background 0.15s, color 0.15s;
    background:var(--guest-surface-2); color:var(--text-muted);
  }
  .cp-action-btn:hover { background:rgba(168,85,247,0.12); color:#C084FC; }

  /* Reply context banner above input */
  .cp-reply-banner {
    display:flex; align-items:center; gap:8px;
    padding:8px 14px; border-top:1px solid rgba(168,85,247,0.15);
    background:rgba(168,85,247,0.06); flex-shrink:0;
    font-size:11px; color:#C084FC;
  }
  .cp-reply-banner span { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .cp-reply-close {
    background:none; border:none; cursor:pointer; color:var(--text-muted); padding:2px;
    display:flex; flex-shrink:0; transition:color 0.15s;
  }
  .cp-reply-close:hover { color:var(--text-primary); }

  /* Empty state */
  .cp-empty {
    flex:1; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:10px; padding:24px;
  }
  .cp-empty-icon {
    width:48px; height:48px; border-radius:16px;
    background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.15);
    display:flex; align-items:center; justify-content:center;
  }
  .cp-empty-text { color:var(--text-muted); font-size:12px; text-align:center; line-height:1.65; margin:0; }

  /* Input */
  .cp-input-wrap {
    padding:10px 12px; border-top:1px solid var(--guest-border);
    display:flex; gap:8px; align-items:flex-end; flex-shrink:0;
  }
  .cp-input {
    flex:1; background:var(--guest-surface-2); border:1px solid var(--guest-border);
    border-radius:12px; padding:9px 14px; color:var(--text-primary); font-size:13px;
    outline:none; resize:none; min-height:38px; max-height:100px;
    font-family:var(--font-body); transition:border-color 0.15s; line-height:1.4;
  }
  .cp-input::placeholder { color:var(--text-muted); }
  .cp-input:focus { border-color:rgba(168,85,247,0.35); }
  .cp-input.is-private { border-color:rgba(168,85,247,0.25); }
  .cp-send {
    width:36px; height:36px; border-radius:11px; flex-shrink:0;
    background:linear-gradient(135deg,#7C3AED,#A855F7); border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:opacity 0.15s, transform 0.15s; box-shadow:0 4px 12px rgba(168,85,247,0.3);
  }
  .cp-send:hover:not(:disabled) { opacity:0.88; transform:scale(1.04); }
  .cp-send:disabled { opacity:0.35; cursor:not-allowed; box-shadow:none; }
`

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ChatPanel({ eventId, initialMessages, organizerName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  // Build a name map from guest messages so we can show "Private → [name]" on replies
  const userNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    messages.forEach(m => {
      if (m.role !== 'organizer' && m.user_id && m.sender_name) {
        map[m.user_id] = m.sender_name
      }
    })
    return map
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = (supabase as any)
      .channel(`event-command-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_chats', filter: `event_id=eq.${eventId}` },
        (payload: any) => {
          const msg = payload.new as ChatMessage
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, { ...msg, sender_name: msg.sender_name ?? 'Guest', sender_avatar: null }]
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const handleReplyTo = (msg: ChatMessage) => {
    setReplyTo({ userId: msg.user_id, name: msg.sender_name ?? 'Guest' })
    inputRef.current?.focus()
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return
    setSending(true)
    setInput('')
    const savedReplyTo = replyTo
    setReplyTo(null)
    const result = await sendCommandMessage(eventId, trimmed, savedReplyTo?.userId ?? null)
    setSending(false)
    if (result.error) { console.error('Chat send error:', result.error); setInput(trimmed) }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
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
            <p className="cp-sub">Live · purged 72h after event ends</p>
          </div>
        </div>

        {/* Messages / empty */}
        {messages.length === 0 ? (
          <div className="cp-empty">
            <div className="cp-empty-icon">
              <MessageSquare size={20} color="#A855F7" />
            </div>
            <p className="cp-empty-text">
              No messages yet.<br />Start the conversation with attendees.
            </p>
          </div>
        ) : (
          <div className="cp-messages">
            {messages.map(msg => {
              const isOrg = msg.role === 'organizer'
              const isPrivate = isOrg && msg.recipient_user_id != null
              const recipientName = isPrivate ? (userNameMap[msg.recipient_user_id!] ?? 'Guest') : null
              const initials = (msg.sender_name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

              return (
                <div key={msg.id} className={`cp-msg-wrap${isOrg ? ' mine' : ''}`}>
                  <div className={`cp-msg${isOrg ? ' mine' : ''}`}>
                    <div className={`cp-avatar${isOrg ? ' org' : ''}`}>{initials}</div>
                    <div className="cp-body">
                      <p className={`cp-name${isOrg ? ' mine' : ''}`}>{msg.sender_name ?? 'Guest'}</p>
                      {isOrg && (
                        <div className={`cp-badge${isPrivate ? ' private' : ' broadcast'}${isOrg ? ' mine' : ''}`}>
                          {isPrivate
                            ? <><Lock size={8} /> Private → {recipientName}</>
                            : <><Globe size={8} /> Broadcast</>
                          }
                        </div>
                      )}
                      <div className={`cp-bubble${isOrg ? ' mine' : ''}`}>{msg.message}</div>
                      <p className={`cp-time${isOrg ? ' mine' : ''}`}>{fmtTime(msg.created_at)}</p>
                    </div>
                  </div>

                  {/* Reply action — only on guest messages */}
                  {!isOrg && (
                    <div className="cp-actions">
                      <button className="cp-action-btn" onClick={() => handleReplyTo(msg)}>
                        <Lock size={9} /> Reply privately
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Private reply context banner */}
        {replyTo && (
          <div className="cp-reply-banner">
            <Lock size={11} style={{ flexShrink: 0 }} />
            <span>Private reply to <strong>{replyTo.name}</strong></span>
            <button className="cp-reply-close" onClick={() => setReplyTo(null)}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="cp-input-wrap">
          <textarea
            ref={inputRef}
            className={`cp-input${replyTo ? ' is-private' : ''}`}
            placeholder={replyTo ? `Private reply to ${replyTo.name}…` : 'Broadcast to all attendees…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button className="cp-send" onClick={handleSend} disabled={!input.trim() || sending}>
            {sending
              ? <Loader2 size={15} color="white" className="animate-spin" />
              : <Send size={15} color="white" />
            }
          </button>
        </div>
      </div>
    </>
  )
}

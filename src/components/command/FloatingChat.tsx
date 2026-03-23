'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getCommandEvents, getEventChatMessages, sendCommandMessage,
} from '@/app/actions/commandActions'
import {
  MessageSquare, X, ChevronLeft, Send, Loader2,
  Globe, Lock, Calendar, Users,
} from 'lucide-react'
import type { ChatMessage } from '@/types/verification'
import { isLive as eventIsLive } from '@/lib/eventStatus'

type EventRow = { id: string; title: string; date_start: string; status: string; cover_image_url: string | null; _count: number }
type ReplyTo  = { userId: string; name: string }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function getGrad(id: string) {
  const g = [
    'linear-gradient(135deg,#7C3AED,#1E5EFF)',
    'linear-gradient(135deg,#1E5EFF,#06B6D4)',
    'linear-gradient(135deg,#EC4899,#7C3AED)',
    'linear-gradient(135deg,#F59E0B,#EF4444)',
    'linear-gradient(135deg,#10B981,#1E5EFF)',
  ]
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return g[n % g.length]
}

export default function FloatingChat() {
  const [open, setOpen]             = useState(false)
  const [events, setEvents]         = useState<EventRow[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; title: string } | null>(null)
  const [messages, setMessages]     = useState<ChatMessage[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [input, setInput]           = useState('')
  const [sending, setSending]       = useState(false)
  const [replyTo, setReplyTo]       = useState<ReplyTo | null>(null)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const supabase   = createClient()

  // Fetch events when panel opens
  useEffect(() => {
    if (!open || events.length) return
    setLoadingEvents(true)
    getCommandEvents().then(data => { setEvents(data); setLoadingEvents(false) })
  }, [open, events.length])

  // Fetch messages when event selected
  useEffect(() => {
    if (!selectedEvent) return
    setLoadingMsgs(true)
    getEventChatMessages(selectedEvent.id).then(({ messages: msgs }) => {
      setMessages(msgs); setLoadingMsgs(false)
    })
  }, [selectedEvent])

  // Realtime subscription for selected event
  useEffect(() => {
    if (!selectedEvent) return
    const ch = (supabase as any)
      .channel(`fc-${selectedEvent.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_chats', filter: `event_id=eq.${selectedEvent.id}` },
        (payload: any) => {
          const msg = payload.new as ChatMessage
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [
            ...prev,
            { ...msg, sender_name: msg.role === 'organizer' ? 'You' : (msg.sender_name ?? 'Guest'), sender_avatar: null },
          ])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [selectedEvent, supabase])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const userNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    messages.forEach(m => { if (m.role !== 'organizer' && m.user_id && m.sender_name) map[m.user_id] = m.sender_name })
    return map
  }, [messages])

  const handleSelectEvent = (ev: EventRow) => {
    setSelectedEvent({ id: ev.id, title: ev.title })
    setMessages([])
    setReplyTo(null)
    setInput('')
  }

  const handleBack = () => { setSelectedEvent(null); setReplyTo(null); setInput('') }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending || !selectedEvent) return
    setSending(true); setInput('')
    const saved = replyTo; setReplyTo(null)
    await sendCommandMessage(selectedEvent.id, trimmed, saved?.userId ?? null)
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const liveCount = events.filter(e => eventIsLive(e)).length

  return (
    <>
      {/* Floating panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 80, right: 20,
          width: 'min(360px, calc(100vw - 32px))',
          height: 'min(500px, calc(100svh - 120px))',
          background: '#0C0E16', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          zIndex: 9999,
        }}>

          {/* Panel header */}
          <div style={{
            padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            background: '#0B0D14',
          }}>
            {selectedEvent ? (
              <button onClick={handleBack} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 600, padding: 0,
              }}>
                <ChevronLeft size={14} /> Back
              </button>
            ) : (
              <MessageSquare size={15} color="#A855F7" />
            )}
            <p style={{ flex: 1, color: 'white', fontSize: 13, fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedEvent ? selectedEvent.title : 'Event Chats'}
            </p>
            {!selectedEvent && liveCount > 0 && (
              <span style={{
                fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 100,
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                color: '#22C55E', letterSpacing: '0.04em',
              }}>
                {liveCount} LIVE
              </span>
            )}
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 0 }}>
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          {!selectedEvent ? (
            /* ── Event list ── */
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {loadingEvents ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Loader2 size={20} color="#4B5563" className="animate-spin" />
                </div>
              ) : events.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, padding: 24 }}>
                  <MessageSquare size={28} color="#374151" />
                  <p style={{ color: '#374151', fontSize: 13, margin: 0, textAlign: 'center' }}>No published events yet</p>
                </div>
              ) : events.map(ev => {
                const isLive = eventIsLive(ev)
                return (
                  <button key={ev.id} onClick={() => handleSelectEvent(ev)} style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px', transition: 'background 0.12s', textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
                      background: ev.cover_image_url ? `url(${ev.cover_image_url}) center/cover` : getGrad(ev.id),
                      border: isLive ? '1.5px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: isLive ? '0 0 10px rgba(34,197,94,0.15)' : 'none',
                    }} />
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)' }}>
                          {ev.title}
                        </p>
                        {isLive && (
                          <span style={{
                            fontSize: 8, fontWeight: 800, padding: '1px 6px', borderRadius: 100, flexShrink: 0,
                            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E',
                          }}>LIVE</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#4B5563', fontSize: 10, fontWeight: 600 }}>
                          <Calendar size={9} color="#4B5563" /> {fmtDate(ev.date_start)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#4B5563', fontSize: 10, fontWeight: 600 }}>
                          <Users size={9} color="#4B5563" /> {ev._count}
                        </span>
                      </div>
                    </div>
                    <ChevronLeft size={13} color="#374151" style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
                  </button>
                )
              })}
            </div>
          ) : (
            /* ── Chat view ── */
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {loadingMsgs ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={18} color="#4B5563" className="animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 40 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare size={18} color="#A855F7" />
                    </div>
                    <p style={{ color: '#374151', fontSize: 12, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                      No messages yet.<br />Start the conversation.
                    </p>
                  </div>
                ) : messages.map(msg => {
                  const isOrg = msg.role === 'organizer'
                  const isPrivate = isOrg && msg.recipient_user_id != null
                  const recipientName = isPrivate ? (userNameMap[msg.recipient_user_id!] ?? 'Guest') : null
                  const initials = (msg.sender_name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOrg ? 'flex-end' : 'flex-start' }}
                      onMouseEnter={e => { if (!isOrg) (e.currentTarget.querySelector('.fc-reply-btn') as HTMLElement | null)?.style.setProperty('opacity', '1') }}
                      onMouseLeave={e => { if (!isOrg) (e.currentTarget.querySelector('.fc-reply-btn') as HTMLElement | null)?.style.setProperty('opacity', '0') }}
                    >
                      <div style={{ display: 'flex', gap: 6, maxWidth: '88%', alignItems: 'flex-end', flexDirection: isOrg ? 'row-reverse' : 'row' }}>
                        {/* Avatar */}
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: isOrg ? 'rgba(168,85,247,0.18)' : 'rgba(30,94,255,0.18)',
                          border: `1px solid ${isOrg ? 'rgba(168,85,247,0.3)' : 'rgba(30,94,255,0.28)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 8, fontWeight: 800, color: isOrg ? '#A855F7' : '#818CF8',
                        }}>{initials}</div>
                        {/* Body */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <p style={{ fontSize: 9, fontWeight: 600, color: '#4B5563', margin: 0, textAlign: isOrg ? 'right' : 'left' }}>
                            {msg.sender_name}
                          </p>
                          {/* Badge */}
                          {isOrg && (
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: 3,
                              fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 100,
                              marginBottom: 2, alignSelf: 'flex-end',
                              ...(isPrivate
                                ? { background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#C084FC' }
                                : { background: 'rgba(30,94,255,0.1)', border: '1px solid rgba(30,94,255,0.2)', color: '#6B9FFF' }
                              ),
                            }}>
                              {isPrivate ? <><Lock size={7} /> {recipientName}</> : <><Globe size={7} /> Broadcast</>}
                            </div>
                          )}
                          <div style={{
                            padding: '6px 10px', borderRadius: isOrg ? '12px 3px 12px 12px' : '3px 12px 12px 12px',
                            fontSize: 12, lineHeight: 1.5, wordBreak: 'break-word',
                            background: isOrg ? 'linear-gradient(135deg,rgba(168,85,247,0.2),rgba(30,94,255,0.15))' : '#151722',
                            border: `1px solid ${isOrg ? 'rgba(168,85,247,0.22)' : 'rgba(255,255,255,0.06)'}`,
                            color: isOrg ? '#D9C8FF' : '#E5E7EB',
                          }}>
                            {msg.message}
                          </div>
                          <p style={{ fontSize: 8, color: '#374151', margin: 0, textAlign: isOrg ? 'right' : 'left' }}>
                            {fmtTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                      {/* Reply button on hover */}
                      {!isOrg && (
                        <button className="fc-reply-btn" onClick={() => { setReplyTo({ userId: msg.user_id, name: msg.sender_name ?? 'Guest' }); inputRef.current?.focus() }}
                          style={{
                            opacity: 0, transition: 'opacity 0.15s',
                            background: 'none', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 3,
                            color: '#6B7280', fontSize: 10, fontWeight: 600,
                            padding: '3px 0', marginTop: 2, marginLeft: 28,
                          }}>
                          <Lock size={8} /> Reply privately
                        </button>
                      )}
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Private reply banner */}
              {replyTo && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
                  borderTop: '1px solid rgba(168,85,247,0.15)', background: 'rgba(168,85,247,0.06)',
                  fontSize: 11, color: '#C084FC', flexShrink: 0,
                }}>
                  <Lock size={10} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Private → <strong>{replyTo.name}</strong>
                  </span>
                  <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 0 }}>
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Input */}
              <div style={{
                padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', gap: 7, alignItems: 'flex-end', flexShrink: 0,
              }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={replyTo ? `Private → ${replyTo.name}…` : 'Broadcast to all attendees…'}
                  rows={1}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${replyTo ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 10, padding: '7px 12px', color: 'white', fontSize: 12,
                    outline: 'none', resize: 'none', minHeight: 34, maxHeight: 80,
                    fontFamily: 'var(--font-body)', lineHeight: 1.4,
                  }}
                />
                <button onClick={handleSend} disabled={!input.trim() || sending} style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: !input.trim() || sending ? 0.35 : 1, transition: 'opacity 0.15s',
                  boxShadow: '0 4px 12px rgba(168,85,247,0.3)',
                }}>
                  {sending ? <Loader2 size={13} color="white" className="animate-spin" /> : <Send size={13} color="white" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
          width: 52, height: 52, borderRadius: 16,
          background: open ? '#1a1d2e' : 'linear-gradient(135deg,#7C3AED,#A855F7)',
          border: open ? '1px solid rgba(168,85,247,0.3)' : 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? 'none' : '0 8px 24px rgba(168,85,247,0.45)',
          transition: 'all 0.2s',
        }}
      >
        {open
          ? <X size={20} color="#A855F7" />
          : <MessageSquare size={20} color="white" />
        }
        {/* Live badge */}
        {!open && liveCount > 0 && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 18, height: 18, borderRadius: '50%',
            background: '#22C55E', border: '2px solid #080A10',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800, color: 'white',
          }}>
            {liveCount}
          </div>
        )}
      </button>
    </>
  )
}

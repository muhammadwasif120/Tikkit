'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendSupportMessage } from '@/app/actions/supportActions'
import { Send, Loader2, ShieldCheck } from 'lucide-react'
import type { SupportMessage } from '@/app/actions/supportActions'

function fmtTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
  if (diffDays === 1) return 'Yesterday ' + d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function OrganizerSupportChat({
  userId,
  initialMessages,
}: {
  userId: string
  initialMessages: SupportMessage[]
}) {
  const [messages, setMessages] = useState<SupportMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messages])

  useEffect(() => {
    const channel = (supabase as any)
      .channel(`organizer-support-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'support_messages',
        filter: `user_id=eq.${userId}`,
      }, (payload: any) => {
        const msg = payload.new as SupportMessage
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    setSendError(null)
    const text = input.trim()
    setInput('')
    const result = await sendSupportMessage(text)
    if (result.error) {
      setSendError(result.error)
      setInput(text)
    } else {
      const optimistic: SupportMessage = {
        id: `opt-${Date.now()}`,
        user_id: userId,
        user_name: 'You',
        user_type: 'organizer',
        message: text,
        sender: 'user',
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, optimistic])
    }
    setSending(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 0 16px', borderBottom: '1px solid var(--guest-border)', flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg, rgba(var(--brand-blue-rgb),0.25), rgba(var(--brand-blue-rgb),0.1))', border: '1px solid rgba(var(--brand-blue-rgb),0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShieldCheck size={22} color="var(--brand-blue)" />
        </div>
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>TIKKIT X Support</h1>
          <p style={{ color: 'var(--brand-blue)', fontSize: 12, margin: '2px 0 0', opacity: 0.8 }}>Official Support Channel · We typically reply within 24 hours</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 12, scrollbarWidth: 'thin', scrollbarColor: 'var(--guest-border) transparent' }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '60px 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(var(--brand-blue-rgb),0.1)', border: '1px solid rgba(var(--brand-blue-rgb),0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={30} color="var(--brand-blue)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>How can we help?</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, maxWidth: 320, lineHeight: 1.6 }}>
                Send a message and our support team will get back to you. You can ask about your account, events, payments, or anything else.
              </p>
            </div>
          </div>
        ) : messages.map(msg => {
          const isMe = msg.sender === 'user'
          const label = isMe ? 'You' : 'TIKKIT Support'
          return (
            <div key={msg.id} style={{ display: 'flex', gap: 10, maxWidth: '75%', alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: isMe ? 'rgba(var(--brand-blue-rgb),0.2)' : 'rgba(239,68,68,0.15)', border: `1px solid ${isMe ? 'rgba(var(--brand-blue-rgb),0.3)' : 'rgba(239,68,68,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: isMe ? 'var(--brand-blue)' : '#F87171' }}>
                {isMe ? 'ME' : 'TX'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, margin: 0, textAlign: isMe ? 'right' : 'left' }}>{label}</p>
                <div style={{ padding: '10px 14px', borderRadius: 14, fontSize: 14, lineHeight: 1.55, wordBreak: 'break-word', background: isMe ? 'rgba(var(--brand-blue-rgb),0.18)' : 'var(--surface-card)', border: `1px solid ${isMe ? 'rgba(var(--brand-blue-rgb),0.25)' : 'var(--guest-border)'}`, color: isMe ? '#C7D6FF' : 'var(--text-primary)' }}>
                  {msg.message}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 10, margin: 0, textAlign: isMe ? 'right' : 'left' }}>{fmtTime(msg.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid var(--guest-border)', paddingTop: 12, flexShrink: 0 }}>
        {sendError && <p style={{ color: '#F87171', fontSize: 12, marginBottom: 6 }}>⚠ {sendError}</p>}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Message TIKKIT Support…"
            rows={2}
            style={{ flex: 1, background: 'var(--guest-surface-2, var(--surface-card))', border: '1px solid var(--guest-border)', borderRadius: 12, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--brand-blue)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !input.trim() || sending ? 0.4 : 1, flexShrink: 0 }}
          >
            {sending ? <Loader2 size={16} color="white" className="animate-spin" /> : <Send size={16} color="white" />}
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8, textAlign: 'center' }}>Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}

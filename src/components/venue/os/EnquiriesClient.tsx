'use client'

import { useState, useTransition } from 'react'
import { MessageSquare, ChevronDown, ChevronUp, Archive, Send, Phone } from 'lucide-react'
import { markEnquiryRead, replyToEnquiry, archiveEnquiry } from '@/app/actions/venueActions'

const C = {
  bg: '#06080C', card: '#0D1117', border: 'rgba(0,212,170,0.1)',
  emerald: '#00D4AA', violet: '#7C3AED', muted: 'rgba(255,255,255,0.38)', text: '#F0F4FF',
}

type Enquiry = {
  id: string
  guest_name: string
  guest_phone: string | null
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  reply: string | null
  replied_at: string | null
  created_at: string
  programme_id: string | null
  resource_id: string | null
  programme?: { title: string } | null
  resource?: { name: string } | null
}

const STATUS_COLOR: Record<string, string> = {
  new: '#F6C90E', read: C.muted, replied: C.emerald, archived: 'rgba(255,255,255,0.2)',
}
const STATUS_LABEL: Record<string, string> = {
  new: 'New', read: 'Read', replied: 'Replied', archived: 'Archived',
}

function EnquiryCard({ enquiry, onUpdate }: { enquiry: Enquiry; onUpdate: (id: string, update: Partial<Enquiry>) => void }) {
  const [expanded, setExpanded] = useState(enquiry.status === 'new')
  const [replyText, setReplyText] = useState('')
  const [pending, startTr] = useTransition()

  function handleExpand() {
    setExpanded(e => !e)
    if (enquiry.status === 'new') {
      startTr(async () => {
        await markEnquiryRead(enquiry.id)
        onUpdate(enquiry.id, { status: 'read' })
      })
    }
  }

  function handleReply() {
    if (!replyText.trim()) return
    startTr(async () => {
      const res = await replyToEnquiry(enquiry.id, replyText)
      if (!res.error) {
        onUpdate(enquiry.id, { status: 'replied', reply: replyText })
        setReplyText('')
      }
    })
  }

  function handleArchive() {
    startTr(async () => {
      await archiveEnquiry(enquiry.id)
      onUpdate(enquiry.id, { status: 'archived' })
    })
  }

  const subject = enquiry.programme?.title
    ? `Re: ${enquiry.programme.title}`
    : enquiry.resource?.name
      ? `Re: ${enquiry.resource.name}`
      : 'General enquiry'

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${enquiry.status === 'new' ? 'rgba(246,201,14,0.25)' : C.border}`,
      borderRadius: 16, marginBottom: 10, overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Header row */}
      <div
        onClick={handleExpand}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: `${STATUS_COLOR[enquiry.status]}18`,
          border: `1px solid ${STATUS_COLOR[enquiry.status]}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MessageSquare size={15} color={STATUS_COLOR[enquiry.status]} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{enquiry.guest_name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLOR[enquiry.status], background: `${STATUS_COLOR[enquiry.status]}18`, border: `1px solid ${STATUS_COLOR[enquiry.status]}30`, borderRadius: 20, padding: '1px 8px' }}>
              {STATUS_LABEL[enquiry.status]}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subject} · {new Date(enquiry.created_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {expanded ? <ChevronUp size={16} color={C.muted} /> : <ChevronDown size={16} color={C.muted} />}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '0 18px 18px', borderTop: `1px solid rgba(255,255,255,0.05)` }}>
          {/* Subject chip */}
          {subject !== 'General enquiry' && (
            <div style={{ margin: '14px 0 12px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.emerald, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 20, padding: '2px 9px' }}>
                {subject}
              </span>
            </div>
          )}

          {/* Message */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 14px', margin: '14px 0', borderLeft: '3px solid rgba(255,255,255,0.1)' }}>
            <p style={{ margin: 0, fontSize: 14, color: C.text, lineHeight: 1.6 }}>{enquiry.message}</p>
          </div>

          {/* Guest phone */}
          {enquiry.guest_phone && (
            <a href={`tel:${enquiry.guest_phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.muted, textDecoration: 'none', marginBottom: 14 }}>
              <Phone size={12} /> {enquiry.guest_phone}
            </a>
          )}

          {/* Existing reply */}
          {enquiry.reply && (
            <div style={{ background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.12)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: C.emerald, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your reply</p>
              <p style={{ margin: 0, fontSize: 14, color: C.text, lineHeight: 1.6 }}>{enquiry.reply}</p>
            </div>
          )}

          {/* Reply box */}
          {enquiry.status !== 'archived' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={enquiry.reply ? 'Send another reply…' : 'Write a reply…'}
                onKeyDown={e => e.key === 'Enter' && handleReply()}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 11, padding: '9px 14px', color: C.text, fontSize: 14,
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
              <button onClick={handleReply} disabled={pending || !replyText.trim()} style={{
                padding: '9px 14px', borderRadius: 11, background: C.emerald, border: 'none',
                color: '#06080C', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                opacity: pending || !replyText.trim() ? 0.5 : 1,
              }}>
                <Send size={13} />
              </button>
            </div>
          )}

          {/* Archive */}
          {enquiry.status !== 'archived' && (
            <button onClick={handleArchive} disabled={pending} style={{
              background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, padding: 0,
            }}>
              <Archive size={12} /> Archive
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const TABS = ['new', 'read', 'replied', 'archived'] as const

export default function EnquiriesClient({ initialEnquiries }: { initialEnquiries: Enquiry[] }) {
  const [enquiries, setEnquiries] = useState(initialEnquiries)
  const [tab, setTab] = useState<typeof TABS[number]>('new')

  function handleUpdate(id: string, update: Partial<Enquiry>) {
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, ...update } : e))
  }

  const counts = Object.fromEntries(TABS.map(t => [t, enquiries.filter(e => e.status === t).length]))
  const visible = enquiries.filter(e => e.status === tab)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.4px' }}>Enquiries</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Messages from guests about your programmes and spaces.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 14px', borderRadius: 20, border: `1px solid ${tab === t ? C.emerald : 'rgba(255,255,255,0.08)'}`,
            background: tab === t ? 'rgba(0,212,170,0.1)' : 'transparent',
            color: tab === t ? C.emerald : C.muted,
            fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {STATUS_LABEL[t]}
            {counts[t] > 0 && (
              <span style={{
                minWidth: 18, height: 18, borderRadius: 9, padding: '0 5px',
                background: t === 'new' ? '#F6C90E' : 'rgba(255,255,255,0.12)',
                color: t === 'new' ? '#06080C' : C.muted,
                fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: C.card, border: `1px dashed ${C.border}`, borderRadius: 18 }}>
          <MessageSquare size={36} color="rgba(255,255,255,0.08)" style={{ marginBottom: 12 }} />
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>No {STATUS_LABEL[tab].toLowerCase()} enquiries.</p>
        </div>
      ) : (
        visible.map(e => <EnquiryCard key={e.id} enquiry={e} onUpdate={handleUpdate} />)
      )}
    </div>
  )
}

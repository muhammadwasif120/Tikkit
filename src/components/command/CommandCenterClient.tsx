'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ActionCard from './ActionCard'
import ChatPanel from './ChatPanel'
import { Users, MessageSquare, ChevronLeft, Calendar, Radio } from 'lucide-react'
import type { CommandAttendee, ChatMessage } from '@/types/verification'
import { updateRegistrationStatus } from '@/app/actions/commandActions'

interface Props {
  event: { id: string; title: string; date_start: string; date_end: string | null; status: string }
  attendees: CommandAttendee[]
  recentMessages: ChatMessage[]
  organizerName: string
}

const CSS = `
  .cc-wrap { height:100%; display:flex; flex-direction:column; }
  .cc-header {
    display:flex; align-items:center; gap:12px; padding:20px 24px 16px;
    border-bottom:1px solid rgba(255,255,255,0.06); flex-shrink:0; flex-wrap:wrap; gap:12px;
  }
  .cc-header-info { flex:1; min-width:0; }
  .cc-event-title { color:white; font-size:18px; font-weight:900; margin:0 0 4px; font-family:var(--font-display); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .cc-event-meta  { color:#4B5563; font-size:12px; margin:0; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
  .cc-live-badge  { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:100px; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.25); color:#22C55E; font-size:10px; font-weight:700; }
  .cc-live-dot    { width:6px; height:6px; border-radius:50%; background:#22C55E; animation:ccPulse 2s infinite; }
  @keyframes ccPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

  .cc-tabs { display:flex; border-bottom:1px solid rgba(255,255,255,0.06); padding:0 24px; flex-shrink:0; }
  .cc-tab  { padding:12px 0; margin-right:24px; font-size:13px; font-weight:700; color:#4B5563; cursor:pointer; border-bottom:2px solid transparent; transition:color 0.15s, border-color 0.15s; display:flex; align-items:center; gap:6px; }
  .cc-tab.active  { color:white; border-color:#1E5EFF; }
  .cc-tab-count   { background:rgba(30,94,255,0.2); color:#818CF8; padding:1px 6px; border-radius:10px; font-size:10px; }

  .cc-body { flex:1; overflow:hidden; display:flex; }

  /* Desktop: side-by-side */
  .cc-attendees { flex:1; overflow-y:auto; padding:20px 24px; display:flex; flex-direction:column; gap:12px; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.08) transparent; }
  .cc-chat-col  { width:360px; flex-shrink:0; padding:20px 24px 20px 0; display:flex; }

  /* Mobile: tabs */
  @media (max-width:767px) {
    .cc-tabs     { display:flex; }
    .cc-chat-col { display:none; }
    .cc-attendees{ padding:16px; }
    .cc-chat-col.mobile-active { display:flex; width:100%; padding:16px; }
    .cc-attendees.mobile-hidden { display:none; }
  }
  @media (min-width:768px) {
    .cc-tabs { display:none; }
  }

  .cc-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:60px 24px; color:#374151; }
  .cc-back-btn {
    display:inline-flex; align-items:center; gap:6px; padding:6px 14px;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    border-radius:8px; color:#9CA3AF; font-size:12px; font-weight:600;
    cursor:pointer; transition:color 0.15s, border-color 0.15s; text-decoration:none;
  }
  .cc-back-btn:hover { color:white; border-color:rgba(255,255,255,0.14); }
`

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function CommandCenterClient({ event, attendees: initial, recentMessages, organizerName }: Props) {
  const router = useRouter()
  const [attendees, setAttendees] = useState<CommandAttendee[]>(initial)
  const [actioning, setActioning] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<'attendees' | 'chat'>('attendees')

  const pending = attendees.filter(a => a.status === 'pending').length

  const handleApprove = async (registrationId: string) => {
    setActioning(registrationId)
    const result = await updateRegistrationStatus(registrationId, 'approved')
    if (!result.error) {
      setAttendees(prev => prev.map(a =>
        a.registration_id === registrationId ? { ...a, status: 'approved' } : a
      ))
    }
    setActioning(null)
  }

  const handleReject = async (registrationId: string) => {
    setActioning(registrationId)
    const result = await updateRegistrationStatus(registrationId, 'rejected')
    if (!result.error) {
      setAttendees(prev => prev.map(a =>
        a.registration_id === registrationId ? { ...a, status: 'rejected' } : a
      ))
    }
    setActioning(null)
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="cc-wrap">

        {/* Header */}
        <div className="cc-header">
          <button className="cc-back-btn" onClick={() => router.push('/dashboard/command')}>
            <ChevronLeft size={14} /> Command
          </button>
          <div className="cc-header-info">
            <h1 className="cc-event-title">{event.title}</h1>
            <p className="cc-event-meta">
              <Calendar size={11} /> {fmtDate(event.date_start)}
              {event.status === 'published' && (
                <span className="cc-live-badge"><div className="cc-live-dot" /> LIVE</span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '6px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
              <p style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)' }}>{attendees.length}</p>
              <p style={{ color: '#4B5563', fontSize: 10, margin: 0, fontWeight: 600 }}>TOTAL</p>
            </div>
            {pending > 0 && (
              <div style={{ textAlign: 'center', padding: '6px 14px', background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 10 }}>
                <p style={{ color: '#FACC15', fontSize: 16, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)' }}>{pending}</p>
                <p style={{ color: '#6B7280', fontSize: 10, margin: 0, fontWeight: 600 }}>PENDING</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="cc-tabs">
          <button
            className={`cc-tab${mobileTab === 'attendees' ? ' active' : ''}`}
            onClick={() => setMobileTab('attendees')}
          >
            <Users size={14} /> Attendees
            {pending > 0 && <span className="cc-tab-count">{pending}</span>}
          </button>
          <button
            className={`cc-tab${mobileTab === 'chat' ? ' active' : ''}`}
            onClick={() => setMobileTab('chat')}
          >
            <MessageSquare size={14} /> Chat
          </button>
        </div>

        {/* Body */}
        <div className="cc-body">
          {/* Attendees column */}
          <div className={`cc-attendees${mobileTab === 'chat' ? ' mobile-hidden' : ''}`}>
            {attendees.length === 0 ? (
              <div className="cc-empty">
                <Users size={32} />
                <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>No attendees yet</p>
              </div>
            ) : (
              attendees.map(a => (
                <ActionCard
                  key={a.registration_id}
                  attendee={a}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  actioning={actioning === a.registration_id}
                />
              ))
            )}
          </div>

          {/* Chat column */}
          <div className={`cc-chat-col${mobileTab === 'chat' ? ' mobile-active' : ''}`}>
            <ChatPanel
              eventId={event.id}
              initialMessages={recentMessages}
              organizerName={organizerName}
            />
          </div>
        </div>
      </div>
    </>
  )
}

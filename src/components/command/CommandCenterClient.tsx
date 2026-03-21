'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ActionCard from './ActionCard'
import ChatPanel from './ChatPanel'
import { Users, MessageSquare, ChevronLeft, Calendar, Clock } from 'lucide-react'
import type { CommandAttendee, ChatMessage } from '@/types/verification'
import { updateRegistrationStatus } from '@/app/actions/commandActions'

interface Props {
  event: { id: string; title: string; date_start: string; date_end: string | null; status: string }
  attendees: CommandAttendee[]
  recentMessages: ChatMessage[]
  organizerName: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })
}

const CSS = `
  .cc-wrap { height:100%; display:flex; flex-direction:column; overflow:hidden; }

  .cc-header {
    display:flex; align-items:center; gap:12px; padding:14px 20px;
    border-bottom:1px solid rgba(255,255,255,0.06); flex-shrink:0;
    flex-wrap:wrap; background:#0B0D14;
  }
  .cc-back-btn {
    display:inline-flex; align-items:center; gap:5px; padding:6px 12px;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    border-radius:8px; color:#9CA3AF; font-size:var(--fs-sm); font-weight:600;
    cursor:pointer; transition:color 0.15s, border-color 0.15s, background 0.15s;
    flex-shrink:0; white-space:nowrap;
  }
  .cc-back-btn:hover { color:white; border-color:rgba(255,255,255,0.15); background:rgba(255,255,255,0.06); }

  .cc-header-info { flex:1; min-width:0; }
  .cc-event-title {
    color:white; font-size:var(--fs-lg); font-weight:900; margin:0 0 3px;
    font-family:var(--font-display); letter-spacing:-0.3px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  .cc-event-meta { color:#4B5563; font-size:var(--fs-xs); margin:0; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }

  .cc-live-badge {
    display:inline-flex; align-items:center; gap:5px; padding:3px 10px;
    border-radius:100px; background:rgba(34,197,94,0.1);
    border:1px solid rgba(34,197,94,0.25); color:#22C55E;
    font-size:var(--fs-2xs); font-weight:800; letter-spacing:0.04em;
  }
  .cc-live-dot {
    display:inline-block; width:6px; height:6px; border-radius:50%; background:#22C55E;
    animation:ccPulse 2s infinite; flex-shrink:0;
  }
  @keyframes ccPulse {
    0%,100% { opacity:1; box-shadow:0 0 4px rgba(34,197,94,0.8); }
    50%      { opacity:0.4; box-shadow:none; }
  }

  .cc-stats { display:flex; gap:8px; flex-wrap:wrap; flex-shrink:0; }
  .cc-stat {
    text-align:center; padding:5px 14px;
    background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07);
    border-radius:10px; min-width:52px;
  }
  .cc-stat-n { color:white; font-size:var(--fs-lg); font-weight:900; margin:0; font-family:var(--font-display); line-height:1.2; }
  .cc-stat-l { color:#4B5563; font-size:var(--fs-2xs); margin:0; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; }
  .cc-stat.warn  { background:rgba(250,204,21,0.07); border-color:rgba(250,204,21,0.18); }
  .cc-stat.warn .cc-stat-n { color:#FACC15; }

  .cc-tabs {
    display:none; border-bottom:1px solid rgba(255,255,255,0.06);
    padding:10px 20px 0; flex-shrink:0; gap:4px;
  }
  .cc-tab {
    padding:8px 16px; border-radius:10px 10px 0 0; font-size:var(--fs-sm); font-weight:700;
    color:#4B5563; cursor:pointer; border:none; background:none;
    border-bottom:2px solid transparent; transition:color 0.15s, border-color 0.15s;
    display:flex; align-items:center; gap:6px;
  }
  .cc-tab.active { color:white; border-color:#1E5EFF; }
  .cc-tab-badge {
    background:rgba(250,204,21,0.15); color:#FACC15; border:1px solid rgba(250,204,21,0.25);
    padding:1px 7px; border-radius:8px; font-size:var(--fs-2xs); font-weight:800;
  }

  .cc-body { flex:1; overflow:hidden; display:flex; min-height:0; }
  .cc-attendees {
    flex:1; overflow-y:auto; padding:16px 20px;
    display:flex; flex-direction:column; gap:10px;
    scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.08) transparent;
  }
  .cc-chat-col { width:360px; flex-shrink:0; padding:16px 20px 16px 0; display:flex; }

  @media (max-width:767px) {
    .cc-tabs     { display:flex; }
    .cc-chat-col { display:none; }
    .cc-attendees{ padding:14px; }
    .cc-chat-col.mobile-active  { display:flex; width:100%; padding:14px; }
    .cc-attendees.mobile-hidden { display:none; }
  }
  @media (min-width:768px) {
    .cc-tabs { display:none; }
  }

  .cc-empty {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:12px; padding:80px 24px;
  }
  .cc-empty-icon {
    width:56px; height:56px; border-radius:18px;
    background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);
    display:flex; align-items:center; justify-content:center;
  }
  .cc-section-label {
    color:#374151; font-size:var(--fs-2xs); font-weight:700; letter-spacing:0.07em;
    text-transform:uppercase; padding:0 0 8px; display:block;
  }
`

export default function CommandCenterClient({ event, attendees: initial, recentMessages, organizerName }: Props) {
  const router = useRouter()
  const [attendees, setAttendees] = useState<CommandAttendee[]>(initial)
  const [actioning, setActioning] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<'attendees' | 'chat'>('attendees')

  const pending  = attendees.filter(a => a.status === 'pending').length
  const approved = attendees.filter(a => ['approved','confirmed','checked_in'].includes(a.status)).length
  const isLive   = event.status === 'published'

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
            <ChevronLeft size={13} /> Command
          </button>

          <div className="cc-header-info">
            <h1 className="cc-event-title">{event.title}</h1>
            <div className="cc-event-meta">
              <Calendar size={10} style={{ flexShrink: 0 }} />
              {fmtDate(event.date_start)}
              {isLive ? (
                <span className="cc-live-badge"><span className="cc-live-dot" /> LIVE NOW</span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#4B5563' }}>
                  <Clock size={10} /> Ended
                </span>
              )}
            </div>
          </div>

          <div className="cc-stats">
            <div className="cc-stat">
              <p className="cc-stat-n">{attendees.length}</p>
              <p className="cc-stat-l">Total</p>
            </div>
            <div className="cc-stat">
              <p className="cc-stat-n">{approved}</p>
              <p className="cc-stat-l">Approved</p>
            </div>
            {pending > 0 && (
              <div className="cc-stat warn">
                <p className="cc-stat-n">{pending}</p>
                <p className="cc-stat-l">Pending</p>
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
            <Users size={13} /> Attendees
            {pending > 0 && <span className="cc-tab-badge">{pending}</span>}
          </button>
          <button
            className={`cc-tab${mobileTab === 'chat' ? ' active' : ''}`}
            onClick={() => setMobileTab('chat')}
          >
            <MessageSquare size={13} /> Chat
          </button>
        </div>

        {/* Body */}
        <div className="cc-body">
          <div className={`cc-attendees${mobileTab === 'chat' ? ' mobile-hidden' : ''}`}>
            {attendees.length === 0 ? (
              <div className="cc-empty">
                <div className="cc-empty-icon"><Users size={24} color="#374151" /></div>
                <p style={{ fontSize: 'var(--fs-md)', color: '#4B5563', margin: 0, fontWeight: 600 }}>No attendees yet</p>
                <p style={{ fontSize: 'var(--fs-sm)', color: '#374151', margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
                  Attendees appear here once they register
                </p>
              </div>
            ) : (
              <>
                {pending > 0 && <span className="cc-section-label">Awaiting action ({pending})</span>}
                {attendees.map(a => (
                  <ActionCard
                    key={a.registration_id}
                    attendee={a}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    actioning={actioning === a.registration_id}
                  />
                ))}
              </>
            )}
          </div>

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

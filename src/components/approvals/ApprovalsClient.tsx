'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X, ChevronDown, Clock, CheckCircle, XCircle, Users, ExternalLink, Copy } from 'lucide-react'
import { notifyGuestApproved, notifyGuestRejected } from '@/app/actions/approvalNotificationActions'
import clsx from 'clsx'

type Registration = {
  id: string
  event_id: string
  full_name: string
  email: string
  phone: string | null
  gender: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

type Event = {
  id: string
  title: string
  registration_mode: string
  require_id_verification: boolean
  require_reference_code: boolean
  reference_code: string | null
}

const statusConfig = {
  pending:  { label: 'Pending',  color: 'text-[#FFC745]',  bg: 'bg-[#FFC74515]',    border: 'border-[#FFC74530]',    icon: Clock },
  approved: { label: 'Approved', color: 'text-green-400',  bg: 'bg-green-500/10',   border: 'border-green-500/20',   icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-400',    bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: XCircle },
}

export default function ApprovalsClient({
  registrations: initial,
  events,
}: {
  registrations: Registration[]
  events: Event[]
}) {
  const supabase = createClient()
  const [registrations, setRegistrations] = useState<Registration[]>(initial)
  const [selectedEventId, setSelectedEventId] = useState('all')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const filtered = registrations.filter(r => {
    const matchEvent  = selectedEventId === 'all' || r.event_id === selectedEventId
    const matchStatus = statusFilter === 'all'    || r.status   === statusFilter
    return matchEvent && matchStatus
  })

  const pendingCount = registrations.filter(r => r.status === 'pending').length

  const approve = async (reg: Registration) => {
    setProcessing(reg.id)
    const event = events.find(e => e.id === reg.event_id)

    const res = await fetch('/api/approve-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId: reg.id }),
    })

    if (!res.ok) {
      const data = await res.json()
      console.error('Approval failed:', data.error)
      setProcessing(null)
      return
    }

    // Send approval email
    await fetch('/api/send-approval-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'approved',
        name: reg.full_name,
        email: reg.email,
        eventTitle: event?.title,
        requireIdVerification: event?.require_id_verification,
        requireReferenceCode:  event?.require_reference_code,
        referenceCode:         event?.reference_code,
      }),
    })

    // Notify organiser
    await notifyGuestApproved(reg.event_id, reg.full_name, event?.title ?? '')

    setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, status: 'approved' } : r))
    setProcessing(null)
  }

  const reject = async (reg: Registration) => {
    setProcessing(reg.id)
    const event = events.find(e => e.id === reg.event_id)

    await supabase
      .from('public_registrations')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', reg.id)

    // Send rejection email
    await fetch('/api/send-approval-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'rejected',
        name: reg.full_name,
        email: reg.email,
        eventTitle: event?.title,
      }),
    })

    // Notify organiser
    await notifyGuestRejected(reg.event_id, reg.full_name, event?.title ?? '')

    setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, status: 'rejected' } : r))
    setProcessing(null)
  }

  const copyLink = (eventId: string) => {
    const url = `${window.location.origin}/register/${eventId}`
    navigator.clipboard.writeText(url)
    setCopied(eventId)
    setTimeout(() => setCopied(null), 2000)
  }

  const publicEvents = events.filter(e => e.registration_mode !== 'invite_only')

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Approvals</h2>
          {pendingCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFC74520] text-[#FFC745] border border-[#FFC74530]">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm mt-1">Review and approve public event registrations</p>
      </div>

      {/* Public event links */}
      {publicEvents.length > 0 && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Public Registration Links
          </h3>
          {publicEvents.map(event => (
            <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
              <div>
                <p className="text-sm font-medium text-white">{event.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {event.registration_mode === 'open' ? '🟢 Open registration' : '🟡 Expression of interest'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyLink(event.id)}
                  className={clsx('btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 transition-all',
                    copied === event.id && 'text-green-400 border-green-500/30')}
                >
                  {copied === event.id
                    ? <><Check className="w-3 h-3" /> Copied!</>
                    : <><Copy className="w-3 h-3" /> Copy Link</>
                  }
                </button>
                <a
                  href={`/register/${event.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3 h-3" /> Preview
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative">
          <select
            className="input appearance-none pr-10"
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
          >
            <option value="all">All Events</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex items-center gap-1 bg-brand-charcoal-light rounded-lg p-1">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx('px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all',
                statusFilter === s ? 'bg-[#1E5EFF] text-white' : 'text-gray-400 hover:text-white')}
            >
              {s}
              {s !== 'all' && (
                <span className="ml-1.5 opacity-60">
                  {registrations.filter(r => r.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Registrations list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium text-sm">
            {statusFilter === 'pending' ? 'No pending approvals' : 'No registrations found'}
          </p>
          <p className="text-gray-600 text-xs mt-1">
            {publicEvents.length === 0
              ? 'Set an event to Open or Expression of Interest to receive registrations'
              : 'Share your registration link to start receiving sign-ups'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(reg => {
            const event = events.find(e => e.id === reg.event_id)
            const s = statusConfig[reg.status]
            return (
              <div key={reg.id} className="card flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#1E5EFF15] border border-[#1E5EFF20] flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-[#1E5EFF]">{reg.full_name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{reg.full_name}</p>
                      <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border', s.bg, s.color, s.border)}>
                        <s.icon className="w-2.5 h-2.5" /> {s.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {reg.email}{reg.phone ? ` · ${reg.phone}` : ''}{reg.gender ? ` · ${reg.gender}` : ''}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {event?.title} · {new Date(reg.created_at).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                    </p>
                  </div>
                </div>

                {reg.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => reject(reg)}
                      disabled={processing === reg.id}
                      className="w-8 h-8 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => approve(reg)}
                      disabled={processing === reg.id}
                      className="w-8 h-8 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
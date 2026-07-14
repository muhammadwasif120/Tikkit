'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Edit, Trash2, CheckCircle, XCircle, FlagOff, Share2, Link as LinkIcon, MessageCircle, Mail, UserPlus, ShieldCheck } from 'lucide-react'
import { notifyEventGoingLive, notifyEventEnded } from '@/app/actions/eventNotificationActions'
import { dismissEventLiveNotification } from '@/app/actions/approvalDismissAction'
import { initiateVerification } from '@/app/actions/verificationActions'
import type { Database } from '@/lib/supabase/database.types'

type Event = Database['public']['Tables']['events']['Row']

export default function EventActions({ event, organizerVerified }: { event: Event; organizerVerified: boolean }) {
  const [open, setOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const updateStatus = async (status: Event['status']) => {
    setLoading(true)
    setErr(null)
    setOpen(false)

    const { error } = await supabase.from('events').update({ status }).eq('id', event.id)
    if (error) {
      // Surface failures instead of silently doing nothing — e.g. the DB-level
      // ID-verification gate rejecting a publish.
      setErr(error.message.includes('ID_VERIFICATION_REQUIRED')
        ? 'Complete your ID verification before publishing this event.'
        : (error.message || 'Could not update the event. Please try again.'))
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      if (status === 'published') {
        await notifyEventGoingLive(user.id, event.id, event.title)
      } else if (status === 'completed' || status === 'cancelled') {
        const { count } = await supabase
          .from('guests')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('status', 'checked_in')
        await dismissEventLiveNotification(event.id)
        await notifyEventEnded(user.id, event.id, event.title, count ?? 0)
      }
    }
    router.refresh()
    setLoading(false)
  }

  // Unverified organizers publish-flow: kick off Didit ID verification.
  const handleVerify = async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await initiateVerification()
      if (res?.diditSessionUrl) { window.location.href = res.diditSessionUrl; return }
      setErr(res?.error || 'Could not start verification. Please try again from Settings.')
    } catch {
      setErr('Could not start verification. Please try again from Settings.')
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async () => {
    setLoading(true)
    setConfirmDelete(false)
    await supabase.from('events').delete().eq('id', event.id)
    router.push('/dashboard/events')
  }

  const appUrl = (typeof window !== 'undefined' ? window.location.origin : '') + `/register/${event.slug || event.id}`
  const shareText = `Check out ${event.title}!`
  
  const handleShareLink = () => {
    navigator.clipboard.writeText(appUrl)
    setShareOpen(false)
    alert('Event link copied to clipboard!')
  }
  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + appUrl)}`, '_blank')
    setShareOpen(false)
  }
  const handleShareEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(shareText + '\n\n' + appUrl)}`, '_blank')
    setShareOpen(false)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {err && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 max-w-xs text-right">
          {err}
        </div>
      )}
      <div className="flex items-center gap-2">
      {event.status === 'draft' && (
        organizerVerified ? (
          <button
            onClick={() => updateStatus('published')}
            className="btn-primary"
            style={{ background: '#22C55E', color: 'white' }}
            disabled={loading}
          >
            <CheckCircle className="w-4 h-4" /> Publish Event
          </button>
        ) : (
          <button
            onClick={handleVerify}
            className="btn-primary"
            style={{ background: '#FFC745', color: '#000' }}
            disabled={loading}
            title="Verify your identity to publish events"
          >
            <ShieldCheck className="w-4 h-4" /> {loading ? 'Starting…' : 'Verify ID to Publish'}
          </button>
        )
      )}

      {event.status === 'published' && !event.is_private && (
        <div className="relative">
          <button
            onClick={() => setShareOpen(!shareOpen)}
            className="btn-secondary items-center gap-2 px-3"
            disabled={loading}
          >
            <Share2 className="w-4 h-4" /> Share
          </button>

          {shareOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShareOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-brand-charcoal border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in text-left">
                <button onClick={handleShareLink} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                  <LinkIcon className="w-4 h-4" /> Share via Link
                </button>
                <button onClick={handleShareWhatsApp} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-green-400 hover:bg-green-500/10 transition-colors">
                  <MessageCircle className="w-4 h-4" /> Share via WhatsApp
                </button>
                <button onClick={handleShareEmail} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors">
                  <Mail className="w-4 h-4" /> Share via Email
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {event.status === 'published' && event.is_private && (
        <button
          onClick={() => router.push(`/dashboard/events/${event.id}/guests/add`)}
          className="btn-primary items-center gap-2 px-3"
          disabled={loading}
        >
          <UserPlus className="w-4 h-4" /> Invite Guests
        </button>
      )}

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="btn-secondary px-3"
          disabled={loading}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-brand-charcoal border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in">

            {event.status === 'published' && (
              <>
                <button
                  onClick={() => updateStatus('completed')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors"
                >
                  <FlagOff className="w-4 h-4" />
                  Mark Complete
                </button>
                <button
                  onClick={() => updateStatus('draft')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Unpublish
                </button>
              </>
            )}
            {event.status !== 'cancelled' && event.status !== 'completed' && (
              <button
                onClick={() => updateStatus('cancelled')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-yellow-400 hover:bg-yellow-500/10 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Cancel Event
              </button>
            )}
            <div className="border-t border-white/5" />
            <button
              onClick={() => { setOpen(false); setConfirmDelete(true) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Event
            </button>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setConfirmDelete(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-sm bg-[#111318] border border-white/10 rounded-2xl p-6 z-50 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-white font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Delete Event</h3>
            <p className="text-gray-400 text-sm mb-5">
              Are you sure? All guests and data for <span className="text-white font-medium">{event.title}</span> will be permanently removed.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary">Cancel</button>
              <button onClick={deleteEvent} disabled={loading}
                className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-medium flex items-center gap-2 transition-all">
                <Trash2 className="w-4 h-4" />{loading ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </>
      )}
      </div>
      </div>
    </div>
  )
}
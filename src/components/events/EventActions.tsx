'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Edit, Trash2, CheckCircle, XCircle, FlagOff } from 'lucide-react'
import { notifyEventGoingLive, notifyEventEnded } from '@/app/actions/eventNotificationActions'
import { dismissEventLiveNotification } from '@/app/actions/approvalDismissAction'
import type { Database } from '@/lib/supabase/database.types'

type Event = Database['public']['Tables']['events']['Row']

export default function EventActions({ event }: { event: Event }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const updateStatus = async (status: Event['status']) => {
    setLoading(true)
    setOpen(false)

    const { error } = await supabase.from('events').update({ status }).eq('id', event.id)
    if (!error) {
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
    }
    setLoading(false)
  }

  const deleteEvent = async () => {
    setLoading(true)
    setConfirmDelete(false)
    await supabase.from('events').delete().eq('id', event.id)
    router.push('/dashboard/events')
  }

  return (
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
            {event.status === 'draft' && (
              <button
                onClick={() => updateStatus('published')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-green-400 hover:bg-green-500/10 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Publish Event
              </button>
            )}
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
  )
}
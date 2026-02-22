'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { notifyEventGoingLive, notifyEventEnded } from '@/app/actions/eventNotificationActions'
import type { Database } from '@/lib/supabase/database.types'

type Event = Database['public']['Tables']['events']['Row']

export default function EventActions({ event }: { event: Event }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const updateStatus = async (status: Event['status']) => {
    setLoading(true)

    await supabase.from('events').update({ status }).eq('id', event.id)
    setOpen(false)

    // Fire notifications based on the new status
    if (status === 'published') {
      await notifyEventGoingLive(event.id, event.title)
    } else if (status === 'cancelled') {
      await notifyEventEnded(event.id, event.title)
    }

    router.refresh()
    setLoading(false)
  }

  const deleteEvent = async () => {
    if (!confirm('Delete this event? This cannot be undone.')) return
    setLoading(true)
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
              <button
                onClick={() => updateStatus('draft')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Unpublish
              </button>
            )}
            {event.status !== 'cancelled' && (
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
              onClick={deleteEvent}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Event
            </button>
          </div>
        </>
      )}
    </div>
  )
}
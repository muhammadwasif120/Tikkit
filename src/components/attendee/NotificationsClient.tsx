'use client'

import Link from 'next/link'
import { useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Megaphone, MapPin, Ticket } from 'lucide-react'
import { Button, Card, EmptyState } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { relative } from '@/lib/format'
import { cn } from '@/lib/cn'

export type Note = { id: string; type: string; title: string; body: string | null; readAt: string | null; createdAt: string; href: string | null }
const icon = (t: string) => t.includes('reveal') ? MapPin : t.includes('announce') ? Megaphone : t.includes('approv') || t.includes('payment') || t.includes('ticket') ? Ticket : Bell

export default function NotificationsClient({ notes }: { notes: Note[] }) {
  const router = useRouter(); const supabase = useMemo(() => createClient(), [])
  const [pending, start] = useTransition()
  const unread = notes.filter(n => !n.readAt).length
  const mark = (ids: string[]) => start(async () => { await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', ids); router.refresh() })

  if (notes.length === 0) return <Card><EmptyState icon={<Bell className="h-6 w-6" />} title="Nothing yet" description="Approvals, announcements and location reveals show up here." /></Card>
  return (
    <>
      {unread > 0 && <div className="mb-3 flex justify-end"><Button variant="ghost" size="sm" leading={<CheckCheck className="h-4 w-4" />} loading={pending} onClick={() => mark(notes.filter(n => !n.readAt).map(n => n.id))}>Mark all as read</Button></div>}
      <ul className="space-y-2">
        {notes.map(n => {
          const Icon = icon(n.type)
          const body = (
            <div className={cn('flex gap-3 rounded-2xl p-4 shadow-card transition-colors', n.readAt ? 'bg-surface' : 'bg-accent/6 ring-1 ring-accent/30')}>
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-raised text-muted"><Icon className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-medium text-fg">{n.title}</p>{n.body && <p className="mt-0.5 whitespace-pre-line text-sm text-muted">{n.body}</p>}<p className="mt-1 text-xs text-subtle">{relative(n.createdAt)}</p></div>
              {!n.readAt && <span className="mt-2 h-2 w-2 rounded-full bg-accent" aria-label="Unread" />}
            </div>
          )
          return <li key={n.id}>{n.href ? <Link href={n.href} onClick={() => !n.readAt && mark([n.id])}>{body}</Link> : <button className="block w-full text-left" onClick={() => !n.readAt && mark([n.id])}>{body}</button>}</li>
        })}
      </ul>
    </>
  )
}

import Link from 'next/link'
import { Clock, ShieldX } from 'lucide-react'
import { Card, EmptyState } from '@/components/kit'
import { createClient } from '@/lib/supabase/server'
import { fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import GateDoor from '@/components/door/GateDoor'

export default async function StaffPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ event?: string }> }) {
  const [{ token }, { event }] = await Promise.all([params, searchParams])
  const supabase = await createClient()
  const { data: events, error } = await supabase.rpc('gate_get_events', { p_link_token: token })

  if (error || !events) {
    const expired = error?.message.includes('LINK_INVALID')
    return (
      <Card>
        <EmptyState icon={expired ? <Clock className="h-6 w-6" /> : <ShieldX className="h-6 w-6" />} title="This link is not valid"
          description="It may have expired or been revoked. Ask your organizer for a new one." />
      </Card>
    )
  }

  const current = events.find(e => e.id === event) ?? events[0]
  if (!current) return <Card><EmptyState icon={<Clock className="h-6 w-6" />} title="No events on this link" /></Card>

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{fmtDateTime(current.starts_at)}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{current.title}</h1>
      </div>
      {events.length > 1 && (
        <nav aria-label="Choose event" className="flex gap-2 overflow-x-auto">
          {events.map(e => (
            <Link key={e.id} href={`/staff/${token}?event=${e.id}`} aria-current={e.id === current.id ? 'page' : undefined}
              className={cn('whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium ring-1', e.id === current.id ? 'bg-accent/12 text-accent ring-accent/40' : 'text-muted ring-line')}>{e.title}</Link>
          ))}
        </nav>
      )}
      <GateDoor key={current.id} linkToken={token} eventId={current.id} />
    </div>
  )
}

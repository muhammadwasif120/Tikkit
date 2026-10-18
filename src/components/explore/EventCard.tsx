import Link from 'next/link'
import { CalendarDays, Lock, MapPin } from 'lucide-react'
import { Badge } from '@/components/kit'
import { fmtDate, fmtTime, pkr } from '@/lib/format'

export type ListingEvent = {
  id: string | null; slug: string | null; title: string | null; cover_image_url: string | null; city: string | null; area_label: string | null
  venue_name: string | null; is_secret_venue: boolean | null; starts_at: string | null; min_price_pkr: number | null
  registration_mode: 'open' | 'approval' | null; capacity: number | null; seats_taken: number | null
}

export function EventCard({ e, org }: { e: ListingEvent; org?: string | null }) {
  const left = e.capacity ? Math.max(0, e.capacity - (e.seats_taken ?? 0)) : null
  return (
    <Link href={`/events/${e.slug}`} className="group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-card transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-raised">
      <div className="relative aspect-[16/9] overflow-hidden bg-raised">
        {e.cover_image_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={e.cover_image_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          : <div className="h-full w-full" style={{ backgroundImage: 'var(--k-glow)' }} />}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {e.registration_mode === 'approval' && <Badge tone="info">Approval</Badge>}
          {left !== null && left > 0 && left <= 15 && <Badge tone="warning">{left} left</Badge>}
          {left === 0 && <Badge tone="danger">Sold out</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-accent"><CalendarDays className="h-3.5 w-3.5" aria-hidden />{fmtDate(e.starts_at)} · {fmtTime(e.starts_at)}</p>
        <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug tracking-tight text-fg">{e.title}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 truncate text-[13px] text-muted">
          {e.is_secret_venue ? <Lock className="h-3.5 w-3.5 shrink-0 text-violet" aria-hidden /> : <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />}
          <span className="truncate">{e.is_secret_venue ? `Secret location · ${e.area_label ?? e.city ?? ''}` : [e.venue_name, e.area_label ?? e.city].filter(Boolean).join(', ')}</span>
        </p>
        <div className="mt-auto flex items-center justify-between pt-4 text-sm">
          <span className="truncate text-muted">{org}</span>
          <span className="tnum font-semibold text-fg">{e.min_price_pkr === null ? '' : e.min_price_pkr === 0 ? 'Free' : `From ${pkr(e.min_price_pkr)}`}</span>
        </div>
      </div>
    </Link>
  )
}

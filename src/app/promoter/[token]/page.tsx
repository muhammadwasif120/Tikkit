import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { ShieldX } from 'lucide-react'
import { Card, CardBody, CardHeader, EmptyState, Logo } from '@/components/kit'
import { createClient } from '@/lib/supabase/server'
import { fmtDate, pkr } from '@/lib/format'
import { CopyButton } from '@/components/events/EventManage'

export const metadata: Metadata = { title: 'Promoter dashboard', robots: { index: false, follow: false } }

type Dash = {
  name: string
  links: { event_id: string; event_title: string; event_slug: string; starts_at: string; code: string; uses: number; registrations: number; confirmed: number; commission_pkr: number }[]
  totals: { accrued_pkr: number; paid_pkr: number }
}

export default async function PromoterPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('promoter_dashboard', { p_token: token })
  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`

  return (
    <div className="min-h-screen bg-canvas text-fg">
      <header className="flex h-14 items-center border-b border-line px-4"><Logo compact /><span className="ml-3 text-sm text-muted">Promoter dashboard</span></header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {error || !data ? (
          <Card><EmptyState icon={<ShieldX className="h-6 w-6" />} title="This link is not valid" description="Ask the organizer for a new promoter link." /></Card>
        ) : (() => {
          const d = data as unknown as Dash
          return (
            <>
              <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-magenta">Promoter</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{d.name}</h1></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-5"><p className="text-[13px] text-muted">Commission owed</p><p className="mt-2 tnum text-3xl font-semibold text-magenta">{pkr(d.totals.accrued_pkr)}</p></Card>
                <Card className="p-5"><p className="text-[13px] text-muted">Paid to you</p><p className="mt-2 tnum text-3xl font-semibold">{pkr(d.totals.paid_pkr)}</p></Card>
              </div>
              {d.links.length === 0 ? (
                <Card><CardBody><p className="text-sm text-muted">No active links yet. The organizer will add them.</p></CardBody></Card>
              ) : d.links.map(l => {
                const url = `${origin}/events/${l.event_slug}?ref=${encodeURIComponent(l.code)}`
                return (
                  <Card key={`${l.event_id}-${l.code}`}>
                    <CardHeader title={l.event_title} description={fmtDate(l.starts_at)} />
                    <CardBody className="space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        {[['Signed up', l.registrations], ['Confirmed', l.confirmed], ['Earned', pkr(l.commission_pkr)]].map(([k, v]) => (
                          <div key={k as string} className="rounded-xl bg-raised p-3"><div className="tnum text-lg font-semibold">{v}</div><div className="text-[11px] text-subtle">{k}</div></div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2"><code className="rounded-md bg-magenta/12 px-2 py-1 font-mono text-xs text-magenta">{l.code}</code><p className="min-w-0 flex-1 truncate text-xs text-muted">{url}</p><CopyButton text={url} label="Copy" /></div>
                    </CardBody>
                  </Card>
                )
              })}
            </>
          )
        })()}
      </main>
    </div>
  )
}

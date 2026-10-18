'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, CloudOff, Megaphone, Search, Smartphone, UserRound, Wifi } from 'lucide-react'
import { Avatar, Badge, Button, Card, CardBody, CardHeader, Input, PageHeader, Progress } from '@/components/kit'
import { cn } from '@/lib/cn'

type Scan = { id: number; name: string; ticket: string; result: 'admitted' | 'duplicate' | 'not_approved'; time: string; vip?: boolean }

const INITIAL: Scan[] = [
  { id: 4, name: 'Noor Fatima', ticket: 'VIP', result: 'admitted', time: '8:42 pm', vip: true },
  { id: 3, name: 'Bilal Ahmed', ticket: 'General', result: 'admitted', time: '8:41 pm' },
  { id: 2, name: 'Usman Tariq', ticket: 'General', result: 'not_approved', time: '8:39 pm' },
  { id: 1, name: 'Hira Shah', ticket: 'Early bird', result: 'duplicate', time: '8:37 pm' },
]

const resultUI = {
  admitted: { tone: 'success', icon: CheckCircle2, label: 'Admitted', ring: 'ring-success/40', bg: 'bg-success/10' },
  duplicate: { tone: 'warning', icon: AlertTriangle, label: 'Already scanned', ring: 'ring-warning/40', bg: 'bg-warning/10' },
  not_approved: { tone: 'danger', icon: AlertTriangle, label: 'Not approved', ring: 'ring-danger/40', bg: 'bg-danger/10' },
} as const

export default function EventDayPrototype() {
  const [scans, setScans] = useState<Scan[]>(INITIAL)
  const [online, setOnline] = useState(true)
  const last = scans[0]
  const ui = resultUI[last.result]
  const admitted = 142 + scans.filter(s => s.result === 'admitted').length - 2

  const simulate = () =>
    setScans(s => [{ id: s[0].id + 1, name: ['Ibrahim Malik', 'Zara Hussain', 'Faizan Haq'][s[0].id % 3], ticket: 'General', result: 'admitted', time: '8:44 pm' }, ...s])

  return (
    <div className="k-fade-up">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-success" aria-hidden /> Live now</span>}
        title="Event Day"
        description="Rooftop Sunset Session · doors opened 8:00 pm"
        actions={
          <>
            <Button variant="secondary" leading={<Megaphone className="h-4 w-4" />}>Announce</Button>
            <Button variant="secondary" leading={<Smartphone className="h-4 w-4" />}>Gate staff links</Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Scanner */}
        <Card className="lg:col-span-3">
          <CardHeader
            title="Scanner"
            description="Point the camera at a guest QR code"
            action={
              <button onClick={() => setOnline(o => !o)} className="cursor-pointer" aria-label="Toggle connection preview">
                {online ? <Badge tone="success" dot><Wifi className="mr-1 h-3 w-3" aria-hidden />Online</Badge> : <Badge tone="warning" dot><CloudOff className="mr-1 h-3 w-3" aria-hidden />Offline: 3 queued</Badge>}
              </button>
            }
          />
          <CardBody className="space-y-4">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl bg-black">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.10),transparent_60%)]" />
              {/* viewfinder */}
              <div className="absolute inset-[14%] rounded-3xl border border-white/10" aria-hidden>
                {['left-0 top-0 border-l-2 border-t-2 rounded-tl-3xl', 'right-0 top-0 border-r-2 border-t-2 rounded-tr-3xl', 'left-0 bottom-0 border-l-2 border-b-2 rounded-bl-3xl', 'right-0 bottom-0 border-r-2 border-b-2 rounded-br-3xl'].map(c => (
                  <span key={c} className={cn('absolute h-10 w-10 border-accent', c)} />
                ))}
                <span className="absolute inset-x-4 h-0.5 rounded-full bg-accent shadow-[0_0_16px_rgb(34_211_238)] [animation:k-scan_1.8s_ease-in-out_infinite_alternate]" />
              </div>
              <p className="absolute inset-x-0 bottom-4 text-center text-xs text-white/60">Hold steady, it scans automatically</p>
            </div>

            <div className={cn('flex items-center gap-4 rounded-2xl p-4 ring-1', last.vip && last.result === 'admitted' ? 'bg-magenta/10 ring-magenta/40' : [ui.bg, ui.ring])} role="status" aria-live="polite">
              <ui.icon className={cn('h-9 w-9 shrink-0', last.result === 'admitted' ? (last.vip ? 'text-magenta' : 'text-success') : last.result === 'duplicate' ? 'text-warning' : 'text-danger')} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold tracking-tight text-fg">{last.name}</p>
                <p className="text-sm text-muted">{last.ticket} ticket · {ui.label}</p>
              </div>
              {last.vip && <Badge tone="magenta">VIP</Badge>}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1"><Input leading={<Search className="h-4 w-4" />} placeholder="Name or phone, if the QR will not scan" aria-label="Manual lookup" /></div>
              <Button variant="secondary" onClick={simulate} leading={<UserRound className="h-4 w-4" />}>Admit manually</Button>
            </div>
          </CardBody>
        </Card>

        {/* Counters + log */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[13px] font-medium text-muted">Admitted</p>
                <p className="tnum mt-1 text-5xl font-semibold tracking-tight text-fg">{admitted}</p>
              </div>
              <p className="tnum pb-1 text-sm text-muted">of 212 confirmed</p>
            </div>
            <Progress value={(admitted / 212) * 100} className="mt-4" tone="success" />
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[['General', '98'], ['VIP', '31'], ['Early bird', '15']].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-raised p-3">
                  <div className="tnum text-lg font-semibold text-fg">{v}</div>
                  <div className="text-[11px] text-subtle">{k}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Recent scans" action={<Badge tone="neutral">Last 4</Badge>} />
            <ul className="mt-3 divide-y divide-line px-2 pb-2">
              {scans.slice(0, 6).map(s => {
                const u = resultUI[s.result]
                return (
                  <li key={s.id} className="flex items-center gap-3 px-3 py-3">
                    <Avatar name={s.name} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{s.name}</p>
                      <p className="text-xs text-muted">{s.ticket}</p>
                    </div>
                    <div className="text-right">
                      <Badge tone={u.tone}>{u.label}</Badge>
                      <p className="tnum mt-1 text-[11px] text-subtle">{s.time}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

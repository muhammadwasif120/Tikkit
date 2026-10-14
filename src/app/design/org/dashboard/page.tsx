import { ArrowRight, CalendarDays, Clock, Coins, QrCode, Ticket, Users, MapPin, Megaphone } from 'lucide-react'
import {
  Avatar, Badge, BarChart, ButtonLink, Card, CardBody, CardHeader, PageHeader, Progress, StatCard,
} from '@/components/kit'

const sales = [
  { label: 'Mon', value: 18 }, { label: 'Tue', value: 26 }, { label: 'Wed', value: 22 },
  { label: 'Thu', value: 41 }, { label: 'Fri', value: 63 }, { label: 'Sat', value: 88 }, { label: 'Sun', value: 54 },
]

const requests = [
  { name: 'Hamza Siddiqui', ticket: 'General', note: 'Payment proof received', tone: 'warning' as const },
  { name: 'Mehreen Qureshi', ticket: 'VIP', note: 'Awaiting approval', tone: 'info' as const },
  { name: 'Danish Ali', ticket: 'General', note: 'Payment proof received', tone: 'warning' as const },
  { name: 'Sana Farooq', ticket: 'Early bird', note: 'Awaiting approval', tone: 'info' as const },
]

export default function DashboardPrototype() {
  return (
    <div className="k-fade-up">
      <PageHeader
        eyebrow="Tuesday, 14 October"
        title="Good evening, Ayesha"
        description="Rooftop Sunset Session is 3 days away. 7 guests are waiting on you."
        actions={
          <>
            <ButtonLink href="/design/org/guests" variant="secondary" leading={<Users className="h-4 w-4" />}>Review 7 requests</ButtonLink>
            <ButtonLink href="/design/org/event-new" leading={<CalendarDays className="h-4 w-4" />}>New event</ButtonLink>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key numbers">
        <StatCard label="Tickets sold" value="312" delta={18} hint="vs last week" icon={<Ticket className="h-4 w-4" />} spark={[12, 18, 15, 24, 31, 28, 44, 52]} />
        <StatCard label="Revenue" value="PKR 468k" delta={12} hint="approved payments" icon={<Coins className="h-4 w-4" />} spark={[8, 12, 11, 18, 22, 25, 30, 41]} />
        <StatCard label="Pending approvals" value="7" hint="oldest 3h ago" icon={<Clock className="h-4 w-4" />} spark={[3, 5, 4, 6, 9, 8, 7, 7]} />
        <StatCard label="Check-in rate" value="0%" hint="opens at 8:00 pm" icon={<QrCode className="h-4 w-4" />} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Registrations this week" description="Approved and confirmed, all events" action={<Badge tone="success" dot>+18%</Badge>} />
          <CardBody>
            <BarChart data={sales} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Next up" description="Starts Fri, 17 Oct at 7:30 pm" />
          <CardBody className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold tracking-tight text-fg">Rooftop Sunset Session</h4>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><MapPin className="h-3.5 w-3.5" aria-hidden /> Location reveals in 2 days</p>
            </div>
            <div>
              <div className="mb-2 flex items-baseline justify-between text-sm">
                <span className="text-muted">Capacity</span>
                <span className="tnum font-medium text-fg">212 / 300</span>
              </div>
              <Progress value={71} />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[['General', '148'], ['VIP', '34'], ['Early bird', '30']].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-raised p-3">
                  <div className="tnum text-lg font-semibold text-fg">{v}</div>
                  <div className="text-[11px] text-subtle">{k}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <ButtonLink href="/design/org/event-day" size="sm" className="flex-1" leading={<QrCode className="h-4 w-4" />}>Open door</ButtonLink>
              <ButtonLink href="#" size="sm" variant="secondary" className="flex-1" leading={<Megaphone className="h-4 w-4" />}>Announce</ButtonLink>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Needs your attention" description="Approve to confirm tickets and issue QR codes" action={<ButtonLink href="/design/org/guests" variant="ghost" size="sm" trailing={<ArrowRight className="h-4 w-4" />}>View all</ButtonLink>} />
          <ul className="mt-3 divide-y divide-line px-2 pb-2 sm:px-3">
            {requests.map(r => (
              <li key={r.name} className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-raised">
                <Avatar name={r.name} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{r.name}</p>
                  <p className="truncate text-xs text-muted">{r.ticket} ticket</p>
                </div>
                <Badge tone={r.tone}>{r.note}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Top promoters" description="By confirmed tickets" />
          <CardBody className="space-y-4">
            {[['Zain Raza', 64, 'PKR 38,400'], ['Areeba N.', 41, 'PKR 24,600'], ['Hassan K.', 27, 'PKR 16,200']].map(([n, c, a], i) => (
              <div key={n as string} className="flex items-center gap-3">
                <span className="tnum w-4 text-sm font-semibold text-subtle">{i + 1}</span>
                <Avatar name={n as string} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{n}</p>
                  <p className="text-xs text-muted">{c} tickets</p>
                </div>
                <span className="tnum text-sm font-medium text-fg">{a}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

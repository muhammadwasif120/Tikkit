import Link from 'next/link'
import { ArrowUpRight, Check, Plus, Search, Trash2 } from 'lucide-react'
import {
  Avatar, Badge, Button, Card, CardBody, CardHeader, Field, Input, Logo, PageHeader, Progress, Select, Skeleton, Switch, Textarea, ThemeToggle,
} from '@/components/kit'

const screens = [
  ['/design/org/dashboard', 'Organizer overview', 'Daily command view'],
  ['/design/org/guests', 'Guest list', 'Requests, payments and check-in in one list'],
  ['/design/org/event-day', 'Event Day', 'Scanner, live counts, manual lookup'],
  ['/design/org/event-new', 'Create event', 'Tiers with cutoffs, secret location, access rules'],
  ['/design/org/referrals', 'Referrals', 'Promoters, commissions, QR links'],
  ['/design/attendee/event', 'Attendee event page', 'Mobile first, registration with codes'],
]

const swatches = ['canvas', 'surface', 'raised', 'overlay', 'line', 'fg', 'muted', 'subtle', 'accent', 'violet', 'success', 'warning', 'danger', 'info']

export default function DesignHome() {
  return (
    <div className="kit min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between"><Logo /><ThemeToggle /></div>
        <PageHeader eyebrow="Design system" title="TIKKIT X kit" description="Midnight (dark, default) and Daylight (light). Every surface below uses semantic tokens only." />

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold text-fg">Screen prototypes</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {screens.map(([href, t, d]) => (
              <Link key={href} href={href} className="group rounded-2xl bg-surface p-4 shadow-card transition-colors hover:bg-raised">
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-fg">{t}</span><ArrowUpRight className="h-4 w-4 text-subtle transition-colors group-hover:text-accent" aria-hidden /></div>
                <p className="mt-1 text-[13px] text-muted">{d}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold text-fg">Color tokens</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
            {swatches.map(s => (
              <div key={s} className="overflow-hidden rounded-xl shadow-card">
                <div className="h-14" style={{ background: `rgb(var(--k-${s}))` }} />
                <div className="bg-surface px-2.5 py-2 text-xs text-muted">{s}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader title="Buttons" />
            <CardBody className="space-y-4">
              <div className="flex flex-wrap gap-2"><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Danger</Button></div>
              <div className="flex flex-wrap items-center gap-2"><Button size="sm">Small</Button><Button size="lg">Large</Button><Button loading>Saving</Button><Button disabled>Disabled</Button><Button size="icon" variant="secondary" aria-label="Add"><Plus className="h-4 w-4" /></Button></div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Badges and status" />
            <CardBody className="flex flex-wrap gap-2">
              <Badge>Neutral</Badge><Badge tone="accent" dot>Live</Badge><Badge tone="violet">VIP</Badge><Badge tone="success" dot>Confirmed</Badge><Badge tone="warning" dot>Proof received</Badge><Badge tone="danger" dot>Rejected</Badge><Badge tone="info">Needs approval</Badge>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Form controls" />
            <CardBody className="space-y-4">
              <Field label="Event name" hint="Shown on your public page">{p => <Input {...p} placeholder="Rooftop Sunset Session" />}</Field>
              <Field label="Search">{p => <Input {...p} leading={<Search className="h-4 w-4" />} placeholder="Search guests" />}</Field>
              <Field label="City">{p => <Select {...p}><option>Karachi</option><option>Lahore</option><option>Islamabad</option></Select>}</Field>
              <Field label="Phone" error="Enter a valid Pakistani mobile number">{p => <Input {...p} defaultValue="0300" />}</Field>
              <Field label="Notes" optional>{p => <Textarea {...p} rows={3} />}</Field>
              <div className="flex items-center gap-3"><Switch checked label="Example" /><span className="text-sm text-muted">Auto reveal</span></div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Feedback" />
            <CardBody className="space-y-4">
              <Progress value={64} />
              <div className="flex items-center gap-3"><Avatar name="Ayesha Khan" /><Avatar name="Zain Raza" /><Avatar name="Hira Shah" size={44} /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>
              <div className="flex gap-2"><Button size="sm" leading={<Check className="h-4 w-4" />}>Approve</Button><Button size="sm" variant="danger" leading={<Trash2 className="h-4 w-4" />}>Remove</Button></div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Copy, Link2, Plus, QrCode, Trophy } from 'lucide-react'
import {
  Avatar, Badge, Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Segmented, Select, StatCard, Table, TableWrap, Td, Th, Tr,
} from '@/components/kit'

const PROMOTERS = [
  { name: 'Zain Raza', code: 'ZAIN10', clicks: 212, sold: 64, accrued: 38400, paid: 12000 },
  { name: 'Areeba Nasir', code: 'AREEBA', clicks: 148, sold: 41, accrued: 24600, paid: 24600 },
  { name: 'Hassan Khan', code: 'HASSAN5', clicks: 96, sold: 27, accrued: 16200, paid: 0 },
  { name: 'Mariam Tahir', code: 'MARIAM', clicks: 61, sold: 12, accrued: 7200, paid: 0 },
]

type Mode = 'percent' | 'fixed' | 'tiered' | 'none'

export default function ReferralsPrototype() {
  const [mode, setMode] = useState<Mode>('tiered')
  return (
    <div className="k-fade-up">
      <PageHeader
        eyebrow="Rooftop Sunset Session"
        title="Referrals"
        description="See who sells your tickets and what you owe them. Links, coupon codes and QR codes all attribute sales automatically."
        actions={<Button leading={<Plus className="h-4 w-4" />}>Add promoter</Button>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Referral totals">
        <StatCard label="Referred sales" value="144" hint="46% of all tickets" icon={<Link2 className="h-4 w-4" />} spark={[4, 9, 12, 18, 25, 33, 41]} delta={22} />
        <StatCard label="Commission owed" value="PKR 86,400" hint="across 4 promoters" icon={<Trophy className="h-4 w-4" />} />
        <StatCard label="Paid out" value="PKR 36,600" hint="42% settled" />
        <StatCard label="Conversion" value="21%" hint="clicks to tickets" delta={4} />
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader title="Promoters" description="Commission accrues when a payment is approved" />
          <TableWrap className="mt-3">
            <Table>
              <thead><tr><Th>Promoter</Th><Th>Code</Th><Th className="text-right">Sold</Th><Th className="text-right">Owed</Th><Th className="text-right">Actions</Th></tr></thead>
              <tbody>
                {PROMOTERS.map(p => {
                  const owed = p.accrued - p.paid
                  return (
                    <Tr key={p.code}>
                      <Td><div className="flex items-center gap-3"><Avatar name={p.name} size={34} /><div><p className="font-medium text-fg">{p.name}</p><p className="tnum text-xs text-muted">{p.clicks} clicks</p></div></div></Td>
                      <Td><code className="rounded-md bg-overlay px-2 py-1 font-mono text-xs text-fg">{p.code}</code></Td>
                      <Td className="tnum text-right font-medium">{p.sold}</Td>
                      <Td className="text-right">
                        {owed > 0 ? <span className="tnum font-medium text-fg">PKR {owed.toLocaleString()}</span> : <Badge tone="success" dot>Settled</Badge>}
                      </Td>
                      <Td>
                        <div className="flex justify-end gap-1.5">
                          <Button size="icon-sm" variant="ghost" aria-label={`Copy link for ${p.name}`}><Copy className="h-4 w-4" /></Button>
                          <Button size="icon-sm" variant="ghost" aria-label={`Show QR for ${p.name}`}><QrCode className="h-4 w-4" /></Button>
                          {owed > 0 && <Button size="sm" variant="secondary">Mark paid</Button>}
                        </div>
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          </TableWrap>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Commission rule" description="Applies to new promoters. Override per promoter." />
            <CardBody className="space-y-4">
              <Segmented<Mode>
                label="Commission mode" value={mode} onChange={setMode}
                items={[{ id: 'none', label: 'Track only' }, { id: 'percent', label: '%' }, { id: 'fixed', label: 'PKR' }, { id: 'tiered', label: 'Tiered' }]}
              />
              {mode === 'tiered' && (
                <div className="k-pop space-y-2 rounded-xl bg-raised p-3 shadow-[inset_0_0_0_1px_rgb(var(--k-line))]">
                  {[['First 20 tickets', '5'], ['After 20 tickets', '10']].map(([l, v]) => (
                    <div key={l} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted">{l}</span>
                      <span className="flex items-center gap-2"><input defaultValue={v} aria-label={l} className="tnum h-9 w-16 rounded-lg border border-line-strong bg-surface text-center text-fg" /><span className="text-subtle">%</span></span>
                    </div>
                  ))}
                </div>
              )}
              {mode === 'percent' && <Field label="Percent of ticket price">{p => <Input {...p} defaultValue="10" inputMode="numeric" />}</Field>}
              {mode === 'fixed' && <Field label="PKR per ticket">{p => <Input {...p} defaultValue="500" inputMode="numeric" />}</Field>}
              <Field label="Buyer discount funded by" hint="When a promoter's code gives guests a discount">
                {p => <Select {...p} defaultValue="split"><option value="organizer">Me</option><option value="referrer">The promoter</option><option value="split">Split 50/50</option></Select>}
              </Field>
              <Button className="w-full">Save rule</Button>
            </CardBody>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="grid h-24 w-24 shrink-0 grid-cols-7 gap-px rounded-xl bg-white p-2" aria-label="Sample QR code" role="img">
                {Array.from({ length: 49 }, (_, i) => <span key={i} className={(i * 7 + (i % 5)) % 3 === 0 || [0, 1, 7, 6, 5, 13, 42, 43, 35, 48, 47, 41].includes(i) ? 'bg-black' : 'bg-transparent'} />)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg">Zain's link</p>
                <p className="mt-0.5 truncate font-mono text-xs text-muted">tikkitx.com/events/rooftop-sunset?ref=ZAIN10</p>
                <Button size="sm" variant="secondary" className="mt-3" leading={<Copy className="h-3.5 w-3.5" />}>Copy link</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

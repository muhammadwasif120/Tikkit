'use client'

import { useMemo, useState } from 'react'
import { BadgeCheck, Check, Download, Filter, Image as ImageIcon, MoreHorizontal, Plus, Search, X } from 'lucide-react'
import {
  Avatar, Badge, Button, Card, Input, PageHeader, Segmented, Table, TableWrap, Td, Th, Tr, type BadgeTone,
} from '@/components/kit'

type Row = {
  id: string; name: string; phone: string; ticket: string; amount: number
  status: 'requested' | 'payment_submitted' | 'awaiting_payment' | 'confirmed' | 'checked_in'
  referrer?: string; tier: 'new' | 'reliable' | 'regular' | 'trusted'; verified: boolean; when: string
}

const ROWS: Row[] = [
  { id: '1', name: 'Hamza Siddiqui', phone: '0300 1234567', ticket: 'General', amount: 2500, status: 'payment_submitted', referrer: 'Zain R.', tier: 'regular', verified: true, when: '3h ago' },
  { id: '2', name: 'Mehreen Qureshi', phone: '0321 9876543', ticket: 'VIP', amount: 6000, status: 'requested', tier: 'trusted', verified: true, when: '5h ago' },
  { id: '3', name: 'Danish Ali', phone: '0333 5554433', ticket: 'General', amount: 2500, status: 'payment_submitted', tier: 'new', verified: false, when: '6h ago' },
  { id: '4', name: 'Sana Farooq', phone: '0345 2221100', ticket: 'Early bird', amount: 1800, status: 'requested', referrer: 'Areeba N.', tier: 'reliable', verified: false, when: '9h ago' },
  { id: '5', name: 'Bilal Ahmed', phone: '0302 7776655', ticket: 'General', amount: 2500, status: 'confirmed', referrer: 'Zain R.', tier: 'regular', verified: true, when: 'Yesterday' },
  { id: '6', name: 'Noor Fatima', phone: '0312 4443322', ticket: 'VIP', amount: 6000, status: 'confirmed', tier: 'trusted', verified: true, when: 'Yesterday' },
  { id: '7', name: 'Usman Tariq', phone: '0334 1112233', ticket: 'General', amount: 2500, status: 'awaiting_payment', tier: 'new', verified: false, when: 'Yesterday' },
  { id: '8', name: 'Hira Shah', phone: '0301 8889900', ticket: 'Early bird', amount: 1800, status: 'checked_in', referrer: 'Hassan K.', tier: 'reliable', verified: true, when: 'Mon' },
]

const statusMeta: Record<Row['status'], { label: string; tone: BadgeTone }> = {
  requested: { label: 'Needs approval', tone: 'info' },
  payment_submitted: { label: 'Proof received', tone: 'warning' },
  awaiting_payment: { label: 'Awaiting payment', tone: 'neutral' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  checked_in: { label: 'Checked in', tone: 'accent' },
}

const tierMeta = { new: { label: 'New', tone: 'neutral' }, reliable: { label: 'Reliable', tone: 'info' }, regular: { label: 'Regular', tone: 'violet' }, trusted: { label: 'Trusted', tone: 'success' } } as const

type Tab = 'review' | 'confirmed' | 'in' | 'all'

export default function GuestsPrototype() {
  const [tab, setTab] = useState<Tab>('review')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const rows = useMemo(() => {
    let r = ROWS
    if (tab === 'review') r = r.filter(x => ['requested', 'payment_submitted'].includes(x.status))
    if (tab === 'confirmed') r = r.filter(x => x.status === 'confirmed')
    if (tab === 'in') r = r.filter(x => x.status === 'checked_in')
    if (q) r = r.filter(x => (x.name + x.phone).toLowerCase().includes(q.toLowerCase()))
    return r
  }, [tab, q])

  const toggle = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allOn = rows.length > 0 && rows.every(r => selected.has(r.id))

  return (
    <div className="k-fade-up">
      <PageHeader
        eyebrow="Rooftop Sunset Session"
        title="Guests"
        description="One list for requests, payments and check-in. Approve to issue the QR ticket."
        actions={
          <>
            <Button variant="secondary" leading={<Download className="h-4 w-4" />}>Export</Button>
            <Button leading={<Plus className="h-4 w-4" />}>Add guest</Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
          <Segmented<Tab>
            label="Guest filter"
            value={tab}
            onChange={setTab}
            items={[
              { id: 'review', label: 'Needs review', count: 4 },
              { id: 'confirmed', label: 'Confirmed', count: 2 },
              { id: 'in', label: 'Checked in', count: 1 },
              { id: 'all', label: 'Everyone', count: 8 },
            ]}
          />
          <div className="flex items-center gap-2">
            <div className="w-full sm:w-64"><Input leading={<Search className="h-4 w-4" />} placeholder="Search name or phone" value={q} onChange={e => setQ(e.target.value)} aria-label="Search guests" /></div>
            <Button variant="secondary" size="icon" aria-label="Filters"><Filter className="h-4 w-4" /></Button>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="k-pop flex items-center justify-between gap-3 border-b border-accent/30 bg-accent/8 px-5 py-2.5">
            <span className="text-sm font-medium text-fg"><span className="tnum">{selected.size}</span> selected</span>
            <div className="flex gap-2">
              <Button size="sm" leading={<Check className="h-4 w-4" />}>Approve</Button>
              <Button size="sm" variant="danger" leading={<X className="h-4 w-4" />}>Reject</Button>
            </div>
          </div>
        )}

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th className="w-10"><input type="checkbox" aria-label="Select all" checked={allOn} onChange={() => setSelected(allOn ? new Set() : new Set(rows.map(r => r.id)))} className="h-4 w-4 cursor-pointer accent-[rgb(var(--k-accent))]" /></Th>
                <Th>Guest</Th><Th>Ticket</Th><Th>Status</Th><Th className="hidden xl:table-cell">Score</Th><Th className="hidden 2xl:table-cell">Referrer</Th><Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <Tr key={r.id} className={selected.has(r.id) ? 'bg-accent/6' : ''}>
                  <Td><input type="checkbox" aria-label={`Select ${r.name}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="h-4 w-4 cursor-pointer accent-[rgb(var(--k-accent))]" /></Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={r.name} size={36} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-medium text-fg">
                          {r.name}
                          {r.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-accent" aria-label="ID verified" />}
                        </p>
                        <p className="tnum text-xs text-muted">{r.phone} · {r.when}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap"><p className="text-fg">{r.ticket}</p><p className="tnum text-xs text-muted">PKR {r.amount.toLocaleString()}</p></Td>
                  <Td><Badge tone={statusMeta[r.status].tone} dot>{statusMeta[r.status].label}</Badge></Td>
                  <Td className="hidden xl:table-cell"><Badge tone={tierMeta[r.tier].tone}>{tierMeta[r.tier].label}</Badge></Td>
                  <Td className="hidden text-muted 2xl:table-cell">{r.referrer ?? <span className="text-subtle">Direct</span>}</Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1.5">
                      {r.status === 'payment_submitted' && <Button variant="ghost" size="sm" leading={<ImageIcon className="h-4 w-4" />}>Proof</Button>}
                      {(r.status === 'requested' || r.status === 'payment_submitted') ? (
                        <>
                          <Button size="sm" leading={<Check className="h-4 w-4" />}>Approve</Button>
                          <Button size="icon-sm" variant="danger" aria-label={`Reject ${r.name}`}><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <Button size="icon-sm" variant="ghost" aria-label="More actions"><MoreHorizontal className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-muted">
          <span>Showing <span className="tnum text-fg">{rows.length}</span> of <span className="tnum text-fg">8</span> guests</span>
          <span>Scores show a band only on the Starter plan</span>
        </div>
      </Card>
    </div>
  )
}

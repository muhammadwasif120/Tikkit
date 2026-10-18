'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Plus, Receipt, Trash2, Users } from 'lucide-react'
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, Select, Table, TableWrap, Td, Textarea, Th, Tr } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { fmtDate, pkr } from '@/lib/format'

export type Vendor = { id: string; name: string; category: string | null; contact: string | null; phone: string | null; email: string | null; notes: string | null }
export type Invoice = { id: string; vendorId: string; vendor: string; eventTitle: string | null; number: string | null; amount: number; due: string | null; status: string; description: string | null }
const readable = (m: string) => (m.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)?.[1]) ?? m
const CATS = ['Sound and lights', 'Security', 'Catering', 'Decor', 'Photography', 'Artists and DJs', 'Venue', 'Transport', 'Other']

export default function VendorsClient({ vendors, invoices, events, limit }: { vendors: Vendor[]; invoices: Invoice[]; events: { id: string; title: string }[]; limit: number | null }) {
  const router = useRouter(); const supabase = useMemo(() => createClient(), [])
  const [modal, setModal] = useState<null | 'vendor' | 'invoice'>(null); const [edit, setEdit] = useState<Vendor | null>(null)
  const [err] = useState<string | null>(null); const [pending, start] = useTransition()
  const owed = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
  const overdue = invoices.filter(i => i.status === 'pending' && i.due && new Date(i.due) < new Date()).length

  const togglePaid = (i: Invoice) => start(async () => { await supabase.from('organizer_vendor_invoices').update({ status: i.status === 'paid' ? 'pending' : 'paid', paid_at: i.status === 'paid' ? null : new Date().toISOString() }).eq('id', i.id); router.refresh() })
  const delVendor = (v: Vendor) => confirm(`Delete ${v.name} and its invoices?`) && start(async () => { await supabase.from('organizer_vendors').delete().eq('id', v.id); router.refresh() })

  return (
    <>
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        {[['Vendors', String(vendors.length) + (limit ? ` / ${limit}` : ''), 'in your contacts'], ['Unpaid invoices', pkr(owed), `${invoices.filter(i => i.status === 'pending').length} pending`], ['Overdue', String(overdue), 'past their due date']].map(([k, v, h], i) => (
          <Card key={k} className="p-5"><p className="text-[13px] font-medium text-muted">{k}</p><p className={`mt-2 tnum text-3xl font-semibold tracking-tight ${i === 2 && overdue ? 'text-danger' : 'text-fg'}`}>{v}</p><p className="mt-1 text-xs text-subtle">{h}</p></Card>
        ))}
      </section>
      {err && <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{err}</p>}

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader title="Vendors" description="Sound, security, catering and everyone else you hire" action={<Button size="sm" leading={<Plus className="h-4 w-4" />} onClick={() => { setEdit(null); setModal('vendor') }}>Add</Button>} />
          {vendors.length === 0 ? <EmptyState icon={<Users className="h-6 w-6" />} title="No vendors yet" description="Keep your suppliers and their contact details in one place." action={<Button onClick={() => { setEdit(null); setModal('vendor') }}>Add vendor</Button>} /> : (
            <ul className="mt-3 divide-y divide-line px-6 pb-3">
              {vendors.map(v => (
                <li key={v.id} className="flex items-center gap-3 py-3">
                  <Avatar name={v.name} size={38} />
                  <button className="min-w-0 flex-1 text-left" onClick={() => { setEdit(v); setModal('vendor') }}>
                    <p className="truncate text-sm font-medium text-fg">{v.name}</p><p className="truncate text-xs text-muted">{[v.category, v.contact].filter(Boolean).join(' · ') || 'No details'}</p>
                  </button>
                  {v.phone && <a href={`tel:${v.phone}`} aria-label={`Call ${v.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-raised hover:text-fg"><Phone className="h-4 w-4" /></a>}
                  <Button size="icon-sm" variant="ghost" aria-label={`Delete ${v.name}`} onClick={() => delVendor(v)}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold tracking-tight text-fg">Invoices</h2><Button size="sm" variant="secondary" leading={<Plus className="h-4 w-4" />} disabled={vendors.length === 0} onClick={() => setModal('invoice')}>Add invoice</Button></div>
          {invoices.length === 0 ? <Card><EmptyState icon={<Receipt className="h-6 w-6" />} title="No invoices" description={vendors.length ? 'Track what each vendor has billed you.' : 'Add a vendor first.'} /></Card> : (
            <TableWrap><Table>
              <thead><tr><Th>Vendor</Th><Th>Due</Th><Th className="text-right">Amount</Th><Th>Status</Th></tr></thead>
              <tbody>{invoices.map(i => (
                <Tr key={i.id}>
                  <Td><p className="text-sm font-medium text-fg">{i.vendor}</p><p className="text-xs text-muted">{[i.number, i.eventTitle].filter(Boolean).join(' · ')}</p></Td>
                  <Td className="text-sm text-muted">{i.due ? fmtDate(i.due) : '—'}</Td>
                  <Td className="text-right"><span className="tnum text-sm text-fg">{pkr(i.amount)}</span></Td>
                  <Td><button onClick={() => togglePaid(i)} disabled={pending} aria-label={`Mark ${i.status === 'paid' ? 'unpaid' : 'paid'}`}><Badge tone={i.status === 'paid' ? 'success' : i.due && new Date(i.due) < new Date() ? 'danger' : 'warning'}>{i.status === 'paid' ? 'Paid' : 'Pending'}</Badge></button></Td>
                </Tr>
              ))}</tbody>
            </Table></TableWrap>
          )}
        </div>
      </div>

      <VendorModal open={modal === 'vendor'} vendor={edit} onClose={() => setModal(null)} onDone={() => { setModal(null); router.refresh() }} />
      <InvoiceModal open={modal === 'invoice'} vendors={vendors} events={events} onClose={() => setModal(null)} onDone={() => { setModal(null); router.refresh() }} />
    </>
  )
}

function VendorModal({ open, vendor, onClose, onDone }: { open: boolean; vendor: Vendor | null; onClose: () => void; onDone: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [f, setF] = useState({ name: '', category: '', contact: '', phone: '', email: '', notes: '' }); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  const key = vendor?.id ?? 'new'
  useMemo(() => setF({ name: vendor?.name ?? '', category: vendor?.category ?? '', contact: vendor?.contact ?? '', phone: vendor?.phone ?? '', email: vendor?.email ?? '', notes: vendor?.notes ?? '' }), [key, open]) // eslint-disable-line react-hooks/exhaustive-deps
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); if (!f.name.trim()) return setErr('Enter a name.'); setBusy(true)
    const body = { name: f.name.trim(), category: f.category || null, contact_name: f.contact.trim() || null, contact_phone: f.phone.trim() || null, contact_email: f.email.trim() || null, notes: f.notes.trim() || null }
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = vendor ? await supabase.from('organizer_vendors').update(body).eq('id', vendor.id) : await supabase.from('organizer_vendors').insert({ ...body, organizer_id: user!.id })
    setBusy(false); if (error) return setErr(readable(error.message)); onDone()
  }
  return (
    <Modal open={open} onClose={onClose} title={vendor ? 'Edit vendor' : 'Add a vendor'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Business name">{p => <Input {...p} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Category">{p => <Select {...p} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}><option value="">Choose</option>{CATS.map(c => <option key={c}>{c}</option>)}</Select>}</Field><Field label="Contact person" optional>{p => <Input {...p} value={f.contact} onChange={e => setF({ ...f, contact: e.target.value })} />}</Field></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Phone" optional>{p => <Input {...p} type="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />}</Field><Field label="Email" optional>{p => <Input {...p} type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />}</Field></div>
        <Field label="Notes" optional>{p => <Textarea {...p} rows={3} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />}</Field>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>Save</Button></div>
      </form>
    </Modal>
  )
}

function InvoiceModal({ open, vendors, events, onClose, onDone }: { open: boolean; vendors: Vendor[]; events: { id: string; title: string }[]; onClose: () => void; onDone: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [f, setF] = useState({ vendor: '', event: '', number: '', amount: '', due: '', description: '' }); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    const vendor = f.vendor || vendors[0]?.id; if (!vendor || !Number(f.amount)) return setErr('Choose a vendor and enter the amount.'); setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('organizer_vendor_invoices').insert({ organizer_id: user!.id, vendor_id: vendor, event_id: f.event || null, invoice_number: f.number.trim() || null, amount_pkr: Number(f.amount), due_date: f.due || null, description: f.description.trim() || null })
    setBusy(false); if (error) return setErr(readable(error.message)); setF({ vendor: '', event: '', number: '', amount: '', due: '', description: '' }); onDone()
  }
  return (
    <Modal open={open} onClose={onClose} title="Add an invoice">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Vendor">{p => <Select {...p} value={f.vendor || vendors[0]?.id || ''} onChange={e => setF({ ...f, vendor: e.target.value })}>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</Select>}</Field>
        <Field label="Event" optional>{p => <Select {...p} value={f.event} onChange={e => setF({ ...f, event: e.target.value })}><option value="">Not tied to an event</option>{events.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}</Select>}</Field>
        <div className="grid gap-4 sm:grid-cols-3"><Field label="Amount (PKR)">{p => <Input {...p} inputMode="numeric" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value.replace(/\D/g, '') })} />}</Field><Field label="Due" optional>{p => <Input {...p} type="date" value={f.due} onChange={e => setF({ ...f, due: e.target.value })} />}</Field><Field label="Invoice no." optional>{p => <Input {...p} value={f.number} onChange={e => setF({ ...f, number: e.target.value })} />}</Field></div>
        <Field label="Description" optional>{p => <Input {...p} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />}</Field>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>Add invoice</Button></div>
      </form>
    </Modal>
  )
}

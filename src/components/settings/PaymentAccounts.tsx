'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Landmark, Plus, Smartphone, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, Modal, Select, Textarea } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'

export type Account = { id: string; method: 'bank' | 'jazzcash' | 'easypaisa' | 'other'; title: string; number: string; bank: string | null; iban: string | null; instructions: string | null; active: boolean; label: string | null }
const METHOD = { bank: 'Bank transfer', jazzcash: 'JazzCash', easypaisa: 'EasyPaisa', other: 'Other' } as const

export default function PaymentAccounts({ accounts }: { accounts: Account[] }) {
  const router = useRouter(); const supabase = useMemo(() => createClient(), [])
  const [open, setOpen] = useState(false); const [err, setErr] = useState<string | null>(null); const [pending, start] = useTransition()
  const [f, setF] = useState({ method: 'jazzcash', title: '', number: '', bank: '', iban: '', instructions: '' })

  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    if (!f.title.trim() || !f.number.trim()) return setErr('Add the account title and number.')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('payment_accounts').insert({
      organizer_id: user!.id, method: f.method as Account['method'], account_title: f.title.trim(), account_number: f.number.trim(),
      bank_name: f.method === 'bank' ? f.bank.trim() || null : null, iban: f.method === 'bank' ? f.iban.trim() || null : null, instructions: f.instructions.trim() || null,
    })
    if (error) return setErr('We could not save the account.')
    setF({ method: 'jazzcash', title: '', number: '', bank: '', iban: '', instructions: '' }); setOpen(false); router.refresh()
  }
  const toggle = (a: Account) => start(async () => { await supabase.from('payment_accounts').update({ is_active: !a.active }).eq('id', a.id); router.refresh() })
  const remove = (a: Account) => confirm(`Remove ${a.title}?`) && start(async () => { const { error } = await supabase.from('payment_accounts').delete().eq('id', a.id); if (error) setErr('This account is used by an event. Pause it instead.'); router.refresh() })

  return (
    <>
      <Card>
        <CardHeader title="Payment accounts" description="Where guests send money. They upload proof and you approve it." action={<Button size="sm" leading={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Add account</Button>} />
        {err && <p role="alert" className="px-6 pt-3 text-sm text-danger">{err}</p>}
        {accounts.length === 0 ? (
          <EmptyState icon={<Landmark className="h-6 w-6" />} title="No accounts yet" description="Add a JazzCash, EasyPaisa or bank account to accept paid tickets." action={<Button onClick={() => setOpen(true)}>Add account</Button>} />
        ) : (
          <ul className="mt-3 divide-y divide-line px-6 pb-3">
            {accounts.map(a => (
              <li key={a.id} className="flex items-center gap-3 py-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-raised text-muted">{a.method === 'bank' ? <Landmark className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">{a.bank ?? METHOD[a.method]} <span className="font-normal text-muted">· {a.title}</span></p>
                  <p className="tnum truncate text-xs text-muted">{a.number}{a.iban ? ` · ${a.iban}` : ''}</p>
                </div>
                {!a.active && <Badge tone="neutral">Paused</Badge>}
                <Button size="sm" variant="ghost" loading={pending} onClick={() => toggle(a)}>{a.active ? 'Pause' : 'Resume'}</Button>
                <Button size="icon-sm" variant="ghost" aria-label={`Remove ${a.title}`} onClick={() => remove(a)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Add a payment account" description="Guests see these details at checkout.">
        <form onSubmit={add} className="space-y-4">
          <Field label="Type">{p => <Select {...p} value={f.method} onChange={e => setF({ ...f, method: e.target.value })}>{Object.entries(METHOD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Account title">{p => <Input {...p} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />}</Field>
            <Field label={f.method === 'bank' ? 'Account number' : 'Mobile number'}>{p => <Input {...p} value={f.number} onChange={e => setF({ ...f, number: e.target.value })} />}</Field>
          </div>
          {f.method === 'bank' && <div className="grid gap-4 sm:grid-cols-2"><Field label="Bank">{p => <Input {...p} value={f.bank} onChange={e => setF({ ...f, bank: e.target.value })} />}</Field><Field label="IBAN" optional>{p => <Input {...p} value={f.iban} onChange={e => setF({ ...f, iban: e.target.value })} />}</Field></div>}
          <Field label="Instructions" optional>{p => <Textarea {...p} rows={2} value={f.instructions} onChange={e => setF({ ...f, instructions: e.target.value })} placeholder="Add your name or event in the reference" />}</Field>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save account</Button></div>
        </form>
      </Modal>
    </>
  )
}

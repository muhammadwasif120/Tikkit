'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button, Field, Input, Modal } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'

export default function NewRetreat({ locked }: { locked: boolean }) {
  const router = useRouter(); const supabase = useMemo(() => createClient(), [])
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null)
  const [f, setF] = useState({ title: '', client: '', destination: '', start: '', end: '', headcount: '', budget: '' })
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    if (!f.title.trim() || !f.start || !f.end) return setErr('Add a title and the start and end dates.')
    if (f.end < f.start) return setErr('The retreat cannot end before it starts.')
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('retreats').insert({ organizer_id: user!.id, title: f.title.trim(), client_company: f.client.trim() || null, destination: f.destination.trim() || null, starts_on: f.start, ends_on: f.end, headcount_target: f.headcount ? Number(f.headcount) : null, budget_pkr: f.budget ? Number(f.budget) : null }).select('id').single()
    setBusy(false)
    if (error) return setErr((error.message.match(/^[A-Z_:a-z]+: ([\s\S]*)$/)?.[1]) ?? error.message)
    router.push(`/dashboard/retreats/${(data as { id: string }).id}`)
  }
  return (
    <>
      <Button leading={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)} disabled={locked}>New retreat</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Plan a retreat" description="A multi day trip for a company. You can change everything later.">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name">{p => <Input {...p} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Annual offsite" />}</Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Client company" optional>{p => <Input {...p} value={f.client} onChange={e => setF({ ...f, client: e.target.value })} />}</Field><Field label="Destination" optional>{p => <Input {...p} value={f.destination} onChange={e => setF({ ...f, destination: e.target.value })} placeholder="Hunza" />}</Field></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Starts">{p => <Input {...p} type="date" value={f.start} onChange={e => setF({ ...f, start: e.target.value })} />}</Field><Field label="Ends">{p => <Input {...p} type="date" value={f.end} onChange={e => setF({ ...f, end: e.target.value })} />}</Field></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="People" optional>{p => <Input {...p} inputMode="numeric" value={f.headcount} onChange={e => setF({ ...f, headcount: e.target.value.replace(/\D/g, '') })} />}</Field><Field label="Budget (PKR)" optional>{p => <Input {...p} inputMode="numeric" value={f.budget} onChange={e => setF({ ...f, budget: e.target.value.replace(/\D/g, '') })} />}</Field></div>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={busy}>Create retreat</Button></div>
        </form>
      </Modal>
    </>
  )
}

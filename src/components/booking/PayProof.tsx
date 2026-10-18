'use client'

import { useEffect, useMemo, useState } from 'react'
import { Copy, Upload } from 'lucide-react'
import { Button, Field, Input } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { pkr } from '@/lib/format'

type Account = { method: string; account_title: string; account_number: string; bank_name: string | null; iban: string | null; instructions: string | null }
const readable = (m: string) => (m.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)?.[1]) ?? m

/** Pay an organizer for a pass, class or space booking: shows their accounts, takes the proof, files it. */
export default function PayProof({ kind, subjectId, organizerId, amount, onDone }: { kind: 'pass_purchase' | 'class_booking' | 'space_booking'; subjectId: string; organizerId: string; amount: number; onDone: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [accounts, setAccounts] = useState<Account[]>([]); const [file, setFile] = useState<File | null>(null); const [ref, setRef] = useState('')
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null)
  useEffect(() => { supabase.from('payment_accounts').select('method, account_title, account_number, bank_name, iban, instructions').eq('organizer_id', organizerId).eq('is_active', true).then(({ data }) => setAccounts((data ?? []) as Account[])) }, [supabase, organizerId])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); if (!file) return setErr('Attach your transfer screenshot.'); setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    const path = `${user!.id}/${subjectId}/${crypto.randomUUID()}.${file.name.split('.').pop()}`
    const up = await supabase.storage.from('payment-proofs').upload(path, file, { contentType: file.type })
    if (up.error) { setBusy(false); return setErr('The screenshot could not be uploaded.') }
    const { error } = await supabase.rpc('submit_product_payment', { p_kind: kind, p_subject: subjectId, p_screenshot_path: path, p_reference: ref.trim() || undefined })
    setBusy(false); if (error) return setErr(readable(error.message)); onDone()
  }
  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl bg-raised p-4 shadow-[inset_0_0_0_1px_rgb(var(--k-line))]">
      <p className="text-sm font-medium text-fg">Pay {pkr(amount)}, then upload the screenshot</p>
      {accounts.map((a, i) => <div key={i} className="rounded-xl bg-surface p-3 text-sm"><p className="font-medium text-fg">{a.bank_name ?? a.method} <span className="font-normal text-muted">· {a.account_title}</span></p><p className="mt-1 flex items-center gap-2 font-mono text-[13px] text-fg">{a.account_number}<button type="button" aria-label="Copy" onClick={() => navigator.clipboard.writeText(a.account_number)} className="text-subtle hover:text-fg"><Copy className="h-3.5 w-3.5" /></button></p>{a.iban && <p className="font-mono text-xs text-muted">{a.iban}</p>}{a.instructions && <p className="mt-1 text-xs text-muted">{a.instructions}</p>}</div>)}
      <Field label="Screenshot">{p => <label className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong bg-surface text-sm text-muted hover:border-accent"><Upload className="h-4 w-4" />{file ? file.name : 'Choose a file'}<input {...p} type="file" accept="image/*,application/pdf" className="sr-only" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>}</Field>
      <Field label="Reference" optional>{p => <Input {...p} value={ref} onChange={e => setRef(e.target.value)} />}</Field>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}<Button type="submit" className="w-full" loading={busy}>Submit payment</Button>
    </form>
  )
}

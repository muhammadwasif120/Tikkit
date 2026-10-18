'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Clock, ShieldAlert, Upload } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, Select } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { submitIdVerification } from '@/app/dashboard/settings/verification/actions'

export default function VerificationForm({ status, reason, optionalNote, audience = 'organizer' }: { status: 'none' | 'pending' | 'verified' | 'rejected'; reason: string | null; optionalNote?: string; audience?: 'organizer' | 'attendee' }) {
  const router = useRouter(); const supabase = useMemo(() => createClient(), [])
  const [f, setF] = useState({ type: 'cnic', number: '', expiry: '' }); const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    if (!file) return setErr('Add a clear photo of your ID.')
    if (file.size > 10 * 1024 * 1024) return setErr('The photo is over 10 MB.')
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    const path = `${user!.id}/${crypto.randomUUID()}.${file.name.split('.').pop()}`
    const up = await supabase.storage.from('id-documents').upload(path, file, { contentType: file.type })
    if (up.error) { setBusy(false); return setErr('The photo could not be uploaded.') }
    const res = await submitIdVerification({ idType: f.type as 'cnic' | 'passport', number: f.number, expiry: f.expiry || null, imagePath: path })
    setBusy(false)
    if ('error' in res && res.error) return setErr(res.error)
    router.refresh()
  }

  const banner = {
    verified: { icon: <BadgeCheck className="h-6 w-6 text-success" />, title: 'Your ID is verified', body: audience === 'attendee' ? 'Organizers see the verified check next to your name, and you can join verified-only events.' : 'You can publish events and your guests see the verified check.', tone: 'success' as const },
    pending: { icon: <Clock className="h-6 w-6 text-warning" />, title: 'Under review', body: 'We review every ID by hand, usually within one working day.', tone: 'warning' as const },
    rejected: { icon: <ShieldAlert className="h-6 w-6 text-danger" />, title: 'We could not verify your ID', body: reason ?? 'Please submit a clearer photo.', tone: 'danger' as const },
    none: { icon: <ShieldAlert className="h-6 w-6 text-subtle" />, title: 'Not verified yet', body: audience === 'attendee' ? 'Verify your ID to get the check next to your name and join verified-only events. It takes two minutes.' : 'Verify your identity to publish events. It takes two minutes.', tone: 'neutral' as const },
  }[status]

  return (
    <>
      <Card className="p-6"><div className="flex items-start gap-4">{banner.icon}<div className="flex-1"><div className="flex items-center gap-2"><h2 className="text-base font-semibold text-fg">{banner.title}</h2><Badge tone={banner.tone}>{status === 'none' ? 'Action needed' : status}</Badge></div><p className="mt-1 text-sm text-muted">{banner.body}</p></div></div></Card>
      {(status === 'none' || status === 'rejected') && (
        <Card>
          <CardHeader title="Submit your ID" description="Your number is encrypted. Only our reviewers can open the photo." />
          <CardBody>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="ID type">{p => <Select {...p} value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option value="cnic">CNIC</option><option value="passport">Passport</option></Select>}</Field>
                <Field label={f.type === 'cnic' ? 'CNIC number' : 'Passport number'}>{p => <Input {...p} inputMode="numeric" value={f.number} onChange={e => setF({ ...f, number: e.target.value })} placeholder={f.type === 'cnic' ? '42101-1234567-1' : ''} />}</Field>
              </div>
              <Field label="Expiry date" optional>{p => <Input {...p} type="date" value={f.expiry} onChange={e => setF({ ...f, expiry: e.target.value })} />}</Field>
              <Field label="Photo of your ID" hint="Front side, all four corners visible, no glare. JPG, PNG or WebP.">
                {p => <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-raised text-sm text-muted hover:border-accent hover:text-fg"><Upload className="h-5 w-5" />{file ? file.name : 'Choose a photo'}<input {...p} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>}
              </Field>
              {err && <p role="alert" className="text-sm text-danger">{err}</p>}
              {optionalNote && <p className="text-xs text-subtle">{optionalNote}</p>}
              <div className="flex justify-end"><Button type="submit" loading={busy}>Submit for review</Button></div>
            </form>
          </CardBody>
        </Card>
      )}
    </>
  )
}

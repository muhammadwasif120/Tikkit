'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Link2, Megaphone, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, Field, Textarea, Input } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { fmtDateTime } from '@/lib/format'
import { flushEmails } from '@/app/actions/emailActions'

function readable(msg: string) {
  const m = msg.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)
  return m ? m[1] : msg
}

export function CopyButton({ text, label = 'Copy link' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button variant="secondary" size="sm" leading={done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800) }}>
      {done ? 'Copied' : label}
    </Button>
  )
}

/** Publish, unpublish and cancel. The database enforces the rules and plan limits. */
export function StatusActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const change = (next: 'draft' | 'published' | 'cancelled', confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return
    setError(null)
    start(async () => {
      const { error: e } = await supabase.from('events').update({ status: next }).eq('id', id)
      if (e) return setError(readable(e.message))
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === 'draft' && <Button onClick={() => change('published')} loading={pending}>Publish</Button>}
      {status === 'published' && <Button variant="secondary" onClick={() => change('draft', 'Unpublish this event? Guests will no longer see it. Existing registrations are kept.')} loading={pending}>Unpublish</Button>}
      {(status === 'published' || status === 'draft') && (
        <Button variant="danger" onClick={() => change('cancelled', 'Cancel this event? Registered guests will see it as cancelled.')} loading={pending}>Cancel event</Button>
      )}
      {error && <p role="alert" className="basis-full text-sm text-danger">{error}</p>}
    </div>
  )
}

type Ann = { id: string; body: string; created_at: string; send_email: boolean }

export function Announcements({ eventId, items, remaining }: { eventId: string; items: Ann[]; remaining: number | null }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [body, setBody] = useState('')
  const [email, setEmail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const send = () => {
    setError(null)
    start(async () => {
      const { error: e } = await supabase.rpc('publish_announcement', { p_event: eventId, p_body: body.trim(), p_send_email: email })
      if (e) return setError(readable(e.message))
      if (email) void flushEmails()
      setBody(''); setEmail(false); router.refresh()
    })
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader title="Sent updates" description="Everyone registered sees these in their notifications" />
        <CardBody>
          {items.length === 0 ? <p className="text-sm text-muted">Nothing sent yet.</p> : (
            <ul className="space-y-4">
              {items.map(a => (
                <li key={a.id} className="rounded-xl bg-raised p-4 shadow-[inset_0_0_0_1px_rgb(var(--k-line))]">
                  <p className="whitespace-pre-wrap text-sm text-fg">{a.body}</p>
                  <p className="mt-2 flex items-center gap-2 text-xs text-subtle">{fmtDateTime(a.created_at)}{a.send_email && <Badge tone="info">Emailed</Badge>}</p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="New announcement" description={remaining === null ? 'Unlimited on your plan' : `${remaining} left for this event`} action={<Megaphone className="h-5 w-5 text-subtle" aria-hidden />} />
        <CardBody className="space-y-4">
          <Field label="Message" hint={`${body.length}/1000`}>{p => <Textarea {...p} rows={5} maxLength={1000} value={body} onChange={e => setBody(e.target.value)} placeholder="Doors open at 8 pm. Dress code is smart casual." />}</Field>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={email} onChange={e => setEmail(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--k-accent))]" /> Also send by email
          </label>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button onClick={send} loading={pending} disabled={!body.trim() || remaining === 0} className="w-full">Send to all guests</Button>
        </CardBody>
      </Card>
    </div>
  )
}

type Link = { id: string; label: string; expires_at: string; revoked_at: string | null; last_used_at: string | null }

export function GateLinks({ eventId, links, origin }: { eventId: string; links: Link[]; origin: string }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [label, setLabel] = useState('')
  const [fresh, setFresh] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const create = () => {
    setError(null)
    start(async () => {
      const { data, error: e } = await supabase.rpc('create_gate_link', { p_label: label.trim() || 'Door team', p_event_ids: [eventId] })
      if (e) return setError(readable(e.message))
      setFresh(`${origin}/staff/${(data as { token: string }).token}`); setLabel(''); router.refresh()
    })
  }
  const revoke = (id: string) => start(async () => { await supabase.rpc('revoke_gate_link', { p_id: id }); router.refresh() })

  const live = links.filter(l => !l.revoked_at && new Date(l.expires_at) > new Date())
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader title="Door team links" description="Staff open the link on their phone. They can scan and look up guests, nothing else." />
        <CardBody>
          {fresh && (
            <div className="mb-5 rounded-xl bg-success/10 p-4">
              <p className="text-sm font-medium text-success">Link created. Copy it now, it is only shown once.</p>
              <p className="mt-2 break-all rounded-lg bg-canvas/60 p-2 font-mono text-xs text-fg">{fresh}</p>
              <div className="mt-3"><CopyButton text={fresh} /></div>
            </div>
          )}
          {live.length === 0 ? <p className="text-sm text-muted">No active links.</p> : (
            <ul className="divide-y divide-line">
              {live.map(l => (
                <li key={l.id} className="flex items-center gap-3 py-3">
                  <Link2 className="h-4 w-4 text-subtle" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{l.label}</p>
                    <p className="text-xs text-muted">Expires {fmtDateTime(l.expires_at)}{l.last_used_at ? ` · last used ${fmtDateTime(l.last_used_at)}` : ' · not used yet'}</p>
                  </div>
                  <Button variant="ghost" size="icon-sm" aria-label={`Revoke ${l.label}`} onClick={() => revoke(l.id)}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="New link" description="Expires 3 hours after the event ends" />
        <CardBody className="space-y-4">
          <Field label="Label">{p => <Input {...p} value={label} onChange={e => setLabel(e.target.value)} placeholder="Main gate" maxLength={40} />}</Field>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button onClick={create} loading={pending} className="w-full">Create link</Button>
        </CardBody>
      </Card>
    </div>
  )
}

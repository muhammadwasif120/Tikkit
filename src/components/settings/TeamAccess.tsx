'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, UserPlus, X } from 'lucide-react'
import { Avatar, Badge, Button, Card, CardBody, CardHeader, Field, Input } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { rpcLoose } from '@/lib/rpc'
import { fmtDate } from '@/lib/format'
import { flushEmails } from '@/app/actions/emailActions'

export type Member = { id: string; email: string; status: string; invitedAt: string }
const readable = (m: string) => (m.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)?.[1]) ?? m

export default function TeamAccess({ members, limit }: { members: Member[]; limit: number | null }) {
  const router = useRouter(); const supabase = useMemo(() => createClient(), [])
  const [email, setEmail] = useState(''); const [err, setErr] = useState<string | null>(null); const [ok, setOk] = useState(false); const [pending, start] = useTransition()
  const active = members.filter(m => m.status !== 'removed')

  const invite = (e: React.FormEvent) => { e.preventDefault(); setErr(null); setOk(false)
    start(async () => { const { error } = await rpcLoose(supabase as never, 'invite_team_member', { p_email: email }); if (error) return setErr(readable(error.message)); void flushEmails(); setEmail(''); setOk(true); router.refresh() }) }
  const remove = (m: Member) => confirm(`Remove ${m.email} from your team?`) && start(async () => { await rpcLoose(supabase as never, 'remove_team_member', { p_id: m.id }); router.refresh() })

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader title="Team" description="Managers can approve guests, run the door and edit your events. They cannot change billing or your profile." />
        <CardBody>
          {active.length === 0 ? <p className="text-sm text-muted">Only you so far.</p> : (
            <ul className="divide-y divide-line">
              {active.map(m => (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <Avatar name={m.email} size={36} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-fg">{m.email}</p><p className="text-xs text-muted">Invited {fmtDate(m.invitedAt)}</p></div>
                  <Badge tone={m.status === 'active' ? 'success' : 'warning'}>{m.status === 'active' ? 'Manager' : 'Invite sent'}</Badge>
                  <Button size="icon-sm" variant="ghost" aria-label={`Remove ${m.email}`} onClick={() => remove(m)}><X className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Invite a manager" description={limit === null ? 'Unlimited on your plan' : limit === 0 ? 'Team access is on Growth and Pro' : `${active.length} of ${limit} used`} action={<UserPlus className="h-5 w-5 text-subtle" aria-hidden />} />
        <CardBody>
          <form onSubmit={invite} className="space-y-4">
            <Field label="Email" hint="They accept the invite after signing in with this email.">{p => <Input {...p} type="email" leading={<Mail className="h-4 w-4" />} value={email} onChange={e => setEmail(e.target.value)} required />}</Field>
            {err && <p role="alert" className="text-sm text-danger">{err}</p>}
            {ok && <p role="status" className="text-sm text-success">Invite sent.</p>}
            <Button type="submit" className="w-full" loading={pending} disabled={limit === 0}>Send invite</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}

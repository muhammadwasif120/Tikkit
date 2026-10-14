import { Flame, ShieldCheck, Trophy } from 'lucide-react'
import { Badge, Card, CardBody, CardHeader, PageHeader, Progress } from '@/components/kit'
import { requireAttendee } from '@/lib/data/viewer'
import { fmtDate } from '@/lib/format'

export const metadata = { title: 'My score' }

const TIERS = [['new', 'New', 0], ['reliable', 'Reliable', 20], ['regular', 'Regular', 60], ['trusted', 'Trusted', 120]] as const

export default async function ScorePage() {
  const { supabase, profile } = await requireAttendee()
  const [{ data: st }, { data: events }, { data: priv }] = await Promise.all([
    supabase.from('attendee_stats').select('*').eq('id', profile.id).maybeSingle(),
    supabase.from('score_events').select('id, delta, reason, created_at').eq('attendee_id', profile.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('profile_private').select('id_status').eq('id', profile.id).maybeSingle(),
  ])
  const score = st?.score ?? 0
  const next = TIERS.find(t => t[2] > score)
  const cur = [...TIERS].reverse().find(t => t[2] <= score) ?? TIERS[0]
  return (
    <div className="k-fade-up space-y-6">
      <PageHeader title="My score" description="Organizers see your tier when you ask to join. Show up and it grows." />
      <Card className="k-gradient-ring p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-[13px] text-muted">Your tier</p><p className="mt-1 flex items-center gap-3 text-3xl font-semibold tracking-tight text-fg"><Trophy className="h-7 w-7 text-magenta" aria-hidden />{cur[1]}</p></div>
          <div className="text-right"><p className="tnum text-4xl font-semibold text-fg">{score}</p><p className="text-xs text-subtle">points</p></div>
        </div>
        {next && <div className="mt-5"><div className="mb-1.5 flex justify-between text-xs text-muted"><span>{next[2] - score} points to {next[1]}</span><span className="tnum">{score} / {next[2]}</span></div><Progress value={Math.min(100, Math.round(((score - cur[2]) / (next[2] - cur[2])) * 100))} /></div>}
      </Card>
      <div className="grid gap-4 sm:grid-cols-4">
        {[['Attended', st?.attended ?? 0], ['No shows', st?.no_shows ?? 0], ['Current streak', st?.streak ?? 0], ['VIP events', st?.vip_events ?? 0]].map(([k, v]) => <Card key={k as string} className="p-4 text-center"><p className="tnum text-2xl font-semibold text-fg">{v}</p><p className="mt-0.5 text-xs text-muted">{k}</p></Card>)}
      </div>
      <Card><CardHeader title="Verification" action={<ShieldCheck className="h-5 w-5 text-subtle" aria-hidden />} /><CardBody className="flex items-center justify-between gap-3"><p className="text-sm text-muted">{priv?.id_status === 'verified' ? 'Your ID is verified. Organizers see the check next to your name.' : 'Verify your ID to get the check and join verified-only events.'}</p>{priv?.id_status === 'verified' ? <Badge tone="success">Verified</Badge> : <a href="/guest/profile#verify" className="text-sm font-medium text-accent hover:underline">Verify</a>}</CardBody></Card>
      <Card><CardHeader title="How it changes" description="Every event you attend or miss moves your score" action={<Flame className="h-5 w-5 text-subtle" aria-hidden />} />
        <CardBody>{(events ?? []).length === 0 ? <p className="text-sm text-muted">Nothing yet. Attend an event to start.</p> : <ul className="divide-y divide-line">{events!.map(e => <li key={e.id} className="flex items-center gap-3 py-2.5 text-sm"><span className="flex-1 text-fg">{e.reason}</span><span className="text-xs text-subtle">{fmtDate(e.created_at)}</span><span className={`tnum w-10 text-right font-medium ${e.delta >= 0 ? 'text-success' : 'text-danger'}`}>{e.delta > 0 ? '+' : ''}{e.delta}</span></li>)}</ul>}</CardBody></Card>
    </div>
  )
}

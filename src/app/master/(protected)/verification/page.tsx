import { Badge, Card, EmptyState, PageHeader } from '@/components/kit'
import IdReveal from '@/components/master/IdReveal'
import ReviewButtons from '@/components/master/ReviewButtons'
import { requireAdmin } from '@/lib/data/admin'
import { fmtDateTime } from '@/lib/format'

export const metadata = { title: 'ID reviews' }

export default async function VerificationPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('profile_private').select('id, id_type, id_image_path, id_status, id_submitted_at, id_expiry').eq('id_status', 'pending').order('id_submitted_at')
  const ids = (data ?? []).map(d => d.id)
  const { data: people } = ids.length ? await supabase.from('profiles').select('id, full_name, role').in('id', ids) : { data: [] }
  const rows = await Promise.all((data ?? []).map(async r => ({ ...r, url: r.id_image_path ? (await supabase.storage.from('id-documents').createSignedUrl(r.id_image_path, 300)).data?.signedUrl ?? null : null })))
  return (
    <div className="k-fade-up space-y-6"><PageHeader title="ID reviews" description="Compare the photo with the number. Every reveal is a deliberate click." />
      {rows.length === 0 ? <Card><EmptyState icon={<Badge>0</Badge>} title="Nothing to review" description="New submissions appear here." /></Card> : <ul className="space-y-3">{rows.map(r => { const p = people?.find(x => x.id === r.id); return (
        <Card key={r.id}><div className="flex flex-wrap items-start gap-4 p-4">
          {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={r.url} alt="ID" className="h-28 w-44 rounded-xl object-cover" /></a> : <div className="h-28 w-44 rounded-xl bg-raised" />}
          <div className="min-w-0 flex-1"><p className="text-sm font-medium text-fg">{p?.full_name} <Badge tone="neutral">{p?.role}</Badge></p><p className="mt-1 text-xs uppercase text-muted">{r.id_type} · submitted {fmtDateTime(r.id_submitted_at)}{r.id_expiry ? ` · expires ${r.id_expiry}` : ''}</p><div className="mt-3"><IdReveal userId={r.id} /></div></div>
          <ReviewButtons kind="id" id={r.id} userId={r.id} />
        </div></Card>) })}</ul>}
    </div>
  )
}

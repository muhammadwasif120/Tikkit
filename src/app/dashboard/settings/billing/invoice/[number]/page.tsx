import { notFound } from 'next/navigation'
import { requireOrganizer } from '@/lib/data/viewer'
import { fmtDate, pkr } from '@/lib/format'
import PrintButton from './PrintButton'

export const metadata = { title: 'Invoice' }

export default async function InvoicePage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params
  const { supabase, profile, company } = await requireOrganizer()
  const { data: inv } = await supabase.from('subscription_invoices').select('*').eq('number', number).eq('organizer_id', profile.id).maybeSingle()
  if (!inv) notFound()
  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 text-neutral-900 shadow-card print:shadow-none">
      <div className="flex items-start justify-between"><div><p className="text-2xl font-bold tracking-tight">TIKKIT X</p><p className="text-sm text-neutral-500">Two Bit Digital Ltd, Karachi, Pakistan</p></div><div className="text-right"><p className="text-sm text-neutral-500">Invoice</p><p className="text-lg font-semibold">{inv.number}</p></div></div>
      <div className="mt-10 grid grid-cols-2 gap-6 text-sm"><div><p className="text-neutral-500">Billed to</p><p className="mt-1 font-medium">{company ?? profile.full_name}</p></div><div className="text-right"><p className="text-neutral-500">Issued</p><p className="mt-1 font-medium">{fmtDate(inv.issued_at, { day: 'numeric', month: 'long', year: 'numeric' })}</p></div></div>
      <table className="mt-10 w-full text-sm"><thead><tr className="border-b text-left text-neutral-500"><th className="py-2 font-medium">Description</th><th className="py-2 text-right font-medium">Amount</th></tr></thead>
        <tbody><tr className="border-b"><td className="py-3 capitalize">TIKKIT X {inv.plan_id} plan, {inv.period === 'year' ? 'annual' : 'monthly'}<span className="block text-xs text-neutral-500">{fmtDate(inv.period_start, { day: 'numeric', month: 'short', year: 'numeric' })} to {fmtDate(inv.period_end, { day: 'numeric', month: 'short', year: 'numeric' })}</span></td><td className="py-3 text-right tabular-nums">{pkr(inv.amount_pkr)}</td></tr></tbody>
        <tfoot><tr><td className="pt-4 text-right font-medium">Total (no tax charged)</td><td className="pt-4 text-right text-lg font-semibold tabular-nums">{pkr(inv.amount_pkr)}</td></tr></tfoot></table>
      <div className="mt-10 print:hidden"><PrintButton /></div>
    </div>
  )
}

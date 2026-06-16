import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { subMonths, format, startOfMonth } from 'date-fns'
import AnalyticsClient from '@/components/vendor/os/AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await (supabase as any)
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) redirect('/vendor/onboarding')

  const vendorId = vendor.id
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5)).toISOString()

  // Fetch paid invoices (revenue)
  const { data: paidInvoices } = await (supabase as any)
    .from('invoices')
    .select('total, created_at')
    .eq('vendor_id', vendorId)
    .eq('status', 'paid')
    .gte('created_at', sixMonthsAgo)

  // Fetch paid bills (expenses)
  const { data: paidBillsData } = await (supabase as any)
    .from('vendor_bills')
    .select('total, created_at')
    .eq('vendor_id', vendorId)
    .eq('status', 'paid')
    .gte('created_at', sixMonthsAgo)

  // Fetch all invoices for status breakdown
  const { data: allInvoices } = await (supabase as any)
    .from('invoices')
    .select('status, total')
    .eq('vendor_id', vendorId)

  // Fetch fulfilled deals + their cross-hire costs for P&L table
  const { data: fulfilledDeals } = await (supabase as any)
    .from('deals')
    .select('id, event_name, client_name, quote_value')
    .eq('vendor_id', vendorId)
    .eq('stage', 'fulfilled')
    .order('created_at', { ascending: false })
    .limit(20)

  // Cross-hire costs per deal
  const dealIds = (fulfilledDeals ?? []).map((d: any) => d.id)
  let crossHireCosts: Record<string, number> = {}
  if (dealIds.length > 0) {
    const { data: xhires } = await (supabase as any)
      .from('cross_hires')
      .select('deal_id, agreed_fee')
      .in('deal_id', dealIds)
      .in('status', ['confirmed', 'completed'])
    for (const x of (xhires ?? [])) {
      crossHireCosts[x.deal_id] = (crossHireCosts[x.deal_id] ?? 0) + Number(x.agreed_fee ?? 0)
    }
  }

  // Build 6-month buckets
  const monthMap: Record<string, { revenue: number; expenses: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const key = format(subMonths(new Date(), i), 'MMM')
    monthMap[key] = { revenue: 0, expenses: 0 }
  }
  for (const inv of (paidInvoices ?? [])) {
    const key = format(new Date(inv.created_at), 'MMM')
    if (monthMap[key]) monthMap[key].revenue += Number(inv.total ?? 0)
  }
  for (const bill of (paidBillsData ?? [])) {
    const key = format(new Date(bill.created_at), 'MMM')
    if (monthMap[key]) monthMap[key].expenses += Number(bill.total ?? 0)
  }
  const months = Object.entries(monthMap).map(([month, v]) => ({ month, ...v }))

  // Invoice status aggregation
  const statusMap: Record<string, { count: number; total: number }> = {}
  for (const inv of (allInvoices ?? [])) {
    if (!statusMap[inv.status]) statusMap[inv.status] = { count: 0, total: 0 }
    statusMap[inv.status].count++
    statusMap[inv.status].total += Number(inv.total ?? 0)
  }
  const invStatuses = Object.entries(statusMap).map(([status, v]) => ({ status, ...v }))

  // Cash flow numbers
  const collected   = (allInvoices ?? []).filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.total), 0)
  const outstanding = (allInvoices ?? []).filter((i: any) => ['sent', 'overdue', 'partially_paid'].includes(i.status)).reduce((s: number, i: any) => s + Number(i.total), 0)
  const totalBills  = (paidBillsData ?? []).length
  const paidBillsAmt = (paidBillsData ?? []).reduce((s: number, b: any) => s + Number(b.total), 0)

  // Deal P&L
  const dealPL = (fulfilledDeals ?? []).map((d: any) => ({
    event_name: d.event_name,
    client_name: d.client_name,
    quote_value: Number(d.quote_value ?? 0),
    cross_hire_cost: crossHireCosts[d.id] ?? 0,
  }))

  return (
    <AnalyticsClient
      months={months}
      dealPL={dealPL}
      invStatuses={invStatuses}
      collected={collected}
      outstanding={outstanding}
      totalBills={totalBills}
      paidBills={paidBillsAmt}
    />
  )
}

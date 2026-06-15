import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { KanbanSquare, FileText, TrendingUp, ChevronRight, Zap } from 'lucide-react'
import { format } from 'date-fns'

const C = {
  surface: '#0D0D14', border: 'rgba(0,229,255,0.1)',
  cyan: '#00E5FF', muted: 'rgba(255,255,255,0.35)',
}

async function OsOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await (supabase as any)
    .from('vendors')
    .select('id, trading_name, verification_tier, created_at')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/vendor/onboarding')

  const [{ data: deals }, { data: invoices }] = await Promise.all([
    (supabase as any).from('deals').select('id, event_name, client_name, quote_value, stage, event_date').eq('vendor_id', vendor.id).order('created_at', { ascending: false }),
    (supabase as any).from('invoices').select('id, invoice_number, total, status, due_date, client_name').eq('vendor_id', vendor.id).order('created_at', { ascending: false }),
  ])

  const activeDeals     = (deals ?? []).filter((d: any) => !['fulfilled', 'lost'].includes(d.stage))
  const pipelineValue   = activeDeals.reduce((s: number, d: any) => s + d.quote_value, 0)
  const overdueInvoices = (invoices ?? []).filter((i: any) => i.status === 'overdue')
  const pendingInvoices = (invoices ?? []).filter((i: any) => ['draft', 'sent', 'partially_paid'].includes(i.status))
  const recentDeals     = (deals ?? []).slice(0, 5)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg,#00E5FF,#CC00FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={12} color="#050508" strokeWidth={2.5} />
          </div>
          <h1 style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '-0.4px' }}>
            {vendor.trading_name}
          </h1>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', color: C.cyan, fontWeight: 700 }}>
            Tier {vendor.verification_tier}
          </span>
        </div>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
          Member since {format(new Date(vendor.created_at), 'MMMM yyyy')}
        </p>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Pipeline Value',    value: `PKR ${pipelineValue.toLocaleString('en-PK')}`, color: C.cyan     },
          { label: 'Active Deals',      value: activeDeals.length.toString(),                   color: '#FFFFFF'  },
          { label: 'Pending Invoices',  value: pendingInvoices.length.toString(),               color: '#F6C90E'  },
          { label: 'Overdue Invoices',  value: overdueInvoices.length.toString(),               color: overdueInvoices.length > 0 ? '#FC8181' : C.muted },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{label}</p>
            <p style={{ color, fontSize: 20, fontWeight: 900, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent deals */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <KanbanSquare size={14} color={C.cyan} />
              <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>Recent Deals</span>
            </div>
            <Link href="/vendor/os/deals" style={{ color: C.cyan, fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {recentDeals.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13, padding: '20px 18px', margin: 0 }}>No deals yet.</p>
          ) : (
            recentDeals.map((d: any) => (
              <Link key={d.id} href={`/vendor/os/deals/${d.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: `1px solid rgba(255,255,255,0.04)`, textDecoration: 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.event_name}</p>
                  <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>{d.client_name}</p>
                </div>
                <span style={{ color: C.cyan, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>PKR {d.quote_value.toLocaleString('en-PK')}</span>
              </Link>
            ))
          )}
        </div>

        {/* Recent invoices */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={14} color={C.cyan} />
              <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>Recent Invoices</span>
            </div>
            <Link href="/vendor/os/invoices" style={{ color: C.cyan, fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {(invoices ?? []).length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13, padding: '20px 18px', margin: 0 }}>No invoices yet.</p>
          ) : (
            (invoices ?? []).slice(0, 5).map((inv: any) => {
              const sc: Record<string, string> = { paid: '#48BB78', sent: C.cyan, draft: C.muted, overdue: '#FC8181', partially_paid: '#F6C90E', cancelled: '#A0AEC0' }
              const c = sc[inv.status] ?? C.muted
              return (
                <Link key={inv.id} href={`/vendor/os/invoices/${inv.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: `1px solid rgba(255,255,255,0.04)`, textDecoration: 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{inv.invoice_number}</p>
                    <p style={{ color: C.muted, fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.client_name}</p>
                  </div>
                  <span style={{ color: '#FFFFFF', fontSize: 12, flexShrink: 0 }}>PKR {inv.total.toLocaleString('en-PK')}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: c, background: `${c}18`, border: `1px solid ${c}30`, borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>{inv.status}</span>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* Upgrade prompt for Tier 1 */}
      {vendor.verification_tier === 1 && (
        <div style={{ marginTop: 20, padding: '16px 20px', background: 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(204,0,255,0.06))', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <TrendingUp size={20} color={C.cyan} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700, margin: '0 0 2px' }}>Get your Verified badge</p>
            <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Complete identity verification to appear in organiser searches and bid on RFQs.</p>
          </div>
          <Link href="/vendor/os/settings/verify" style={{ padding: '8px 16px', borderRadius: 10, background: C.cyan, color: '#050508', fontSize: 12, fontWeight: 800, textDecoration: 'none', flexShrink: 0 }}>
            Get Verified
          </Link>
        </div>
      )}
    </div>
  )
}

export default function VendorOsPage() {
  return (
    <Suspense fallback={<div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</div>}>
      <OsOverview />
    </Suspense>
  )
}

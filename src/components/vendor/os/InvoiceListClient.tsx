'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, ChevronRight, CheckCircle, Clock, AlertCircle, X } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { updateInvoiceStatus, type InvoiceStatus } from '@/app/actions/vendorXActions'

type Invoice = {
  id: string; invoice_number: string; client_name: string; client_email: string | null
  total: number; status: string; issue_date: string; due_date: string | null
  advance_amount: number; advance_confirmed_at: string | null; paid_in_full_at: string | null
}
type Deal = { id: string; event_name: string; client_name: string }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft:           { label: 'Draft',           color: 'rgba(255,255,255,0.35)', icon: FileText    },
  sent:            { label: 'Sent',            color: '#00E5FF',                icon: Clock       },
  partially_paid:  { label: 'Part Paid',       color: '#F6C90E',                icon: CheckCircle },
  paid:            { label: 'Paid',            color: '#48BB78',                icon: CheckCircle },
  overdue:         { label: 'Overdue',         color: '#FC8181',                icon: AlertCircle },
  cancelled:       { label: 'Cancelled',       color: 'rgba(255,255,255,0.25)', icon: X           },
}

const C = {
  surface: '#0D0D14', border: 'rgba(0,229,255,0.1)',
  cyan: '#00E5FF', muted: 'rgba(255,255,255,0.35)',
}

export default function InvoiceListClient({
  invoices: initial, deals, vendorId,
}: {
  invoices: Invoice[]; deals: Deal[]; vendorId: string
}) {
  const router = useRouter()
  const [invoices, setInvoices] = useState(initial)
  const [filter, setFilter]     = useState<string>('all')

  const handleStatusChange = async (id: string, status: InvoiceStatus) => {
    await updateInvoiceStatus(id, status)
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  const visible = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)

  const totalOutstanding = invoices
    .filter(i => ['sent', 'partially_paid', 'overdue'].includes(i.status))
    .reduce((s, i) => s + i.total, 0)

  const totalPaid = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + i.total, 0)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Invoices</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/vendor/os/invoices/new"
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 12, background: C.cyan, color: '#050508', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}
        >
          <Plus size={15} /> New Invoice
        </Link>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Outstanding', value: `PKR ${totalOutstanding.toLocaleString('en-PK')}`, color: '#F6C90E' },
          { label: 'Collected',   value: `PKR ${totalPaid.toLocaleString('en-PK')}`,        color: '#48BB78' },
          { label: 'Overdue',     value: invoices.filter(i => i.status === 'overdue').length.toString(), color: '#FC8181' },
          { label: 'Drafts',      value: invoices.filter(i => i.status === 'draft').length.toString(),   color: C.muted },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{label}</p>
            <p style={{ color, fontSize: 16, fontWeight: 900, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {['all', ...Object.keys(STATUS_CONFIG)].map(s => {
          const active = filter === s
          return (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: '5px 12px', borderRadius: 20, background: active ? 'rgba(0,229,255,0.1)' : 'transparent', border: `1px solid ${active ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.08)'}`, color: active ? C.cyan : C.muted, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label ?? s}
              <span style={{ marginLeft: 5, opacity: 0.6 }}>
                {s === 'all' ? invoices.length : invoices.filter(i => i.status === s).length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Invoice list */}
      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FileText size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
          <p style={{ color: C.muted, fontSize: 14 }}>No invoices yet.</p>
        </div>
      ) : (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
          {visible.map((inv, i) => {
            const sc = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft
            const Icon = sc.icon
            return (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < visible.length - 1 ? `1px solid rgba(255,255,255,0.05)` : 'none', cursor: 'pointer' }}
                onClick={() => router.push(`/vendor/os/invoices/${inv.id}`)}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${sc.color}12`, border: `1px solid ${sc.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={sc.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700, margin: 0 }}>{inv.invoice_number}</p>
                    <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: `${sc.color}18`, border: `1px solid ${sc.color}30`, borderRadius: 20, padding: '1px 7px' }}>{sc.label}</span>
                  </div>
                  <p style={{ color: C.muted, fontSize: 12, margin: '2px 0 0' }}>
                    {inv.client_name}
                    {inv.due_date && <span style={{ marginLeft: 8 }}>· Due {format(new Date(inv.due_date), 'MMM d')}</span>}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 800, margin: 0 }}>PKR {inv.total.toLocaleString('en-PK')}</p>
                  <p style={{ color: C.muted, fontSize: 11, margin: '2px 0 0' }}>{format(new Date(inv.issue_date), 'MMM d, yyyy')}</p>
                </div>
                <ChevronRight size={14} color={C.muted} style={{ flexShrink: 0 }} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

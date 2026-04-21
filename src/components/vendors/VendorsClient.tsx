'use client'

import { useState } from 'react'
import {
  Plus, X, Check, ChevronDown, Building2, Tag, FileText,
  AlertCircle, CheckCircle, Clock,
  Edit2, Trash2, Link as LinkIcon, Search
} from 'lucide-react'
import { saveVendorAction, deleteVendorAction, saveInvoiceAction, deleteInvoiceAction, markInvoicePaidAction } from '@/app/actions/vendorActions'
import { notifyVendorPaymentDue } from '@/app/actions/vendorNotificationActions'
import { dismissVendorPaymentNotification } from '@/app/actions/approvalDismissAction'
import clsx from 'clsx'

type Vendor = {
  id: string
  organizer_id: string
  name: string
  category: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  notes: string | null
  event_ids: string[] | null
}

type Invoice = {
  id: string
  vendor_id: string
  event_id: string | null
  amount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  due_date: string | null
  description: string | null
  paid_at: string | null
}

type Event = { id: string; title: string; status: string }

const CATEGORIES = [
  'Catering', 'Security', 'AV / Sound', 'Lighting', 'Decoration',
  'Photography', 'Videography', 'Transport', 'Venue', 'Entertainment', 'Other'
]

const statusConfig = {
  pending:   { label: 'Pending',   color: 'text-[#FFC745]',  bg: 'bg-[#FFC74520]',  border: 'border-[#FFC74533]',  icon: Clock },
  paid:      { label: 'Paid',      color: 'text-green-400',  bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle },
  overdue:   { label: 'Overdue',   color: 'text-red-400',    bg: 'bg-red-500/10',   border: 'border-red-500/20',   icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'text-gray-500',   bg: 'bg-white/5',      border: 'border-white/10',     icon: X },
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount)

type Tab = 'vendors' | 'invoices'

export default function VendorsClient({
  vendors: initialVendors,
  invoices: initialInvoices,
  events,
  userId,
}: {
  vendors: Vendor[]
  invoices: Invoice[]
  events: Event[]
  userId: string
}) {
  const [activeTab, setActiveTab] = useState<Tab>('vendors')
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors)
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)

  // Vendor modal
  const [vendorModal, setVendorModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [vendorForm, setVendorForm] = useState({
    name: '', category: 'Other', contact_name: '', contact_email: '',
    contact_phone: '', notes: '', event_ids: [] as string[],
  })
  const [vendorSaving, setVendorSaving] = useState(false)
  const [vendorError, setVendorError] = useState<string | null>(null)

  // Invoice modal
  const [invoiceModal, setInvoiceModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [invoiceForm, setInvoiceForm] = useState({
    vendor_id: '', event_id: '', amount: '', description: '', due_date: '',
    status: 'pending' as Invoice['status'],
  })
  const [invoiceSaving, setInvoiceSaving] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedVendorId, setSelectedVendorId] = useState('all')
  const [vendorSearch, setVendorSearch] = useState('')
  const [invoiceSearch, setInvoiceSearch] = useState('')

  const openVendorModal = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor)
      setVendorForm({
        name: vendor.name, category: vendor.category,
        contact_name: vendor.contact_name ?? '', contact_email: vendor.contact_email ?? '',
        contact_phone: vendor.contact_phone ?? '', notes: vendor.notes ?? '',
        event_ids: vendor.event_ids ?? [],
      })
    } else {
      setEditingVendor(null)
      setVendorForm({ name: '', category: 'Other', contact_name: '', contact_email: '', contact_phone: '', notes: '', event_ids: [] })
    }
    setVendorError(null)
    setVendorModal(true)
  }

  const saveVendor = async () => {
    if (!vendorForm.name) return
    setVendorSaving(true)
    setVendorError(null)

    const result = await saveVendorAction({
      id:            editingVendor?.id,
      name:          vendorForm.name,
      category:      vendorForm.category,
      contact_name:  vendorForm.contact_name  || null,
      contact_email: vendorForm.contact_email || null,
      contact_phone: vendorForm.contact_phone || null,
      notes:         vendorForm.notes         || null,
      event_ids:     vendorForm.event_ids,
    })

    if (result.error) { setVendorError(result.error); setVendorSaving(false); return }
    if (result.data) {
      if (editingVendor) {
        setVendors(prev => prev.map(v => v.id === result.data!.id ? (result.data as any) : v))
      } else {
        setVendors(prev => [result.data as any, ...prev])
      }
    }
    setVendorSaving(false)
    setVendorModal(false)
  }

  const deleteVendor = async (id: string) => {
    await deleteVendorAction(id)
    setVendors(prev => prev.filter(v => v.id !== id))
  }

  const openInvoiceModal = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice)
      setInvoiceForm({
        vendor_id: invoice.vendor_id, event_id: invoice.event_id ?? '',
        amount: String(invoice.amount), description: invoice.description ?? '',
        due_date: invoice.due_date ? invoice.due_date.split('T')[0] : '',
        status: invoice.status,
      })
    } else {
      setEditingInvoice(null)
      setInvoiceForm({ vendor_id: '', event_id: '', amount: '', description: '', due_date: '', status: 'pending' })
    }
    setInvoiceError(null)
    setInvoiceModal(true)
  }

  const saveInvoice = async () => {
    if (!invoiceForm.vendor_id || !invoiceForm.amount) return
    setInvoiceSaving(true)
    setInvoiceError(null)

    const result = await saveInvoiceAction({
      id:          editingInvoice?.id,
      vendor_id:   invoiceForm.vendor_id,
      event_id:    invoiceForm.event_id || null,
      amount:      parseFloat(invoiceForm.amount),
      description: invoiceForm.description || null,
      due_date:    invoiceForm.due_date || null,
      status:      invoiceForm.status,
    })

    if (result.error) { setInvoiceError(result.error); setInvoiceSaving(false); return }
    if (result.data) {
      const data = result.data as any
      if (editingInvoice) {
        setInvoices(prev => prev.map(i => i.id === data.id ? data : i))
        if ((data.status === 'pending' || data.status === 'overdue') &&
            data.status !== editingInvoice.status) {
          const vendor = vendors.find(v => v.id === data.vendor_id)
          if (vendor) await notifyVendorPaymentDue(userId, data.event_id, vendor.name, data.amount)
        }
      } else {
        setInvoices(prev => [...prev, data])
        if (data.status === 'pending' || data.status === 'overdue') {
          const vendor = vendors.find(v => v.id === data.vendor_id)
          if (vendor) await notifyVendorPaymentDue(userId, data.event_id, vendor.name, data.amount)
        }
      }
    }

    setInvoiceSaving(false)
    setInvoiceModal(false)
  }

  const markPaid = async (invoice: Invoice) => {
    const result = await markInvoicePaidAction(invoice.id)
    if (result.data) {
      setInvoices(prev => prev.map(i => i.id === result.data!.id ? (result.data as any) : i))
      const vendor = vendors.find(v => v.id === invoice.vendor_id)
      if (vendor) await dismissVendorPaymentNotification(invoice.event_id, vendor.name)
    }
  }

  const deleteInvoice = async (id: string) => {
    await deleteInvoiceAction(id)
    setInvoices(prev => prev.filter(i => i.id !== id))
  }

  // Filtered data
  const filteredVendors = vendors.filter(v => {
    const matchCategory = categoryFilter === 'all' || v.category === categoryFilter
    const q = vendorSearch.toLowerCase()
    const matchSearch = !q || v.name.toLowerCase().includes(q) ||
      (v.contact_name ?? '').toLowerCase().includes(q) ||
      (v.contact_email ?? '').toLowerCase().includes(q)
    return matchCategory && matchSearch
  })

  const filteredInvoices = invoices.filter(i => {
    const matchStatus = statusFilter === 'all' || i.status === statusFilter
    const matchVendor = selectedVendorId === 'all' || i.vendor_id === selectedVendorId
    const q = invoiceSearch.toLowerCase()
    const vendor = vendors.find(v => v.id === i.vendor_id)
    const matchSearch = !q || (vendor?.name ?? '').toLowerCase().includes(q) ||
      (i.description ?? '').toLowerCase().includes(q)
    return matchStatus && matchVendor && matchSearch
  })

  // Finance summary
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: 'rgba(var(--brand-blue-rgb),0.12)', border: '1px solid rgba(var(--brand-blue-rgb),0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={22} color="var(--brand-blue)" />
          </div>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-2xl)', fontWeight: 800, margin: '0 0 2px', fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
              Vendors
            </h1>
            <p className="text-gray-400 text-sm" style={{ margin: 0, lineHeight: 1.6 }}>
              {vendors.length} vendors<br />{invoices.length} invoices
            </p>
          </div>
        </div>
        <button onClick={() => activeTab === 'vendors' ? openVendorModal() : openInvoiceModal()} className="btn-primary" style={{ flexShrink: 0 }}>
          <Plus className="w-4 h-4" />
          {activeTab === 'vendors' ? 'Add Vendor' : 'New Invoice'}
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Pending', value: totalPending, color: 'text-[#FFC745]', icon: Clock },
          { label: 'Paid',    value: totalPaid,    color: 'text-green-400',  icon: CheckCircle },
          { label: 'Overdue', value: totalOverdue, color: 'text-red-400',    icon: AlertCircle },
        ].map(s => (
          <div key={s.label} className="bg-brand-charcoal rounded-xl border border-white/5 p-3 sm:p-5 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <s.icon className={clsx('w-3.5 h-3.5 shrink-0', s.color)} />
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">{s.label}</p>
            </div>
            <p className={clsx('text-base sm:text-xl font-bold truncate', s.color)} style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
              {formatCurrency(s.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'vendors'  as Tab, label: 'Vendors',  icon: Building2, count: vendors.length },
          { key: 'invoices' as Tab, label: 'Invoices', icon: FileText,  count: invoices.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all duration-200 cursor-pointer',
              activeTab === tab.key
                ? 'bg-brand-blue/[0.08] border-brand-blue/25 text-[color:var(--text-primary)]'
                : 'bg-brand-charcoal border-white/5 text-gray-400 hover:border-white/10 hover:text-gray-200'
            )}>
            <div className="flex items-center gap-2">
              <tab.icon className={clsx('w-3.5 h-3.5 shrink-0', activeTab === tab.key ? 'text-brand-blue' : 'text-gray-500')} />
              <span className="text-sm font-medium">{tab.label}</span>
            </div>
            <span className={clsx('ml-2 text-xs font-semibold px-2 py-0.5 rounded-full',
              activeTab === tab.key ? 'bg-brand-blue/[0.15] text-brand-blue' : 'bg-white/5 text-gray-500'
            )}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* VENDORS TAB */}
      {activeTab === 'vendors' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-brand-charcoal rounded-xl border border-white/5 p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" className="input pl-9 w-full" placeholder="Search vendors…" value={vendorSearch} onChange={e => setVendorSearch(e.target.value)} />
            </div>
            <div className="relative">
              <select className="input appearance-none pr-10 w-full cursor-pointer" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {filteredVendors.length === 0 ? (
            <div className="card text-center py-12">
              <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium text-sm">No vendors yet</p>
              <p className="text-gray-600 text-xs mt-1">Add your first vendor to get started</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredVendors.map(vendor => {
                const vendorInvoices = invoices.filter(i => i.vendor_id === vendor.id)
                const unpaid = vendorInvoices.filter(i => i.status === 'pending' || i.status === 'overdue')
                const totalOwed = unpaid.reduce((s, i) => s + i.amount, 0)
                const linkedEvents = events.filter(e => vendor.event_ids?.includes(e.id))

                return (
                  <div key={vendor.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-blue/[0.08] border border-brand-blue/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-brand-blue" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{vendor.name}</h3>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-gray-400 border border-white/10">
                              <Tag className="w-2.5 h-2.5" /> {vendor.category}
                            </span>
                          </div>
                          {vendor.contact_name  && <p className="text-sm text-gray-400 mt-0.5">{vendor.contact_name}</p>}
                          {vendor.contact_email && <p className="text-xs text-gray-600">{vendor.contact_email}</p>}
                          {vendor.contact_phone && <p className="text-xs text-gray-600">{vendor.contact_phone}</p>}
                          {linkedEvents.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              <LinkIcon className="w-3 h-3 text-gray-600" />
                              {linkedEvents.map(e => (
                                <span key={e.id} className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{e.title}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {totalOwed > 0 && (
                          <span className="text-xs font-medium text-[#FFC745]">{formatCurrency(totalOwed)} owed</span>
                        )}
                        <button onClick={() => openVendorModal(vendor)} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteVendor(vendor.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {vendor.notes && (
                      <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-white/5">{vendor.notes}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <p className="text-xs text-gray-600">{vendorInvoices.length} invoice{vendorInvoices.length !== 1 ? 's' : ''}</p>
                      <button onClick={() => { setActiveTab('invoices'); setSelectedVendorId(vendor.id) }}
                        className="text-xs text-brand-blue hover:text-brand-blue/80 transition-colors">
                        View invoices →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* INVOICES TAB */}
      {activeTab === 'invoices' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-brand-charcoal rounded-xl border border-white/5 p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" className="input pl-9 w-full" placeholder="Search invoices…" value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select className="appearance-none input pr-8 w-full cursor-pointer" value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)}>
                  <option value="all">All Vendors</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative flex-1">
                <select className="appearance-none input pr-8 w-full cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium text-sm">No invoices yet</p>
            </div>
          ) : (
            <div className="card overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="table-header">Vendor</th>
                    <th className="table-header">Description</th>
                    <th className="table-header">Event</th>
                    <th className="table-header">Amount</th>
                    <th className="table-header">Due Date</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(invoice => {
                    const vendor = vendors.find(v => v.id === invoice.vendor_id)
                    const event  = events.find(e => e.id === invoice.event_id)
                    const s = statusConfig[invoice.status]
                    return (
                      <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="table-cell font-medium" style={{ color: 'var(--text-primary)' }}>{vendor?.name ?? '—'}</td>
                        <td className="table-cell text-gray-400 max-w-[160px] truncate">{invoice.description ?? '—'}</td>
                        <td className="table-cell text-gray-400 text-xs">{event?.title ?? '—'}</td>
                        <td className="table-cell font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(invoice.amount)}</td>
                        <td className="table-cell text-gray-400 text-xs">
                          {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-PK') : '—'}
                        </td>
                        <td className="table-cell">
                          <span className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border', s.bg, s.color, s.border)}>
                            <s.icon className="w-3 h-3" /> {s.label}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                              <button onClick={() => markPaid(invoice)} title="Mark Paid"
                                className="p-1.5 text-gray-500 hover:text-green-400 transition-colors">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => openInvoiceModal(invoice)} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteInvoice(invoice.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VENDOR MODAL */}
      {vendorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {editingVendor ? 'Edit Vendor' : 'Add Vendor'}
              </h3>
              <button onClick={() => setVendorModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Vendor Name *</label>
                <input type="text" className="input" placeholder="Acme Catering Co." value={vendorForm.name} onChange={e => setVendorForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Category</label>
                <div className="relative">
                  <select className="input appearance-none pr-10" value={vendorForm.category} onChange={e => setVendorForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Contact Name</label>
                  <input type="text" className="input" placeholder="John Smith" value={vendorForm.contact_name} onChange={e => setVendorForm(p => ({ ...p, contact_name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Contact Phone</label>
                  <input type="tel" className="input" placeholder="+92 300 0000000" value={vendorForm.contact_phone} onChange={e => setVendorForm(p => ({ ...p, contact_phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Contact Email</label>
                <input type="email" className="input" placeholder="vendor@example.com" value={vendorForm.contact_email} onChange={e => setVendorForm(p => ({ ...p, contact_email: e.target.value }))} />
              </div>
              <div>
                <label className="label">Link to Events</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {events.map(event => (
                    <div key={event.id} onClick={() => {
                      const ids = vendorForm.event_ids.includes(event.id)
                        ? vendorForm.event_ids.filter(id => id !== event.id)
                        : [...vendorForm.event_ids, event.id]
                      setVendorForm(p => ({ ...p, event_ids: ids }))
                    }}
                      className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors border',
                        vendorForm.event_ids.includes(event.id) ? 'bg-brand-blue/[0.08] border-brand-blue/20' : 'border-transparent hover:bg-white/5')}>
                      <div className={clsx('w-4 h-4 rounded border flex items-center justify-center shrink-0',
                        vendorForm.event_ids.includes(event.id) ? 'bg-brand-blue border-brand-blue' : 'border-white/20')}>
                        {vendorForm.event_ids.includes(event.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{event.title}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input resize-none min-h-16" placeholder="Any notes about this vendor..." value={vendorForm.notes} onChange={e => setVendorForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            {vendorError && (
              <p className="text-red-400 text-sm mt-3">{vendorError}</p>
            )}
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setVendorModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveVendor} disabled={vendorSaving || !vendorForm.name} className="btn-primary">
                {vendorSaving ? 'Saving...' : editingVendor ? 'Save Changes' : 'Add Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE MODAL */}
      {invoiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {editingInvoice ? 'Edit Invoice' : 'New Invoice'}
              </h3>
              <button onClick={() => setInvoiceModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Vendor *</label>
                <div className="relative">
                  <select className="input appearance-none pr-10" value={invoiceForm.vendor_id} onChange={e => setInvoiceForm(p => ({ ...p, vendor_id: e.target.value }))}>
                    <option value="">Select vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="label">Link to Event (optional)</label>
                <div className="relative">
                  <select className="input appearance-none pr-10" value={invoiceForm.event_id} onChange={e => setInvoiceForm(p => ({ ...p, event_id: e.target.value }))}>
                    <option value="">No specific event</option>
                    {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount (PKR) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₨</span>
                    <input type="number" className="input pl-7" placeholder="0" min="0" value={invoiceForm.amount} onChange={e => setInvoiceForm(p => ({ ...p, amount: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" className="input" value={invoiceForm.due_date} onChange={e => setInvoiceForm(p => ({ ...p, due_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <input type="text" className="input" placeholder="Sound equipment rental for event" value={invoiceForm.description} onChange={e => setInvoiceForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['pending', 'paid', 'overdue', 'cancelled'] as const).map(s => {
                    const config = statusConfig[s]
                    return (
                      <button key={s} type="button" onClick={() => setInvoiceForm(p => ({ ...p, status: s }))}
                        className={clsx('p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all',
                          invoiceForm.status === s ? clsx(config.bg, config.color, config.border) : 'border-white/10 text-gray-500 hover:border-white/20')}>
                        <config.icon className="w-3.5 h-3.5" /> {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {invoiceError && (
              <p className="text-red-400 text-sm mt-3">{invoiceError}</p>
            )}
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setInvoiceModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveInvoice} disabled={invoiceSaving || !invoiceForm.vendor_id || !invoiceForm.amount} className="btn-primary">
                {invoiceSaving ? 'Saving...' : editingInvoice ? 'Save Changes' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
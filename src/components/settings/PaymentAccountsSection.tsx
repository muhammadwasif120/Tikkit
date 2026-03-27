'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard, Plus, Trash2, Edit2, Check, X,
  Building2, Smartphone, ChevronDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  createPaymentAccount, updatePaymentAccount, deletePaymentAccount,
  type PaymentAccount,
} from '@/app/actions/paymentAccountActions'
import clsx from 'clsx'

const ACCOUNT_TYPES = [
  { value: 'bank',      label: 'Bank Transfer', icon: Building2,  color: 'text-blue-400',  bg: 'bg-blue-500/10',  border: 'border-blue-500/20' },
  { value: 'jazzcash',  label: 'JazzCash',      icon: Smartphone, color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/20' },
  { value: 'easypaisa', label: 'EasyPaisa',     icon: Smartphone, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { value: 'other',     label: 'Other',          icon: CreditCard, color: 'text-gray-400',  bg: 'bg-white/5',      border: 'border-white/10' },
]

function getTypeConfig(type: string) {
  return ACCOUNT_TYPES.find(t => t.value === type) ?? ACCOUNT_TYPES[3]
}

const EMPTY_FORM = {
  label: '',
  account_type: 'bank' as string,
  account_title: '',
  account_number: '',
  bank_name: '',
  iban: '',
  instructions: '',
}

export default function PaymentAccountsSection({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  const supabase = createClient()
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  /* ── Load accounts directly via Supabase client ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('payment_accounts')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false })
      setAccounts((data ?? []) as any)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (acc: PaymentAccount) => {
    setForm({
      label:          acc.label,
      account_type:   acc.account_type,
      account_title:  acc.account_title,
      account_number: acc.account_number,
      bank_name:      acc.bank_name ?? '',
      iban:           acc.iban ?? '',
      instructions:   acc.instructions ?? '',
    })
    setEditingId(acc.id)
    setShowForm(true)
  }

  const cancelForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); setSaveError('') }

  const handleSave = async () => {
    if (!form.label || !form.account_title || !form.account_number) {
      setSaveError('Please fill in the label, account title, and account number. You can add more details later.')
      return
    }
    setSaveError('')
    setSaving(true)
    try {
      if (editingId) {
        await updatePaymentAccount(editingId, {
          label:          form.label,
          account_type:   form.account_type,
          account_title:  form.account_title,
          account_number: form.account_number,
          bank_name:      form.bank_name || undefined,
          iban:           form.iban || undefined,
          instructions:   form.instructions || undefined,
        })
        setAccounts(prev => prev.map(a =>
          a.id === editingId
            ? { ...a, ...form, bank_name: form.bank_name || null, iban: form.iban || null, instructions: form.instructions || null }
            : a
        ))
      } else {
        const created = await createPaymentAccount({
          label:          form.label,
          account_type:   form.account_type,
          account_title:  form.account_title,
          account_number: form.account_number,
          bank_name:      form.bank_name || undefined,
          iban:           form.iban || undefined,
          instructions:   form.instructions || undefined,
        })
        setAccounts(prev => [created, ...prev])
      }
      cancelForm()
    } catch { setSaveError('Something went wrong. Please try again.') }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deletePaymentAccount(id)
      setAccounts(prev => prev.filter(a => a.id !== id))
    } catch (e) { console.error(e) }
    setDeletingId(null)
  }

  return (
    <div className="card space-y-5">
      {/* Header toggle */}
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Payment Accounts</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {loading
                ? 'Loading...'
                : accounts.length > 0
                  ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''} saved`
                  : 'No payment accounts saved'}
            </p>
          </div>
        </div>
        <ChevronDown className={clsx('w-4 h-4 text-gray-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-white/5 pt-4 space-y-4">

          {/* Saved accounts list */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              {accounts.map(acc => {
                const cfg = getTypeConfig(acc.account_type)
                const Icon = cfg.icon
                return (
                  <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
                        <Icon className={clsx('w-4 h-4', cfg.color)} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">{acc.label}</p>
                          <span className={clsx('text-[10px] font-medium px-1.5 py-0.5 rounded-full border shrink-0', cfg.bg, cfg.color, cfg.border)}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{acc.account_title} · {acc.account_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button onClick={() => openEdit(acc)}
                        className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-md hover:bg-white/5">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(acc.id)} disabled={deletingId === acc.id}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-md hover:bg-red-500/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && accounts.length === 0 && !showForm && (
            <div className="text-center py-4">
              <CreditCard className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No payment accounts yet</p>
              <p className="text-xs text-gray-600 mt-0.5">Add an account so guests can pay for tickets</p>
            </div>
          )}

          {/* Add/Edit form */}
          {showForm ? (
            <div className="border border-white/10 rounded-xl p-4 space-y-4 bg-brand-charcoal-light">
              <p className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {editingId ? 'Edit Account' : 'Add Payment Account'}
              </p>

              {/* Account type selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ACCOUNT_TYPES.map(t => (
                  <button key={t.value} type="button"
                    onClick={() => update('account_type', t.value)}
                    className={clsx(
                      'flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-all',
                      form.account_type === t.value
                        ? `${t.bg} ${t.border} ${t.color}`
                        : 'border-white/10 text-gray-500 hover:border-white/20'
                    )}>
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Label <span className="text-gray-600">(for your reference)</span></label>
                  <input type="text" className="input" placeholder="e.g. JazzCash Business, HBL Main"
                    value={form.label} onChange={e => update('label', e.target.value)} />
                </div>
                <div>
                  <label className="label">Account Title *</label>
                  <input type="text" className="input" placeholder="Muhammad Wasif"
                    value={form.account_title} onChange={e => update('account_title', e.target.value)} />
                </div>
                <div>
                  <label className="label">Account / Mobile Number *</label>
                  <input type="text" className="input" placeholder="03001234567"
                    value={form.account_number} onChange={e => update('account_number', e.target.value)} />
                </div>
                {form.account_type === 'bank' && (
                  <>
                    <div>
                      <label className="label">Bank Name</label>
                      <input type="text" className="input" placeholder="HBL, Meezan, UBL..."
                        value={form.bank_name} onChange={e => update('bank_name', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">IBAN <span className="text-gray-600">(optional)</span></label>
                      <input type="text" className="input font-mono text-xs" placeholder="PK36SCBL0000001123456702"
                        value={form.iban} onChange={e => update('iban', e.target.value.toUpperCase())} />
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <label className="label">Instructions <span className="text-gray-600">(shown to guest)</span></label>
                  <textarea className="input resize-none min-h-16 text-sm"
                    placeholder="e.g. Send payment to this number and upload screenshot below"
                    value={form.instructions} onChange={e => update('instructions', e.target.value)} />
                </div>
              </div>

              {saveError && (
                <p className="text-xs text-orange-400 py-2 px-3 rounded-lg bg-orange-500/8 border border-orange-500/20">
                  {saveError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={cancelForm} className="btn-secondary">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Saving...' : <><Check className="w-4 h-4" /> {editingId ? 'Update' : 'Save Account'}</>}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={openAdd}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-white/15 text-sm text-gray-400 hover:text-white hover:border-white/30 transition-all">
              <Plus className="w-4 h-4" />
              Add Payment Account
            </button>
          )}
        </div>
      )}
    </div>
  )
}

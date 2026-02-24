'use client'

import { useState } from 'react'
import { CreditCard, Check, Building2, Smartphone, Plus, ExternalLink } from 'lucide-react'
import { setEventPaymentAccounts } from '@/app/actions/paymentAccountActions'
import type { PaymentAccount } from '@/app/actions/paymentAccountActions'
import clsx from 'clsx'

const accountTypeColor = (type: string) => {
  if (type === 'bank') return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  if (type === 'jazzcash') return 'text-red-400 bg-red-500/10 border-red-500/20'
  if (type === 'easypaisa') return 'text-green-400 bg-green-500/10 border-green-500/20'
  return 'text-gray-400 bg-white/5 border-white/10'
}

const accountTypeIcon = (type: string) => {
  if (type === 'bank') return Building2
  return Smartphone
}

export default function EventPaymentSetup({
  eventId,
  ticketPrice,
  allAccounts,
  linkedAccountIds: initialLinked,
}: {
  eventId: string
  ticketPrice: number
  allAccounts: PaymentAccount[]
  linkedAccountIds: string[]
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialLinked))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await setEventPaymentAccounts(eventId, Array.from(selected))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const isPaid = ticketPrice > 0

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
          <CreditCard className="w-4 h-4 text-yellow-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Payment Collection
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {isPaid
              ? `₨${ticketPrice.toLocaleString()} ticket — select accounts guests can pay to`
              : 'Free event — no payment collection needed'}
          </p>
        </div>
      </div>

      {!isPaid ? (
        <div className="text-xs text-gray-500 bg-white/5 rounded-lg px-4 py-3">
          Since this event is free, guests will be registered automatically (open) or approved by you (EOI) with no payment step.
        </div>
      ) : allAccounts.length === 0 ? (
        <div className="text-center py-6 space-y-2">
          <CreditCard className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="text-sm text-gray-400">No payment accounts saved yet</p>
          <a href="/dashboard/settings" className="inline-flex items-center gap-1.5 text-xs text-brand-blue hover:text-white transition-colors">
            <Plus className="w-3 h-3" /> Add accounts in Settings
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {allAccounts.map(acc => {
              const Icon = accountTypeIcon(acc.account_type)
              const colorClass = accountTypeColor(acc.account_type)
              const isSelected = selected.has(acc.id)
              return (
                <button key={acc.id} type="button" onClick={() => toggle(acc.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                    isSelected
                      ? 'border-[#1E5EFF] bg-[#1E5EFF08]'
                      : 'border-white/10 hover:border-white/20 bg-brand-charcoal-light'
                  )}>
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border', colorClass)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{acc.label}</p>
                    <p className="text-xs text-gray-500">{acc.account_title} · {acc.account_number}</p>
                  </div>
                  <div className={clsx(
                    'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all',
                    isSelected ? 'bg-[#1E5EFF] border-[#1E5EFF]' : 'border-white/20'
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              )
            })}
          </div>

          {selected.size === 0 && (
            <p className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              ⚠️ No payment accounts selected — guests won't see payment details.
            </p>
          )}

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saved ? <><Check className="w-4 h-4" /> Saved</> : saving ? 'Saving...' : <><Check className="w-4 h-4" /> Save Payment Setup</>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
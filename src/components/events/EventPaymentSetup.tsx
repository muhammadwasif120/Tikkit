'use client'

import { useState } from 'react'
import { CreditCard, Check, Building2, Smartphone, Plus, ExternalLink } from 'lucide-react'
import { setEventPaymentAccounts } from '@/app/actions/paymentAccountActions'
import type { PaymentAccount } from '@/app/actions/paymentAccountActions'
import clsx from 'clsx'

/* ─── Helpers ─── */
const accountTypeColor = (type: string) => {
  if (type === 'bank')      return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  if (type === 'jazzcash')  return 'text-red-400 bg-red-500/10 border-red-500/20'
  if (type === 'easypaisa') return 'text-green-400 bg-green-500/10 border-green-500/20'
  return 'text-[var(--mist-400)] bg-[var(--overlay-2)] border-[var(--guest-border)]'
}
const accountTypeIcon = (type: string) => (type === 'bank' ? Building2 : Smartphone)

/* ─── Toggle ─── */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${on ? 'bg-[var(--brand-blue)]' : 'bg-[var(--overlay-3)]'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

/* ─── Component ─── */
export default function EventPaymentSetup({
  eventId,
  allAccounts,
  linkedAccountIds: initialLinked,
}: {
  eventId: string
  allAccounts: PaymentAccount[]
  linkedAccountIds: string[]
}) {
  // Default toggle ON if there are already linked accounts
  const [collectPayment, setCollectPayment] = useState(initialLinked.length > 0)
  const [selected, setSelected] = useState<Set<string>>(new Set(initialLinked))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const toggleAccount = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSaved(false)
  }

  const handleCollectToggle = () => {
    const newVal = !collectPayment
    setCollectPayment(newVal)
    if (!newVal) setSelected(new Set())
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      await setEventPaymentAccounts(eventId, collectPayment ? Array.from(selected) : [])
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError('Something went wrong. Please try again.')
    }
    setSaving(false)
  }



  return (
    <div className="card space-y-4">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] text-sm">
              Payment Collection
            </h3>
            <p className="text-xs text-[var(--mist-400)] mt-0.5">
              {collectPayment
                ? 'Guests will see your payment details at checkout'
                : 'Free event or payment handled externally'}
            </p>
          </div>
        </div>
        <Toggle on={collectPayment} onToggle={handleCollectToggle} />
      </div>

      {!collectPayment ? (
        <div className="text-xs text-[var(--mist-400)] bg-[var(--overlay-2)] rounded-lg px-4 py-3">
          In-app payment is disabled. Guests won&apos;t see any payment details. Toggle on to collect payments through Tikkit.
        </div>
      ) : allAccounts.length === 0 ? (
        <div className="text-center py-6 space-y-2">
          <CreditCard className="w-8 h-8 text-[var(--mist-500)] mx-auto" />
          <p className="text-sm text-[var(--mist-400)]">No payment accounts saved yet</p>
          <a href="/dashboard/settings"
            className="inline-flex items-center gap-1.5 text-xs text-brand-blue hover:text-[var(--text-primary)] transition-colors">
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
                <button key={acc.id} type="button" onClick={() => toggleAccount(acc.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                    isSelected
                      ? 'border-[var(--brand-blue)] bg-[rgba(0,229,255,0.05)]'
                      : 'border-[var(--guest-border)] hover:border-[var(--guest-border-hover)] bg-brand-charcoal-light'
                  )}>
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border', colorClass)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{acc.label}</p>
                    <p className="text-xs text-[var(--mist-400)]">{acc.account_title} · {acc.account_number}</p>
                  </div>
                  <div className={clsx(
                    'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all',
                    isSelected ? 'bg-[var(--brand-blue)] border-[var(--brand-blue)]' : 'border-[var(--guest-border-hover)]'
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-[var(--text-primary)]" />}
                  </div>
                </button>
              )
            })}
          </div>

          {selected.size === 0 && (
            <p className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              ⚠️ No accounts selected — guests won&apos;t see payment details.
            </p>
          )}

          {saveError && (
            <p className="text-xs text-orange-400 px-3 py-2 bg-orange-500/8 border border-orange-500/20 rounded-lg">{saveError}</p>
          )}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className={clsx('btn-primary', saved && 'bg-green-600 hover:bg-green-700 border-green-600')}>
              {saved
                ? <><Check className="w-4 h-4" /> Saved</>
                : saving ? 'Saving…'
                : <><Check className="w-4 h-4" /> Save Payment Setup</>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

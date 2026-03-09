'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Calendar, MapPin, Users, Lock, Eye, Wallet, Ticket,
  Star, Tag, CreditCard, Building2, Smartphone, ExternalLink, Check,
} from 'lucide-react'
import Link from 'next/link'
import type { PaymentAccount } from '@/app/actions/paymentAccountActions'
import { setEventPaymentAccounts } from '@/app/actions/paymentAccountActions'

/* ─── Ticket tier state ─── */
type TierKey = 'standard' | 'vip' | 'discounted'
type Tier = {
  enabled: boolean
  price: string
  quantity: string
  discountType: 'percentage' | 'fixed'
  discountValue: string
}

const DEFAULT_TIERS: Record<TierKey, Tier> = {
  standard:   { enabled: true,  price: '', quantity: '', discountType: 'percentage', discountValue: '' },
  vip:        { enabled: false, price: '', quantity: '', discountType: 'percentage', discountValue: '' },
  discounted: { enabled: false, price: '', quantity: '', discountType: 'percentage', discountValue: '' },
}

function computeFinalPrice(tier: Tier): number | null {
  const orig = parseFloat(tier.price)
  const dval = parseFloat(tier.discountValue)
  if (isNaN(orig) || isNaN(dval)) return null
  return Math.max(0, tier.discountType === 'percentage'
    ? orig - (orig * dval / 100)
    : orig - dval)
}

/* ─── Toggle ─── */
function Toggle({ on, onToggle, color = 'blue' }: { on: boolean; onToggle: () => void; color?: string }) {
  const bg = on
    ? color === 'yellow' ? 'bg-[#FFC745]'
    : color === 'green'  ? 'bg-green-500'
    : 'bg-[#1E5EFF]'
    : 'bg-white/10'
  return (
    <button type="button" onClick={onToggle}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${bg}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

/* ─── Page ─── */
export default function NewEventPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    venue_name: '',
    venue_address: '',
    date_start: '',
    date_end: '',
    capacity: '',
    is_private: false,
    secret_venue: false,
    male_ratio: '50',
    female_ratio: '50',
    budget: '',
    registration_mode: 'invite_only',
    require_id_verification: false,
    require_reference_code: false,
    reference_code: '',
  })

  const [tiers, setTiers] = useState<Record<TierKey, Tier>>(DEFAULT_TIERS)

  // Payment accounts
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([])
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set())

  // Load organizer's payment accounts
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('payment_accounts')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false })
      setPaymentAccounts(data ?? [])
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const update = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const updateTier = (key: TierKey, field: keyof Tier, value: string | boolean) =>
    setTiers(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))

  /* ─── Submit ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    // 1. Create the event
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .insert({
        organizer_id:            user.id,
        title:                   form.title,
        description:             form.description || null,
        venue_name:              form.venue_name || null,
        venue_address:           form.venue_address || null,
        date_start:              form.date_start || null,
        date_end:                form.date_end || null,
        capacity:                parseInt(form.capacity) || 0,
        is_private:              form.is_private,
        secret_venue:            form.secret_venue,
        male_ratio:              parseInt(form.male_ratio) || 50,
        female_ratio:            parseInt(form.female_ratio) || 50,
        budget:                  parseFloat(form.budget) || 0,
        registration_mode:       form.registration_mode,
        require_id_verification: form.require_id_verification,
        require_reference_code:  form.require_reference_code,
        reference_code:          form.reference_code || null,
        status:                  'draft',
      })
      .select()
      .single()

    if (eventErr) { setError(eventErr.message); setLoading(false); return }

    // 2. Insert enabled ticket tiers
    const inserts: object[] = []

    if (tiers.standard.enabled) {
      inserts.push({
        event_id: event.id,
        name:     'Standard',
        price:    parseFloat(tiers.standard.price) || 0,
        quantity: parseInt(tiers.standard.quantity) || parseInt(form.capacity) || 0,
        is_vip:   false,
      })
    }

    if (tiers.vip.enabled) {
      inserts.push({
        event_id: event.id,
        name:     'VIP',
        price:    parseFloat(tiers.vip.price) || 0,
        quantity: parseInt(tiers.vip.quantity) || 0,
        is_vip:   true,
      })
    }

    if (tiers.discounted.enabled) {
      const orig  = parseFloat(tiers.discounted.price) || 0
      const dval  = parseFloat(tiers.discounted.discountValue) || 0
      const final = Math.max(0, tiers.discounted.discountType === 'percentage'
        ? orig - (orig * dval / 100)
        : orig - dval)
      inserts.push({
        event_id:       event.id,
        name:           'Discounted',
        price:          final,
        original_price: orig,
        discount_type:  tiers.discounted.discountType,
        discount_value: dval,
        quantity:       parseInt(tiers.discounted.quantity) || 0,
        is_vip:         false,
      })
    }

    if (inserts.length > 0) {
      const { error: tiersErr } = await supabase.from('ticket_types').insert(inserts)
      if (tiersErr) {
        setError('Event created but ticket tiers failed to save: ' + tiersErr.message)
        setLoading(false)
        return
      }
    }

    // Link selected payment accounts to the event
    if (selectedAccountIds.size > 0) {
      await setEventPaymentAccounts(event.id, Array.from(selectedAccountIds))
    }

    router.push('/dashboard/events')
    router.refresh()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/events" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
            Create Event
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">Set up a new event</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Basic Info ── */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1E5EFF]" /> Event Details
          </h3>

          <div>
            <label className="label">Event Title *</label>
            <input type="text" className="input" placeholder="Summer Rooftop Party"
              value={form.title} onChange={e => update('title', e.target.value)} required />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-20 resize-none" placeholder="What's this event about?"
              value={form.description} onChange={e => update('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date & Time</label>
              <input type="datetime-local" className="input"
                value={form.date_start} onChange={e => update('date_start', e.target.value)} />
            </div>
            <div>
              <label className="label">End Date & Time</label>
              <input type="datetime-local" className="input"
                value={form.date_end} onChange={e => update('date_end', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Venue ── */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1E5EFF]" /> Venue
          </h3>

          <div>
            <label className="label">Venue Name</label>
            <input type="text" className="input" placeholder="The Grand Hall"
              value={form.venue_name} onChange={e => update('venue_name', e.target.value)} />
          </div>

          <div>
            <label className="label">Venue Address</label>
            <input type="text" className="input" placeholder="123 Main St, Karachi"
              value={form.venue_address} onChange={e => update('venue_address', e.target.value)} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
            <div>
              <p className="text-sm font-medium text-white flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" /> Secret Venue
              </p>
              <p className="text-xs text-gray-500">Hide address until confirmed guests receive it</p>
            </div>
            <Toggle on={form.secret_venue} onToggle={() => update('secret_venue', !form.secret_venue)} />
          </div>
        </div>

        {/* ── Capacity & Demographics ── */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1E5EFF]" /> Capacity & Demographics
          </h3>

          <div>
            <label className="label">Total Capacity *</label>
            <input type="number" className="input" placeholder="200" min="1"
              value={form.capacity} onChange={e => update('capacity', e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Male Ratio (%)</label>
              <input type="number" className="input" min="0" max="100" value={form.male_ratio}
                onChange={e => { update('male_ratio', e.target.value); update('female_ratio', String(100 - parseInt(e.target.value || '0'))) }} />
            </div>
            <div>
              <label className="label">Female Ratio (%)</label>
              <input type="number" className="input" min="0" max="100" value={form.female_ratio}
                onChange={e => { update('female_ratio', e.target.value); update('male_ratio', String(100 - parseInt(e.target.value || '0'))) }} />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
            <div>
              <p className="text-sm font-medium text-white flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" /> Private Event
              </p>
              <p className="text-xs text-gray-500">Only invited guests can see this event</p>
            </div>
            <Toggle on={form.is_private} onToggle={() => update('is_private', !form.is_private)} />
          </div>
        </div>

        {/* ── Ticket Tiers ── */}
        <div className="card space-y-3">
          <div>
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#FFC745]" /> Ticket Tiers
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Enable the tiers you want to offer. Each tier can have its own price and quantity.
            </p>
          </div>

          {/* Standard */}
          <TierCard
            label="Standard"
            description="General admission"
            dot="bg-[#1E5EFF]"
            icon={<Ticket className="w-3.5 h-3.5 text-[#1E5EFF]" />}
            enabled={tiers.standard.enabled}
            toggleColor="blue"
            onToggle={() => updateTier('standard', 'enabled', !tiers.standard.enabled)}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Price (PKR)</label>
                <PriceInput
                  value={tiers.standard.price}
                  onChange={v => updateTier('standard', 'price', v)}
                  placeholder="0"
                />
                <p className="text-xs text-gray-600 mt-1">Leave 0 for free entry</p>
              </div>
              <div>
                <label className="label">Available Spots</label>
                <input type="number" className="input" min="0"
                  placeholder={form.capacity || '100'}
                  value={tiers.standard.quantity}
                  onChange={e => updateTier('standard', 'quantity', e.target.value)} />
              </div>
            </div>
          </TierCard>

          {/* VIP */}
          <TierCard
            label="VIP"
            description="Premium access with exclusive perks"
            dot="bg-[#FFC745]"
            icon={<Star className="w-3.5 h-3.5 text-[#FFC745]" />}
            enabled={tiers.vip.enabled}
            toggleColor="yellow"
            onToggle={() => updateTier('vip', 'enabled', !tiers.vip.enabled)}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">VIP Price (PKR)</label>
                <PriceInput
                  value={tiers.vip.price}
                  onChange={v => updateTier('vip', 'price', v)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label">VIP Spots</label>
                <input type="number" className="input" min="0" placeholder="20"
                  value={tiers.vip.quantity}
                  onChange={e => updateTier('vip', 'quantity', e.target.value)} />
              </div>
            </div>
          </TierCard>

          {/* Discounted */}
          <TierCard
            label="Discounted"
            description="Reduced price for specific guests"
            dot="bg-green-400"
            icon={<Tag className="w-3.5 h-3.5 text-green-400" />}
            enabled={tiers.discounted.enabled}
            toggleColor="green"
            onToggle={() => updateTier('discounted', 'enabled', !tiers.discounted.enabled)}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Original Price (PKR)</label>
                  <PriceInput
                    value={tiers.discounted.price}
                    onChange={v => updateTier('discounted', 'price', v)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label">Available Spots</label>
                  <input type="number" className="input" min="0" placeholder="50"
                    value={tiers.discounted.quantity}
                    onChange={e => updateTier('discounted', 'quantity', e.target.value)} />
                </div>
              </div>

              {/* Discount type + value */}
              <div>
                <label className="label">Discount</label>
                <div className="flex gap-2">
                  {/* Toggle buttons */}
                  <div className="flex rounded-lg border border-white/10 overflow-hidden shrink-0">
                    <button type="button"
                      onClick={() => updateTier('discounted', 'discountType', 'percentage')}
                      className={`px-3 py-2 text-xs font-semibold transition-colors ${
                        tiers.discounted.discountType === 'percentage'
                          ? 'bg-green-500 text-white'
                          : 'text-gray-400 hover:text-white bg-brand-charcoal-light'
                      }`}>
                      %
                    </button>
                    <button type="button"
                      onClick={() => updateTier('discounted', 'discountType', 'fixed')}
                      className={`px-3 py-2 text-xs font-semibold transition-colors ${
                        tiers.discounted.discountType === 'fixed'
                          ? 'bg-green-500 text-white'
                          : 'text-gray-400 hover:text-white bg-brand-charcoal-light'
                      }`}>
                      ₨ Fixed
                    </button>
                  </div>
                  <input type="number" className="input flex-1" min="0"
                    placeholder={tiers.discounted.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                    value={tiers.discounted.discountValue}
                    onChange={e => updateTier('discounted', 'discountValue', e.target.value)} />
                </div>
              </div>

              {/* Computed final price */}
              {(() => {
                const final = computeFinalPrice(tiers.discounted)
                if (final === null) return null
                const orig = parseFloat(tiers.discounted.price)
                const saving = orig - final
                return (
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs">
                    <div>
                      <p className="text-gray-400">Final discounted price</p>
                      {saving > 0 && (
                        <p className="text-green-500 mt-0.5">
                          Guests save ₨{saving.toLocaleString()}
                          {tiers.discounted.discountType === 'percentage' && ` (${tiers.discounted.discountValue}% off)`}
                        </p>
                      )}
                    </div>
                    <span className="text-green-400 font-bold text-sm">
                      {final === 0 ? 'Free' : `₨${final.toLocaleString()}`}
                    </span>
                  </div>
                )
              })()}
            </div>
          </TierCard>
        </div>

        {/* ── Payment Accounts ── */}
        <PaymentAccountsSelector
          accounts={paymentAccounts}
          selected={selectedAccountIds}
          onToggle={(id) => setSelectedAccountIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
          })}
          hasPaidTiers={
            (tiers.standard.enabled && parseFloat(tiers.standard.price || '0') > 0) ||
            (tiers.vip.enabled && parseFloat(tiers.vip.price || '0') > 0) ||
            (tiers.discounted.enabled && (() => {
              const orig = parseFloat(tiers.discounted.price || '0')
              const dval = parseFloat(tiers.discounted.discountValue || '0')
              const final = tiers.discounted.discountType === 'percentage'
                ? Math.max(0, orig - orig * dval / 100)
                : Math.max(0, orig - dval)
              return final > 0
            })())
          }
        />

        {/* ── Budget ── */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-400" /> Event Budget
          </h3>
          <div>
            <label className="label">Total Budget (PKR)</label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="number" className="input pl-9" placeholder="0" min="0"
                value={form.budget} onChange={e => update('budget', e.target.value)} />
            </div>
            <p className="text-xs text-gray-600 mt-1">Total cost to run this event</p>
          </div>
        </div>

        {/* ── Registration Mode ── */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1E5EFF]" /> Registration Mode
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'invite_only',          label: 'Invite Only',            desc: 'Private, guests added manually' },
              { value: 'open',                  label: 'Open',                   desc: 'Anyone can register via link' },
              { value: 'expression_of_interest',label: 'Expression of Interest', desc: 'Organizer approves each request' },
            ] as const).map(opt => (
              <button key={opt.value} type="button"
                onClick={() => update('registration_mode', opt.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  form.registration_mode === opt.value
                    ? 'border-[#1E5EFF] bg-[#1E5EFF15] text-white'
                    : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}>
                <p className="text-xs font-semibold">{opt.label}</p>
                <p className="text-[10px] mt-0.5 opacity-70">{opt.desc}</p>
              </button>
            ))}
          </div>

          {form.registration_mode !== 'invite_only' && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">Require ID Verification</p>
                  <p className="text-xs text-gray-500">Guests must show ID at the door</p>
                </div>
                <Toggle
                  on={form.require_id_verification}
                  onToggle={() => update('require_id_verification', !form.require_id_verification)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">Require Reference Code</p>
                  <p className="text-xs text-gray-500">Guests need a code to complete registration</p>
                </div>
                <Toggle
                  on={form.require_reference_code}
                  onToggle={() => update('require_reference_code', !form.require_reference_code)}
                />
              </div>

              {form.require_reference_code && (
                <div>
                  <label className="label">Reference Code</label>
                  <input type="text" className="input font-mono uppercase tracking-widest"
                    placeholder="e.g. TIKKIT2025"
                    value={form.reference_code}
                    onChange={e => update('reference_code', e.target.value.toUpperCase())} />
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 justify-end">
          <Link href="/dashboard/events" className="btn-secondary">Cancel</Link>
          <button
            type="submit"
            disabled={loading || !form.title || !form.capacity}
            className="btn-primary"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ─── Payment accounts selector ─── */

const accountTypeColor = (type: string) => {
  if (type === 'bank')      return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  if (type === 'jazzcash')  return 'text-red-400 bg-red-500/10 border-red-500/20'
  if (type === 'easypaisa') return 'text-green-400 bg-green-500/10 border-green-500/20'
  return 'text-gray-400 bg-white/5 border-white/10'
}

const accountTypeIcon = (type: string) => (type === 'bank' ? Building2 : Smartphone)

function PaymentAccountsSelector({
  accounts,
  selected,
  onToggle,
  hasPaidTiers,
}: {
  accounts: PaymentAccount[]
  selected: Set<string>
  onToggle: (id: string) => void
  hasPaidTiers: boolean
}) {
  // Only show this section when at least one tier has a real price
  if (!hasPaidTiers) return null

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-yellow-400" /> Payment Collection
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Select which accounts guests will send payment to
        </p>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-5 space-y-2">
          <CreditCard className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="text-sm text-gray-400">No payment accounts saved yet</p>
          <Link
            href="/dashboard/settings"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs text-[#1E5EFF] hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Add accounts in Settings
          </Link>
          <p className="text-xs text-gray-600">You can also link accounts after creating the event</p>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map(acc => {
            const Icon = accountTypeIcon(acc.account_type)
            const colorClass = accountTypeColor(acc.account_type)
            const isSelected = selected.has(acc.id)
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => onToggle(acc.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-[#1E5EFF] bg-[#1E5EFF08]'
                    : 'border-white/10 hover:border-white/20 bg-brand-charcoal-light'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{acc.label}</p>
                  <p className="text-xs text-gray-500">{acc.account_title} · {acc.account_number}</p>
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                  isSelected ? 'bg-[#1E5EFF] border-[#1E5EFF]' : 'border-white/20'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            )
          })}

          {selected.size === 0 && (
            <p className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              ⚠️ No accounts selected — you can link them later from the event page
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Shared sub-components ─── */

function PriceInput({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₨</span>
      <input
        type="number" className="input pl-7" min="0"
        placeholder={placeholder ?? '0'}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function TierCard({
  label, description, dot, enabled, toggleColor, onToggle, children,
}: {
  label: string
  description: string
  dot: string
  icon?: React.ReactNode
  enabled: boolean
  toggleColor: 'blue' | 'yellow' | 'green'
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      enabled ? 'border-white/15' : 'border-white/8'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 ${
        enabled ? 'bg-brand-charcoal-light' : 'bg-brand-charcoal-light/50'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
          <div>
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <Toggle on={enabled} onToggle={onToggle} color={toggleColor} />
      </div>

      {/* Body */}
      {enabled && (
        <div className="px-4 py-4 border-t border-white/5 space-y-3 bg-white/[0.01]">
          {children}
        </div>
      )}
    </div>
  )
}

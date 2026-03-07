'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronDown, Star } from 'lucide-react'

type TicketType = {
  id: string
  name: string
  price: number
  original_price: number | null
  discount_type: string | null
  discount_value: number | null
  quantity: number
  quantity_sold: number
  is_vip: boolean
}

type Event = {
  id: string
  title: string
  registration_mode: string
  require_id_verification: boolean
  require_reference_code: boolean
}

export default function PublicRegistrationForm({
  event,
  ticketTypes,
}: {
  event: Event
  ticketTypes: TicketType[]
}) {
  const supabase = createClient()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', gender: '' })
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string>(
    ticketTypes.length === 1 ? ticketTypes[0].id : ''
  )
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOpen = event.registration_mode === 'open'
  const hasTicketTypes = ticketTypes.length > 0

  // The selected ticket type object (if any)
  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketTypeId) ?? null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate ticket type selection
    if (hasTicketTypes && !selectedTicketTypeId) {
      setError('Please select a ticket type.')
      setLoading(false)
      return
    }

    // Check for duplicate registration
    const { data: existing } = await supabase
      .from('public_registrations')
      .select('id, status')
      .eq('event_id', event.id)
      .eq('email', form.email)
      .single()

    if (existing) {
      setError(existing.status === 'rejected'
        ? 'Your registration was not approved for this event.'
        : 'You have already registered for this event.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('public_registrations')
      .insert({
        event_id:       event.id,
        ticket_type_id: selectedTicketTypeId || null,
        full_name:      form.full_name,
        email:          form.email,
        phone:          form.phone || null,
        gender:         form.gender || null,
        status:         isOpen ? 'approved' : 'pending',
      })

    if (insertError) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    // If open registration, also create guest directly
    if (isOpen) {
      await supabase.from('guests').insert({
        event_id:       event.id,
        ticket_type_id: selectedTicketTypeId || null,
        full_name:      form.full_name,
        email:          form.email,
        phone:          form.phone || null,
        gender:         form.gender || null,
        status:         'registered',
        is_vip:         selectedTicket?.is_vip ?? false,
      })
    }

    // Notify the organizer via RPC (works without an authenticated session)
    await supabase.rpc('notify_guest_signup', {
      p_event_id:    event.id,
      p_guest_name:  form.full_name,
      p_event_title: event.title,
      p_is_interest: !isOpen,
    })

    setDone(true)
    setLoading(false)
  }

  /* ─── Done state ─── */
  if (done) {
    return (
      <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 text-green-400" />
        </div>
        <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
          {isOpen ? "You're registered!" : 'Interest submitted!'}
        </h2>
        {selectedTicket && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
            {selectedTicket.is_vip && <Star className="w-3 h-3 text-[#FFC745]" />}
            {selectedTicket.name} Ticket
            {selectedTicket.price > 0 && ` · ₨${selectedTicket.price.toLocaleString()}`}
          </div>
        )}
        <p className="text-gray-400 text-sm">
          {isOpen
            ? `You're confirmed for ${event.title}. Check your email for next steps.`
            : `Your interest has been received. You'll get an email if you're approved.`}
        </p>
        {isOpen && selectedTicket && selectedTicket.price > 0 && (
          <p className="text-xs text-gray-500 bg-white/5 rounded-lg px-4 py-2">
            Payment instructions will be sent to your email.
          </p>
        )}
      </div>
    )
  }

  /* ─── Form ─── */
  return (
    <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-6 space-y-5">
      <div>
        <h2 className="text-white font-semibold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
          {isOpen ? 'Register for this event' : 'Express your interest'}
        </h2>
        <p className="text-gray-500 text-xs mt-0.5">
          {isOpen
            ? 'Fill in your details to secure your spot.'
            : 'The organizer will review and get back to you.'}
        </p>
      </div>

      {/* ── Ticket tier selection ── */}
      {hasTicketTypes && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Select Ticket Type {ticketTypes.length > 1 ? '*' : ''}
          </label>
          <div className="space-y-2">
            {ticketTypes.map(tt => {
              const spotsLeft = tt.quantity - tt.quantity_sold
              const isSoldOut = spotsLeft <= 0
              const isSelected = selectedTicketTypeId === tt.id
              return (
                <button
                  key={tt.id}
                  type="button"
                  disabled={isSoldOut}
                  onClick={() => setSelectedTicketTypeId(tt.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-[#1E5EFF] bg-[#1E5EFF08] ring-1 ring-[#1E5EFF]/30'
                      : isSoldOut
                        ? 'border-white/5 opacity-40 cursor-not-allowed'
                        : 'border-white/10 hover:border-white/20 bg-[#0F1117]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white">{tt.name}</p>
                        {tt.is_vip && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-[#FFC745]/15 text-[#FFC745] font-semibold border border-[#FFC745]/20">
                            <Star className="w-2.5 h-2.5" /> VIP
                          </span>
                        )}
                      </div>
                      {/* Discount line */}
                      {tt.original_price && tt.discount_type && (
                        <p className="text-[11px] text-gray-500">
                          <span className="line-through">₨{tt.original_price.toLocaleString()}</span>
                          {' '}
                          <span className="text-green-400">
                            {tt.discount_type === 'percentage'
                              ? `${tt.discount_value}% off`
                              : `₨${tt.discount_value?.toLocaleString()} off`}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-white">
                        {tt.price === 0 ? 'Free' : `₨${tt.price.toLocaleString()}`}
                      </p>
                      <p className={`text-[10px] mt-0.5 ${isSoldOut ? 'text-red-400' : 'text-gray-500'}`}>
                        {isSoldOut ? 'Sold out' : `${spotsLeft} left`}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="ml-2 w-5 h-5 rounded-full bg-[#1E5EFF] flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name *</label>
          <input type="text" required placeholder="Your full name"
            className="w-full bg-[#0F1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#1E5EFF] transition-colors"
            value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address *</label>
          <input type="email" required placeholder="you@example.com"
            className="w-full bg-[#0F1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#1E5EFF] transition-colors"
            value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone Number</label>
          <input type="tel" placeholder="+92 300 0000000"
            className="w-full bg-[#0F1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#1E5EFF] transition-colors"
            value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Gender</label>
          <div className="relative">
            <select
              className="w-full bg-[#0F1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-[#1E5EFF] transition-colors pr-10"
              value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Price summary */}
        {selectedTicket && selectedTicket.price > 0 && (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#1E5EFF08] border border-[#1E5EFF]/20 text-xs">
            <span className="text-gray-400">
              {selectedTicket.name} ticket — payment details will be sent to your email
            </span>
            <span className="text-white font-bold">₨{selectedTicket.price.toLocaleString()}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (hasTicketTypes && !selectedTicketTypeId)}
          className="w-full bg-[#1E5EFF] hover:bg-[#1E5EFF]/90 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Submitting...' : isOpen ? 'Register Now' : 'Submit Interest'}
        </button>
      </form>
    </div>
  )
}

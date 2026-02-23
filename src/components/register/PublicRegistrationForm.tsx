'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronDown } from 'lucide-react'

type Event = {
  id: string
  title: string
  registration_mode: string
  require_id_verification: boolean
  require_reference_code: boolean
}

export default function PublicRegistrationForm({ event }: { event: Event }) {
  const supabase = createClient()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', gender: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOpen = event.registration_mode === 'open'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

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
        event_id: event.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        gender: form.gender || null,
        status: isOpen ? 'approved' : 'pending',
      })

    if (insertError) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    // If open registration, also create guest directly
    if (isOpen) {
      await supabase.from('guests').insert({
        event_id: event.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        gender: form.gender || null,
        status: 'registered',
        is_vip: false,
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

  if (done) {
    return (
      <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 text-green-400" />
        </div>
        <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {isOpen ? "You're registered!" : 'Interest submitted!'}
        </h2>
        <p className="text-gray-400 text-sm">
          {isOpen
            ? `You're confirmed for ${event.title}. Check your email for next steps.`
            : `Your interest has been received. You'll get an email if you're approved.`}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-6 space-y-5">
      <div>
        <h2 className="text-white font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {isOpen ? 'Register for this event' : 'Express your interest'}
        </h2>
        <p className="text-gray-500 text-xs mt-0.5">
          {isOpen ? 'Fill in your details to secure your spot.' : 'The organizer will review and get back to you.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name *</label>
          <input type="text" required placeholder="Muhammad Wasif"
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

        <button type="submit" disabled={loading}
          className="w-full bg-[#1E5EFF] hover:bg-[#1E5EFF]/90 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50">
          {loading ? 'Submitting...' : isOpen ? 'Register Now' : 'Submit Interest'}
        </button>
      </form>
    </div>
  )
}
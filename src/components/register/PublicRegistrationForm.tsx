'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Star, Eye, EyeOff, Lock } from 'lucide-react'
import Link from 'next/link'
import { PAKISTAN_CITIES } from '@/lib/pakistanCities'
import { completeSignupProfile } from '@/app/actions/profileCompletionActions'

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

const inputCls = 'w-full bg-[#0F1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FFC745] transition-colors'

export default function PublicRegistrationForm({
  event,
  ticketTypes,
}: {
  event: Event
  ticketTypes: TicketType[]
}) {
  const supabase = createClient()
  const router = useRouter()

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    dob: '',
    cnic: '',
    referenceCode: '',
    city: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string>(
    ticketTypes.length === 1 ? ticketTypes[0].id : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyExists, setAlreadyExists] = useState(false)

  const isOpen = event.registration_mode === 'open'
  const hasTicketTypes = ticketTypes.length > 0
  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketTypeId) ?? null

  const f = (field: string, val: string) => setForm(p => ({ ...p, [field]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setAlreadyExists(false)

    if (hasTicketTypes && !selectedTicketTypeId) {
      setError('Please select a ticket type.')
      setLoading(false)
      return
    }
    if (!form.full_name.trim() || !form.email.trim() || form.password.length < 8) {
      setError('Please fill in all required fields. Password must be at least 8 characters.')
      setLoading(false)
      return
    }
    if (!form.phone.trim()) { setError('Phone number is required.'); setLoading(false); return }
    if (!form.cnic.trim()) { setError('CNIC is required for identity verification.'); setLoading(false); return }
    if (!form.dob) { setError('Date of birth is required.'); setLoading(false); return }
    if (!form.gender) { setError('Please select a gender.'); setLoading(false); return }
    if (!form.city) { setError('Please select your city.'); setLoading(false); return }

    // Step 1: Create the Tikkit X account
    const { data: authData, error: signUpErr } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: { data: { full_name: form.full_name.trim(), role: 'guest' } },
    })

    if (signUpErr) {
      if (signUpErr.message.toLowerCase().includes('already')) {
        setAlreadyExists(true)
        setError('You already have a Tikkit X account. Please log in to continue with your registration.')
      } else {
        setError(signUpErr.message)
      }
      setLoading(false)
      return
    }

    const user = authData.user
    if (!user) {
      setError('Account creation failed. Please try again.')
      setLoading(false)
      return
    }

    // Step 2: Extend the user profile with security data via the shared,
    // service-role signup-completion action — encrypts the CNIC (this used to
    // be stored in plaintext here) and works even if there's no session yet
    // (e.g. once email confirmation is enabled, signUp() returns no session
    // until it's confirmed). bootstrapUserId lets it proceed regardless.
    const profileRes = await completeSignupProfile({
      phone:    form.phone.trim(),
      idType:   'cnic',
      idNumber: form.cnic.trim(),
      country:  'Pakistan',
      city:     form.city,
      dob:      form.dob,
      gender:   form.gender,
    }, user.id)

    if (profileRes.error) {
      setError('Your account was created, but we couldn\'t save your details. Please sign in and complete your profile.')
      setLoading(false)
      return
    }

    // Step 3: Check for duplicate registration
    const { data: existing } = await supabase
      .from('public_registrations')
      .select('id, status')
      .eq('event_id', event.id)
      .eq('email', form.email.trim().toLowerCase())
      .maybeSingle()

    if (existing) {
      // Account created but already registered — redirect to app
      router.push(`/guest/explore/${event.id}`)
      return
    }

    // Step 4: Register for the event
    const { error: regError } = await supabase.from('public_registrations').insert({
      event_id: event.id,
      ticket_type_id: selectedTicketTypeId || null,
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      gender: form.gender || null,
      status: isOpen ? 'approved' : 'pending',
      reference_code_entered: form.referenceCode || null,
    })

    if (regError) {
      setError('Your account was created, but registration failed. Please sign in and try again from the app.')
      setLoading(false)
      return
    }

    if (isOpen) {
      const { error: guestError } = await supabase.from('guests').insert({
        event_id: event.id,
        ticket_type_id: selectedTicketTypeId || null,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        gender: form.gender || null,
        guest_profile_id: user.id,
        status: 'registered',
        is_vip: selectedTicket?.is_vip ?? false,
      })
      if (guestError) console.error('guests insert error:', guestError.message)
    }

    // Step 5: Notify organizer (non-blocking — not worth failing the
    // registration over a notification not being delivered)
    const { error: notifyError } = await supabase.rpc('notify_guest_signup', {
      p_event_id: event.id,
      p_guest_name: form.full_name.trim(),
      p_event_title: event.title,
      p_is_interest: !isOpen,
    })
    if (notifyError) console.error('notify_guest_signup error:', notifyError.message)

    // Step 6: Redirect into the native app experience
    router.push(`/guest/explore/${event.id}`)
  }

  /* ─── Form ─── */
  return (
    <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-6 space-y-5">
      
      {/* Header */}
      <div>
        <h2 className="text-white font-semibold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
          {isOpen ? 'Register for this event' : 'Express your interest'}
        </h2>
        <p className="text-gray-500 text-xs mt-0.5">
          {isOpen
            ? 'Create your Tikkit X account to secure your spot and manage payment.'
            : 'Create an account so the organizer can reach you when approved.'}
        </p>
      </div>

      {/* Tikkit X branding notice */}
      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-[#FFC745]/8 border border-[#FFC745]/20">
        <Lock className="w-3.5 h-3.5 text-[#FFC745] mt-0.5 shrink-0" />
        <p className="text-[11px] text-[#FFC745] leading-relaxed">
          A free <span className="font-bold">Tikkit X</span> account is required to manage your ticket, upload payment proof, and receive your QR pass securely.
        </p>
      </div>

      {/* Ticket tier selection */}
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
                      ? 'border-[#FFC745] bg-[#FFC74508] ring-1 ring-[#FFC745]/30'
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
                      {tt.original_price && tt.discount_type && (
                        <p className="text-[11px] text-gray-500">
                          <span className="line-through">₨{tt.original_price.toLocaleString()}</span>{' '}
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
                      <div className="ml-2 w-5 h-5 rounded-full bg-[#FFC745] flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Registration + Account Form */}
      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Personal Info */}
        <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest pb-0.5">
          Personal Info
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name *</label>
          <input type="text" required placeholder="Your full name"
            className={inputCls} value={form.full_name}
            onChange={e => f('full_name', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Gender *</label>
            <div className="relative">
              <select required className={inputCls + ' appearance-none pr-8'}
                value={form.gender} onChange={e => f('gender', e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Date of Birth *</label>
            <input type="date" required className={inputCls}
              value={form.dob} onChange={e => f('dob', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone Number *</label>
          <input type="tel" required placeholder="+92 300 0000000"
            className={inputCls} value={form.phone}
            onChange={e => f('phone', e.target.value)} />
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">City *</label>
          <div style={{ position: 'relative' }}>
            <select
              required
              value={form.city}
              onChange={e => f('city', e.target.value)}
              className={inputCls}
              style={{ appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
            >
              <option value="">Select City</option>
              {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">CNIC Number *</label>
          <input type="text" required placeholder="xxxxx-xxxxxxx-x"
            className={inputCls} value={form.cnic}
            onChange={e => f('cnic', e.target.value)} />
          <p className="text-[10px] text-gray-600 mt-1">Complete CNIC verification in settings later to get a Verified badge.</p>
        </div>

        {/* Account Credentials */}
        <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest pb-0.5 pt-2">
          Account Credentials
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address *</label>
          <input type="email" required placeholder="you@example.com"
            className={inputCls} value={form.email}
            onChange={e => f('email', e.target.value)} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Password * <span className="text-gray-600 font-normal">(min 8 chars)</span></label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} required placeholder="Create a password"
              className={inputCls + ' pr-9'} value={form.password}
              onChange={e => f('password', e.target.value)} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {event.require_reference_code && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Reference Code <span className="text-gray-500 font-normal">(optional)</span></label>
            <input type="text" placeholder="Enter code"
              className={inputCls + ' font-mono uppercase tracking-widest'}
              value={form.referenceCode}
              onChange={e => f('referenceCode', e.target.value.toUpperCase())} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
            {alreadyExists && (
              <div className="mt-2">
                <Link href={`/auth/login?redirect=/guest/explore/${event.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFC745] hover:text-[#FFC745]/80 transition-colors">
                  Log in to your Tikkit X account →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Price summary */}
        {selectedTicket && selectedTicket.price > 0 && (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#FFC74508] border border-[#FFC745]/20 text-xs">
            <span className="text-gray-400">
              {selectedTicket.name} — payment uploaded inside the app after sign-up
            </span>
            <span className="text-[#FFC745] font-bold">₨{selectedTicket.price.toLocaleString()}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (hasTicketTypes && !selectedTicketTypeId)}
          className="w-full font-semibold py-3 rounded-lg text-sm transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #FFC745, #f59e0b)', color: '#000' }}
        >
          {loading
            ? 'Creating your account...'
            : isOpen
              ? 'Create Account & Register'
              : 'Create Account & Submit Interest'}
        </button>

        <p className="text-center text-[11px] text-gray-600">
          Already have a Tikkit X account?{' '}
          <Link href={`/auth/login?redirect=/guest/explore/${event.id}`}
            className="text-[#FFC745] hover:text-[#FFC745]/80 font-semibold transition-colors">
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}

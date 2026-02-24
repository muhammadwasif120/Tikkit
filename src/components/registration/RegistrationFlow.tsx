'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Calendar, MapPin, Users, CheckCircle, Upload, X,
  Building2, Smartphone, CreditCard, ArrowRight,
  Clock, XCircle, Ticket,
} from 'lucide-react'
import clsx from 'clsx'

type Event = {
  id: string
  title: string
  description: string | null
  venue_name: string | null
  venue_address: string | null
  date_start: string | null
  ticket_price: number
  capacity: number
  registration_mode: string
  require_id_verification: boolean
  require_reference_code: boolean
  reference_code: string | null
  secret_venue: boolean
  organizer: { full_name: string; company_name: string | null }
}

type PaymentAccount = {
  id: string
  label: string
  account_type: string
  account_title: string
  account_number: string
  bank_name: string | null
  iban: string | null
  instructions: string | null
}

type ExistingRegistration = {
  id: string
  full_name: string
  email: string
  payment_status: string
} | null

const accountTypeIcon = (type: string) => {
  if (type === 'bank') return Building2
  if (type === 'jazzcash' || type === 'easypaisa') return Smartphone
  return CreditCard
}

const accountTypeColor = (type: string) => {
  if (type === 'bank') return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  if (type === 'jazzcash') return 'text-red-400 bg-red-500/10 border-red-500/20'
  if (type === 'easypaisa') return 'text-green-400 bg-green-500/10 border-green-500/20'
  return 'text-gray-400 bg-white/5 border-white/10'
}

export default function RegistrationFlow({
  event,
  isFull,
  isPaid,
  paymentAccounts,
  initialStep,
  existingRegistration,
}: {
  event: Event
  isFull: boolean
  isPaid: boolean
  paymentAccounts: PaymentAccount[]
  initialStep: number
  existingRegistration: ExistingRegistration
}) {
  const supabase = createClient()
  const [step, setStep] = useState(initialStep)

  // Step 1 state
  const [form, setForm] = useState({
    full_name: existingRegistration?.full_name ?? '',
    email: existingRegistration?.email ?? '',
    phone: '',
    referenceCode: '',
  })
  const [step1Loading, setStep1Loading] = useState(false)
  const [step1Error, setStep1Error] = useState<string | null>(null)
  const [registrationId, setRegistrationId] = useState<string | null>(existingRegistration?.id ?? null)

  // Step 2 state
  const [selectedAccountId, setSelectedAccountId] = useState<string>(paymentAccounts[0]?.id ?? '')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [step2Loading, setStep2Loading] = useState(false)
  const [step2Error, setStep2Error] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const isEOI = event.registration_mode === 'expression_of_interest'
  const isOpen = event.registration_mode === 'open'
  const isFree = !isPaid

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScreenshot(file)
    setScreenshotPreview(URL.createObjectURL(file))
  }

  const removeScreenshot = () => {
    setScreenshot(null)
    setScreenshotPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep1Loading(true)
    setStep1Error(null)

    // Reference code check
    if (event.require_reference_code && event.reference_code) {
      if (form.referenceCode.toUpperCase() !== event.reference_code.toUpperCase()) {
        setStep1Error('Invalid reference code.')
        setStep1Loading(false)
        return
      }
    }

    // Determine initial status
    // Free + Open → registered immediately
    // Paid + Open → waitlist (awaiting payment)
    // EOI (free or paid) → pending (awaiting approval)
    const status = isEOI ? 'pending' : (isFree ? 'approved' : 'pending')
    const payment_status = !isPaid ? 'not_required' : 'pending'

    const { data, error } = await supabase
      .from('public_registrations')
      .insert({
        event_id: event.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        status,
        payment_status,
      })
      .select()
      .single()

    if (error) {
      // Check for duplicate
      if (error.code === '23505') {
        setStep1Error('This email is already registered for this event.')
      } else {
        setStep1Error(error.message)
      }
      setStep1Loading(false)
      return
    }

    setRegistrationId(data.id)
    setStep1Loading(false)

    // Free + Open → done (first come first serve, immediately registered)
    if (isFree && isOpen) {
      // Convert to guest
      await supabase.from('guests').insert({
        event_id: event.id,
        full_name: form.full_name,
        email: form.email,
        status: 'registered',
        source: 'public_registration',
        registration_id: data.id,
      })
      setDone(true)
      return
    }

    // Free + EOI → show pending confirmation
    if (isFree && isEOI) {
      setStep(3) // waiting for approval screen
      return
    }

    // Paid (open or EOI already approved) → go to payment step
    setStep(2)
  }

  const handleStep2 = async () => {
    if (!screenshot || !registrationId) return
    setStep2Loading(true)
    setStep2Error(null)

    // Upload screenshot
    const ext = screenshot.name.split('.').pop()
    const path = `${event.id}/${registrationId}-${Date.now()}.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-screenshots')
      .upload(path, screenshot)

    if (uploadError) {
      setStep2Error('Failed to upload screenshot. Please try again.')
      setStep2Loading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('payment-screenshots')
      .getPublicUrl(path)

    // Create payment submission
    const { data: submission, error: subError } = await supabase
      .from('payment_submissions')
      .insert({
        event_id: event.id,
        registration_id: registrationId,
        payment_account_id: selectedAccountId || null,
        screenshot_url: uploadData.path,
        status: 'pending',
      })
      .select()
      .single()

    if (subError) {
      setStep2Error(subError.message)
      setStep2Loading(false)
      return
    }

    // Update registration payment_status to submitted
    await supabase
      .from('public_registrations')
      .update({ payment_status: 'submitted', payment_submission_id: submission.id })
      .eq('id', registrationId)

    setStep2Loading(false)
    setDone(true)
  }

  const organizer = event.organizer
  const displayName = organizer.company_name ?? organizer.full_name

  // ─── Registration Closed ───────────────────────────────────────────────────
  if (isFull) {
    return (
      <PageShell event={event} displayName={displayName}>
        <div className="text-center py-10 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Registrations Closed</h2>
            <p className="text-gray-400 text-sm mt-2">This event has reached its maximum capacity.</p>
            <p className="text-gray-500 text-xs mt-1">Check back later or contact the organizer.</p>
          </div>
        </div>
      </PageShell>
    )
  }

  // ─── Done (free+open confirmed, or payment submitted) ─────────────────────
  if (done) {
    const isPaymentSubmitted = isPaid
    return (
      <PageShell event={event} displayName={displayName}>
        <div className="text-center py-10 space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {isPaymentSubmitted ? 'Payment Submitted!' : "You're registered!"}
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              {isPaymentSubmitted
                ? 'Your payment screenshot has been submitted. The organizer will review and confirm your spot.'
                : `You're confirmed for ${event.title}. Check your email for your QR code.`}
            </p>
          </div>
          {isPaymentSubmitted && (
            <div className="text-xs text-gray-500 bg-white/5 rounded-lg px-4 py-3">
              You'll receive a confirmation email once your payment is verified.
            </div>
          )}
        </div>
      </PageShell>
    )
  }

  // ─── Waiting for EOI approval ─────────────────────────────────────────────
  if (step === 3) {
    return (
      <PageShell event={event} displayName={displayName}>
        <div className="text-center py-10 space-y-4">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Request Submitted
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              Your interest has been noted. The organizer will review your request.
            </p>
            {isPaid && (
              <p className="text-gray-500 text-xs mt-2">
                If approved, you'll receive an email with a payment link to complete your registration.
              </p>
            )}
            {!isPaid && (
              <p className="text-gray-500 text-xs mt-2">
                If approved, you'll receive a confirmation email with your QR code.
              </p>
            )}
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell event={event} displayName={displayName}>
      {/* Step indicator — only show for paid flows */}
      {isPaid && (
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={clsx(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                step >= s ? 'bg-[#1E5EFF] text-white' : 'bg-white/10 text-gray-500'
              )}>
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              <span className={clsx('text-xs', step >= s ? 'text-white' : 'text-gray-500')}>
                {s === 1 ? 'Your Details' : 'Payment'}
              </span>
              {i < 1 && <div className="flex-1 h-px bg-white/10 mx-1 w-8" />}
            </div>
          ))}
        </div>
      )}

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {isEOI ? 'Express Your Interest' : 'Register for this Event'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {isEOI
                ? 'Fill in your details and the organizer will review your request.'
                : isPaid
                  ? "Fill in your details, then complete payment to secure your spot."
                  : "Fill in your details to secure your spot."}
            </p>
          </div>

          {step1Error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {step1Error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="label">Full Name *</label>
              <input type="text" className="input" placeholder="Your full name" required
                value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email Address *</label>
              <input type="email" className="input" placeholder="you@example.com" required
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Phone Number <span className="text-gray-600">(optional)</span></label>
              <input type="tel" className="input" placeholder="+92 300 0000000"
                value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            {event.require_reference_code && (
              <div>
                <label className="label">Reference Code *</label>
                <input type="text" className="input font-mono uppercase tracking-widest" placeholder="Enter code"
                  required value={form.referenceCode}
                  onChange={e => setForm(p => ({ ...p, referenceCode: e.target.value.toUpperCase() }))} />
              </div>
            )}
          </div>

          {isPaid && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#1E5EFF10] border border-[#1E5EFF20] text-xs text-blue-300">
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              Ticket price: <span className="font-bold">₨{event.ticket_price.toLocaleString()}</span>
              — payment details on the next step
            </div>
          )}

          <button type="submit" disabled={step1Loading} className="w-full btn-primary justify-center py-3">
            {step1Loading ? 'Submitting...' : (
              <>
                {isEOI ? 'Submit Interest' : isPaid ? 'Continue to Payment' : 'Register Now'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* ── STEP 2 — Payment ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Complete Payment</h2>
            <p className="text-gray-400 text-sm mt-1">
              Transfer <span className="text-white font-semibold">₨{event.ticket_price.toLocaleString()}</span> to one of the accounts below, then upload your screenshot.
            </p>
          </div>

          {step2Error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {step2Error}
            </div>
          )}

          {/* Payment accounts */}
          {paymentAccounts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pay to</p>
              {paymentAccounts.map(acc => {
                const Icon = accountTypeIcon(acc.account_type)
                const colorClass = accountTypeColor(acc.account_type)
                const isSelected = selectedAccountId === acc.id
                return (
                  <button key={acc.id} type="button"
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={clsx(
                      'w-full text-left p-4 rounded-xl border transition-all space-y-2',
                      isSelected ? 'border-[#1E5EFF] bg-[#1E5EFF08]' : 'border-white/10 hover:border-white/20 bg-brand-charcoal-light'
                    )}>
                    <div className="flex items-center gap-3">
                      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border', colorClass)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{acc.label}</p>
                        <p className="text-xs text-gray-500 capitalize">{acc.account_type === 'bank' ? acc.bank_name ?? 'Bank Transfer' : acc.account_type}</p>
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-[#1E5EFF] ml-auto shrink-0" />}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Account Title</p>
                        <p className="text-white font-medium">{acc.account_title}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Number</p>
                        <p className="text-white font-mono">{acc.account_number}</p>
                      </div>
                      {acc.iban && (
                        <div className="col-span-2">
                          <p className="text-gray-500">IBAN</p>
                          <p className="text-white font-mono text-[11px]">{acc.iban}</p>
                        </div>
                      )}
                    </div>
                    {acc.instructions && (
                      <p className="text-xs text-gray-400 bg-white/5 rounded-lg px-3 py-2">{acc.instructions}</p>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Screenshot upload */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Upload Payment Screenshot *</p>
            {screenshotPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10">
                <img src={screenshotPreview} alt="Payment screenshot" className="w-full max-h-64 object-contain bg-black/40" />
                <button type="button" onClick={removeScreenshot}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500/80 flex items-center justify-center transition-colors">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-3 py-10 rounded-xl border-2 border-dashed border-white/15 hover:border-white/30 transition-all text-gray-400 hover:text-white">
                <Upload className="w-8 h-8" />
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload screenshot</p>
                  <p className="text-xs text-gray-600 mt-0.5">PNG, JPG up to 10MB</p>
                </div>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <button
            type="button"
            onClick={handleStep2}
            disabled={step2Loading || !screenshot}
            className="w-full btn-primary justify-center py-3"
          >
            {step2Loading ? 'Submitting...' : <><CheckCircle className="w-4 h-4" /> Submit Payment</>}
          </button>
        </div>
      )}
    </PageShell>
  )
}

function PageShell({ event, displayName, children }: {
  event: Event
  displayName: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0F1117] flex flex-col items-center justify-start p-4 pt-10">
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="flex items-center gap-2 justify-center">
          <div className="w-6 h-6 bg-[#1E5EFF] rounded-md flex items-center justify-center">
            <Ticket className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Tikkit</span>
          <span className="text-gray-600 text-xs">by {displayName}</span>
        </div>

        {/* Event card */}
        <div className="card space-y-3">
          <h1 className="text-xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {event.title}
          </h1>
          <div className="space-y-1.5 text-xs text-gray-400">
            {event.date_start && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                {new Date(event.date_start).toLocaleDateString('en-PK', { dateStyle: 'full' })}
                {' · '}
                {new Date(event.date_start).toLocaleTimeString('en-PK', { timeStyle: 'short' })}
              </div>
            )}
            {!event.secret_venue && (event.venue_name || event.venue_address) && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {event.venue_name ?? event.venue_address}
              </div>
            )}
            {event.secret_venue && (
              <div className="flex items-center gap-2 text-yellow-500">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                Venue revealed to confirmed guests
              </div>
            )}
            {event.capacity > 0 && (
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 shrink-0" />
                Limited to {event.capacity} guests
              </div>
            )}
          </div>
          {event.ticket_price > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs text-gray-500">Ticket Price</span>
              <span className="text-sm font-bold text-white">₨{event.ticket_price.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Main content card */}
        <div className="card">
          {children}
        </div>
      </div>
    </div>
  )
}
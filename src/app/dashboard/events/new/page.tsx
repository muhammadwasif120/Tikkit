'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Calendar, MapPin, Users, Lock, Eye, DollarSign, Wallet } from 'lucide-react'
import Link from 'next/link'

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
    ticket_price: '',
    budget: '',
    registration_mode: 'invite_only',
    require_id_verification: false,
    require_reference_code: false,
    reference_code: '',
  })

  const update = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { error } = await supabase.from('events').insert({
      organizer_id: user.id,
      title: form.title,
      description: form.description || null,
      venue_name: form.venue_name || null,
      venue_address: form.venue_address || null,
      date_start: form.date_start || null,
      date_end: form.date_end || null,
      capacity: parseInt(form.capacity) || 0,
      is_private: form.is_private,
      secret_venue: form.secret_venue,
      male_ratio: parseInt(form.male_ratio) || 50,
      female_ratio: parseInt(form.female_ratio) || 50,
      ticket_price: parseFloat(form.ticket_price) || 0,
      budget: parseFloat(form.budget) || 0,
      registration_mode: form.registration_mode,
      require_id_verification: form.require_id_verification,
      require_reference_code: form.require_reference_code,
      reference_code: form.reference_code || null,
      status: 'draft',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard/events')
      router.refresh()
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/events" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Create Event
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">Set up a new event</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <Calendar className="w-4 h-4 text-[#1E5EFF]" /> Event Details
          </h3>

          <div>
            <label className="label">Event Title *</label>
            <input type="text" className="input" placeholder="Summer Rooftop Party" value={form.title} onChange={e => update('title', e.target.value)} required />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-20 resize-none" placeholder="What's this event about?" value={form.description} onChange={e => update('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date & Time</label>
              <input type="datetime-local" className="input" value={form.date_start} onChange={e => update('date_start', e.target.value)} />
            </div>
            <div>
              <label className="label">End Date & Time</label>
              <input type="datetime-local" className="input" value={form.date_end} onChange={e => update('date_end', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Venue */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <MapPin className="w-4 h-4 text-[#1E5EFF]" /> Venue
          </h3>

          <div>
            <label className="label">Venue Name</label>
            <input type="text" className="input" placeholder="The Grand Hall" value={form.venue_name} onChange={e => update('venue_name', e.target.value)} />
          </div>

          <div>
            <label className="label">Venue Address</label>
            <input type="text" className="input" placeholder="123 Main St, Karachi" value={form.venue_address} onChange={e => update('venue_address', e.target.value)} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
            <div>
              <p className="text-sm font-medium text-white flex items-center gap-2"><Eye className="w-3.5 h-3.5" /> Secret Venue</p>
              <p className="text-xs text-gray-500">Hide venue until confirmed guests receive it</p>
            </div>
            <button type="button" onClick={() => update('secret_venue', !form.secret_venue)}
              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${form.secret_venue ? 'bg-[#1E5EFF]' : 'bg-white/10'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.secret_venue ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Capacity & Ratios */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <Users className="w-4 h-4 text-[#1E5EFF]" /> Capacity & Demographics
          </h3>

          <div>
            <label className="label">Total Capacity *</label>
            <input type="number" className="input" placeholder="200" min="1" value={form.capacity} onChange={e => update('capacity', e.target.value)} required />
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
              <p className="text-sm font-medium text-white flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Private Event</p>
              <p className="text-xs text-gray-500">Only invited guests can see this event</p>
            </div>
            <button type="button" onClick={() => update('is_private', !form.is_private)}
              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${form.is_private ? 'bg-[#1E5EFF]' : 'bg-white/10'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_private ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Finance */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <DollarSign className="w-4 h-4 text-green-400" /> Finance
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ticket Price (PKR)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₨</span>
                <input type="number" className="input pl-7" placeholder="0" min="0" value={form.ticket_price} onChange={e => update('ticket_price', e.target.value)} />
              </div>
              <p className="text-xs text-gray-600 mt-1">Set 0 for free entry</p>
            </div>
            <div>
              <label className="label">Event Budget (PKR)</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="number" className="input pl-9" placeholder="0" min="0" value={form.budget} onChange={e => update('budget', e.target.value)} />
              </div>
              <p className="text-xs text-gray-600 mt-1">Total cost to run this event</p>
            </div>
          </div>

          {form.ticket_price && form.capacity && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-green-400">
                Max potential revenue at full capacity:{' '}
                <span className="font-bold">
                  ₨{(parseFloat(form.ticket_price) * parseInt(form.capacity)).toLocaleString()}
                </span>
              </p>
            </div>
          )}
        </div>


        {/* Registration */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <Users className="w-4 h-4 text-[#1E5EFF]" /> Registration Mode
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'invite_only', label: 'Invite Only', desc: 'Private, guests added manually' },
              { value: 'open', label: 'Open', desc: 'Anyone can register via link' },
              { value: 'expression_of_interest', label: 'Expression of Interest', desc: 'Organizer approves each request' },
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
                <button type="button" onClick={() => update('require_id_verification', !form.require_id_verification)}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${form.require_id_verification ? 'bg-[#1E5EFF]' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.require_id_verification ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">Require Reference Code</p>
                  <p className="text-xs text-gray-500">Guests need a code to complete registration</p>
                </div>
                <button type="button" onClick={() => update('require_reference_code', !form.require_reference_code)}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${form.require_reference_code ? 'bg-[#1E5EFF]' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.require_reference_code ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {form.require_reference_code && (
                <div>
                  <label className="label">Reference Code</label>
                  <input type="text" className="input font-mono uppercase tracking-widest" placeholder="e.g. TIKKIT2025"
                    value={form.reference_code} onChange={e => update('reference_code', e.target.value.toUpperCase())} />
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
          <button type="submit" disabled={loading || !form.title || !form.capacity} className="btn-primary">
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  )
}
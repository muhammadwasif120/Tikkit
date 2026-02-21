'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Eye, EyeOff, MapPin } from 'lucide-react'
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
    capacity: 100,
    is_public: true,
    venue_secret: false,
    venue_reveal_at: '',
    tags: '',
    male_ratio_max: '',
    female_ratio_max: '',
  })

  const update = (field: string, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('events').insert({
      organizer_id: user.id,
      title: form.title,
      description: form.description || null,
      venue_name: form.venue_name || null,
      venue_address: form.venue_address || null,
      date_start: new Date(form.date_start).toISOString(),
      date_end: form.date_end ? new Date(form.date_end).toISOString() : null,
      capacity: form.capacity,
      is_public: form.is_public,
      venue_secret: form.venue_secret,
      venue_reveal_at: form.venue_reveal_at ? new Date(form.venue_reveal_at).toISOString() : null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      male_ratio_max: form.male_ratio_max ? parseInt(form.male_ratio_max as string) : null,
      female_ratio_max: form.female_ratio_max ? parseInt(form.female_ratio_max as string) : null,
      status: 'draft',
    }).select().single()

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(`/dashboard/events/${data.id}`)
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
          <p className="text-gray-400 text-sm mt-0.5">Saved as draft — publish when ready</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Basic Information
          </h3>

          <div>
            <label className="label">Event Title *</label>
            <input
              type="text"
              className="input"
              placeholder="Art Basel Karachi 2025"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-24 resize-none"
              placeholder="A curated evening of contemporary art and music..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date & Time *</label>
              <input
                type="datetime-local"
                className="input"
                value={form.date_start}
                onChange={(e) => update('date_start', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">End Date & Time</label>
              <input
                type="datetime-local"
                className="input"
                value={form.date_end}
                onChange={(e) => update('date_end', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Capacity *</label>
            <input
              type="number"
              className="input"
              min={1}
              value={form.capacity}
              onChange={(e) => update('capacity', parseInt(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="label">Tags (comma-separated)</label>
            <input
              type="text"
              className="input"
              placeholder="art, music, networking"
              value={form.tags}
              onChange={(e) => update('tags', e.target.value)}
            />
          </div>
        </div>

        {/* Venue */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <MapPin className="w-4 h-4 text-gray-400" />
            Venue
          </h3>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
            <div
              className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                form.venue_secret ? 'bg-brand-yellow/10' : 'bg-white/5'
              }`}
            >
              {form.venue_secret ? (
                <EyeOff className="w-4 h-4 text-brand-yellow" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Secret Venue</p>
              <p className="text-xs text-gray-500">Location revealed X hours before event</p>
            </div>
            <button
              type="button"
              onClick={() => update('venue_secret', !form.venue_secret)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                form.venue_secret ? 'bg-brand-yellow' : 'bg-white/10'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  form.venue_secret ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="label">Venue Name</label>
            <input
              type="text"
              className="input"
              placeholder="Canvas Gallery, DHA Phase 6"
              value={form.venue_name}
              onChange={(e) => update('venue_name', e.target.value)}
            />
          </div>

          {!form.venue_secret && (
            <div>
              <label className="label">Venue Address</label>
              <input
                type="text"
                className="input"
                placeholder="Street address, Karachi"
                value={form.venue_address}
                onChange={(e) => update('venue_address', e.target.value)}
              />
            </div>
          )}

          {form.venue_secret && (
            <div>
              <label className="label">Reveal Date & Time</label>
              <input
                type="datetime-local"
                className="input"
                value={form.venue_reveal_at}
                onChange={(e) => update('venue_reveal_at', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Venue address will be shown to guests after this time</p>
            </div>
          )}
        </div>

        {/* Privacy */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Privacy & Access
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {[
              { value: true, label: 'Public', desc: 'Anyone can see & buy tickets' },
              { value: false, label: 'Private', desc: 'Invite-only guest list' },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => update('is_public', opt.value)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  form.is_public === opt.value
                    ? 'border-brand-blue bg-brand-blue/10'
                    : 'border-white/10 bg-brand-charcoal-light hover:border-white/20'
                }`}
              >
                <p className="font-medium text-white text-sm">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Demographic Ratio (Phase 2) */}
        <div className="card space-y-4">
          <div>
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Demographic Controls
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Optionally set max gender ratios for crowd balance</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Max Male % (optional)</label>
              <input
                type="number"
                className="input"
                min={0}
                max={100}
                placeholder="e.g. 60"
                value={form.male_ratio_max}
                onChange={(e) => update('male_ratio_max', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Max Female % (optional)</label>
              <input
                type="number"
                className="input"
                min={0}
                max={100}
                placeholder="e.g. 60"
                value={form.female_ratio_max}
                onChange={(e) => update('female_ratio_max', e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 justify-end">
          <Link href="/dashboard/events" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  )
}
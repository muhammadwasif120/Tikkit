'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Field, Input, Select } from '@/components/kit'
import { AuthFrame } from '@/components/auth/AuthFrame'
import { createClient } from '@/lib/supabase/client'
import { PAKISTAN_CITIES } from '@/lib/pakistanCities'

type Initial = { name: string; phone: string; city: string; gender: string; dob: string; company: string }

export default function CompleteProfileClient({ role, initial }: { role: 'organizer' | 'attendee'; initial: Initial }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [f, setF] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof Initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!/^(\+92|0)?3\d{9}$/.test(f.phone.replace(/[\s-]/g, ''))) return setError('Enter a Pakistani mobile number, like 0300 1234567.')
    if (!f.city) return setError('Choose your city.')
    if (role === 'attendee' && (!f.gender || !f.dob)) return setError('Add your gender and date of birth.')
    if (role === 'organizer' && !f.company.trim()) return setError('Add your company or brand name.')

    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const results = await Promise.all([
      supabase.from('profiles').update({ city: f.city, ...(f.name.trim() ? { full_name: f.name.trim() } : {}) }).eq('id', user.id),
      supabase.from('profile_private').update({
        phone: f.phone.replace(/[\s-]/g, ''),
        ...(role === 'attendee' ? { gender: f.gender as 'male' | 'female' | 'other', date_of_birth: f.dob } : {}),
      }).eq('id', user.id),
      role === 'organizer'
        ? supabase.from('organizer_profiles').update({ company_name: f.company.trim() }).eq('id', user.id)
        : Promise.resolve({ error: null }),
    ])
    const failed = results.find(r => r.error)
    if (failed?.error) { setBusy(false); return setError('We could not save your details. Please try again.') }

    router.push(role === 'organizer' ? '/dashboard' : '/explore')
    router.refresh()
  }

  return (
    <AuthFrame title="One last step" lead="We need a few details before you continue. Organizers see your name and phone number only for events you register for.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name">{p => <Input {...p} value={f.name} onChange={set('name')} autoComplete="name" required />}</Field>
        {role === 'organizer' && <Field label="Company or brand">{p => <Input {...p} value={f.company} onChange={set('company')} required />}</Field>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mobile number">{p => <Input {...p} type="tel" placeholder="0300 1234567" value={f.phone} onChange={set('phone')} required />}</Field>
          <Field label="City">
            {p => (
              <Select {...p} value={f.city} onChange={set('city')} required>
                <option value="" disabled>Select</option>
                {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            )}
          </Field>
        </div>
        {role === 'attendee' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Gender">
              {p => (
                <Select {...p} value={f.gender} onChange={set('gender')} required>
                  <option value="" disabled>Select</option>
                  <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                </Select>
              )}
            </Field>
            <Field label="Date of birth">{p => <Input {...p} type="date" value={f.dob} onChange={set('dob')} required />}</Field>
          </div>
        )}
        {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>Continue</Button>
      </form>
    </AuthFrame>
  )
}

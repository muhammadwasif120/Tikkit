'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button, Card, CardBody, CardHeader, Field, Input, Select, ThemeToggle } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { PAKISTAN_CITIES } from '@/lib/pakistanCities'

export type AttendeeValues = { name: string; city: string; phone: string; gender: string; dob: string; email: string }

export default function AttendeeProfile({ initial }: { initial: AttendeeValues }) {
  const router = useRouter(); const supabase = useMemo(() => createClient(), [])
  const [v, setV] = useState(initial); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const set = (k: keyof AttendeeValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV(p => ({ ...p, [k]: e.target.value }))

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null)
    if (!/^(\+92|0)?3\d{9}$/.test(v.phone.replace(/[\s-]/g, ''))) return setMsg({ ok: false, t: 'Enter a Pakistani mobile number, like 0300 1234567.' })
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    const [a, b] = await Promise.all([
      supabase.from('profiles').update({ full_name: v.name.trim(), city: v.city || null }).eq('id', user!.id),
      supabase.from('profile_private').update({ phone: v.phone.replace(/[\s-]/g, ''), gender: (v.gender || null) as 'male' | 'female' | 'other' | null, date_of_birth: v.dob || null }).eq('id', user!.id),
    ])
    setBusy(false)
    if (a.error || b.error) return setMsg({ ok: false, t: 'We could not save your details.' })
    setMsg({ ok: true, t: 'Saved.' }); router.refresh()
  }
  async function signOut() { await supabase.auth.signOut(); router.push('/'); router.refresh() }

  return (
    <div className="space-y-6">
      <form onSubmit={save}><Card>
        <CardHeader title="Your details" description="Organizers see your name and phone only for events you register for." />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">{p => <Input {...p} value={v.name} onChange={set('name')} />}</Field>
            <Field label="Email">{p => <Input {...p} value={v.email} disabled />}</Field>
            <Field label="Mobile number">{p => <Input {...p} type="tel" value={v.phone} onChange={set('phone')} />}</Field>
            <Field label="City">{p => <Select {...p} value={v.city} onChange={set('city')}><option value="">Choose</option>{PAKISTAN_CITIES.map(c => <option key={c}>{c}</option>)}</Select>}</Field>
            <Field label="Gender">{p => <Select {...p} value={v.gender} onChange={set('gender')}><option value="">Choose</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select>}</Field>
            <Field label="Date of birth">{p => <Input {...p} type="date" value={v.dob} onChange={set('dob')} />}</Field>
          </div>
          {msg && <p role={msg.ok ? 'status' : 'alert'} className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{msg.t}</p>}
          <div className="flex justify-end"><Button type="submit" loading={busy}>Save changes</Button></div>
        </CardBody>
      </Card></form>
      <Card><CardBody className="flex items-center justify-between"><div><p className="text-sm font-medium text-fg">Appearance</p><p className="text-[13px] text-muted">Midnight or Daylight.</p></div><ThemeToggle /></CardBody></Card>
      <Button variant="secondary" leading={<LogOut className="h-4 w-4" />} onClick={signOut}>Sign out</Button>
    </div>
  )
}

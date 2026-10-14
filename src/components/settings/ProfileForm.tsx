'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus } from 'lucide-react'
import { Avatar, Button, Card, CardBody, CardHeader, Field, Input, Select, Switch, Textarea } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { PAKISTAN_CITIES } from '@/lib/pakistanCities'

export type ProfileValues = {
  fullName: string; username: string; city: string; company: string; bio: string; logoUrl: string; coverUrl: string
  whatsapp: string; contactEmail: string; instagram: string; website: string; publicContact: boolean
}

export default function ProfileForm({ initial, publicUrl }: { initial: ProfileValues; publicUrl: string | null }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [v, setV] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const logo = useRef<HTMLInputElement>(null); const cover = useRef<HTMLInputElement>(null)
  const set = <K extends keyof ProfileValues>(k: K, val: ProfileValues[K]) => setV(p => ({ ...p, [k]: val }))
  const text = (k: keyof ProfileValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never)

  async function upload(file: File, key: 'logoUrl' | 'coverUrl') {
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return
    const path = `${user.id}/${key === 'logoUrl' ? 'logo' : 'cover'}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('event-media').upload(path, file, { contentType: file.type })
    if (error) return setMsg({ ok: false, text: 'The image could not be uploaded. Use a JPG, PNG or WebP under 10 MB.' })
    set(key, supabase.storage.from('event-media').getPublicUrl(path).data.publicUrl)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const username = v.username.trim().toLowerCase()
    if (username && !/^[a-z0-9_]{3,24}$/.test(username)) { setBusy(false); return setMsg({ ok: false, text: 'The username can use letters, numbers and underscore, 3 to 24 characters.' }) }
    const [a, b] = await Promise.all([
      supabase.from('profiles').update({ full_name: v.fullName.trim(), username: username || null, city: v.city || null }).eq('id', user.id),
      supabase.from('organizer_profiles').update({
        company_name: v.company.trim() || null, bio: v.bio.trim() || null, logo_url: v.logoUrl || null, cover_url: v.coverUrl || null,
        whatsapp: v.whatsapp.trim() || null, contact_email: v.contactEmail.trim() || null, instagram: v.instagram.trim() || null,
        website: v.website.trim() || null, public_contact: v.publicContact,
      }).eq('id', user.id),
    ])
    setBusy(false)
    const err = a.error ?? b.error
    if (err) return setMsg({ ok: false, text: err.message.includes('duplicate') ? 'That username is taken.' : 'We could not save your changes.' })
    setMsg({ ok: true, text: 'Saved.' }); router.refresh()
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <CardHeader title="Your brand" description="Shown on your public organizer page and your events" />
        <CardBody className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar name={v.company || v.fullName || 'Organizer'} src={v.logoUrl} size={64} />
            <input ref={logo} type="file" accept="image/*" className="sr-only" onChange={e => e.target.files?.[0] && upload(e.target.files[0], 'logoUrl')} />
            <Button type="button" variant="secondary" size="sm" leading={<ImagePlus className="h-4 w-4" />} onClick={() => logo.current?.click()}>Upload logo</Button>
          </div>
          <div>
            <input ref={cover} type="file" accept="image/*" className="sr-only" onChange={e => e.target.files?.[0] && upload(e.target.files[0], 'coverUrl')} />
            {v.coverUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={v.coverUrl} alt="Cover" className="h-32 w-full rounded-2xl object-cover" />
              : <div className="grid h-32 place-items-center rounded-2xl border border-dashed border-line-strong text-sm text-muted">No cover image</div>}
            <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => cover.current?.click()}>{v.coverUrl ? 'Change cover' : 'Upload cover'}</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company or brand">{p => <Input {...p} value={v.company} onChange={text('company')} />}</Field>
            <Field label="Your name">{p => <Input {...p} value={v.fullName} onChange={text('fullName')} />}</Field>
            <Field label="Username" hint={publicUrl ? `Public page: ${publicUrl}` : 'Used in your public page link'}>{p => <Input {...p} value={v.username} onChange={text('username')} placeholder="nightshift" />}</Field>
            <Field label="City">{p => <Select {...p} value={v.city} onChange={text('city')}><option value="">Choose</option>{PAKISTAN_CITIES.map(c => <option key={c}>{c}</option>)}</Select>}</Field>
          </div>
          <Field label="About" optional>{p => <Textarea {...p} rows={4} maxLength={600} value={v.bio} onChange={text('bio')} />}</Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Public contact" description="Guests have no in-app chat. Publish the ways they can reach you." />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp number">{p => <Input {...p} type="tel" value={v.whatsapp} onChange={text('whatsapp')} />}</Field>
            <Field label="Contact email">{p => <Input {...p} type="email" value={v.contactEmail} onChange={text('contactEmail')} />}</Field>
            <Field label="Instagram" optional>{p => <Input {...p} value={v.instagram} onChange={text('instagram')} placeholder="@handle" />}</Field>
            <Field label="Website" optional>{p => <Input {...p} value={v.website} onChange={text('website')} placeholder="https://" />}</Field>
          </div>
          <div className="flex items-start justify-between gap-4 rounded-xl bg-raised p-4 shadow-[inset_0_0_0_1px_rgb(var(--k-line))]">
            <div><p className="text-sm font-medium text-fg">Show WhatsApp and email publicly</p><p className="mt-0.5 text-[13px] text-muted">When off, only your name, bio and social links appear.</p></div>
            <Switch checked={v.publicContact} onChange={x => set('publicContact', x)} label="Show contact publicly" />
          </div>
        </CardBody>
      </Card>

      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{msg.text}</p>}
      <div className="flex justify-end"><Button type="submit" loading={busy}>Save changes</Button></div>
    </form>
  )
}

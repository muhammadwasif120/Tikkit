'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import { Avatar, Button } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'

const BUCKET = 'event-media'

/** Crops to a centred square and re-encodes as WebP. Re-encoding also drops EXIF data such as GPS location. */
async function toSquareWebp(file: File, size = 512): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const side = Math.min(bmp.width, bmp.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, size, size)
  return await new Promise<Blob>((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('encode'))), 'image/webp', 0.86))
}

export default function AvatarUpload({ name, url }: { name: string; url: string | null }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const input = useRef<HTMLInputElement>(null)
  const [src, setSrc] = useState(url)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)

  async function removeOld(oldUrl: string | null) {
    const i = oldUrl?.indexOf(`/${BUCKET}/`) ?? -1
    if (oldUrl && i > -1) await supabase.storage.from(BUCKET).remove([decodeURIComponent(oldUrl.slice(i + BUCKET.length + 2).split('?')[0])])
  }

  async function pick(file: File) {
    setMsg(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setMsg({ ok: false, t: 'Use a JPG, PNG or WebP photo.' })
    if (file.size > 10 * 1024 * 1024) return setMsg({ ok: false, t: 'That photo is over 10 MB.' })
    setBusy(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('auth')
      const blob = await toSquareWebp(file)
      const path = `${user.id}/avatar-${Date.now()}.webp`
      const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/webp' })
      if (up.error) throw up.error
      const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      const { error } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      if (error) { await supabase.storage.from(BUCKET).remove([path]); throw error }
      await removeOld(src)
      setSrc(publicUrl); setMsg({ ok: true, t: 'Photo updated.' }); router.refresh()
    } catch {
      setMsg({ ok: false, t: 'We could not update your photo. Try another image. (Photos are turned off in the demo.)' })
    }
    setBusy(false)
  }

  async function clear() {
    setBusy(true); setMsg(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user!.id)
    if (error) setMsg({ ok: false, t: 'We could not remove your photo.' })
    else { await removeOld(src); setSrc(null); setMsg({ ok: true, t: 'Photo removed.' }); router.refresh() }
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name || 'You'} src={src} size={72} />
      <div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" loading={busy} leading={<Camera className="h-4 w-4" />} onClick={() => input.current?.click()}>{src ? 'Change photo' : 'Add a photo'}</Button>
          {src && <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={clear}>Remove</Button>}
        </div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose a profile photo"
          onChange={e => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = '' }} />
        <p className="mt-1.5 text-xs text-subtle">Shown on your account. Cropped to a square. Photos are stored on a public link, so pick one you are happy to share.</p>
        {msg && <p role={msg.ok ? 'status' : 'alert'} className={`mt-1.5 text-sm ${msg.ok ? 'text-success' : 'text-danger'}`}>{msg.t}</p>}
      </div>
    </div>
  )
}

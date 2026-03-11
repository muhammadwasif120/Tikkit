'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, Pencil, Check, X, Loader2 } from 'lucide-react'

const GRADIENTS = [
  'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #200122 0%, #6f0000 100%)',
  'linear-gradient(135deg, #1f0033 0%, #0d001a 50%, #2d0050 100%)',
  'linear-gradient(135deg, #001233 0%, #001845 50%, #023e8a 100%)',
]
function getGradient(id: string) { return GRADIENTS[id.charCodeAt(0) % GRADIENTS.length] }

type Props = {
  eventId: string
  initialCoverUrl: string | null
  initialDescription: string | null
  eventTitle: string
  readOnly?: boolean
}

export default function EventCoverAndDescription({
  eventId,
  initialCoverUrl,
  initialDescription,
  eventTitle,
  readOnly = false,
}: Props) {
  const supabase = createClient()

  // Cover image state
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Description state
  const [description, setDescription] = useState<string>(initialDescription ?? '')
  const [editingDesc, setEditingDesc] = useState(false)
  const [draftDesc, setDraftDesc] = useState<string>(initialDescription ?? '')
  const [descSaving, setDescSaving] = useState(false)
  const [descError, setDescError] = useState<string | null>(null)

  /* ── Cover image upload ── */
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverError(null)

    if (file.size > 10 * 1024 * 1024) {
      setCoverError('Image must be under 10 MB')
      return
    }

    setCoverUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `event-covers/${eventId}/cover.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('tikkit-uploads')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadErr) throw new Error(uploadErr.message)

      const { data: { publicUrl } } = supabase.storage
        .from('tikkit-uploads')
        .getPublicUrl(path)

      const { error: updateErr } = await supabase
        .from('events')
        .update({ cover_image_url: publicUrl })
        .eq('id', eventId)

      if (updateErr) throw new Error(updateErr.message)

      // Bust the cache by appending timestamp
      setCoverUrl(`${publicUrl}?t=${Date.now()}`)
    } catch (err: unknown) {
      setCoverError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setCoverUploading(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const removeCover = async () => {
    setCoverError(null)
    setCoverUploading(true)
    try {
      const { error } = await supabase
        .from('events')
        .update({ cover_image_url: null })
        .eq('id', eventId)
      if (error) throw new Error(error.message)
      setCoverUrl(null)
    } catch (err: unknown) {
      setCoverError(err instanceof Error ? err.message : 'Failed to remove image')
    } finally {
      setCoverUploading(false)
    }
  }

  /* ── Description save ── */
  const saveDescription = async () => {
    setDescSaving(true)
    setDescError(null)
    try {
      const { error } = await supabase
        .from('events')
        .update({ description: draftDesc || null })
        .eq('id', eventId)
      if (error) throw new Error(error.message)
      setDescription(draftDesc)
      setEditingDesc(false)
    } catch (err: unknown) {
      setDescError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setDescSaving(false)
    }
  }

  const cancelDesc = () => {
    setDraftDesc(description)
    setEditingDesc(false)
    setDescError(null)
  }

  return (
    <div className="card overflow-hidden space-y-0 p-0">
      {/* ── Cover image zone ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '16/6', minHeight: 140 }}
      >
        {coverUrl ? (
          /* Has image */
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt={`${eventTitle} cover`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </>
        ) : (
          /* Fallback gradient */
          <div
            className="absolute inset-0"
            style={{ background: getGradient(eventId) }}
          />
        )}

        {/* Upload overlay controls — hidden in readOnly mode */}
        {!readOnly && (
          <>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              {coverUploading ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-black/50 border border-white/20 backdrop-blur-sm">
                  <Loader2 size={12} className="animate-spin" />
                  Uploading…
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-black/50 border border-white/20 backdrop-blur-sm hover:bg-black/70 transition-all"
                  >
                    <ImagePlus size={13} />
                    {coverUrl ? 'Change' : 'Add Cover'}
                  </button>
                  {coverUrl && (
                    <button
                      type="button"
                      onClick={removeCover}
                      className="flex items-center justify-center w-7 h-7 rounded-lg bg-black/50 border border-white/20 text-gray-300 hover:text-red-400 transition-colors backdrop-blur-sm"
                    >
                      <X size={13} />
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {coverError && (
          <div className="absolute top-3 left-3 right-3 text-xs text-red-300 bg-red-900/60 border border-red-500/30 rounded-lg px-3 py-2 backdrop-blur-sm">
            {coverError}
          </div>
        )}
      </div>

      {/* ── Description zone ── */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Description</h3>
          {/* Edit button hidden in readOnly mode */}
          {!readOnly && !editingDesc && (
            <button
              type="button"
              onClick={() => { setDraftDesc(description); setEditingDesc(true) }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <Pencil size={12} />
              {description ? 'Edit' : 'Add description'}
            </button>
          )}
        </div>

        {!readOnly && editingDesc ? (
          <div className="space-y-2">
            <textarea
              className="input min-h-[100px] resize-none w-full text-sm"
              placeholder="Tell guests what to expect — the vibe, dress code, highlights..."
              value={draftDesc}
              onChange={e => setDraftDesc(e.target.value)}
              autoFocus
            />
            {descError && (
              <p className="text-xs text-red-400">{descError}</p>
            )}
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={cancelDesc}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-3 py-1.5"
              >
                <X size={12} /> Cancel
              </button>
              <button
                type="button"
                onClick={saveDescription}
                disabled={descSaving}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1E5EFF] hover:bg-[#1448CC] disabled:opacity-50 transition-colors rounded-lg px-3 py-1.5"
              >
                {descSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                {descSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : description ? (
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        ) : !readOnly ? (
          <button
            type="button"
            onClick={() => { setDraftDesc(''); setEditingDesc(true) }}
            className="w-full py-4 rounded-xl border border-dashed border-white/10 hover:border-white/20 transition-all text-sm text-gray-500 hover:text-gray-400"
          >
            + Add a description for guests
          </button>
        ) : (
          <p className="text-sm text-gray-500 italic">No description added</p>
        )}
      </div>
    </div>
  )
}

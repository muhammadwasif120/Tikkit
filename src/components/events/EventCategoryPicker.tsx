'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getEventCategories } from '@/app/actions/behaviourActions'
import type { EventCategory } from '@/app/actions/behaviourActions'
import { Tag, ChevronDown, Check } from 'lucide-react'

export default function EventCategoryPicker({
  eventId,
  currentCategoryId,
  isArchived = false,
}: {
  eventId: string
  currentCategoryId: string | null
  isArchived?: boolean
}) {
  const supabase = createClient()
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [selected, setSelected] = useState<string>(currentCategoryId ?? '')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getEventCategories().then(setCategories)
  }, [])

  const handleChange = (catId: string) => {
    if (isArchived) return
    setSelected(catId)
    startTransition(async () => {
      await supabase
        .from('events')
        .update({ category_id: catId || null })
        .eq('id', eventId)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  if (categories.length === 0) return null

  const selectedCat = categories.find(c => c.id === selected)

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold text-white text-sm flex items-center gap-2">
        <Tag className="w-4 h-4 text-[#1E5EFF]" /> Category
        {saved && (
          <span className="ml-auto flex items-center gap-1 text-green-400 text-xs font-normal">
            <Check size={12} /> Saved
          </span>
        )}
        {isPending && !saved && (
          <span className="ml-auto text-gray-500 text-xs font-normal">Saving…</span>
        )}
      </h3>

      <div className="relative">
        <select
          className="input appearance-none pr-9"
          value={selected}
          disabled={isArchived}
          onChange={e => handleChange(e.target.value)}
          style={{
            color: selectedCat ? selectedCat.color : undefined,
            fontWeight: selectedCat ? 600 : undefined,
            opacity: isArchived ? 0.5 : 1,
          }}
        >
          <option value="">— No category —</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon}  {cat.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      </div>

      {!selected && !isArchived && (
        <p className="text-xs text-gray-600">
          Tag this event so guests can find it under the right category on Explore.
        </p>
      )}
    </div>
  )
}

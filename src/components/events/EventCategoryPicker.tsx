'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getEventCategories } from '@/app/actions/behaviourActions'
import type { EventCategory } from '@/app/actions/behaviourActions'
import { Tag, Check } from 'lucide-react'

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
  const [selected, setSelected] = useState<string | null>(currentCategoryId)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getEventCategories().then(setCategories)
  }, [])

  const handleSelect = (catId: string) => {
    if (isArchived) return
    const next = selected === catId ? null : catId
    setSelected(next)
    startTransition(async () => {
      await supabase.from('events').update({ category_id: next }).eq('id', eventId)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  if (categories.length === 0) return null

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

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const isSelected = selected === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              disabled={isArchived}
              onClick={() => handleSelect(cat.id)}
              style={{
                background: isSelected ? `${cat.color}22` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isSelected ? cat.color : 'rgba(255,255,255,0.08)'}`,
                color: isSelected ? cat.color : '#9CA3AF',
                borderRadius: 20,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: isSelected ? 700 : 500,
                cursor: isArchived ? 'default' : 'pointer',
                opacity: isArchived ? 0.5 : 1,
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          )
        })}
      </div>

      {!selected && !isArchived && (
        <p className="text-xs text-gray-600">
          Select a category so guests can find this event when filtering by interest.
        </p>
      )}
    </div>
  )
}

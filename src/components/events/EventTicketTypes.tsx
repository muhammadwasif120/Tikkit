'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ticket, Star, Tag, Plus, Pencil, Check, X, Trash2 } from 'lucide-react'

type TicketType = {
  id: string
  event_id: string
  name: string
  price: number
  original_price: number | null
  discount_type: string | null
  discount_value: number | null
  quantity: number
  is_vip: boolean
}

type EditState = {
  price: string
  quantity: string
  discountType: 'percentage' | 'fixed'
  discountValue: string
}

/* ─── Tier colour/icon map ─── */
const TIER_META: Record<string, {
  dot: string; iconColor: string; headerBg: string; border: string; badgeBg: string; badgeText: string
}> = {
  Standard: {
    dot: 'bg-[#1E5EFF]', iconColor: 'text-[#1E5EFF]',
    headerBg: 'bg-[#1E5EFF08]', border: 'border-[#1E5EFF25]',
    badgeBg: 'bg-[#1E5EFF15]', badgeText: 'text-[#1E5EFF]',
  },
  VIP: {
    dot: 'bg-[#FFC745]', iconColor: 'text-[#FFC745]',
    headerBg: 'bg-[#FFC74508]', border: 'border-[#FFC74525]',
    badgeBg: 'bg-[#FFC74515]', badgeText: 'text-[#FFC745]',
  },
  Discounted: {
    dot: 'bg-green-400', iconColor: 'text-green-400',
    headerBg: 'bg-green-500/5', border: 'border-green-500/20',
    badgeBg: 'bg-green-500/10', badgeText: 'text-green-400',
  },
}

const tierIcon = (name: string) => {
  if (name === 'VIP') return Star
  if (name === 'Discounted') return Tag
  return Ticket
}

/* ─── Inline price input ─── */
function PriceInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₨</span>
      <input type="number" className="input pl-7" min="0" placeholder="0"
        value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

/* ─── Main component ─── */
export default function EventTicketTypes({
  eventId,
  initialTicketTypes,
}: {
  eventId: string
  initialTicketTypes: TicketType[]
}) {
  const supabase = createClient()
  const [tiers, setTiers] = useState<TicketType[]>(initialTicketTypes)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ price: '', quantity: '', discountType: 'percentage', discountValue: '' })
  const [addingKey, setAddingKey] = useState<'standard' | 'vip' | 'discounted' | null>(null)
  const [newState, setNewState] = useState<EditState>({ price: '', quantity: '', discountType: 'percentage', discountValue: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  /* ── helpers ── */
  const computePrice = (state: EditState, isDisc: boolean) => {
    const orig = parseFloat(state.price) || 0
    if (!isDisc) return orig
    const dval = parseFloat(state.discountValue) || 0
    return Math.max(0, state.discountType === 'percentage'
      ? orig - (orig * dval / 100)
      : orig - dval)
  }

  /* ── edit ── */
  const startEdit = (t: TicketType) => {
    setEditingId(t.id)
    setEditState({
      price:         String(t.original_price ?? t.price),
      quantity:      String(t.quantity),
      discountType:  (t.discount_type as 'percentage' | 'fixed') ?? 'percentage',
      discountValue: String(t.discount_value ?? ''),
    })
  }

  const saveEdit = async (t: TicketType) => {
    setSaving(true)
    setEditError(null)
    const isDisc = t.name === 'Discounted'
    const orig = parseFloat(editState.price) || 0
    const dval = parseFloat(editState.discountValue) || 0
    const finalPrice = computePrice(editState, isDisc)
    const updates: Record<string, unknown> = {
      price:    isDisc ? finalPrice : orig,
      quantity: parseInt(editState.quantity) || t.quantity,
      is_vip:   t.is_vip,
      ...(isDisc ? {
        original_price: orig,
        discount_type:  editState.discountType,
        discount_value: dval,
      } : {}),
    }
    const { data, error } = await supabase
      .from('ticket_types').update(updates).eq('id', t.id).select().single()
    if (error) {
      setEditError(error.message)
      setSaving(false)
      return
    }
    if (data) setTiers(prev => prev.map(x => x.id === t.id ? data : x))
    setSaving(false)
    setEditingId(null)
  }

  /* ── delete ── */
  const deleteTier = async (id: string) => {
    setDeleting(id)
    await supabase.from('ticket_types').delete().eq('id', id)
    setTiers(prev => prev.filter(t => t.id !== id))
    setDeleting(null)
  }

  /* ── add ── */
  const addTier = async (key: 'standard' | 'vip' | 'discounted') => {
    setSaving(true)
    setAddError(null)
    const isDisc = key === 'discounted'
    const orig = parseFloat(newState.price) || 0
    const dval = parseFloat(newState.discountValue) || 0
    const finalPrice = computePrice(newState, isDisc)
    const nameMap = { standard: 'Standard', vip: 'VIP', discounted: 'Discounted' }

    // Build insert payload — only include discount fields if they exist in the DB
    const payload: Record<string, unknown> = {
      event_id:  eventId,
      name:      nameMap[key],
      price:     isDisc ? finalPrice : orig,
      quantity:  parseInt(newState.quantity) || 0,
      is_vip:    key === 'vip',
    }
    if (isDisc) {
      payload.original_price = orig
      payload.discount_type  = newState.discountType
      payload.discount_value = dval
    }

    const { data, error } = await supabase
      .from('ticket_types')
      .insert(payload)
      .select()
      .single()

    if (error) {
      // Retry without discount columns if they don't exist in the schema yet
      if (error.code === 'PGRST204' || error.message?.includes('original_price') || error.message?.includes('discount')) {
        const fallbackPayload: Record<string, unknown> = {
          event_id: eventId,
          name:     nameMap[key],
          price:    isDisc ? finalPrice : orig,
          quantity: parseInt(newState.quantity) || 0,
          is_vip:   key === 'vip',
        }
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('ticket_types')
          .insert(fallbackPayload)
          .select()
          .single()
        if (fallbackError) {
          setAddError(fallbackError.message)
          setSaving(false)
          return
        }
        if (fallbackData) setTiers(prev => [...prev, fallbackData as TicketType])
      } else {
        setAddError(error.message)
        setSaving(false)
        return
      }
    } else {
      if (data) setTiers(prev => [...prev, data as TicketType])
    }

    setSaving(false)
    setAddingKey(null)
    setNewState({ price: '', quantity: '', discountType: 'percentage', discountValue: '' })
  }

  const existingNames = tiers.map(t => t.name.toLowerCase())
  const canAdd = {
    standard:  !existingNames.includes('standard'),
    vip:       !existingNames.includes('vip'),
    discounted:!existingNames.includes('discounted'),
  }
  const hasAddable = canAdd.standard || canAdd.vip || canAdd.discounted

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <Ticket className="w-4 h-4 text-[#FFC745]" /> Ticket Tiers
        </h3>
        {tiers.length > 0 && (
          <span className="text-xs text-gray-500">{tiers.length} tier{tiers.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Tiers list */}
      {tiers.length === 0 && !addingKey && (
        <div className="text-sm text-gray-500 bg-white/5 rounded-lg px-4 py-3 text-center">
          No ticket tiers yet. Add one below.
        </div>
      )}

      <div className="space-y-3">
        {tiers.map(t => {
          const meta = TIER_META[t.name] ?? TIER_META.Standard
          const Icon = tierIcon(t.name)
          const isEditing = editingId === t.id
          const isDisc = t.name === 'Discounted'

          return (
            <div key={t.id} className={`rounded-xl border overflow-hidden ${meta.border}`}>
              {/* Tier header */}
              <div className={`flex items-center justify-between px-4 py-3 ${meta.headerBg}`}>
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      {t.is_vip && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${meta.badgeBg} ${meta.badgeText}`}>
                          VIP
                        </span>
                      )}
                    </div>
                    {!isEditing && (
                      <p className="text-xs text-gray-500">
                        {t.price === 0 ? 'Free' : `₨${t.price.toLocaleString()}`}
                        {isDisc && t.original_price && t.original_price > t.price && (
                          <span className="ml-1.5 line-through text-gray-600">₨{t.original_price.toLocaleString()}</span>
                        )}
                        <span className="mx-1.5 text-gray-600">·</span>
                        {t.quantity.toLocaleString()} spots
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!isEditing ? (
                    <>
                      <button type="button" onClick={() => startEdit(t)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Edit tier">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button"
                        onClick={() => deleteTier(t.id)}
                        disabled={deleting === t.id}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete tier">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => saveEdit(t)} disabled={saving}
                        className="p-1.5 rounded-lg hover:bg-green-500/10 text-gray-400 hover:text-green-400 transition-colors"
                        title="Save">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                        title="Cancel">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Edit body */}
              {isEditing && (
                <div className="px-4 py-4 border-t border-white/5 space-y-3 bg-white/[0.01]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">{isDisc ? 'Original Price (PKR)' : 'Price (PKR)'}</label>
                      <PriceInput value={editState.price} onChange={v => setEditState(p => ({ ...p, price: v }))} />
                      {!isDisc && <p className="text-xs text-gray-600 mt-1">Leave 0 for free entry</p>}
                    </div>
                    <div>
                      <label className="label">Available Spots</label>
                      <input type="number" className="input" min="0"
                        value={editState.quantity}
                        onChange={e => setEditState(p => ({ ...p, quantity: e.target.value }))} />
                    </div>
                  </div>

                  {isDisc && (
                    <div>
                      <label className="label">Discount</label>
                      <div className="flex gap-2">
                        <div className="flex rounded-lg border border-white/10 overflow-hidden shrink-0">
                          {(['percentage', 'fixed'] as const).map(dt => (
                            <button key={dt} type="button"
                              onClick={() => setEditState(p => ({ ...p, discountType: dt }))}
                              className={`px-3 py-2 text-xs font-semibold transition-colors ${
                                editState.discountType === dt
                                  ? 'bg-green-500 text-white'
                                  : 'text-gray-400 hover:text-white bg-brand-charcoal-light'
                              }`}>
                              {dt === 'percentage' ? '%' : '₨ Fixed'}
                            </button>
                          ))}
                        </div>
                        <input type="number" className="input flex-1" min="0"
                          placeholder={editState.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                          value={editState.discountValue}
                          onChange={e => setEditState(p => ({ ...p, discountValue: e.target.value }))} />
                      </div>
                    </div>
                  )}

                  {/* Live preview of discounted price */}
                  {isDisc && editState.price && editState.discountValue && (() => {
                    const final = computePrice(editState, true)
                    const orig  = parseFloat(editState.price) || 0
                    const saving = orig - final
                    return saving > 0 ? (
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs">
                        <div>
                          <p className="text-gray-400">Final discounted price</p>
                          <p className="text-green-500 mt-0.5">
                            Guests save ₨{saving.toLocaleString()}
                            {editState.discountType === 'percentage' && ` (${editState.discountValue}% off)`}
                          </p>
                        </div>
                        <span className="text-green-400 font-bold text-sm">
                          {final === 0 ? 'Free' : `₨${final.toLocaleString()}`}
                        </span>
                      </div>
                    ) : null
                  })()}

                  {editError && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      {editError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setEditingId(null); setEditError(null) }}
                      className="btn-secondary text-xs px-3 py-1.5">
                      Cancel
                    </button>
                    <button type="button" onClick={() => saveEdit(t)} disabled={saving}
                      className="btn-primary text-xs px-3 py-1.5">
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* ── Add tier form ── */}
        {addingKey && (() => {
          const isDisc = addingKey === 'discounted'
          const meta = addingKey === 'vip' ? TIER_META.VIP
                     : addingKey === 'discounted' ? TIER_META.Discounted
                     : TIER_META.Standard
          const nameMap = { standard: 'Standard', vip: 'VIP', discounted: 'Discounted' }
          return (
            <div className={`rounded-xl border overflow-hidden ${meta.border}`}>
              <div className={`flex items-center justify-between px-4 py-3 ${meta.headerBg}`}>
                <p className="text-sm font-semibold text-white">New {nameMap[addingKey]} Tier</p>
                <button type="button" onClick={() => setAddingKey(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="px-4 py-4 border-t border-white/5 space-y-3 bg-white/[0.01]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{isDisc ? 'Original Price (PKR)' : 'Price (PKR)'}</label>
                    <PriceInput value={newState.price} onChange={v => setNewState(p => ({ ...p, price: v }))} />
                    {!isDisc && <p className="text-xs text-gray-600 mt-1">Leave 0 for free entry</p>}
                  </div>
                  <div>
                    <label className="label">Available Spots</label>
                    <input type="number" className="input" min="0" placeholder="50"
                      value={newState.quantity}
                      onChange={e => setNewState(p => ({ ...p, quantity: e.target.value }))} />
                  </div>
                </div>

                {isDisc && (
                  <>
                    <div>
                      <label className="label">Discount</label>
                      <div className="flex gap-2">
                        <div className="flex rounded-lg border border-white/10 overflow-hidden shrink-0">
                          {(['percentage', 'fixed'] as const).map(dt => (
                            <button key={dt} type="button"
                              onClick={() => setNewState(p => ({ ...p, discountType: dt }))}
                              className={`px-3 py-2 text-xs font-semibold transition-colors ${
                                newState.discountType === dt
                                  ? 'bg-green-500 text-white'
                                  : 'text-gray-400 hover:text-white bg-brand-charcoal-light'
                              }`}>
                              {dt === 'percentage' ? '%' : '₨ Fixed'}
                            </button>
                          ))}
                        </div>
                        <input type="number" className="input flex-1" min="0"
                          placeholder={newState.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                          value={newState.discountValue}
                          onChange={e => setNewState(p => ({ ...p, discountValue: e.target.value }))} />
                      </div>
                    </div>

                    {newState.price && newState.discountValue && (() => {
                      const final = computePrice(newState, true)
                      const orig  = parseFloat(newState.price) || 0
                      const save  = orig - final
                      return save > 0 ? (
                        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs">
                          <div>
                            <p className="text-gray-400">Final discounted price</p>
                            <p className="text-green-500 mt-0.5">
                              Guests save ₨{save.toLocaleString()}
                              {newState.discountType === 'percentage' && ` (${newState.discountValue}% off)`}
                            </p>
                          </div>
                          <span className="text-green-400 font-bold text-sm">
                            {final === 0 ? 'Free' : `₨${final.toLocaleString()}`}
                          </span>
                        </div>
                      ) : null
                    })()}
                  </>
                )}

                {addError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {addError}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setAddingKey(null); setAddError(null) }}
                    className="btn-secondary text-xs px-3 py-1.5">
                    Cancel
                  </button>
                  <button type="button" onClick={() => addTier(addingKey!)} disabled={saving}
                    className="btn-primary text-xs px-3 py-1.5">
                    {saving ? 'Adding…' : 'Add Tier'}
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Add buttons */}
      {hasAddable && !addingKey && (
        <div className="pt-1">
          <p className="text-xs text-gray-600 mb-2">Add a tier</p>
          <div className="flex gap-2 flex-wrap">
            {canAdd.standard && (
              <button type="button" onClick={() => setAddingKey('standard')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1E5EFF30] bg-[#1E5EFF08] text-[#1E5EFF] text-xs font-medium hover:border-[#1E5EFF70] transition-colors">
                <Plus className="w-3.5 h-3.5" /> Standard
              </button>
            )}
            {canAdd.vip && (
              <button type="button" onClick={() => setAddingKey('vip')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#FFC74530] bg-[#FFC74508] text-[#FFC745] text-xs font-medium hover:border-[#FFC74570] transition-colors">
                <Plus className="w-3.5 h-3.5" /> VIP
              </button>
            )}
            {canAdd.discounted && (
              <button type="button" onClick={() => setAddingKey('discounted')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-green-500/30 bg-green-500/5 text-green-400 text-xs font-medium hover:border-green-500/60 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Discounted
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

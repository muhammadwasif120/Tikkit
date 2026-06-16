'use client'

import { useState, useRef, useCallback, useId } from 'react'
import { Plus, Trash2, Save, Grid3X3, Move } from 'lucide-react'
import { saveSpotMap, type SpotItem } from '@/app/actions/venueActions'

const C = {
  emerald: '#00D4AA', violet: '#7C3AED',
  surface: '#0A0F14', border: 'rgba(0,212,170,0.12)', muted: 'rgba(255,255,255,0.4)',
  canvas: '#0D1117',
}

const SPOT_TYPES: { value: SpotItem['type']; label: string; color: string; defaultW: number; defaultH: number }[] = [
  { value: 'table',  label: 'Table',   color: '#00D4AA', defaultW: 60,  defaultH: 60  },
  { value: 'booth',  label: 'Booth',   color: '#7C3AED', defaultW: 80,  defaultH: 50  },
  { value: 'row',    label: 'Row',     color: '#F6C90E', defaultW: 200, defaultH: 40  },
  { value: 'bar',    label: 'Bar',     color: '#FC8181', defaultW: 120, defaultH: 40  },
  { value: 'stage',  label: 'Stage',   color: '#CC00FF', defaultW: 200, defaultH: 80  },
  { value: 'zone',   label: 'Zone',    color: 'rgba(255,255,255,0.15)', defaultW: 160, defaultH: 120 },
]

function typeColor(type: SpotItem['type']): string {
  return SPOT_TYPES.find(t => t.value === type)?.color ?? '#00D4AA'
}

type DragState = { spotId: string; startX: number; startY: number; origX: number; origY: number }

type ExistingMap = {
  id: string; name: string; layout_json: SpotItem[]
  canvas_width: number; canvas_height: number
}

export default function SpotMapEditor({
  venueId, existingMap,
}: {
  venueId: string
  existingMap: ExistingMap | null
}) {
  const uid = useId()
  const [mapId,   setMapId]   = useState<string | null>(existingMap?.id ?? null)
  const [mapName, setMapName] = useState(existingMap?.name ?? 'Main Layout')
  const [spots,   setSpots]   = useState<SpotItem[]>(existingMap?.layout_json ?? [])
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [addType, setAddType] = useState<SpotItem['type']>('table')
  const [mode, setMode]       = useState<'select' | 'add'>('select')

  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const W = existingMap?.canvas_width  ?? 800
  const H = existingMap?.canvas_height ?? 500

  const selectedSpot = spots.find(s => s.id === selected) ?? null

  // ── Canvas click → add spot in "add" mode ────────────────────────────────
  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'add') return
    if ((e.target as SVGElement).closest('.spot-el')) return

    const rect = svgRef.current!.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const x = Math.round((e.clientX - rect.left) * scaleX)
    const y = Math.round((e.clientY - rect.top)  * scaleY)

    const cfg = SPOT_TYPES.find(t => t.value === addType)!
    const newSpot: SpotItem = {
      id:        `${uid}-${Date.now()}`,
      label:     `${cfg.label} ${spots.filter(s => s.type === addType).length + 1}`,
      type:      addType,
      x:         Math.max(0, x - cfg.defaultW / 2),
      y:         Math.max(0, y - cfg.defaultH / 2),
      w:         cfg.defaultW,
      h:         cfg.defaultH,
      capacity:  addType === 'row' ? 10 : addType === 'zone' ? 20 : addType === 'stage' ? 0 : 4,
      surcharge: 0,
    }
    setSpots(prev => [...prev, newSpot])
    setSelected(newSpot.id)
    setMode('select')
  }, [mode, addType, spots, uid, W, H])

  // ── Drag to reposition ────────────────────────────────────────────────────
  const startDrag = useCallback((e: React.MouseEvent, spotId: string) => {
    e.stopPropagation()
    if (mode !== 'select') return
    const rect = svgRef.current!.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const spot = spots.find(s => s.id === spotId)!
    dragRef.current = {
      spotId,
      startX: e.clientX * scaleX,
      startY: e.clientY * scaleY,
      origX: spot.x,
      origY: spot.y,
    }
    setSelected(spotId)
  }, [mode, spots, W, H])

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragRef.current) return
    const rect = svgRef.current!.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const dx = e.clientX * scaleX - dragRef.current.startX
    const dy = e.clientY * scaleY - dragRef.current.startY
    const { spotId, origX, origY } = dragRef.current
    setSpots(prev => prev.map(s =>
      s.id === spotId
        ? { ...s, x: Math.max(0, Math.round(origX + dx)), y: Math.max(0, Math.round(origY + dy)) }
        : s
    ))
  }, [W, H])

  const onMouseUp = useCallback(() => { dragRef.current = null }, [])

  // ── Edit selected spot properties ─────────────────────────────────────────
  const updateSelected = (patch: Partial<SpotItem>) => {
    setSpots(prev => prev.map(s => s.id === selected ? { ...s, ...patch } : s))
  }

  const deleteSelected = () => {
    setSpots(prev => prev.filter(s => s.id !== selected))
    setSelected(null)
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    const result = await saveSpotMap(venueId, mapId, mapName, spots, W, H)
    if (!result.error) {
      if (!mapId && result.id) setMapId(result.id)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Spot Map</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Design your venue's seating/table layout for spot reservations.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: 13, color: C.emerald, fontWeight: 600 }}>✓ Saved</span>}
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, background: C.emerald, color: '#050508', fontSize: 13, fontWeight: 800, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save Layout'}
          </button>
        </div>
      </div>

      {/* Map name */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ flex: 1, maxWidth: 320 }}>
          <input
            value={mapName}
            onChange={e => setMapName(e.target.value)}
            placeholder="Layout name"
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 14px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <span style={{ fontSize: 12, color: C.muted }}>{spots.length} spot{spots.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, marginRight: 4 }}>
          <button onClick={() => setMode('select')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: mode === 'select' ? 'rgba(0,212,170,0.15)' : 'transparent', border: mode === 'select' ? '1px solid rgba(0,212,170,0.3)' : '1px solid transparent', color: mode === 'select' ? C.emerald : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Move size={13} /> Move
          </button>
          <button onClick={() => setMode('add')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: mode === 'add' ? 'rgba(0,212,170,0.15)' : 'transparent', border: mode === 'add' ? '1px solid rgba(0,212,170,0.3)' : '1px solid transparent', color: mode === 'add' ? C.emerald : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={13} /> Add
          </button>
        </div>

        {/* Spot type selector (shown in add mode) */}
        {SPOT_TYPES.map(t => (
          <button key={t.value} onClick={() => { setAddType(t.value); setMode('add') }}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: addType === t.value && mode === 'add' ? 700 : 500, background: addType === t.value && mode === 'add' ? `${t.color}18` : 'transparent', border: `1px solid ${addType === t.value && mode === 'add' ? t.color + '40' : 'rgba(255,255,255,0.08)'}`, color: addType === t.value && mode === 'add' ? t.color : C.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 16, border: `1px solid ${C.border}` }}>
          {mode === 'add' && (
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 20, padding: '5px 14px', fontSize: 12, color: C.emerald, fontWeight: 600, zIndex: 10, pointerEvents: 'none' }}>
              Click anywhere to place a {SPOT_TYPES.find(t => t.value === addType)?.label}
            </div>
          )}

          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', display: 'block', background: C.canvas, cursor: mode === 'add' ? 'crosshair' : 'default', userSelect: 'none' }}
            onClick={handleCanvasClick}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {/* Grid */}
            <defs>
              <pattern id={`${uid}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill={`url(#${uid}-grid)`} />

            {/* Spots */}
            {spots.map(spot => {
              const color = typeColor(spot.type)
              const isSelected = spot.id === selected
              const isCircle = spot.type === 'table'
              const cx = spot.x + spot.w / 2
              const cy = spot.y + spot.h / 2
              const rx = spot.w / 2
              const ry = spot.h / 2

              return (
                <g
                  key={spot.id}
                  className="spot-el"
                  onMouseDown={e => startDrag(e, spot.id)}
                  onClick={e => { e.stopPropagation(); setSelected(spot.id); setMode('select') }}
                  style={{ cursor: mode === 'select' ? 'grab' : 'default' }}
                >
                  {isCircle ? (
                    <ellipse
                      cx={cx} cy={cy} rx={rx} ry={ry}
                      fill={`${color}22`}
                      stroke={color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      opacity={isSelected ? 1 : 0.8}
                    />
                  ) : (
                    <rect
                      x={spot.x} y={spot.y} width={spot.w} height={spot.h}
                      rx={spot.type === 'zone' ? 8 : 6}
                      fill={`${color}18`}
                      stroke={color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      strokeDasharray={spot.type === 'zone' ? '6 4' : undefined}
                      opacity={isSelected ? 1 : 0.8}
                    />
                  )}
                  <text
                    x={cx} y={cy - (spot.h > 40 ? 6 : 0)}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.min(12, Math.min(spot.w, spot.h) * 0.22)}
                    fill={color}
                    fontFamily="DM Sans, sans-serif"
                    fontWeight="700"
                    style={{ pointerEvents: 'none' }}
                  >
                    {spot.label.length > 12 ? spot.label.slice(0, 11) + '…' : spot.label}
                  </text>
                  {spot.capacity > 0 && spot.h > 40 && (
                    <text
                      x={cx} y={cy + 10}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={9}
                      fill={`${color}99`}
                      fontFamily="DM Sans, sans-serif"
                      style={{ pointerEvents: 'none' }}
                    >
                      {spot.capacity} pax
                    </text>
                  )}

                  {/* Selection handles */}
                  {isSelected && (
                    <>
                      <rect x={spot.x - 3} y={spot.y - 3} width={6} height={6} rx={2} fill={color} />
                      <rect x={spot.x + spot.w - 3} y={spot.y - 3} width={6} height={6} rx={2} fill={color} />
                      <rect x={spot.x - 3} y={spot.y + spot.h - 3} width={6} height={6} rx={2} fill={color} />
                      <rect x={spot.x + spot.w - 3} y={spot.y + spot.h - 3} width={6} height={6} rx={2} fill={color} />
                    </>
                  )}
                </g>
              )
            })}

            {/* Empty state */}
            {spots.length === 0 && (
              <>
                <text x={W / 2} y={H / 2 - 16} textAnchor="middle" fontSize={14} fill="rgba(255,255,255,0.15)" fontFamily="DM Sans, sans-serif">
                  Click "Add" and place spots on the canvas
                </text>
                <text x={W / 2} y={H / 2 + 10} textAnchor="middle" fontSize={12} fill="rgba(255,255,255,0.08)" fontFamily="DM Sans, sans-serif">
                  Tables · Booths · Rows · Zones · Bars · Stage
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Properties panel */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
            {selectedSpot ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, margin: 0, color: typeColor(selectedSpot.type) }}>
                    {SPOT_TYPES.find(t => t.value === selectedSpot.type)?.label}
                  </p>
                  <button onClick={deleteSelected} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,129,129,0.6)', padding: 4 }}>
                    <Trash2 size={14} />
                  </button>
                </div>

                {[
                  { key: 'label',     label: 'Label',      type: 'text',   val: selectedSpot.label                    },
                  { key: 'capacity',  label: 'Capacity',   type: 'number', val: selectedSpot.capacity.toString()      },
                  { key: 'surcharge', label: 'Surcharge (PKR)', type: 'number', val: selectedSpot.surcharge.toString() },
                  { key: 'x',        label: 'X',          type: 'number', val: selectedSpot.x.toString()             },
                  { key: 'y',        label: 'Y',          type: 'number', val: selectedSpot.y.toString()             },
                  { key: 'w',        label: 'Width',      type: 'number', val: selectedSpot.w.toString()             },
                  { key: 'h',        label: 'Height',     type: 'number', val: selectedSpot.h.toString()             },
                ].map(({ key, label, type, val }) => (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</label>
                    <input
                      type={type}
                      value={val}
                      onChange={e => {
                        const v = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                        updateSelected({ [key]: v } as Partial<SpotItem>)
                      }}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}

                <div style={{ marginTop: 4 }}>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Type</label>
                  <select value={selectedSpot.type} onChange={e => updateSelected({ type: e.target.value as SpotItem['type'] })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', appearance: 'none' }}>
                    {SPOT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Grid3X3 size={28} color="rgba(255,255,255,0.1)" style={{ marginBottom: 10 }} />
                <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Select a spot to edit its properties</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>Legend</p>
            {SPOT_TYPES.filter(t => t.value !== 'zone' && t.value !== 'stage').map(t => (
              <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: t.value === 'table' ? '50%' : 2, background: t.color, opacity: 0.8 }} />
                <span style={{ fontSize: 12, color: C.muted }}>{t.label}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>
                  {spots.filter(s => s.type === t.value).length}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: C.muted, marginTop: 14 }}>
        Tip: Use <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Move mode</strong> to drag spots. Toggle <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Add mode</strong> + click the canvas to place. Edit label/size/surcharge in the panel.
      </p>
    </div>
  )
}

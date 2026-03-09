'use client'

import { useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Upload, FileSpreadsheet, X, Check, AlertCircle, Download } from 'lucide-react'
import Link from 'next/link'

/* ─── Toggle ─── */
function Toggle({
  on, onToggle, color = 'blue',
}: { on: boolean; onToggle: () => void; color?: 'blue' | 'yellow' | 'green' }) {
  const bg = on
    ? color === 'yellow' ? 'bg-[#FFC745]'
    : color === 'green'  ? 'bg-green-500'
    : 'bg-[#1E5EFF]'
    : 'bg-white/10'
  return (
    <button type="button" onClick={onToggle}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${bg}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

type ImportRow = {
  full_name: string
  email?: string
  phone?: string
  gender?: string
  is_vip?: boolean
  plus_one?: boolean
  plus_one_name?: string
  status: 'ready' | 'error'
  error?: string
}

async function insertGuest(supabase: any, eventId: string, data: {
  full_name: string; email?: string; phone?: string
  gender?: string; is_vip?: boolean; plus_one?: boolean
  plus_one_name?: string; waitlist?: boolean
}) {
  // 1. Insert into guests table
  const { data: guest, error: guestError } = await supabase.from('guests').insert({
    event_id:       eventId,
    full_name:      data.full_name,
    email:          data.email || null,
    phone:          data.phone || null,
    gender:         data.gender || null,
    is_vip:         data.is_vip ?? false,
    plus_one:       data.plus_one ?? false,
    plus_one_name:  data.plus_one ? data.plus_one_name || null : null,
    waitlist:       data.waitlist ?? false,
    status:         'invited',
    source:         'organizer',
  }).select().single()

  if (guestError) return { error: guestError }

  // 2. If guest has email, create public_registrations record so attendee app sees it
  if (data.email) {
    const { error: regError } = await supabase.from('public_registrations').upsert({
      event_id:   eventId,
      email:      data.email.toLowerCase().trim(),
      full_name:  data.full_name,
      phone:      data.phone || null,
      status:     data.waitlist ? 'waitlisted' : 'confirmed',
      source:     'organizer_invite',
    }, { onConflict: 'event_id,email', ignoreDuplicates: false })

    if (regError) console.error('Registration sync error:', regError)

    // 3. Send in-app notification to the guest if they have a profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', data.email.toLowerCase().trim())
      .maybeSingle()

    if (profile?.id) {
      // Fetch event title for notification
      const { data: event } = await supabase
        .from('events')
        .select('title, date_start')
        .eq('id', eventId)
        .single()

      await supabase.from('notifications').insert({
        user_id: profile.id,
        type:    'organizer_invite',
        title:   "You're on the list! 🎉",
        body:    `You've been added to ${event?.title ?? 'an event'}. Check your Tikkit for details.`,
        data:    { event_id: eventId },
      })
    }
  }

  return { error: null }
}

export default function AddGuestPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<'single' | 'import'>('single')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', gender: '',
    is_vip: false, plus_one: false, plus_one_name: '', waitlist: false,
  })

  const update = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await insertGuest(supabase, resolvedParams.id, form)
    if (error) { setError(error.message); setLoading(false) }
    else { router.push(`/dashboard/events/${resolvedParams.id}`); router.refresh() }
  }

  const handleAddAnother = async () => {
    if (!form.full_name) return
    setLoading(true); setError(null)
    const { error } = await insertGuest(supabase, resolvedParams.id, form)
    if (error) { setError(error.message) }
    else { setForm({ full_name: '', email: '', phone: '', gender: '', is_vip: false, plus_one: false, plus_one_name: '', waitlist: false }) }
    setLoading(false)
  }

  const parseCSV = (text: string): ImportRow[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/['"]/g, ''))
    return lines.slice(1).map(line => {
      const values: string[] = []
      let current = ''; let inQuotes = false
      for (const char of line) {
        if (char === '"') inQuotes = !inQuotes
        else if (char === ',' && !inQuotes) { values.push(current.trim()); current = '' }
        else current += char
      }
      values.push(current.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = values[i] ?? '' })
      const full_name = row['full_name'] || row['name'] || ''
      if (!full_name) return { full_name: '', status: 'error', error: 'Missing name' } as ImportRow
      const genderRaw = (row['gender'] || '').toLowerCase()
      const gender = ['male','female','other','prefer_not_to_say'].includes(genderRaw) ? genderRaw : undefined
      return { full_name, email: row['email'] || undefined, phone: row['phone'] || undefined, gender, is_vip: ['true','yes','1'].includes((row['is_vip']||row['vip']||'').toLowerCase()), plus_one: ['true','yes','1'].includes((row['plus_one']||'').toLowerCase()), plus_one_name: row['plus_one_name'] || undefined, status: 'ready' } as ImportRow
    }).filter(r => r.full_name)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setImportRows([]); setImportDone(false); setError(null)
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    const isCSV = file.name.endsWith('.csv')
    if (!isCSV && !isExcel) { setError('Please upload a .csv or .xlsx file'); return }
    if (isCSV) { const text = await file.text(); setImportRows(parseCSV(text)) }
    else {
      try {
        const XLSX = await import('xlsx')
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        const rows: ImportRow[] = json.map(row => {
          const keys = Object.keys(row).reduce((acc, k) => { acc[k.toLowerCase().replace(/\s+/g,'_')] = String(row[k]); return acc }, {} as Record<string, string>)
          const full_name = keys['full_name'] || keys['name'] || ''
          if (!full_name) return { full_name: '', status: 'error', error: 'Missing name' } as ImportRow
          const genderRaw = (keys['gender'] || '').toLowerCase()
          const gender = ['male','female','other','prefer_not_to_say'].includes(genderRaw) ? genderRaw : undefined
          return { full_name, email: keys['email'] || undefined, phone: keys['phone'] || undefined, gender, is_vip: ['true','yes','1'].includes((keys['is_vip']||keys['vip']||'').toLowerCase()), plus_one: ['true','yes','1'].includes((keys['plus_one']||'').toLowerCase()), plus_one_name: keys['plus_one_name'] || undefined, status: 'ready' } as ImportRow
        }).filter(r => r.full_name)
        setImportRows(rows)
      } catch { setError('Failed to parse Excel file. Try saving as CSV instead.') }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImport = async () => {
    const validRows = importRows.filter(r => r.status === 'ready')
    if (!validRows.length) return
    setImporting(true)
    let hasError = false
    for (const row of validRows) {
      const { error } = await insertGuest(supabase, resolvedParams.id, row)
      if (error) { hasError = true; console.error('Import error:', error) }
    }
    if (hasError) setError('Some guests could not be imported')
    else { setImportDone(true); setTimeout(() => { router.push(`/dashboard/events/${resolvedParams.id}`); router.refresh() }, 1500) }
    setImporting(false)
  }

  const downloadTemplate = () => {
    const csv = `full_name,email,phone,gender,is_vip,plus_one,plus_one_name\nAhmed Raza,ahmed@example.com,+92300000000,male,false,false,\nSara Khan,sara@example.com,+92300000001,female,true,true,Ali Khan\n`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'tikkit-guest-import-template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/events/${resolvedParams.id}`} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Add Guests</h2>
          <p className="text-gray-400 text-sm mt-0.5">Add individually or import from a file</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'single', icon: Plus, label: 'Single Guest', desc: 'Add one guest at a time' },
          { key: 'import', icon: FileSpreadsheet, label: 'Import File', desc: 'Upload CSV or Excel sheet' },
        ].map(opt => (
          <button key={opt.key} onClick={() => setMode(opt.key as 'single' | 'import')}
            className={`p-4 rounded-lg border text-left transition-all ${mode === opt.key ? 'border-[#1E5EFF] bg-[#1E5EFF15]' : 'border-white/10 bg-brand-charcoal hover:border-white/20'}`}>
            <opt.icon className={`w-5 h-5 mb-2 ${mode === opt.key ? 'text-[#1E5EFF]' : 'text-gray-400'}`} />
            <p className="font-medium text-white text-sm">{opt.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
          </button>
        ))}
      </div>

      {mode === 'single' && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          <div className="card space-y-4">
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Guest Details</h3>
            <div>
              <label className="label">Full Name *</label>
              <input type="text" className="input" placeholder="Ahmed Raza" value={form.full_name} onChange={e => update('full_name', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="guest@example.com" value={form.email} onChange={e => update('email', e.target.value)} />
                <p className="text-xs text-gray-600 mt-1">If they have a Tikkit account, they'll be notified</p>
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="tel" className="input" placeholder="+92 300 0000000" value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => update('gender', e.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="card space-y-3">
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Guest Options</h3>
            {([
              { key: 'is_vip',   label: 'VIP Guest',         desc: 'Marked with VIP badge on entry',           color: 'yellow' as const },
              { key: 'plus_one', label: 'Plus One',           desc: 'Guest is bringing a +1',                    color: 'blue'   as const },
              { key: 'waitlist', label: 'Add to Waitlist',    desc: 'Guest is on waitlist, not confirmed',        color: 'blue'   as const },
            ]).map(opt => (
              <div key={opt.key}>
                <div className="flex items-center justify-between p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                  <Toggle
                    on={!!form[opt.key as keyof typeof form]}
                    onToggle={() => update(opt.key, !form[opt.key as keyof typeof form])}
                    color={opt.color}
                  />
                </div>
                {opt.key === 'plus_one' && form.plus_one && (
                  <div className="mt-2 animate-slide-up">
                    <input type="text" className="input" placeholder="Plus one's name" value={form.plus_one_name} onChange={e => update('plus_one_name', e.target.value)} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>}

          <div className="flex items-center gap-3 justify-end">
            <Link href={`/dashboard/events/${resolvedParams.id}`} className="btn-secondary">Cancel</Link>
            <button type="button" onClick={handleAddAnother} disabled={loading || !form.full_name} className="btn-secondary">
              <Plus className="w-4 h-4" /> Save & Add Another
            </button>
            <button type="submit" disabled={loading || !form.full_name} className="btn-primary">
              {loading ? 'Adding...' : 'Add Guest'}
            </button>
          </div>
        </form>
      )}

      {mode === 'import' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Download Template</p>
              <p className="text-xs text-gray-500 mt-0.5">Use our CSV template for correct formatting</p>
            </div>
            <button onClick={downloadTemplate} className="btn-secondary text-xs px-3 py-2">
              <Download className="w-3 h-3" /> Template
            </button>
          </div>

          <div onClick={() => fileInputRef.current?.click()}
            className="card border-dashed border-white/20 hover:border-[#1E5EFF]/50 hover:bg-[#1E5EFF08] transition-all cursor-pointer text-center py-10">
            <Upload className="w-8 h-8 text-gray-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-white">Click to upload file</p>
            <p className="text-xs text-gray-500 mt-1">Supports .csv and .xlsx files</p>
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
          </div>

          {importRows.length > 0 && (
            <div className="card space-y-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white text-sm">{importRows.length} guests found</p>
                  <p className="text-xs text-gray-500 mt-0.5">{importRows.filter(r => r.status === 'ready').length} ready · {importRows.filter(r => r.status === 'error').length} errors</p>
                </div>
                <button onClick={() => setImportRows([])} className="text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Name','Email','Gender','VIP','+1','Status'].map(h => <th key={h} className="table-header">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="table-cell font-medium text-white">{row.full_name}</td>
                        <td className="table-cell text-gray-400">{row.email || '—'}</td>
                        <td className="table-cell text-gray-400 capitalize">{row.gender || '—'}</td>
                        <td className="table-cell">{row.is_vip ? '⭐' : '—'}</td>
                        <td className="table-cell">{row.plus_one ? '✓' : '—'}</td>
                        <td className="table-cell">
                          {row.status === 'ready'
                            ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#22c55e20] text-green-400 border border-[#22c55e33]"><Check className="w-3 h-3" /> Ready</span>
                            : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><AlertCircle className="w-3 h-3" /> {row.error}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>}
              {importDone
                ? <div className="flex items-center gap-2 text-green-400 text-sm font-medium justify-center py-2"><Check className="w-4 h-4" /> {importRows.filter(r => r.status === 'ready').length} guests imported!</div>
                : <div className="flex justify-end gap-3">
                    <button onClick={() => setImportRows([])} className="btn-secondary">Cancel</button>
                    <button onClick={handleImport} disabled={importing || importRows.filter(r => r.status === 'ready').length === 0} className="btn-primary">
                      <Upload className="w-4 h-4" />
                      {importing ? 'Importing...' : `Import ${importRows.filter(r => r.status === 'ready').length} Guests`}
                    </button>
                  </div>
              }
            </div>
          )}
        </div>
      )}
    </div>
  )
}

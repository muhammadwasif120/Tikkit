'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle, XCircle, ScanLine, AlertCircle } from 'lucide-react'

type ScanResult = {
  success: boolean
  message: string
  guestName?: string
  isVip?: boolean
  scanType?: 'entry' | 'exit'
}

export default function ScannerPage() {
  const supabase = createClient()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [eventId, setEventId] = useState<string>('')
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([])
  const [scanType, setScanType] = useState<'entry' | 'exit'>('entry')
  const [lastScan, setLastScan] = useState<string>('')
  const cooldownRef = useRef(false)

  useEffect(() => {
    const loadEvents = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('events')
        .select('id, title')
        .eq('organizer_id', user.id)
        .in('status', ['published', 'draft'])
        .order('date_start', { ascending: false })
      setEvents(data ?? [])
      if (data?.[0]) setEventId(data[0].id)
    }
    loadEvents()
  }, [])

  const startScanner = async () => {
    if (!eventId) return
    setScanning(true)
    setResult(null)

    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => {}
      )
    } catch {
      setScanning(false)
      setResult({ success: false, message: 'Camera access denied or unavailable.' })
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
    }
    setScanning(false)
  }

  const handleScan = async (qrCode: string) => {
    if (cooldownRef.current || qrCode === lastScan) return
    cooldownRef.current = true
    setLastScan(qrCode)

    const { data: { user } } = await supabase.auth.getUser()

    // Find guest
    const { data: guest } = await supabase
      .from('guests')
      .select('*')
      .eq('qr_code', qrCode)
      .eq('event_id', eventId)
      .single()

    if (!guest) {
      setResult({ success: false, message: 'QR code not found for this event.' })
      setTimeout(() => { cooldownRef.current = false }, 3000)
      return
    }

    if (guest.status === 'cancelled') {
      setResult({ success: false, message: `${guest.full_name} — ticket cancelled.`, guestName: guest.full_name })
      setTimeout(() => { cooldownRef.current = false }, 3000)
      return
    }

    if (scanType === 'entry' && guest.status === 'checked_in') {
      setResult({ success: false, message: `${guest.full_name} — already checked in.`, guestName: guest.full_name })
      setTimeout(() => { cooldownRef.current = false }, 3000)
      return
    }

    // Update guest status
    const newStatus = scanType === 'entry' ? 'checked_in' : 'checked_out'
    const timeField = scanType === 'entry' ? 'checked_in_at' : 'checked_out_at'

    await supabase.from('guests').update({
      status: newStatus,
      [timeField]: new Date().toISOString(),
    }).eq('id', guest.id)

    // Log scan
    await supabase.from('scan_logs').insert({
      event_id: eventId,
      guest_id: guest.id,
      scanned_by: user?.id,
      scan_type: scanType,
    })

    setResult({
      success: true,
      message: scanType === 'entry' ? 'Entry granted ✓' : 'Exit recorded ✓',
      guestName: guest.full_name,
      isVip: guest.is_vip,
      scanType,
    })

    setTimeout(() => {
      setResult(null)
      cooldownRef.current = false
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
          QR Scanner
        </h2>
        <p className="text-gray-400 text-sm mt-1">Scan guest QR codes for entry and exit</p>
      </div>

      {/* Config */}
      <div className="card space-y-4">
        <div>
          <label className="label">Select Event</label>
          <select
            className="input"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            disabled={scanning}
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Scan Type</label>
          <div className="grid grid-cols-2 gap-3">
            {(['entry', 'exit'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setScanType(type)}
                disabled={scanning}
                className={`p-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                  scanType === type
                    ? type === 'entry'
                      ? 'border-green-500 bg-green-500/10 text-green-400'
                      : 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow'
                    : 'border-white/10 bg-brand-charcoal-light text-gray-400 hover:border-white/20'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {!scanning ? (
          <button onClick={startScanner} disabled={!eventId} className="btn-primary w-full justify-center">
            <ScanLine className="w-4 h-4" />
            Start Scanner
          </button>
        ) : (
          <button onClick={stopScanner} className="btn-danger w-full justify-center">
            Stop Scanner
          </button>
        )}
      </div>

      {/* Camera view */}
      {scanning && (
        <div className="card">
          <div id="qr-reader" className="rounded-lg overflow-hidden" />
          <p className="text-xs text-center text-gray-500 mt-3">
            Point camera at guest QR code
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`card animate-slide-up flex items-start gap-4 ${
          result.success ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
        }`}>
          {result.success ? (
            <CheckCircle className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          )}
          <div>
            {result.guestName && (
              <p className="font-semibold text-white mb-0.5">
                {result.guestName}
                {result.isVip && <span className="badge-yellow ml-2">VIP</span>}
              </p>
            )}
            <p className={`text-sm ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
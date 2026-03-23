'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle, XCircle, ScanLine, X, LogIn, LogOut, Crown, Wifi, Camera, Hash } from 'lucide-react'


const OVERLAY_DURATION = 8000

type ScanResult = {
  success: boolean
  message: string
  guestName?: string
  isVip?: boolean
  scanType?: 'entry' | 'exit'
  email?: string
  ticketType?: string
  checkedInAt?: string
  validDays?: string[]
}

function ScanResultOverlay({ result, onClose }: { result: ScanResult; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, OVERLAY_DURATION)
    return () => clearTimeout(timer)
  }, [onClose])

  const isSuccess = result.success

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className={`relative w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden animate-slide-up ${
        isSuccess ? 'bg-[#0a1a0a] border-green-500/40' : 'bg-[#1a0a0a] border-red-500/40'
      }`}>
        <div className={`h-1 w-full ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`} />
        <div className="p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {isSuccess
                ? <CheckCircle className="w-6 h-6 text-green-400" />
                : <XCircle className="w-6 h-6 text-red-400" />
              }
            </div>
            <div>
              <p className={`font-semibold ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                {result.message}
              </p>
              {result.scanType && (
                <div className="flex items-center gap-1 mt-0.5">
                  {result.scanType === 'entry'
                    ? <LogIn className="w-3 h-3 text-gray-500" />
                    : <LogOut className="w-3 h-3 text-gray-500" />
                  }
                  <span className="text-xs text-gray-500 capitalize">{result.scanType}</span>
                </div>
              )}
            </div>
          </div>
          {result.guestName && (
            <>
              <div className="h-px bg-white/8 mb-5" />
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider">Guest</p>
                    <p className="text-xl font-bold text-white leading-tight" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
                      {result.guestName}
                    </p>
                  </div>
                  {result.isVip && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 shrink-0 mt-1">
                      <Crown className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-xs font-bold text-yellow-400 tracking-wide">VIP</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {result.email && (
                    <div className="col-span-2 bg-white/5 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 mb-0.5">Email</p>
                      <p className="text-sm text-gray-200 truncate">{result.email}</p>
                    </div>
                  )}
                  {result.ticketType && (
                    <div className="bg-white/5 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 mb-0.5">Ticket</p>
                      <p className="text-sm text-gray-200 capitalize">{result.ticketType.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {result.checkedInAt && (
                    <div className="bg-white/5 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 mb-0.5">
                        {result.scanType === 'exit' ? 'Checked Out' : 'Checked In'}
                      </p>
                      <p className="text-sm text-gray-200">
                        {new Date(result.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>
                {result.validDays && result.validDays.length > 0 && (
                  <div className="bg-white/5 rounded-lg px-3 py-2 mt-1">
                    <p className="text-xs text-gray-500 mb-1">Ticket valid for</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.validDays.map(day => (
                        <span key={day} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20">
                          {new Date(day + 'T12:00:00').toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          <div className="mt-5 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ animation: `shrink ${OVERLAY_DURATION}ms linear forwards` }}
            />
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

export default function ScannerPage() {
  const supabase = createClient()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [eventId, setEventId] = useState<string>('')
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([])
  const [scanType, setScanType] = useState<'entry' | 'exit'>('entry')
  const [scanCount, setScanCount] = useState(0)
  const [pendingStart, setPendingStart] = useState(false)

  const cooldownRef = useRef(false)
  const lastScanRef = useRef('')
  const eventIdRef = useRef(eventId)
  const scanTypeRef = useRef(scanType)

  useEffect(() => { eventIdRef.current = eventId }, [eventId])
  useEffect(() => { scanTypeRef.current = scanType }, [scanType])

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

  const resetForNextScan = useCallback(() => {
    setResult(null)
    lastScanRef.current = ''
    cooldownRef.current = false
  }, [])

  const handleScan = useCallback(async (qrCode: string) => {
    if (cooldownRef.current) return
    if (qrCode === lastScanRef.current) return

    cooldownRef.current = true
    lastScanRef.current = qrCode

    const { data: { user } } = await supabase.auth.getUser()
    const currentEventId = eventIdRef.current
    const currentScanType = scanTypeRef.current

    const { data: guest } = await supabase
      .from('guests')
      .select('*')
      .eq('qr_code', qrCode)
      .eq('event_id', currentEventId)
      .single()

    if (!guest) {
      setResult({ success: false, message: 'QR code not found for this event.' })
      setTimeout(resetForNextScan, OVERLAY_DURATION)
      return
    }

    if (guest.status === 'cancelled') {
      setResult({
        success: false,
        message: 'Ticket cancelled.',
        guestName: guest.full_name,
        isVip: guest.is_vip,
        email: guest.email,
      })
      setTimeout(resetForNextScan, OVERLAY_DURATION)
      return
    }

    // Multi-day ticket: check today is a valid day
    const ticketDays: string[] | null = (guest as any).ticket_days ?? null
    if (ticketDays && ticketDays.length > 0) {
      const todayStr = new Date().toISOString().slice(0, 10)
      if (!ticketDays.includes(todayStr)) {
        setResult({
          success: false,
          message: 'Ticket not valid today.',
          guestName: guest.full_name,
          isVip: guest.is_vip,
          email: guest.email,
          validDays: ticketDays,
        })
        setTimeout(resetForNextScan, OVERLAY_DURATION)
        return
      }
    }

    if (currentScanType === 'entry' && guest.status === 'checked_in') {
      setResult({
        success: false,
        message: 'Already checked in.',
        guestName: guest.full_name,
        isVip: guest.is_vip,
        email: guest.email,
        checkedInAt: guest.checked_in_at,
        scanType: currentScanType,
      })
      setTimeout(resetForNextScan, OVERLAY_DURATION)
      return
    }

    const newStatus = currentScanType === 'entry' ? 'checked_in' : 'checked_out'
    const timeField  = currentScanType === 'entry' ? 'checked_in_at' : 'checked_out_at'
    const now = new Date().toISOString()

    await supabase.from('guests').update({ status: newStatus, [timeField]: now }).eq('id', guest.id)
    await supabase.from('scan_logs').insert({
      event_id:   currentEventId,
      guest_id:   guest.id,
      scanned_by: user?.id,
      scan_type:  currentScanType,
    })

    // Write notification directly via authenticated client
    if (user) {
      const isVip = guest.is_vip ?? false
      supabase.from('notifications').insert({
        user_id:  user.id,
        event_id: currentEventId,
        type:     currentScanType === 'entry' ? 'entry_scan' : 'exit_scan',
        title:    currentScanType === 'entry'
                    ? (isVip ? '⭐ VIP arrived' : 'Guest checked in')
                    : 'Guest checked out',
        body:     currentScanType === 'entry'
                    ? `${guest.full_name} has entered the event`
                    : `${guest.full_name} has left the event`,
        metadata: { guestName: guest.full_name, isVip },
      })
    }

    setScanCount((c) => c + 1)
    setResult({
      success:     true,
      message:     currentScanType === 'entry' ? 'Entry granted ✓' : 'Exit recorded ✓',
      guestName:   guest.full_name,
      isVip:       guest.is_vip,
      email:       guest.email,
      ticketType:  guest.ticket_type,
      checkedInAt: now,
      scanType:    currentScanType,
    })

    setTimeout(resetForNextScan, OVERLAY_DURATION)
  }, [supabase, resetForNextScan])

  const startScanner = () => {
    if (!eventId) return
    setResult(null)
    setScanCount(0)
    cooldownRef.current = false
    lastScanRef.current = ''
    setScanning(true)
    setPendingStart(true)
  }

  useEffect(() => {
    if (!pendingStart) return
    setPendingStart(false)

    const initScanner = async () => {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          handleScan,
          () => {}
        )
      } catch {
        setScanning(false)
        setResult({ success: false, message: 'Camera access denied or unavailable.' })
      }
    }

    initScanner()
  }, [pendingStart, handleScan])

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const selectedEvent = events.find((e) => e.id === eventId)

  return (
    <>
      {result && <ScanResultOverlay result={result} onClose={resetForNextScan} />}

      <div className="max-w-lg space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
            QR Scanner
          </h2>
          <p className="text-gray-400 text-sm mt-1">Scan guest QR codes for entry and exit</p>
        </div>

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
                  className={`p-3 rounded-lg border text-sm font-medium capitalize transition-all flex items-center justify-center gap-2 ${
                    scanType === type
                      ? type === 'entry'
                        ? 'border-green-500 bg-green-500/10 text-green-400'
                        : 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow'
                      : 'border-white/10 bg-brand-charcoal-light text-gray-400 hover:border-white/20'
                  }`}
                >
                  {type === 'entry' ? <LogIn className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
                  {type}
                </button>
              ))}
            </div>
          </div>

          {!scanning ? (
            <button onClick={startScanner} disabled={!eventId} className="btn-primary w-full justify-center">
              <Camera className="w-4 h-4" />
              Start Scanner
            </button>
          ) : (
            <button onClick={stopScanner} className="btn-danger w-full justify-center">
              Stop Scanner
            </button>
          )}
        </div>

        {/* Camera view — always in DOM so Html5Qrcode can find the element */}
        <div className={`card overflow-hidden p-0 ${!scanning ? 'hidden' : ''}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Live</span>
              <span className="text-xs text-gray-600">·</span>
              <span className="text-xs text-gray-400 capitalize">{scanType}</span>
            </div>
            <div className="flex items-center gap-3">
              {scanCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Hash className="w-3 h-3" />
                  {scanCount} scanned
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Wifi className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{selectedEvent?.title}</span>
              </div>
            </div>
          </div>

          <div className="relative bg-black">
            <div id="qr-reader" className="w-full" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-52 h-52">
                <span className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-white/70 rounded-tl-sm" />
                <span className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-white/70 rounded-tr-sm" />
                <span className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-white/70 rounded-bl-sm" />
                <span className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-white/70 rounded-br-sm" />
                <div
                  className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"
                  style={{ animation: 'scanline 2s ease-in-out infinite' }}
                />
              </div>
            </div>
          </div>

          <div className="px-4 py-3 flex items-center justify-center gap-2">
            <ScanLine className="w-3.5 h-3.5 text-gray-500" />
            <p className="text-xs text-gray-500">Align QR code within the frame</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scanline {
          0%, 100% { top: 6px; opacity: 0.3; }
          50% { top: calc(100% - 6px); opacity: 1; }
        }
        #qr-reader__header_message,
        #qr-reader__status_span,
        #qr-reader__dashboard,
        #qr-reader img,
        #qr-reader select,
        #qr-reader button {
          display: none !important;
        }
        #qr-reader video {
          width: 100% !important;
          border-radius: 0 !important;
          display: block !important;
        }
        #qr-reader {
          border: none !important;
          padding: 0 !important;
          background: black !important;
        }
      `}</style>
    </>
  )
}
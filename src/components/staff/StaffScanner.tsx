'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Html5Qrcode } from 'html5-qrcode'
import {
  CheckCircle, XCircle, ScanLine, X, LogIn, Crown,
  Camera, Hash, Wifi, WifiOff, Users, ChevronDown, RefreshCw
} from 'lucide-react'
import { syncOfflineCheckins } from '@/app/actions/qrActions'
import { isQRToken, verifyQRToken, importKeyBase64, QRPayload } from '@/lib/qrCrypto'

const OVERLAY_DURATION = 8000

type Invite = {
  token: string
  label: string
  role: string
  organizer_id: string
}

type Event = {
  id: string
  title: string
  date_start: string
  status: string
}

type Guest = {
  id: string
  full_name: string
  email: string
  status: string
  is_vip: boolean
  checked_in_at: string | null
  qr_code: string
}

type ScanResult = {
  success: boolean
  message: string
  guestName?: string
  isVip?: boolean
  email?: string
  ticketType?: string
  checkedInAt?: string
}

function ScanResultOverlay({ result, onClose }: { result: ScanResult; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, OVERLAY_DURATION)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className={`relative w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden ${
        result.success ? 'bg-[#0a1a0a] border-green-500/40' : 'bg-[#1a0a0a] border-red-500/40'
      }`}>
        <div className={`h-1 w-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`} />
        <div className="p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              result.success ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {result.success
                ? <CheckCircle className="w-6 h-6 text-green-400" />
                : <XCircle className="w-6 h-6 text-red-400" />}
            </div>
            <div>
              <p className={`font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.message}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <LogIn className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-500">Entry</span>
              </div>
            </div>
          </div>
          {result.guestName && (
            <>
              <div className="h-px bg-white/8 mb-5" />
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider">Guest</p>
                    <p className="text-xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
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
                      <p className="text-xs text-gray-500 mb-0.5">Checked In</p>
                      <p className="text-sm text-gray-200">
                        {new Date(result.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          <div className="mt-5 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ animation: `shrink ${OVERLAY_DURATION}ms linear forwards` }}
            />
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes shrink { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  )
}

function getOfflineQueue(): Array<{ guestId: string; eventId: string; scannedAt: string; name: string }> {
  try { return JSON.parse(localStorage.getItem('tikkit_checkin_queue') ?? '[]') } catch { return [] }
}
function saveOfflineQueue(q: Array<{ guestId: string; eventId: string; scannedAt: string; name: string }>) {
  localStorage.setItem('tikkit_checkin_queue', JSON.stringify(q))
}

export default function StaffScanner({ invite, events }: { invite: Invite; events: Event[] }) {
  const supabase = createClient()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [eventId, setEventId] = useState(events[0]?.id ?? '')
  const [scanCount, setScanCount] = useState(0)
  const [pendingStart, setPendingStart] = useState(false)
  const [activeTab, setActiveTab] = useState<'scanner' | 'guestlist'>('scanner')
  const [guests, setGuests] = useState<Guest[]>([])
  const [guestsLoading, setGuestsLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSync, setPendingSync] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const cooldownRef = useRef(false)
  const lastScanRef = useRef('')
  const eventIdRef = useRef(eventId)
  useEffect(() => { eventIdRef.current = eventId }, [eventId])

  // Online/offline + auto-sync on reconnect
  useEffect(() => {
    const online = () => {
      setIsOnline(true)
      const queue = getOfflineQueue()
      if (queue.length > 0) {
        setSyncing(true)
        syncOfflineCheckins(queue.map(q => ({ guestId: q.guestId, eventId: q.eventId, scannedAt: q.scannedAt })))
          .then(({ synced }) => {
            if (synced > 0) saveOfflineQueue(getOfflineQueue().filter(q => !queue.find(x => x.guestId === q.guestId && x.scannedAt === q.scannedAt)))
            setPendingSync(getOfflineQueue().length)
          })
          .finally(() => setSyncing(false))
      }
    }
    const offline = () => setIsOnline(false)
    setIsOnline(navigator.onLine)
    setPendingSync(getOfflineQueue().length)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline) }
  }, [])

  // Cache scan key on event select (online)
  useEffect(() => {
    if (!eventId || !isOnline) return
    import('@/app/actions/qrActions').then(({ getEventScanKey }) => {
      getEventScanKey(eventId).then(res => {
        if (res) localStorage.setItem(`scan_key_${eventId}`, res.keyB64)
      })
    })
  }, [eventId, isOnline])

  useEffect(() => {
    if (!eventId || activeTab !== 'guestlist') return
    const load = async () => {
      setGuestsLoading(true)
      const { data } = await supabase
        .from('guests')
        .select('id, full_name, email, status, is_vip, checked_in_at, qr_code')
        .eq('event_id', eventId)
        .order('full_name')
      setGuests((data ?? []) as any)
      setGuestsLoading(false)
    }
    load()
  }, [eventId, activeTab, supabase])

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

    const currentEventId = eventIdRef.current

    // ── OFFLINE PATH ──────────────────────────────────────────────────
    if (!navigator.onLine && isQRToken(qrCode)) {
      const keyB64 = localStorage.getItem(`scan_key_${currentEventId}`)
      if (!keyB64) {
        setResult({ success: false, message: 'Offline — no cached key. Connect to internet first.' })
        setTimeout(resetForNextScan, OVERLAY_DURATION)
        return
      }
      try {
        const key = await importKeyBase64(keyB64)
        const payload: QRPayload | null = await verifyQRToken(qrCode, key)
        if (!payload) {
          setResult({ success: false, message: 'Invalid or expired QR code.' })
          setTimeout(resetForNextScan, OVERLAY_DURATION)
          return
        }
        if (payload.eid !== currentEventId) {
          setResult({ success: false, message: 'QR is for a different event.' })
          setTimeout(resetForNextScan, OVERLAY_DURATION)
          return
        }
        if (payload.days && payload.days.length > 0) {
          const today = new Date().toISOString().slice(0, 10)
          if (!payload.days.includes(today)) {
            setResult({ success: false, message: `Not valid today — ticket is for: ${payload.days.map(d => new Date(d+'T12:00:00').toLocaleDateString([], { weekday:'short', day:'numeric', month:'short' })).join(', ')}`, guestName: payload.name })
            setTimeout(resetForNextScan, OVERLAY_DURATION)
            return
          }
        }
        const now = new Date().toISOString()
        const queue = getOfflineQueue()
        if (!queue.find(q => q.guestId === payload.gid)) {
          queue.push({ guestId: payload.gid, eventId: currentEventId, scannedAt: now, name: payload.name })
          saveOfflineQueue(queue)
          setPendingSync(queue.length)
        }
        setScanCount(c => c + 1)
        setResult({ success: true, message: 'Entry queued (offline) ✓', guestName: payload.name })
        setTimeout(resetForNextScan, OVERLAY_DURATION)
        return
      } catch {
        setResult({ success: false, message: 'Offline verification failed.' })
        setTimeout(resetForNextScan, OVERLAY_DURATION)
        return
      }
    }

    // ── ONLINE PATH ───────────────────────────────────────────────────
    let filterField = 'qr_code'
    let filterValue = qrCode
    if (isQRToken(qrCode)) {
      try {
        const parts = qrCode.split('.')
        const payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/'))) as QRPayload
        filterField = 'id'
        filterValue = payload.gid
      } catch { /* fall through to qr_code lookup */ }
    }

    const { data: guest } = await (supabase as any)
      .from('guests').select('*')
      .eq('event_id', currentEventId)
      .eq(filterField, filterValue)
      .single()

    if (!guest) {
      setResult({ success: false, message: 'QR code not found for this event.' })
      setTimeout(resetForNextScan, OVERLAY_DURATION)
      return
    }

    if (guest.status === 'cancelled') {
      setResult({ success: false, message: 'Ticket cancelled.', guestName: guest.full_name, isVip: guest.is_vip })
      setTimeout(resetForNextScan, OVERLAY_DURATION)
      return
    }

    // Multi-day ticket: check today is a valid day
    const ticketDays: string[] | null = (guest as any).ticket_days ?? null
    if (ticketDays && ticketDays.length > 0) {
      const todayStr = new Date().toISOString().slice(0, 10)
      if (!ticketDays.includes(todayStr)) {
        const fmtDay = (d: string) =>
          new Date(d + 'T12:00:00').toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
        setResult({
          success: false,
          message: `Not valid today — ticket is for: ${ticketDays.map(fmtDay).join(', ')}`,
          guestName: guest.full_name,
          isVip: guest.is_vip,
        })
        setTimeout(resetForNextScan, OVERLAY_DURATION)
        return
      }
    }

    if (guest.status === 'checked_in') {
      setResult({
        success: false, message: 'Already checked in.',
        guestName: guest.full_name, isVip: guest.is_vip,
        email: guest.email, checkedInAt: guest.checked_in_at,
      })
      setTimeout(resetForNextScan, OVERLAY_DURATION)
      return
    }

    const now = new Date().toISOString()
    await supabase.from('guests').update({ status: 'checked_in', checked_in_at: now }).eq('id', guest.id)
    await supabase.from('scan_logs').insert({
      event_id: currentEventId,
      guest_id: guest.id,
      scanned_by: null,
      scan_type: 'entry',
    })

    setScanCount(c => c + 1)
    setResult({
      success: true, message: 'Entry granted ✓',
      guestName: guest.full_name, isVip: guest.is_vip,
      email: guest.email, ticketType: guest.ticket_type,
      checkedInAt: now,
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
    const init = async () => {
      const scanner = new Html5Qrcode('staff-qr-reader')
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
    init()
  }, [pendingStart, handleScan])

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) await scannerRef.current.stop()
    setScanning(false)
  }

  useEffect(() => {
    return () => { if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(() => {}) }
  }, [])

  const selectedEvent = events.find(e => e.id === eventId)

  const statusColor: Record<string, string> = {
    registered:  'text-blue-400 bg-blue-500/10 border-blue-500/20',
    checked_in:  'text-green-400 bg-green-500/10 border-green-500/20',
    checked_out: 'text-gray-400 bg-white/5 border-white/10',
    cancelled:   'text-red-400 bg-red-500/10 border-red-500/20',
  }

  return (
    <>
      {result && <ScanResultOverlay result={result} onClose={resetForNextScan} />}

      <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {invite.label}
              </h2>
              <p className="text-gray-400 text-sm mt-1 capitalize">{invite.role} access</p>
            </div>
            {scanCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <Hash className="w-3 h-3 text-green-400" />
                <span className="text-xs font-semibold text-green-400">{scanCount} scanned</span>
              </div>
            )}
          </div>

          {/* Offline / sync banners */}
          {!isOnline && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-400">Offline Mode</p>
                <p className="text-xs text-amber-400/70">QR codes verified locally and queued for sync.</p>
              </div>
              {pendingSync > 0 && <span className="text-xs font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">{pendingSync} queued</span>}
            </div>
          )}
          {isOnline && syncing && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
              <p className="text-sm text-blue-400">Syncing offline check-ins…</p>
            </div>
          )}

          {/* Event selector */}
          <div className="card">
            <label className="label">Select Event</label>
            <div className="relative">
              <select className="input appearance-none pr-10" value={eventId}
                onChange={e => { setEventId(e.target.value); stopScanner() }} disabled={scanning}>
                {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-brand-charcoal-light rounded-lg p-1 border border-white/5">
            {[
              { key: 'scanner' as const, label: 'Scanner', icon: ScanLine },
              { key: 'guestlist' as const, label: 'Guest List', icon: Users },
            ].map(tab => (
              <button key={tab.key}
                onClick={() => { setActiveTab(tab.key); if (tab.key !== 'scanner') stopScanner() }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.key ? 'bg-[#1E5EFF] text-white' : 'text-gray-400 hover:text-white'
                }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scanner tab */}
          {activeTab === 'scanner' && (
            <div className="space-y-4">
              {!scanning ? (
                <div className="card text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#1E5EFF15] border border-[#1E5EFF20] flex items-center justify-center mx-auto">
                    <ScanLine className="w-8 h-8 text-[#1E5EFF]" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Entry Scanner
                    </p>
                    <p className="text-gray-500 text-sm mt-1">Scan guest QR codes to check them in</p>
                  </div>
                  <button onClick={startScanner} disabled={!eventId} className="btn-primary mx-auto">
                    <Camera className="w-4 h-4" /> Start Scanner
                  </button>
                </div>
              ) : (
                <div className="card overflow-hidden p-0">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-green-400' : 'bg-amber-400'}`} />
                      <span className={`text-xs font-medium ${isOnline ? 'text-green-400' : 'text-amber-400'}`}>
                        {isOnline ? 'Live' : 'Offline'}
                      </span>
                      <span className="text-xs text-gray-600">·</span>
                      <span className="text-xs text-gray-400">Entry</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {scanCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Hash className="w-3 h-3" />{scanCount} scanned
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        <span className="truncate max-w-[120px]">{selectedEvent?.title}</span>
                      </div>
                      <button onClick={stopScanner} className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded border border-red-500/30 hover:bg-red-500/10">
                        Stop
                      </button>
                    </div>
                  </div>
                  <div className="relative bg-black">
                    <div id="staff-qr-reader" className="w-full" />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-52 h-52">
                        <span className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-white/70 rounded-tl-sm" />
                        <span className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-white/70 rounded-tr-sm" />
                        <span className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-white/70 rounded-bl-sm" />
                        <span className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-white/70 rounded-br-sm" />
                        <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"
                          style={{ animation: 'scanline 2s ease-in-out infinite' }} />
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-center gap-2">
                    <ScanLine className="w-3.5 h-3.5 text-gray-500" />
                    <p className="text-xs text-gray-500">Align QR code within the frame</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Guest list tab */}
          {activeTab === 'guestlist' && (
            <div className="card space-y-3">
              {guestsLoading ? (
                <div className="py-12 text-center">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto" />
                </div>
              ) : guests.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No guests for this event</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                    <span>{guests.length} guests</span>
                    <span>{guests.filter(g => g.status === 'checked_in').length} checked in</span>
                  </div>
                  <div className="space-y-2">
                    {guests.map(g => (
                      <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#1E5EFF15] border border-[#1E5EFF20] flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-[#1E5EFF]">{g.full_name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-white truncate">{g.full_name}</p>
                              {g.is_vip && <Crown className="w-3 h-3 text-yellow-400 shrink-0" />}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{g.email}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize shrink-0 ml-2 ${statusColor[g.status] ?? 'text-gray-400 bg-white/5 border-white/10'}`}>
                          {g.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

      </div>
      </div>

      <style jsx>{`
        @keyframes scanline {
          0%, 100% { top: 6px; opacity: 0.3; }
          50% { top: calc(100% - 6px); opacity: 1; }
        }
        #staff-qr-reader__header_message,
        #staff-qr-reader__status_span,
        #staff-qr-reader__dashboard,
        #staff-qr-reader img,
        #staff-qr-reader select,
        #staff-qr-reader button { display: none !important; }
        #staff-qr-reader video { width: 100% !important; border-radius: 0 !important; display: block !important; }
        #staff-qr-reader { border: none !important; padding: 0 !important; background: black !important; }
      `}</style>
    </>
  )
}
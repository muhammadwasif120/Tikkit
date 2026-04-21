'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Html5Qrcode } from 'html5-qrcode'
import {
  CheckCircle, XCircle, ScanLine, X, LogIn, LogOut, Crown,
  Wifi, WifiOff, Camera, RefreshCw, Users, UserCheck, Hourglass,
  UserMinus, Zap, ChevronDown, QrCode,
} from 'lucide-react'
import { syncOfflineCheckins } from '@/app/actions/qrActions'
import { isQRToken, verifyQRToken, importKeyBase64, QRPayload } from '@/lib/qrCrypto'

const OVERLAY_DURATION = 6000

/* ─── Types ──────────────────────────────────────────────────────── */
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

type LogEntry = {
  id: string
  name: string
  isVip: boolean
  time: string
  scanType: 'entry' | 'exit'
  success: boolean
}

type Stats = { total: number; checkedIn: number; checkedOut: number; remaining: number }

/* ─── Scan result overlay ─────────────────────────────────────────── */
function ScanResultOverlay({ result, onClose }: { result: ScanResult; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, OVERLAY_DURATION)
    return () => clearTimeout(timer)
  }, [onClose])

  const ok = result.success
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 380, borderRadius: 20, border: `1px solid ${ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`, background: 'var(--surface-card)', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ height: 3, background: ok ? '#22C55E' : '#EF4444' }} />
        <div style={{ padding: '20px 20px 16px' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={12} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: result.guestName ? 16 : 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}>
              {ok ? <CheckCircle size={22} color="#22C55E" /> : <XCircle size={22} color="#EF4444" />}
            </div>
            <div>
              <p style={{ color: ok ? '#22C55E' : '#EF4444', fontSize: 15, fontWeight: 700, margin: 0 }}>{result.message}</p>
              {result.scanType && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  {result.scanType === 'entry' ? <LogIn size={11} color="var(--text-muted)" /> : <LogOut size={11} color="var(--text-muted)" />}
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'capitalize' }}>{result.scanType}</span>
                </div>
              )}
            </div>
          </div>
          {result.guestName && (
            <>
              <div style={{ height: 1, background: 'var(--guest-border)', marginBottom: 14 }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 3px' }}>Guest</p>
                  <p style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>{result.guestName}</p>
                </div>
                {result.isVip && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20, background: 'rgba(255,199,69,0.12)', border: '1px solid rgba(255,199,69,0.3)', flexShrink: 0, marginTop: 4 }}>
                    <Crown size={12} color="#FFC745" />
                    <span style={{ color: '#FFC745', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em' }}>VIP</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {result.email && (
                  <div style={{ gridColumn: '1 / -1', background: 'var(--guest-surface-2)', borderRadius: 10, padding: '8px 12px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 10, margin: '0 0 2px' }}>Email</p>
                    <p style={{ color: 'var(--text-primary)', fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.email}</p>
                  </div>
                )}
                {result.ticketType && (
                  <div style={{ background: 'var(--guest-surface-2)', borderRadius: 10, padding: '8px 12px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 10, margin: '0 0 2px' }}>Ticket</p>
                    <p style={{ color: 'var(--text-primary)', fontSize: 12, margin: 0, textTransform: 'capitalize' }}>{result.ticketType.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {result.checkedInAt && (
                  <div style={{ background: 'var(--guest-surface-2)', borderRadius: 10, padding: '8px 12px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 10, margin: '0 0 2px' }}>{result.scanType === 'exit' ? 'Checked Out' : 'Checked In'}</p>
                    <p style={{ color: 'var(--text-primary)', fontSize: 12, margin: 0 }}>{new Date(result.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                )}
              </div>
              {result.validDays && result.validDays.length > 0 && (
                <div style={{ background: 'var(--guest-surface-2)', borderRadius: 10, padding: '8px 12px', marginTop: 8 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 10, margin: '0 0 6px' }}>Valid for</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {result.validDays.map(day => (
                      <span key={day} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(var(--brand-blue-rgb),0.12)', color: 'var(--brand-blue)', border: '1px solid rgba(var(--brand-blue-rgb),0.2)' }}>
                        {new Date(day + 'T12:00:00').toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          <div style={{ marginTop: 14, height: 3, borderRadius: 99, background: 'var(--guest-border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: ok ? '#22C55E' : '#EF4444', animation: `shrinkbar ${OVERLAY_DURATION}ms linear forwards` }} />
          </div>
        </div>
      </div>
      <style jsx>{`@keyframes shrinkbar { from { width: 100%; } to { width: 0%; } }`}</style>
    </div>
  )
}

/* ─── Offline queue helpers ───────────────────────────────────────── */
type OfflineCheckin = { guestId: string; eventId: string; scannedAt: string; name: string }
function getOfflineQueue(): OfflineCheckin[] {
  try { return JSON.parse(localStorage.getItem('tikkit_checkin_queue') ?? '[]') } catch { return [] }
}
function saveOfflineQueue(q: OfflineCheckin[]) {
  localStorage.setItem('tikkit_checkin_queue', JSON.stringify(q))
}

/* ─── Main Page ───────────────────────────────────────────────────── */
export default function ScannerPage() {
  const supabase = createClient()
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [eventId, setEventId] = useState<string>('')
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([])
  const [scanType, setScanType] = useState<'entry' | 'exit'>('entry')
  const [pendingStart, setPendingStart] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSync, setPendingSync] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [log, setLog] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, checkedIn: 0, checkedOut: 0, remaining: 0 })
  const [staffCopied, setStaffCopied] = useState(false)

  const cooldownRef = useRef(false)
  const lastScanRef = useRef('')
  const eventIdRef = useRef(eventId)
  const scanTypeRef = useRef(scanType)

  useEffect(() => { eventIdRef.current = eventId }, [eventId])
  useEffect(() => { scanTypeRef.current = scanType }, [scanType])

  /* ── Load events ── */
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('events').select('id, title').eq('organizer_id', user.id)
        .in('status', ['published', 'draft']).order('date_start', { ascending: false })
      setEvents(data ?? [])
      if (data?.[0]) setEventId(data[0].id)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Load stats + realtime ── */
  useEffect(() => {
    if (!eventId) return
    const loadStats = async () => {
      const { data } = await supabase.from('guests').select('id, status').eq('event_id', eventId)
      if (!data) return
      const total = data.length
      const checkedIn = data.filter(g => g.status === 'checked_in').length
      const checkedOut = data.filter(g => g.status === 'checked_out').length
      setStats({ total, checkedIn, checkedOut, remaining: total - checkedIn - checkedOut })
    }
    loadStats()
    const channel = supabase
      .channel(`scanner-guests-${eventId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'guests', filter: `event_id=eq.${eventId}` }, () => loadStats())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  /* ── Online/offline ── */
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

  /* ── Cache scan key ── */
  useEffect(() => {
    if (!eventId || !isOnline) return
    import('@/app/actions/qrActions').then(({ getEventScanKey }) => {
      getEventScanKey(eventId).then(res => {
        if (res) localStorage.setItem(`scan_key_${eventId}`, res.keyB64)
      })
    })
  }, [eventId, isOnline])

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
    const currentScanType = scanTypeRef.current
    const now = new Date().toISOString()

    /* ── OFFLINE PATH ── */
    if (!navigator.onLine && isQRToken(qrCode)) {
      const keyB64 = localStorage.getItem(`scan_key_${currentEventId}`)
      if (!keyB64) {
        setResult({ success: false, message: 'Offline — no cached key. Connect first.' })
        setTimeout(resetForNextScan, OVERLAY_DURATION); return
      }
      try {
        const key = await importKeyBase64(keyB64)
        const payload: QRPayload | null = await verifyQRToken(qrCode, key)
        if (!payload) { setResult({ success: false, message: 'Invalid or expired QR code.' }); setTimeout(resetForNextScan, OVERLAY_DURATION); return }
        if (payload.eid !== currentEventId) { setResult({ success: false, message: 'QR is for a different event.' }); setTimeout(resetForNextScan, OVERLAY_DURATION); return }
        if (payload.days && payload.days.length > 0) {
          const today = new Date().toISOString().slice(0, 10)
          if (!payload.days.includes(today)) { setResult({ success: false, message: 'Ticket not valid today.', guestName: payload.name, validDays: payload.days }); setTimeout(resetForNextScan, OVERLAY_DURATION); return }
        }
        const queue = getOfflineQueue()
        if (!queue.find(q => q.guestId === payload.gid)) {
          queue.push({ guestId: payload.gid, eventId: currentEventId, scannedAt: now, name: payload.name })
          saveOfflineQueue(queue)
          setPendingSync(queue.length)
        }
        setLog(prev => [{ id: `${payload.gid}-${now}`, name: payload.name, isVip: false, time: now, scanType: currentScanType, success: true }, ...prev.slice(0, 49)])
        setStats(s => ({ ...s, checkedIn: s.checkedIn + 1, remaining: Math.max(0, s.remaining - 1) }))
        setResult({ success: true, message: 'Entry queued (offline) ✓', guestName: payload.name, scanType: currentScanType })
        setTimeout(resetForNextScan, OVERLAY_DURATION); return
      } catch {
        setResult({ success: false, message: 'Offline verification failed.' })
        setTimeout(resetForNextScan, OVERLAY_DURATION); return
      }
    }

    /* ── ONLINE PATH ── */
    const { data: { user } } = await supabase.auth.getUser()

    let filterField = 'qr_code', filterValue = qrCode
    if (isQRToken(qrCode)) {
      try {
        const parts = qrCode.split('.')
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as QRPayload
        filterField = 'id'; filterValue = payload.gid
      } catch { /* fall through */ }
    }

    const { data: guest } = await (supabase as any).from('guests').select('*')
      .eq('event_id', currentEventId).eq(filterField, filterValue).single()

    if (!guest) {
      setLog(prev => [{ id: `notfound-${now}`, name: 'Unknown QR', isVip: false, time: now, scanType: currentScanType, success: false }, ...prev.slice(0, 49)])
      setResult({ success: false, message: 'QR code not found for this event.' })
      setTimeout(resetForNextScan, OVERLAY_DURATION); return
    }

    if (guest.status === 'cancelled') {
      setLog(prev => [{ id: guest.id + now, name: guest.full_name, isVip: guest.is_vip, time: now, scanType: currentScanType, success: false }, ...prev.slice(0, 49)])
      setResult({ success: false, message: 'Ticket cancelled.', guestName: guest.full_name, isVip: guest.is_vip, email: guest.email })
      setTimeout(resetForNextScan, OVERLAY_DURATION); return
    }

    const ticketDays: string[] | null = (guest as any).ticket_days ?? null
    if (ticketDays && ticketDays.length > 0) {
      const todayStr = new Date().toISOString().slice(0, 10)
      if (!ticketDays.includes(todayStr)) {
        setLog(prev => [{ id: guest.id + now, name: guest.full_name, isVip: guest.is_vip, time: now, scanType: currentScanType, success: false }, ...prev.slice(0, 49)])
        setResult({ success: false, message: 'Ticket not valid today.', guestName: guest.full_name, isVip: guest.is_vip, email: guest.email, validDays: ticketDays })
        setTimeout(resetForNextScan, OVERLAY_DURATION); return
      }
    }

    if (currentScanType === 'entry' && guest.status === 'checked_in') {
      setLog(prev => [{ id: guest.id + now, name: guest.full_name, isVip: guest.is_vip, time: now, scanType: currentScanType, success: false }, ...prev.slice(0, 49)])
      setResult({ success: false, message: 'Already checked in.', guestName: guest.full_name, isVip: guest.is_vip, email: guest.email, checkedInAt: guest.checked_in_at, scanType: currentScanType })
      setTimeout(resetForNextScan, OVERLAY_DURATION); return
    }

    const newStatus = currentScanType === 'entry' ? 'checked_in' : 'checked_out'
    const timeField  = currentScanType === 'entry' ? 'checked_in_at' : 'checked_out_at'
    await supabase.from('guests').update({ status: newStatus, [timeField]: now }).eq('id', guest.id)
    await supabase.from('scan_logs').insert({ event_id: currentEventId, guest_id: guest.id, scanned_by: user?.id, scan_type: currentScanType })

    if (user) {
      const isVip = guest.is_vip ?? false
      supabase.from('notifications').insert({
        user_id: user.id, event_id: currentEventId,
        type: currentScanType === 'entry' ? 'entry_scan' : 'exit_scan',
        title: currentScanType === 'entry' ? (isVip ? '⭐ VIP arrived' : 'Guest checked in') : 'Guest checked out',
        body: currentScanType === 'entry' ? `${guest.full_name} has entered the event` : `${guest.full_name} has left the event`,
        metadata: { guestName: guest.full_name, isVip },
      })
    }

    setLog(prev => [{ id: guest.id + now, name: guest.full_name, isVip: guest.is_vip ?? false, time: now, scanType: currentScanType, success: true }, ...prev.slice(0, 49)])
    if (currentScanType === 'entry') {
      setStats(s => ({ ...s, checkedIn: s.checkedIn + 1, remaining: Math.max(0, s.remaining - 1) }))
    } else {
      setStats(s => ({ ...s, checkedOut: s.checkedOut + 1, checkedIn: Math.max(0, s.checkedIn - 1) }))
    }

    setResult({ success: true, message: currentScanType === 'entry' ? 'Entry granted ✓' : 'Exit recorded ✓', guestName: guest.full_name, isVip: guest.is_vip, email: guest.email, ticketType: guest.ticket_type, checkedInAt: now, scanType: currentScanType })
    setTimeout(resetForNextScan, OVERLAY_DURATION)
  }, [supabase, resetForNextScan])

  const startScanner = () => {
    if (!eventId) return
    setResult(null)
    cooldownRef.current = false
    lastScanRef.current = ''
    setScanning(true)
    setPendingStart(true)
  }

  useEffect(() => {
    if (!pendingStart) return
    setPendingStart(false)
    const init = async () => {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      try {
        await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 220, height: 220 } }, handleScan, () => {})
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

  const copyStaffLink = () => {
    const link = `${window.location.origin}/staff/scan?event=${eventId}`
    navigator.clipboard.writeText(link).then(() => {
      setStaffCopied(true)
      setTimeout(() => setStaffCopied(false), 2000)
    })
  }

  const selectedEvent = events.find(e => e.id === eventId)

  return (
    <>
      {result && <ScanResultOverlay result={result} onClose={resetForNextScan} />}

      <div style={{ maxWidth: 900 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: 'rgba(var(--brand-blue-rgb),0.12)', border: '1px solid rgba(var(--brand-blue-rgb),0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QrCode size={20} color="var(--brand-blue)" />
          </div>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-2xl)', fontWeight: 800, margin: '0 0 2px', fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>QR Scanner</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', margin: 0 }}>Scan guest QR codes at the venue entrance.</p>
          </div>
        </div>

        {/* ── Status banners ── */}
        {!isOnline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 14 }}>
            <WifiOff size={14} color="#F59E0B" />
            <div style={{ flex: 1 }}>
              <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 700, margin: 0 }}>Offline Mode</p>
              <p style={{ color: 'rgba(245,158,11,0.6)', fontSize: 11, margin: 0 }}>Verifying locally — queued for sync on reconnect.</p>
            </div>
            {pendingSync > 0 && <span style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{pendingSync} queued</span>}
          </div>
        )}
        {isOnline && syncing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(var(--brand-blue-rgb),0.08)', border: '1px solid rgba(var(--brand-blue-rgb),0.2)', marginBottom: 14 }}>
            <RefreshCw size={14} color="var(--brand-blue)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--brand-blue)', fontSize: 13, margin: 0 }}>Syncing offline check-ins…</p>
          </div>
        )}

        {/* ── Controls bar ── */}
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--guest-border)', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
          {/* Event row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 4px' }}>Event</p>
              <div style={{ position: 'relative' }}>
                <select
                  value={eventId}
                  onChange={e => setEventId(e.target.value)}
                  disabled={scanning}
                  style={{ width: '100%', background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, padding: '8px 32px 8px 12px', outline: 'none', cursor: scanning ? 'not-allowed' : 'pointer', appearance: 'none' }}
                >
                  {events.map(e => <option key={e.id} value={e.id} style={{ background: 'var(--surface-card)' }}>{e.title}</option>)}
                  {events.length === 0 && <option disabled>No active events</option>}
                </select>
                <ChevronDown size={14} color="var(--text-muted)" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          {/* Scan type + action */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              {(['entry', 'exit'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setScanType(type)}
                  disabled={scanning}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    cursor: scanning ? 'not-allowed' : 'pointer', textTransform: 'capitalize',
                    border: scanType === type
                      ? type === 'entry' ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,199,69,0.4)'
                      : '1px solid var(--guest-border)',
                    background: scanType === type
                      ? type === 'entry' ? 'rgba(34,197,94,0.1)' : 'rgba(255,199,69,0.1)'
                      : 'var(--guest-surface-2)',
                    color: scanType === type
                      ? type === 'entry' ? '#22C55E' : '#FFC745'
                      : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {type === 'entry' ? <LogIn size={13} /> : <LogOut size={13} />}
                  {type}
                </button>
              ))}
            </div>

            {!scanning ? (
              <button
                onClick={startScanner}
                disabled={!eventId}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'var(--brand-blue)', border: 'none', borderRadius: 10, color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: !eventId ? 'not-allowed' : 'pointer', flexShrink: 0, boxShadow: '0 4px 16px rgba(var(--brand-blue-rgb),0.3)', opacity: !eventId ? 0.5 : 1 }}
              >
                <Camera size={15} /> Start
              </button>
            ) : (
              <button
                onClick={stopScanner}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
              >
                Stop
              </button>
            )}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }} className="stats-grid">
          {[
            { label: 'Total', value: stats.total, color: '#4D82FF', icon: Users },
            { label: 'Checked In', value: stats.checkedIn, color: '#22C55E', icon: UserCheck },
            { label: 'Checked Out', value: stats.checkedOut, color: '#A78BFA', icon: UserMinus },
            { label: 'Remaining', value: stats.remaining, color: '#FFC745', icon: Hourglass },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} style={{ background: 'var(--surface-card)', border: '1px solid var(--guest-border)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Icon size={12} color={color} />
                <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>{label}</p>
              </div>
              <p style={{ color, fontSize: 28, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Main grid: Scanner | Log (stacks on mobile) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="scanner-grid">

          {/* ── Camera panel ── */}
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--guest-border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid var(--guest-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: scanning ? (isOnline ? '#22C55E' : '#F59E0B') : 'var(--guest-border)', display: 'inline-block', ...(scanning ? { animation: 'pulse 2s infinite' } : {}) }} />
                <span style={{ color: scanning ? (isOnline ? '#22C55E' : '#F59E0B') : 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>
                  {scanning ? (isOnline ? 'Live' : 'Offline') : 'Ready to scan'}
                </span>
                {scanning && selectedEvent && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>· {selectedEvent.title}</span>
                )}
              </div>
              {scanning && (
                <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
                  {scanType}
                </span>
              )}
            </div>

            {/* Camera */}
            <div style={{ position: 'relative', background: 'black', minHeight: 260 }}>
              <div id="qr-reader" style={{ display: scanning ? 'block' : 'none', width: '100%' }} />
              {scanning && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: 200, height: 200 }}>
                    <span style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, borderTop: '2px solid rgba(255,255,255,0.75)', borderLeft: '2px solid rgba(255,255,255,0.75)', borderRadius: '3px 0 0 0' }} />
                    <span style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, borderTop: '2px solid rgba(255,255,255,0.75)', borderRight: '2px solid rgba(255,255,255,0.75)', borderRadius: '0 3px 0 0' }} />
                    <span style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, borderBottom: '2px solid rgba(255,255,255,0.75)', borderLeft: '2px solid rgba(255,255,255,0.75)', borderRadius: '0 0 0 3px' }} />
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderBottom: '2px solid rgba(255,255,255,0.75)', borderRight: '2px solid rgba(255,255,255,0.75)', borderRadius: '0 0 3px 0' }} />
                    <div style={{ position: 'absolute', left: 6, right: 6, height: 2, background: 'linear-gradient(90deg, transparent, #22C55E, transparent)', animation: 'scanline 2s ease-in-out infinite' }} />
                  </div>
                </div>
              )}
              {!scanning && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 12, padding: 24 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(var(--brand-blue-rgb),0.07)', border: '1px solid rgba(var(--brand-blue-rgb),0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCode size={32} color="var(--brand-blue)" style={{ opacity: 0.45 }} />
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0, textAlign: 'center' }}>Select an event and press Start</p>
                </div>
              )}
            </div>

            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, borderTop: '1px solid var(--guest-border)' }}>
              <ScanLine size={12} color="var(--text-muted)" />
              <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: 0 }}>{scanning ? 'Align QR code within the frame' : 'Camera inactive'}</p>
            </div>
          </div>

          {/* ── Right column: Log + Staff Mode ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Check-in Log */}
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--guest-border)', borderRadius: 16, overflow: 'hidden', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--guest-border)' }}>
                <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>Check-in Log</p>
                {log.length > 0 && (
                  <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                    {log.filter(e => e.success && e.scanType === 'entry').length} in
                  </span>
                )}
              </div>
              <div style={{ overflowY: 'auto', maxHeight: 240 }}>
                {log.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', gap: 8 }}>
                    <QrCode size={28} color="var(--text-muted)" />
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0, textAlign: 'center' }}>No scans yet</p>
                  </div>
                ) : (
                  log.map((entry, i) => (
                    <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < log.length - 1 ? '1px solid var(--guest-border)' : 'none', background: i === 0 ? 'var(--guest-surface-2)' : 'transparent' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: entry.success ? (entry.scanType === 'entry' ? '#22C55E' : '#A78BFA') : '#EF4444', ...(i === 0 ? { boxShadow: `0 0 6px ${entry.success ? (entry.scanType === 'entry' ? 'rgba(34,197,94,0.7)' : 'rgba(167,139,250,0.7)') : 'rgba(239,68,68,0.7)'}` } : {}) }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <p style={{ color: entry.success ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</p>
                          {entry.isVip && <Crown size={10} color="#FFC745" />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                          {entry.scanType === 'entry' ? <LogIn size={9} color={entry.success ? '#22C55E' : 'var(--text-muted)'} /> : <LogOut size={9} color={entry.success ? '#A78BFA' : 'var(--text-muted)'} />}
                          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{entry.scanType}</span>
                        </div>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, flexShrink: 0 }}>
                        {new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Staff Mode */}
            <div style={{ background: 'rgba(var(--brand-blue-rgb),0.05)', border: '1px solid rgba(var(--brand-blue-rgb),0.16)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <Zap size={13} color="#FFC745" />
                <p style={{ color: '#FFC745', fontSize: 13, fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>Staff Mode</p>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 10px', lineHeight: 1.55 }}>
                Share a scanner-only link with your team — they can scan without seeing your dashboard or guest data.
              </p>
              {eventId && (
                <button onClick={copyStaffLink} style={{ background: staffCopied ? 'rgba(34,197,94,0.1)' : 'var(--guest-surface-2)', border: `1px solid ${staffCopied ? 'rgba(34,197,94,0.3)' : 'var(--guest-border)'}`, borderRadius: 8, padding: '7px 12px', color: staffCopied ? '#22C55E' : 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', width: '100%', transition: 'all 0.2s' }}>
                  {staffCopied ? '✓ Link copied!' : 'Copy staff scanner link'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scanline {
          0%, 100% { top: 4px; opacity: 0.3; }
          50% { top: calc(100% - 4px); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        #qr-reader__header_message,
        #qr-reader__status_span,
        #qr-reader__dashboard,
        #qr-reader img,
        #qr-reader select,
        #qr-reader button { display: none !important; }
        #qr-reader video { width: 100% !important; border-radius: 0 !important; display: block !important; }
        #qr-reader { border: none !important; padding: 0 !important; background: black !important; }

        @media (max-width: 640px) {
          .scanner-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </>
  )
}

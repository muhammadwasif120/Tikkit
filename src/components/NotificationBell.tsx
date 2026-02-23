'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X, Check, CheckCheck, UserPlus, UserMinus, LogIn, LogOut, CreditCard, Zap, Flag } from 'lucide-react'
import type { NotificationType } from '@/lib/supabase/notification-types'

type Notification = {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  metadata: Record<string, unknown>
  read: boolean
  dismissed: boolean
  created_at: string
  event_id: string | null
}

// ─── Icon + colour per type ───────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; colour: string; dot: string }> = {
  guest_signup:        { icon: <UserPlus className="w-4 h-4" />,   colour: 'text-green-400',  dot: 'bg-green-400' },
  guest_cancellation:  { icon: <UserMinus className="w-4 h-4" />,  colour: 'text-red-400',    dot: 'bg-red-400' },
  entry_scan:          { icon: <LogIn className="w-4 h-4" />,      colour: 'text-blue-400',   dot: 'bg-blue-400' },
  exit_scan:           { icon: <LogOut className="w-4 h-4" />,     colour: 'text-gray-400',   dot: 'bg-gray-400' },
  vendor_payment_due:  { icon: <CreditCard className="w-4 h-4" />, colour: 'text-yellow-400', dot: 'bg-yellow-400' },
  event_going_live:    { icon: <Zap className="w-4 h-4" />,        colour: 'text-purple-400', dot: 'bg-purple-400' },
  event_ended:         { icon: <Flag className="w-4 h-4" />,       colour: 'text-orange-400', dot: 'bg-orange-400' },
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // ── Load initial notifications ──────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(30)

    console.log('[Bell] loaded notifications:', data?.length, 'unread:', data?.filter(n => !n.read).length)
    setNotifications(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadNotifications() }, [loadNotifications])

  // ── Supabase Realtime subscription ─────────────────────────────────────────
  useEffect(() => {
    let userId = ''

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userId = user.id

      const channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            const notif = payload.new as Notification
            if (notif.user_id !== userId) return
            if (notif.dismissed) return
            setNotifications((prev) => [notif, ...prev.slice(0, 29)])
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications' },
          (payload) => {
            const notif = payload.new as Notification
            if (notif.user_id !== userId) return
            if (notif.dismissed) {
              setNotifications((prev) => prev.filter((n) => n.id !== notif.id))
            } else {
              setNotifications((prev) => prev.map((n) => n.id === notif.id ? notif : n))
            }
          }
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }

    const cleanup = setup()
    return () => { cleanup.then((fn) => fn?.()) }
  }, [supabase])

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Mark single as read ─────────────────────────────────────────────────────
  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }

  // ── Mark all as read ────────────────────────────────────────────────────────
  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (!unreadIds.length) return
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/10 bg-[#1C1E26] shadow-2xl z-50 overflow-hidden animate-slide-up">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-brand-yellow/20 text-brand-yellow text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/8"
                >
                  <CheckCheck className="w-3 h-3" />
                  All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded text-gray-500 hover:text-white transition-colors hover:bg-white/8"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-600 mt-1">They'll show up here as activity happens</p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = TYPE_CONFIG[n.type]
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer group ${
                      n.read ? 'opacity-60 hover:opacity-80' : 'hover:bg-white/4'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-white/6 ${config.colour}`}>
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${n.read ? 'text-gray-400' : 'text-white font-medium'}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${config.dot}`} />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.created_at)}</p>
                    </div>

                    {/* Mark read on hover */}
                    {!n.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(n.id) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/8 text-center">
              <p className="text-xs text-gray-600">Showing last {notifications.length} notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
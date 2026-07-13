'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from './masterActions'

export type SupportMessage = {
  id: string
  user_id: string
  user_name: string
  user_type: 'organizer' | 'attendee'
  message: string
  sender: 'user' | 'admin'
  created_at: string
}

export type SupportConversationSummary = {
  userId: string
  userName: string
  userType: string
  lastMessage: string
  lastAt: string
  unreadCount: number
}

// ─── User Actions ─────────────────────────────────────────────────────────────

export async function getSupportConversation(): Promise<SupportMessage[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await (supabase as any)
    .from('support_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  return (data ?? []) as SupportMessage[]
}

export async function sendSupportMessage(message: string): Promise<{ error?: string }> {
  if (!message.trim()) return { error: 'Message cannot be empty' }
  if (message.length > 2000) return { error: 'Message must be 2,000 characters or fewer.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Rate limit: 20 messages per user per minute
  const { checkRateLimit } = await import('@/lib/rateLimit')
  if (!(await checkRateLimit(`support:${user.id}`, 20, 60_000))) {
    return { error: 'Too many messages. Please wait before sending more.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()
  const userName = (profile as any)?.full_name ?? 'Unknown User'
  const userType = (profile as any)?.role === 'organizer' ? 'organizer' : 'attendee'

  const { error } = await (supabase as any)
    .from('support_messages')
    .insert({ user_id: user.id, user_name: userName, user_type: userType, message: message.trim(), sender: 'user' })
  return { error: error?.message }
}

export async function getUnreadSupportMessageCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0
  const { count } = await (supabase as any)
    .from('support_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('sender', 'admin')
    .eq('read_by_user', false)
  return count ?? 0
}

export async function markSupportMessagesRead(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await (supabase as any)
    .from('support_messages')
    .update({ read_by_user: true })
    .eq('user_id', user.id)
    .eq('sender', 'admin')
    .eq('read_by_user', false)
}

// ─── Admin Actions ────────────────────────────────────────────────────────────

export async function getAdminSupportConversations(): Promise<SupportConversationSummary[]> {
  await requireAdmin()
  const admin = createAdminClient()
  const { data } = await (admin as any)
    .from('support_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000)

  const map = new Map<string, SupportConversationSummary & { seenFirst: boolean }>()
  for (const msg of (data ?? [])) {
    if (!map.has(msg.user_id)) {
      map.set(msg.user_id, {
        userId: msg.user_id,
        userName: msg.user_name,
        userType: msg.user_type,
        lastMessage: msg.message,
        lastAt: msg.created_at,
        unreadCount: msg.read_by_admin === false && msg.sender === 'user' ? 1 : 0,
        seenFirst: true,
      })
    } else if (msg.read_by_admin === false && msg.sender === 'user') {
      map.get(msg.user_id)!.unreadCount++
    }
  }
  return Array.from(map.values())
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
    .map(({ seenFirst: _, ...rest }) => rest)
}

export async function getAdminSupportThread(userId: string): Promise<SupportMessage[]> {
  await requireAdmin()
  const admin = createAdminClient()
  const { data } = await (admin as any)
    .from('support_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  return (data ?? []) as SupportMessage[]
}

export async function sendAdminSupportReply(
  userId: string,
  userName: string,
  userType: 'organizer' | 'attendee',
  message: string
): Promise<{ error?: string }> {
  if (!message.trim()) return { error: 'Message cannot be empty' }
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await (admin as any)
    .from('support_messages')
    .insert({ user_id: userId, user_name: userName, user_type: userType, message: message.trim(), sender: 'admin' })
  return { error: error?.message }
}

export async function markAdminSupportMessagesRead(userId: string): Promise<void> {
  await requireAdmin()
  const admin = createAdminClient()
  await (admin as any)
    .from('support_messages')
    .update({ read_by_admin: true })
    .eq('user_id', userId)
    .eq('sender', 'user')
    .eq('read_by_admin', false)
}

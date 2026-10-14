'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export type WaitlistModule = 'vendor' | 'venue' | 'artist'

export async function joinModuleWaitlist(data: {
  module: WaitlistModule
  full_name: string
  email: string
  phone?: string
}) {
  if (!['vendor', 'venue', 'artist'].includes(data.module))
    return { error: 'Invalid module.' }
  if (!data.full_name || data.full_name.trim().length < 2)
    return { error: 'Please enter your full name.' }
  if (data.full_name.length > 100)
    return { error: 'Name must be 100 characters or fewer.' }
  if (!data.email || data.email.length > 255)
    return { error: 'Please enter a valid email address.' }
  if (data.phone && data.phone.length > 20)
    return { error: 'Phone number is too long.' }

  const ip = await getClientIp()
  if (!(await checkRateLimit(`module-waitlist:${ip}`, 3, 3_600_000))) {
    return { error: 'Too many requests. Please try again later.' }
  }

  const supabase = createAdminClient()

  const { error } = await (supabase as any)
    .from('module_waitlist')
    .insert({
      module: data.module,
      full_name: data.full_name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      source: 'module_home',
    })

  if (error) {
    if (error.code === '23505') {
      return { error: "You're already on this waitlist! We'll be in touch soon." }
    }
    return { error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}

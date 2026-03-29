'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export type AppTheme = 'noir' | 'corporate' | 'pulse'

const VALID_THEMES: AppTheme[] = ['noir', 'corporate', 'pulse']

export async function updateTheme(theme: AppTheme) {
  if (!VALID_THEMES.includes(theme)) return { error: 'Invalid theme' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await (supabase as any).from('profiles').update({ ui_theme: theme }).eq('id', user.id)

  const cookieStore = await cookies()
  cookieStore.set('tikkit-theme', theme, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })

  return { success: true }
}

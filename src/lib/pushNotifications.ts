/**
 * Server-side Expo push notification sender.
 * Called alongside createNotification() for in-app events that need push.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

type PushMessage = {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  badge?: number
}

export async function sendExpoPush(messages: PushMessage[]) {
  if (messages.length === 0) return

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    })
    if (!res.ok) {
      console.error('Expo push error:', await res.text())
    }
  } catch (err) {
    console.error('Failed to send push:', err)
  }
}

/**
 * Send a push notification to a single user by looking up their stored push tokens.
 * Uses the admin Supabase client to bypass RLS.
 */
export async function pushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const { createAdminClient } = await import('./supabase/admin')
  const admin = createAdminClient()

  const { data: tokens } = await (admin as any)
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId)

  if (!tokens || tokens.length === 0) return

  const messages: PushMessage[] = tokens.map((t: { token: string }) => ({
    to: t.token,
    title,
    body,
    data,
    sound: 'default',
  }))

  await sendExpoPush(messages)
}

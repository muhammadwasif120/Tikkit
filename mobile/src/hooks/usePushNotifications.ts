/**
 * usePushNotifications
 *
 * Requests notification permissions, registers the Expo push token with the
 * backend, and wires up foreground + tap handlers so the app can navigate
 * in response to received notifications.
 *
 * Call once inside a logged-in layout (e.g. the root navigator after the user
 * is authenticated). The hook is a no-op if the user is not logged in.
 */
import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { registerPushToken } from '@/lib/api'

// Show notifications as banners even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export function usePushNotifications(userId: string | null | undefined) {
  const router = useRouter()
  const notifListener  = useRef<Notifications.EventSubscription | null>(null)
  const responseListener = useRef<Notifications.EventSubscription | null>(null)

  useEffect(() => {
    if (!userId) return  // not logged in — nothing to do

    let tokenString: string | null = null

    const register = async () => {
      try {
        // 1. Request permission
        const { status: existing } = await Notifications.getPermissionsAsync()
        let finalStatus = existing

        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync()
          finalStatus = status
        }

        if (finalStatus !== 'granted') return  // user declined — silently skip

        // 2. Android: create a default notification channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Tikkit',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#1E5EFF',
          })
        }

        // 3. Get the Expo push token
        const { data: token } = await Notifications.getExpoPushTokenAsync({
          projectId: 'tikkit',  // matches app.json slug
        })
        tokenString = token

        // 4. Register with our backend
        const platform = Platform.OS === 'ios' ? 'ios'
          : Platform.OS === 'android' ? 'android'
          : 'web'

        await registerPushToken(token, platform)
      } catch (e) {
        if (__DEV__) console.warn('[Push] registration failed:', e)
      }
    }

    register()

    // 5. Handle notifications received while app is in foreground
    notifListener.current = Notifications.addNotificationReceivedListener(notification => {
      if (__DEV__) console.log('[Push] foreground notification:', notification.request.content)
    })

    // 6. Handle taps on notifications (foreground & background)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, any>
      handleNotificationTap(data, router)
    })

    return () => {
      notifListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [userId])
}

/**
 * Navigate to the relevant screen based on notification data.
 * The backend sends `{ type, eventId, registrationId }` in the data payload.
 */
function handleNotificationTap(
  data: Record<string, any>,
  router: ReturnType<typeof useRouter>
) {
  if (!data?.type) return

  switch (data.type) {
    case 'registration_approved':
    case 'registration_rejected':
      // Go to registrations list
      router.push('/(guest)/registrations')
      break

    case 'payment_confirmed':
    case 'payment_reminder':
      router.push('/(guest)/registrations')
      break

    case 'event_reminder':
      if (data.eventId) router.push(`/(guest)/event/${data.eventId}`)
      else router.push('/(guest)/explore')
      break

    case 'waitlist_promoted':
      router.push('/(guest)/registrations')
      break

    default:
      router.push('/(guest)/notifications')
  }
}

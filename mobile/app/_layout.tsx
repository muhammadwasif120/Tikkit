import { useEffect } from 'react'
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import * as Linking from 'expo-linking'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/Toast'
import { useFonts } from '@/hooks/useFonts'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { supabase } from '@/lib/supabase'
import { colors } from '@/theme'

SplashScreen.preventAutoHideAsync()

/**
 * Parse a deep link URL from Supabase and exchange it for a session.
 * Returns the auth `type` string ('signup', 'recovery', etc.) so callers
 * can navigate accordingly.
 *
 * Handles both:
 *   • Implicit flow  — tikkit://#access_token=...&refresh_token=...&type=signup|recovery
 *   • PKCE flow      — tikkit://?code=...
 */
async function handleDeepLink(url: string): Promise<string | null> {
  try {
    if (__DEV__) console.log('[DeepLink]', url)

    // Fragment-style (implicit): #access_token=...
    const hashIdx = url.indexOf('#')
    if (hashIdx !== -1) {
      const params = new URLSearchParams(url.slice(hashIdx + 1))
      const accessToken  = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type         = params.get('type')
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        return type
      }
    }

    // Query-style (PKCE): ?code=...
    const queryIdx = url.indexOf('?')
    if (queryIdx !== -1) {
      const params = new URLSearchParams(url.slice(queryIdx + 1))
      const code = params.get('code')
      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
        return null
      }
    }
  } catch (e) {
    if (__DEV__) console.warn('[DeepLink] failed to handle:', e)
  }
  return null
}

function RootNavigator() {
  const { user, profile, loading, profileLoading } = useAuth()
  const router = useRouter()
  const segments = useSegments()
  const [fontsLoaded, fontError] = useFonts()

  // Register device for push notifications once user is logged in
  usePushNotifications(user?.id)

  const fontsReady = fontsLoaded || !!fontError
  const appReady = fontsReady && !loading

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync()
  }, [fontsReady])

  // Handle deep links (email verification + password reset)
  useEffect(() => {
    const process = async (url: string) => {
      const type = await handleDeepLink(url)
      // Password reset link: route user to the reset screen
      if (type === 'recovery') {
        router.replace('/(auth)/reset-password')
      }
    }

    // Cold start: app opened via deep link
    Linking.getInitialURL().then(url => { if (url) process(url) })

    // Warm: app already open, link tapped
    const sub = Linking.addEventListener('url', ({ url }) => process(url))
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (!appReady) return

    const inAuthGroup = segments[0] === '(auth)'
    const inGuestGroup = segments[0] === '(guest)'
    const inOrgGroup = segments[0] === '(organizer)'

    if (!user) {
      if (!inAuthGroup) router.replace('/(auth)/login')
      return
    }

    // Profile fetch still in-flight — keep splash up until it resolves.
    if (profileLoading) return

    // Profile fetch finished but returned nothing (no DB row / RLS blocked).
    // Sign the user out so they land on login rather than hanging forever.
    if (!profile) {
      if (__DEV__) console.warn('[Nav] profile is null after fetch — signing out')
      supabase.auth.signOut()
      return
    }

    if (__DEV__) console.log('[Nav] routing | role:', profile.role, '| segments:', segments[0])

    const role = profile.role ?? ''
    const isOrganizer = ['organizer', 'staff', 'admin'].includes(role)

    if (isOrganizer && !inOrgGroup) {
      router.replace('/(organizer)/dashboard')
    } else if (!isOrganizer && !inGuestGroup) {
      router.replace('/(guest)/explore')
    }
  }, [user, profile, profileLoading, appReady, segments])

  // Show splash until fully ready.
  // Also show it while profile fetch is in-flight after sign-in.
  const showSplash = !appReady || (!!user && profileLoading)

  if (showSplash) {
    return (
      <View style={s.splash}>
        <Image source={require('../assets/icon.png')} style={s.icon} resizeMode="contain" />
        <Text style={s.title}>TIKKIT X</Text>
        <ActivityIndicator color={colors.blue} size="small" style={s.spinner} />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.pageBg } }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="(auth)" options={{ animation: 'none' }} />
      <Stack.Screen name="(guest)" options={{ animation: 'none' }} />
      <Stack.Screen name="(organizer)" options={{ animation: 'none' }} />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RootNavigator />
      </ToastProvider>
    </AuthProvider>
  )
}

const s = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 22,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  spinner: {
    marginTop: 8,
  },
})

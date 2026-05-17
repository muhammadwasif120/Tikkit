import { useEffect } from 'react'
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { useFonts } from '@/hooks/useFonts'
import { colors } from '@/theme'

SplashScreen.preventAutoHideAsync()

function RootNavigator() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()
  const [fontsLoaded, fontError] = useFonts()

  const fontsReady = fontsLoaded || !!fontError
  const appReady = fontsReady && !loading

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync()
  }, [fontsReady])

  useEffect(() => {
    if (!appReady) return

    const inAuthGroup = segments[0] === '(auth)'
    const inGuestGroup = segments[0] === '(guest)'
    const inOrgGroup = segments[0] === '(organizer)'

    if (!user) {
      if (!inAuthGroup) router.replace('/(auth)/login')
      return
    }

    // Profile fetch still in-flight (sign-in via onAuthStateChange path) — wait.
    // With the new AuthContext, INITIAL_SESSION always awaits the fetch before
    // setting loading=false, so this guard only ever fires during a fresh sign-in.
    if (!profile) return

    if (__DEV__) console.log('[Nav] routing | role:', profile.role, '| segments:', segments[0])

    const role = profile.role ?? ''
    const isOrganizer = ['organizer', 'staff', 'admin'].includes(role)

    if (isOrganizer && !inOrgGroup) {
      router.replace('/(organizer)/dashboard')
    } else if (!isOrganizer && !inGuestGroup) {
      router.replace('/(guest)/explore')
    }
  }, [user, profile, appReady, segments])

  // Show splash until fully ready.
  // Also show it while user is known but profile is still loading (sign-in transition)
  // so we never briefly render the wrong route group.
  const showSplash = !appReady || (!!user && !profile)

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
      <RootNavigator />
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

import { Stack } from 'expo-router'
import { colors } from '@/theme'

export default function TeamLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.pageBg } }}>
      <Stack.Screen name="enter" />
      <Stack.Screen name="[token]" />
    </Stack>
  )
}

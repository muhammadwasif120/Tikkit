import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { colors, radius } from '@/theme'

// A shared team_invites link looks like https://www.tikkitx.com/staff/<token>
// (or tikkit://team/<token>) — accept either the full link or just the token.
function extractToken(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const match = trimmed.match(/(?:staff|team)\/([a-zA-Z0-9-]+)\/?$/)
  if (match) return match[1]
  // Bare token (UUID-shaped or not) — accept as-is.
  if (/^[a-zA-Z0-9-]+$/.test(trimmed)) return trimmed
  return null
}

export default function TeamEnterScreen() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleContinue = () => {
    const token = extractToken(value)
    if (!token) {
      setError('Paste the full link or the code your organizer sent you.')
      return
    }
    setError(null)
    router.push(`/(team)/${token}` as any)
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={s.content}>
          <View style={s.iconWrap}>
            <Ionicons name="key-outline" size={26} color={colors.blue} />
          </View>
          <Text style={s.title}>Team access</Text>
          <Text style={s.subtitle}>
            Paste the link your organizer shared with you, or type the access code directly.
          </Text>

          <TextInput
            style={s.input}
            placeholder="tikkitx.com/staff/... or code"
            placeholderTextColor={colors.textDisabled}
            value={value}
            onChangeText={setValue}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleContinue}
          />
          {error && <Text style={s.error}>{error}</Text>}

          <TouchableOpacity style={[s.button, !value.trim() && s.buttonDisabled]} onPress={handleContinue} disabled={!value.trim()}>
            <Text style={s.buttonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.navy950} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  backBtn: { marginLeft: 16, marginTop: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  iconWrap: {
    width: 52, height: 52, borderRadius: radius.lg,
    backgroundColor: colors.blueSubtle, borderWidth: 1, borderColor: colors.blueBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { color: colors.textPrimary, fontSize: 24, fontFamily: 'Sora_700Bold', marginBottom: 8 },
  subtitle: { color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 20, marginBottom: 24 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14,
    color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular',
  },
  error: { color: colors.error, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 8 },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.blue, borderRadius: radius.md, paddingVertical: 14, marginTop: 20,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.navy950, fontSize: 15, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
})

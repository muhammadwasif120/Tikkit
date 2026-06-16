import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { colors, radius } from '@/theme'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [done,        setDone]        = useState(false)

  const [pwFocused,  setPwFocused]  = useState(false)
  const [cfFocused,  setCfFocused]  = useState(false)

  const submit = async () => {
    setError(null)
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError("Passwords don't match")
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) setError(err.message)
      else setDone(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        <View style={[s.content, { paddingBottom: insets.bottom + 32 }]}>

          {done ? (
            /* ── Success ── */
            <View style={s.doneWrap}>
              <View style={s.doneIcon}>
                <Ionicons name="checkmark-circle" size={40} color={colors.success} />
              </View>
              <Text style={s.doneTitle}>Password updated!</Text>
              <Text style={s.doneSub}>You can now sign in with your new password.</Text>
              <TouchableOpacity
                style={[s.btn, { backgroundColor: colors.blue, shadowColor: colors.blue }]}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.85}
              >
                <Text style={s.btnText}>Go to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Form ── */
            <>
              {/* Lock icon */}
              <View style={s.iconWrap}>
                <Ionicons name="lock-open-outline" size={28} color={colors.blue} />
              </View>

              <Text style={s.headline}>Create new password</Text>
              <Text style={s.sub}>Choose something strong that you'll remember</Text>

              {/* Password field */}
              <View style={[
                s.fieldWrap,
                pwFocused && { borderColor: colors.blue, backgroundColor: colors.blueSubtle },
              ]}>
                <Ionicons name="lock-closed-outline" size={16} color={pwFocused ? colors.blue : colors.textMuted} style={s.fieldIcon} />
                <TextInput
                  style={s.fieldInput}
                  placeholder="New password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPw(v => !v)} style={s.eyeBtn}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Confirm field */}
              <View style={[
                s.fieldWrap,
                cfFocused && { borderColor: colors.blue, backgroundColor: colors.blueSubtle },
                !cfFocused && confirm.length > 0 && confirm === password && { borderColor: colors.success + '55' },
              ]}>
                <Ionicons name="lock-closed-outline" size={16} color={cfFocused ? colors.blue : colors.textMuted} style={s.fieldIcon} />
                <TextInput
                  style={s.fieldInput}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textMuted}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  onFocus={() => setCfFocused(true)}
                  onBlur={() => setCfFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={s.eyeBtn}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
                {!cfFocused && confirm.length > 0 && confirm === password && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                )}
              </View>

              {/* Strength hint */}
              <Text style={s.hint}>Minimum 8 characters</Text>

              {/* Error */}
              {error && (
                <View style={s.errorWrap}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              )}

              {/* CTA */}
              <TouchableOpacity
                style={[
                  s.btn, { backgroundColor: colors.blue, shadowColor: colors.blue },
                  (loading || password.length < 8 || password !== confirm) && s.btnDisabled,
                ]}
                onPress={submit}
                disabled={loading || password.length < 8 || password !== confirm}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={colors.white} size="small" />
                  : <Text style={s.btnText}>Set New Password</Text>
                }
              </TouchableOpacity>
            </>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  content: {
    flex: 1, paddingHorizontal: 24,
    justifyContent: 'center', gap: 14,
  },

  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.blueSubtle, borderWidth: 1, borderColor: colors.blueBorder,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 4,
  },
  headline: {
    color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold',
    textAlign: 'center', letterSpacing: -0.3,
  },
  sub: {
    color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_400Regular',
    textAlign: 'center', marginBottom: 8,
  },

  fieldWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, gap: 10,
  },
  fieldIcon: { width: 18 },
  fieldInput: {
    flex: 1, color: colors.textPrimary,
    fontSize: 15, fontFamily: 'DMSans_400Regular', paddingVertical: 14,
  },
  eyeBtn: { padding: 4 },

  hint: {
    color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular',
    marginTop: -6,
  },

  errorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.errorSubtle, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.error + '30',
  },
  errorText: { color: colors.error, fontSize: 13, fontFamily: 'DMSans_400Regular', flex: 1 },

  btn: {
    borderRadius: radius.md, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  btnText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold', fontWeight: '700' },

  // Done state
  doneWrap: { alignItems: 'center', gap: 14 },
  doneIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.successSubtle, borderWidth: 1, borderColor: colors.success + '40',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  doneTitle: { color: colors.textPrimary, fontSize: 24, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  doneSub: { color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center' },
})

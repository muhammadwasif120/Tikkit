import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Image,
} from 'react-native'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/contexts/AuthContext'
import { colors, radius } from '@/theme'

type Role    = 'organizer' | 'attendee' | null
type SubMode = 'login' | 'signup'

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()

  const [role,        setRole]        = useState<Role>(null)
  const [subMode,     setSubMode]     = useState<SubMode>('login')
  const [step,        setStep]        = useState(1)

  // Step 1 fields
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPw,      setShowPw]      = useState(false)

  // Step 2 fields
  const [phone,       setPhone]       = useState('')
  const [city,        setCity]        = useState('')
  const [company,     setCompany]     = useState('')
  const [gender,      setGender]      = useState('')

  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const accent = role === 'organizer' ? colors.blue : colors.gold

  const reset = (r: Role, m: SubMode) => {
    setRole(r); setSubMode(m); setStep(1)
    setName(''); setEmail(''); setPassword(''); setPhone('')
    setCity(''); setCompany(''); setGender(''); setError(null)
  }

  // ─── Role selection ───────────────────────────────────────────────────────

  if (!role) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={s.roleScroll} showsVerticalScrollIndicator={false}>
          <Image source={require('../../assets/icon.png')} style={s.roleLogo} resizeMode="contain" />
          <Text style={s.roleHeadline}>Welcome to TIKKIT X</Text>
          <Text style={s.roleSub}>How do you want to use the app?</Text>

          <TouchableOpacity style={[s.roleCard, s.roleCardBlue]} onPress={() => reset('organizer', 'login')} activeOpacity={0.85}>
            <View style={s.roleIconWrap}>
              <Ionicons name="calendar-outline" size={28} color={colors.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.roleCardLabel}>RUN THE SCENE</Text>
              <Text style={s.roleCardTitle}>Organizer Access</Text>
              <Text style={s.roleCardSub}>Create events, manage guests, scan QR codes at the door</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.blue} />
          </TouchableOpacity>

          <TouchableOpacity style={[s.roleCard, s.roleCardGold]} onPress={() => reset('attendee', 'login')} activeOpacity={0.85}>
            <View style={[s.roleIconWrap, { backgroundColor: colors.goldSubtle }]}>
              <Ionicons name="ticket-outline" size={28} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.roleCardLabel, { color: colors.gold }]}>JOIN THE SCENE</Text>
              <Text style={s.roleCardTitle}>Attendee Access</Text>
              <Text style={s.roleCardSub}>Discover events, grab tickets, show your QR at the door</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.gold} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    setError(null)
    if (!email.trim() || !password) return setError('Please fill in all fields')
    setLoading(true)
    try {
      const { error: err } = await signIn(email.trim(), password)
      if (err) setError(err)
    } finally {
      setLoading(false)
    }
  }

  // ─── Signup step 1 → 2 ───────────────────────────────────────────────────

  const handleStep1 = () => {
    setError(null)
    if (!name.trim()) return setError('Please enter your full name')
    if (!email.trim()) return setError('Please enter your email')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    setStep(2)
  }

  // ─── Signup submit ────────────────────────────────────────────────────────

  const handleSignup = async () => {
    setError(null)
    if (role === 'attendee' && !gender) return setError('Please select your gender')
    setLoading(true)
    try {
      const { error: err } = await signUp(email.trim(), password, name.trim(), {
        role: role === 'organizer' ? 'organizer' : 'guest',
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        company: role === 'organizer' ? company.trim() || undefined : undefined,
        gender: role === 'attendee' ? gender || undefined : undefined,
      })
      if (err) {
        setError(err)
      } else {
        Alert.alert('Check your email', 'We sent a confirmation link. Please verify before signing in.')
        reset(role, 'login')
      }
    } finally {
      setLoading(false)
    }
  }

  // ─── Shared UI ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={() => step === 2 ? setStep(1) : setRole(null)}>
            <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
            <Text style={s.backText}>{step === 2 ? 'Back' : 'Change role'}</Text>
          </TouchableOpacity>

          {/* Role badge */}
          <View style={[s.roleBadge, { backgroundColor: accent + '18', borderColor: accent + '44' }]}>
            <View style={[s.roleDot, { backgroundColor: accent }]} />
            <Text style={[s.roleBadgeText, { color: accent }]}>
              {role === 'organizer' ? 'ORGANIZER ACCESS' : 'ATTENDEE ACCESS'}
            </Text>
          </View>

          {/* Headline */}
          <Text style={s.headline}>
            {subMode === 'login'
              ? (role === 'organizer' ? 'Run the scene.' : 'Join the scene.')
              : step === 1 ? 'Create your account' : 'Complete your profile'}
          </Text>
          <Text style={s.subtext}>
            {subMode === 'login'
              ? `Sign in to your ${role === 'organizer' ? 'organizer' : 'attendee'} account`
              : step === 1 ? 'Start with your basics' : 'Almost there — a few more details'}
          </Text>

          {/* Login / Signup tabs */}
          {step === 1 && (
            <View style={s.tabs}>
              {(['login', 'signup'] as SubMode[]).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.tab, subMode === t && { backgroundColor: accent, borderColor: accent }]}
                  onPress={() => { setSubMode(t); setError(null) }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.tabText, subMode === t && { color: colors.white }]}>
                    {t === 'login' ? 'Sign In' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <View style={s.form}>
              {subMode === 'signup' && (
                <Field icon="person-outline" placeholder="Full Name" value={name} onChangeText={setName} accent={accent} />
              )}
              <Field icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" accent={accent} />
              <PasswordField value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw(v => !v)} accent={accent} />

              {error && <ErrorBanner message={error} />}

              <CTA
                label={subMode === 'login' ? 'Sign In' : 'Continue'}
                accent={accent}
                loading={loading}
                onPress={subMode === 'login' ? handleLogin : handleStep1}
              />
            </View>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <View style={s.form}>
              <Field icon="call-outline" placeholder="Phone number (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" accent={accent} />
              <Field icon="location-outline" placeholder="Your city (optional)" value={city} onChangeText={setCity} accent={accent} />

              {role === 'organizer' && (
                <Field icon="business-outline" placeholder="Company or brand name" value={company} onChangeText={setCompany} accent={accent} />
              )}

              {role === 'attendee' && (
                <View style={s.genderWrap}>
                  <Text style={s.genderLabel}>Gender</Text>
                  <View style={s.genderRow}>
                    {GENDERS.map(g => (
                      <TouchableOpacity
                        key={g}
                        style={[s.genderBtn, gender === g && { backgroundColor: accent + '22', borderColor: accent }]}
                        onPress={() => setGender(g)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.genderBtnText, gender === g && { color: accent }]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {error && <ErrorBanner message={error} />}

              <CTA label="Create Account" accent={accent} loading={loading} onPress={handleSignup} />

              <Text style={s.skipText} onPress={handleSignup}>
                Skip for now
              </Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── Small components ─────────────────────────────────────────────────────────

function Field({ icon, placeholder, value, onChangeText, keyboardType, accent }: {
  icon: keyof typeof Ionicons.glyphMap
  placeholder: string
  value: string
  onChangeText: (v: string) => void
  keyboardType?: 'email-address' | 'phone-pad' | 'default'
  accent: string
}) {
  return (
    <View style={sf.wrap}>
      <Ionicons name={icon} size={16} color={colors.textMuted} style={sf.icon} />
      <TextInput
        style={sf.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        autoCorrect={false}
      />
    </View>
  )
}

function PasswordField({ value, onChange, show, onToggle, accent }: {
  value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; accent: string
}) {
  return (
    <View style={sf.wrap}>
      <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} style={sf.icon} />
      <TextInput
        style={[sf.input, { flex: 1 }]}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChange}
        secureTextEntry={!show}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={onToggle} style={sf.eye}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={sf.error}>
      <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
      <Text style={sf.errorText}>{message}</Text>
    </View>
  )
}

function CTA({ label, accent, loading, onPress }: { label: string; accent: string; loading: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[sf.cta, { backgroundColor: accent }]} onPress={onPress} disabled={loading} activeOpacity={0.85}>
      {loading
        ? <ActivityIndicator color={colors.white} size="small" />
        : <Text style={sf.ctaText}>{label}</Text>
      }
    </TouchableOpacity>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  // Role selection
  roleScroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 },
  roleLogo: { width: 80, height: 80, borderRadius: 18, marginBottom: 24 },
  roleHeadline: { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 6 },
  roleSub: { color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center', marginBottom: 36 },
  roleCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: radius.lg, borderWidth: 1, padding: 18, marginBottom: 14,
  },
  roleCardBlue: { backgroundColor: colors.blueSubtle, borderColor: colors.blueBorder },
  roleCardGold: { backgroundColor: colors.goldSubtle, borderColor: colors.gold + '44' },
  roleIconWrap: {
    width: 52, height: 52, borderRadius: radius.md,
    backgroundColor: colors.blueSubtle,
    alignItems: 'center', justifyContent: 'center',
  },
  roleCardLabel: { color: colors.blue, fontSize: 10, fontFamily: 'DMSans_500Medium', letterSpacing: 1.5, marginBottom: 2 },
  roleCardTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold', marginBottom: 2 },
  roleCardSub: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular', lineHeight: 17 },

  // Auth form
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 },
  backText: { color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_400Regular' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderRadius: radius.full,
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16,
  },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleBadgeText: { fontSize: 10, fontFamily: 'DMSans_500Medium', letterSpacing: 1 },

  headline: { color: colors.textPrimary, fontSize: 28, fontFamily: 'Poppins_700Bold', marginBottom: 6 },
  subtext: { color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_400Regular', marginBottom: 24 },

  tabs: {
    flexDirection: 'row', gap: 8, marginBottom: 24,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 4,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: radius.sm,
    alignItems: 'center', borderWidth: 1, borderColor: 'transparent',
  },
  tabText: { color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_500Medium' },

  form: { gap: 12 },

  genderWrap: { gap: 8 },
  genderLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_500Medium' },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genderBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  genderBtnText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular' },

  skipText: {
    color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular',
    textAlign: 'center', marginTop: 8, textDecorationLine: 'underline',
  },
})

const sf = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13, gap: 10,
  },
  icon: { width: 18 },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15, fontFamily: 'DMSans_400Regular' },
  eye: { padding: 2 },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.errorSubtle, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  errorText: { color: colors.error, fontSize: 13, fontFamily: 'DMSans_400Regular', flex: 1 },
  cta: {
    borderRadius: radius.md, paddingVertical: 15,
    alignItems: 'center', marginTop: 4,
  },
  ctaText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold', fontWeight: '700' },
})

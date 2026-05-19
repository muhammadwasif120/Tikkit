import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Image, Dimensions, Animated, Modal,
} from 'react-native'
import { useState, useRef, useEffect } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as SecureStore from 'expo-secure-store'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { colors, radius } from '@/theme'

const { width: SCREEN_W } = Dimensions.get('window')

const PAKISTAN_CITIES = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan',
  'Peshawar','Quetta','Sialkot','Gujranwala','Hyderabad','Abbottabad',
  'Bahawalpur','Sargodha','Sukkur','Larkana','Sheikhupura','Jhang',
  'Rahim Yar Khan','Gujrat','Mardan','Kasur','Dera Ghazi Khan',
  'Nawabshah','Mingora','Other',
]

/* ─── Types ───────────────────────────────────────────────────────────────── */
type Role   = 'organizer' | 'attendee'
type Screen = 'welcome' | 'signin' | 'signup1' | 'signup2' | 'signup3' | 'verify' | 'forgot'

/* ─── Category interests ─────────────────────────────────────────────────── */
const SCENE_CATS = [
  { slug: 'music',         label: 'Music',         emoji: '🎵' },
  { slug: 'tech',          label: 'Tech',           emoji: '💻' },
  { slug: 'art-culture',   label: 'Arts',           emoji: '🎨' },
  { slug: 'sports',        label: 'Sports',         emoji: '⚽' },
  { slug: 'food-drink',    label: 'Food & Drink',   emoji: '🍔' },
  { slug: 'business',      label: 'Business',       emoji: '💼' },
  { slug: 'fashion',       label: 'Fashion',        emoji: '👗' },
  { slug: 'networking',    label: 'Networking',     emoji: '🤝' },
  { slug: 'education',     label: 'Education',      emoji: '📚' },
  { slug: 'gaming',        label: 'Gaming',         emoji: '🎮' },
  { slug: 'health-wellness', label: 'Health',       emoji: '💪' },
  { slug: 'comedy',        label: 'Comedy',         emoji: '😂' },
  { slug: 'social',        label: 'Social',         emoji: '🥳' },
  { slug: 'charity',       label: 'Charity',        emoji: '❤️' },
]

/* ─── Focused input ──────────────────────────────────────────────────────── */
function AuthField({
  icon, placeholder, value, onChangeText,
  keyboardType, secureTextEntry, accent, autoCapitalize,
  rightElement,
}: {
  icon: keyof typeof Ionicons.glyphMap
  placeholder: string
  value: string
  onChangeText: (v: string) => void
  keyboardType?: 'email-address' | 'phone-pad' | 'default'
  secureTextEntry?: boolean
  accent: string
  autoCapitalize?: 'none' | 'words' | 'sentences'
  rightElement?: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={[
      af.wrap,
      focused && { borderColor: accent, backgroundColor: accent + '0D' },
      !focused && value.length > 0 && { borderColor: colors.success + '55' },
    ]}>
      <Ionicons
        name={icon}
        size={16}
        color={focused ? accent : colors.textMuted}
        style={af.icon}
      />
      <TextInput
        style={af.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? (keyboardType === 'email-address' ? 'none' : 'words')}
        autoCorrect={false}
        secureTextEntry={secureTextEntry}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightElement}
      {!focused && value.length > 0 && !rightElement && (
        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
      )}
    </View>
  )
}
const af = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, gap: 10,
  },
  icon: { width: 18 },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15, fontFamily: 'DMSans_400Regular', paddingVertical: 14 },
})

/* ─── Step dots ──────────────────────────────────────────────────────────── */
function StepDots({ total, current, accent }: { total: number; current: number; accent: string }) {
  return (
    <View style={sd.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            sd.dot,
            i === current - 1 && { width: 20, backgroundColor: accent },
            i < current - 1 && { backgroundColor: accent + '55' },
          ]}
        />
      ))}
    </View>
  )
}
const sd = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surface3 },
})

/* ─── Error banner ───────────────────────────────────────────────────────── */
function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={eb.wrap}>
      <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
      <Text style={eb.text}>{message}</Text>
    </View>
  )
}
const eb = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.errorSubtle, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.error + '30',
  },
  text: { color: colors.error, fontSize: 13, fontFamily: 'DMSans_400Regular', flex: 1 },
})

/* ─── CTA button ─────────────────────────────────────────────────────────── */
function CTAButton({
  label, accent, loading, onPress, disabled,
}: {
  label: string; accent: string; loading?: boolean; onPress: () => void; disabled?: boolean
}) {
  return (
    <TouchableOpacity
      style={[cta.btn, { backgroundColor: accent }, (disabled || loading) && cta.disabled]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.85}
    >
      {loading
        ? <ActivityIndicator color={colors.white} size="small" />
        : <Text style={cta.text}>{label}</Text>
      }
    </TouchableOpacity>
  )
}
const cta = StyleSheet.create({
  btn: {
    borderRadius: radius.md, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  disabled: { opacity: 0.55, shadowOpacity: 0, elevation: 0 },
  text: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold', fontWeight: '700' },
})

/* ─── Main screen ─────────────────────────────────────────────────────────── */
export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const insets = useSafeAreaInsets()

  const [screen, setScreen]       = useState<Screen>('welcome')
  const [role,   setRole]         = useState<Role>('attendee')
  const accent = role === 'organizer' ? colors.blue : colors.gold

  // Credentials
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)

  // Interests (attendee)
  const [interests, setInterests] = useState<string[]>([])

  // Brand (organizer)
  const [company,  setCompany]  = useState('')

  // Details
  const [phone,    setPhone]    = useState('')
  const [city,     setCity]     = useState('')
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [gender,   setGender]   = useState('')

  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const clearError = () => setError(null)

  const goToRole = (r: Role, s: Screen) => {
    setRole(r)
    clearError()
    setScreen(s)
  }

  const goBack = () => {
    clearError()
    if (screen === 'signin' || screen === 'signup1') return setScreen('welcome')
    if (screen === 'signup2') return setScreen('signup1')
    if (screen === 'signup3') return setScreen('signup2')
    setScreen('welcome')
  }

  /* ── Sign in ────────────────────────────────────────────────────────────── */
  const handleSignIn = async () => {
    clearError()
    if (!email.trim() || !password) return setError('Please fill in all fields')
    setLoading(true)
    try {
      const { error: err } = await signIn(email.trim(), password)
      if (err) setError(err)
    } finally {
      setLoading(false)
    }
  }

  /* ── Signup step 1 ──────────────────────────────────────────────────────── */
  const handleStep1 = () => {
    clearError()
    if (!name.trim()) return setError('Please enter your full name')
    if (!email.trim()) return setError('Please enter your email address')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    setScreen('signup2')
  }

  /* ── Signup step 2 ──────────────────────────────────────────────────────── */
  const handleStep2 = () => {
    clearError()
    setScreen('signup3')
  }

  /* ── Final submit ───────────────────────────────────────────────────────── */
  const handleSignUp = async () => {
    clearError()
    setLoading(true)
    try {
      // Save interests to SecureStore so explore can seed them after email confirm
      if (role === 'attendee' && interests.length > 0) {
        await SecureStore.setItemAsync('pending_interests', JSON.stringify(interests))
      }

      const { error: err } = await signUp(email.trim(), password, name.trim(), {
        role: role === 'organizer' ? 'organizer' : 'guest',
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        company: role === 'organizer' ? (company.trim() || undefined) : undefined,
        gender: role === 'attendee' ? (gender || undefined) : undefined,
      })
      if (err) {
        setError(err)
      } else {
        setScreen('verify')
      }
    } finally {
      setLoading(false)
    }
  }

  /* ── Forgot password ───────────────────────────────────────────────────── */
  const [forgotEmail,    setForgotEmail]    = useState('')
  const [forgotSent,     setForgotSent]     = useState(false)

  const handleForgotPw = () => { clearError(); setScreen('forgot') }

  const sendResetLink = async () => {
    clearError()
    if (!forgotEmail.trim()) return setError('Please enter your email address')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim(),
        { redirectTo: 'tikkit://reset-password' }
      )
      if (err) setError(err.message)
      else setForgotSent(true)
    } finally {
      setLoading(false)
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SCREENS
  ══════════════════════════════════════════════════════════════════════════ */

  /* ── Welcome ────────────────────────────────────────────────────────────── */
  if (screen === 'welcome') {
    return (
      <View style={w.root}>
        <StatusBar style="light" />
        <ScrollView
          contentContainerStyle={[w.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo area */}
          <View style={w.logoWrap}>
            <View style={w.logoGlow} />
            <Image source={require('../../assets/icon.png')} style={w.logo} resizeMode="contain" />
          </View>
          <Text style={w.wordmark}>TIKKIT</Text>
          <Text style={w.tagline}>Your scene starts here.</Text>

          {/* Role cards */}
          <RoleCard
            icon="ticket-outline"
            accent={colors.gold}
            tagline="JOIN THE SCENE"
            title="Attend Events"
            description="Discover events, grab tickets, show your QR at the door"
            onSignIn={() => goToRole('attendee', 'signin')}
            onJoin={() => goToRole('attendee', 'signup1')}
          />

          <RoleCard
            icon="calendar-outline"
            accent={colors.blue}
            tagline="RUN THE SCENE"
            title="Host & Organise"
            description="Create events, manage guests, scan QR codes at the door"
            onSignIn={() => goToRole('organizer', 'signin')}
            onJoin={() => goToRole('organizer', 'signup1')}
            style={{ marginTop: 12 }}
          />
        </ScrollView>
      </View>
    )
  }

  /* ── Verify email ────────────────────────────────────────────────────────── */
  if (screen === 'verify') {
    return <VerifyEmailScreen email={email} onBack={() => { setScreen('signin'); clearError() }} insets={insets} />
  }

  /* ── Forgot password ─────────────────────────────────────────────────────── */
  if (screen === 'forgot') {
    return (
      <SafeAreaView style={a.root}>
        <StatusBar style="light" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[a.scroll, { paddingBottom: insets.bottom + 32 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity style={a.backBtn} onPress={() => { clearError(); setForgotSent(false); setScreen('signin') }}>
              <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
              <Text style={a.backText}>Back to sign in</Text>
            </TouchableOpacity>

            {forgotSent ? (
              <View style={fg.sentWrap}>
                <View style={fg.sentIcon}>
                  <Ionicons name="mail-open-outline" size={32} color={colors.blue} />
                </View>
                <Text style={fg.sentTitle}>Check your inbox</Text>
                <Text style={fg.sentBody}>
                  {'We sent a password reset link to\n'}
                  <Text style={{ color: colors.blue }}>{forgotEmail}</Text>
                </Text>
                <Text style={fg.sentHint}>
                  Click the link in the email, then come back and sign in with your new password.
                </Text>
                <CTAButton
                  label="Back to Sign In"
                  accent={colors.blue}
                  onPress={() => { setForgotSent(false); setForgotEmail(''); setScreen('signin') }}
                />
              </View>
            ) : (
              <>
                <Text style={[a.headline, { marginTop: 8 }]}>Reset password</Text>
                <Text style={a.subtext}>
                  Enter your email and we'll send you a link to create a new password
                </Text>
                <View style={a.form}>
                  <AuthField
                    icon="mail-outline"
                    placeholder="Your email address"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    accent={colors.blue}
                    autoCapitalize="none"
                  />
                  {error && <ErrorBanner message={error} />}
                  <CTAButton
                    label="Send Reset Link"
                    accent={colors.blue}
                    loading={loading}
                    onPress={sendResetLink}
                    disabled={!forgotEmail.trim()}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  /* ── Sign in ─────────────────────────────────────────────────────────────── */
  if (screen === 'signin') {
    return (
      <AuthShell
        accent={accent}
        role={role}
        onBack={goBack}
        backLabel="Change role"
        insets={insets}
      >
        <Text style={a.headline}>{role === 'organizer' ? 'Run the scene.' : 'Welcome back.'}</Text>
        <Text style={a.subtext}>Sign in to your {role === 'organizer' ? 'organizer' : 'attendee'} account</Text>

        <View style={a.form}>
          <AuthField
            icon="mail-outline" placeholder="Email address" value={email}
            onChangeText={setEmail} keyboardType="email-address" accent={accent}
            autoCapitalize="none"
          />
          <View>
            <AuthField
              icon="lock-closed-outline" placeholder="Password" value={password}
              onChangeText={setPassword} secureTextEntry={!showPw} accent={accent}
              autoCapitalize="none"
              rightElement={
                <TouchableOpacity onPress={() => setShowPw(v => !v)} style={{ padding: 4 }}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
              }
            />
            <TouchableOpacity onPress={handleForgotPw} style={a.forgotBtn}>
              <Text style={a.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {error && <ErrorBanner message={error} />}

          <CTAButton
            label="Sign In"
            accent={accent}
            loading={loading}
            onPress={handleSignIn}
            disabled={!email.trim() || !password}
          />

          <View style={a.switchRow}>
            <Text style={a.switchText}>New to Tikkit?</Text>
            <TouchableOpacity onPress={() => { clearError(); setScreen('signup1') }}>
              <Text style={[a.switchLink, { color: accent }]}>Create account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AuthShell>
    )
  }

  /* ── Signup step 1: credentials ─────────────────────────────────────────── */
  if (screen === 'signup1') {
    return (
      <AuthShell
        accent={accent}
        role={role}
        onBack={goBack}
        backLabel="Change role"
        insets={insets}
      >
        <StepDots total={3} current={1} accent={accent} />
        <Text style={[a.headline, { marginTop: 12 }]}>Create your account</Text>
        <Text style={a.subtext}>Let's start with the basics</Text>

        <View style={a.form}>
          <AuthField
            icon="person-outline" placeholder="Full name" value={name}
            onChangeText={setName} accent={accent} autoCapitalize="words"
          />
          <AuthField
            icon="mail-outline" placeholder="Email address" value={email}
            onChangeText={setEmail} keyboardType="email-address" accent={accent}
            autoCapitalize="none"
          />
          <AuthField
            icon="lock-closed-outline" placeholder="Password (min 6 chars)" value={password}
            onChangeText={setPassword} secureTextEntry={!showPw} accent={accent}
            autoCapitalize="none"
            rightElement={
              <TouchableOpacity onPress={() => setShowPw(v => !v)} style={{ padding: 4 }}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            }
          />

          {error && <ErrorBanner message={error} />}

          <CTAButton
            label="Continue"
            accent={accent}
            onPress={handleStep1}
            disabled={!name.trim() || !email.trim() || password.length < 6}
          />

          <View style={a.switchRow}>
            <Text style={a.switchText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => { clearError(); setScreen('signin') }}>
              <Text style={[a.switchLink, { color: accent }]}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AuthShell>
    )
  }

  /* ── Signup step 2: scene (attendee) or brand (organizer) ───────────────── */
  if (screen === 'signup2') {
    const isAttendee = role === 'attendee'
    const toggleInterest = (slug: string) =>
      setInterests(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug])

    return (
      <AuthShell
        accent={accent}
        role={role}
        onBack={goBack}
        backLabel="Back"
        insets={insets}
      >
        <StepDots total={3} current={2} accent={accent} />

        {isAttendee ? (
          <>
            <Text style={[a.headline, { marginTop: 12 }]}>What's your scene?</Text>
            <Text style={a.subtext}>
              Pick your interests and we'll personalise your event feed from day one
            </Text>

            {/* Category grid */}
            <View style={sc.grid}>
              {SCENE_CATS.map(cat => {
                const active = interests.includes(cat.slug)
                return (
                  <TouchableOpacity
                    key={cat.slug}
                    style={[
                      sc.chip,
                      active && { borderColor: accent, backgroundColor: accent + '18' },
                    ]}
                    onPress={() => toggleInterest(cat.slug)}
                    activeOpacity={0.7}
                  >
                    <Text style={sc.chipEmoji}>{cat.emoji}</Text>
                    <Text style={[sc.chipLabel, active && { color: accent }]}>{cat.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {interests.length > 0 && (
              <View style={sc.selRow}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={sc.selText}>{interests.length} selected</Text>
              </View>
            )}

            <View style={[a.form, { marginTop: 8 }]}>
              <CTAButton label="Continue" accent={accent} onPress={handleStep2} />
              <TouchableOpacity onPress={handleStep2} style={a.skipBtn}>
                <Text style={a.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={[a.headline, { marginTop: 12 }]}>Your brand identity</Text>
            <Text style={a.subtext}>Help attendees recognise your events</Text>

            <View style={[a.form, { marginTop: 4 }]}>
              <AuthField
                icon="business-outline" placeholder="Company or brand name" value={company}
                onChangeText={setCompany} accent={accent} autoCapitalize="words"
              />

              {error && <ErrorBanner message={error} />}

              <CTAButton label="Continue" accent={accent} onPress={handleStep2} />
              <TouchableOpacity onPress={handleStep2} style={a.skipBtn}>
                <Text style={a.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </AuthShell>
    )
  }

  /* ── Signup step 3: details ──────────────────────────────────────────────── */
  if (screen === 'signup3') {
    const isAttendee = role === 'attendee'
    const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

    return (
      <AuthShell
        accent={accent}
        role={role}
        onBack={goBack}
        backLabel="Back"
        insets={insets}
      >
        <StepDots total={3} current={3} accent={accent} />
        <Text style={[a.headline, { marginTop: 12 }]}>Almost there</Text>
        <Text style={a.subtext}>A couple more details to complete your profile</Text>

        <View style={a.form}>
          <AuthField
            icon="call-outline" placeholder="Phone number (optional)" value={phone}
            onChangeText={setPhone} keyboardType="phone-pad" accent={accent}
            autoCapitalize="none"
          />
          {/* City picker */}
          <TouchableOpacity
            onPress={() => setShowCityPicker(true)}
            style={[a.cityPickerBtn, city ? { borderColor: accent + '40' } : {}]}
            activeOpacity={0.7}
          >
            <Ionicons name="location-outline" size={18} color={city ? accent : colors.textMuted} />
            <Text style={[a.cityPickerText, city ? { color: colors.textPrimary } : {}]}>
              {city || 'Your city (optional)'}
            </Text>
            <Ionicons name="chevron-down-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <Modal
            visible={showCityPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCityPicker(false)}
          >
            <TouchableOpacity style={a.modalOverlay} activeOpacity={1} onPress={() => setShowCityPicker(false)} />
            <View style={a.cityModal}>
              <View style={a.cityModalHandle} />
              <Text style={a.cityModalTitle}>Select City</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {PAKISTAN_CITIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[a.cityOption, city === c && { backgroundColor: accent + '15' }]}
                    onPress={() => { setCity(c); setShowCityPicker(false) }}
                    activeOpacity={0.7}
                  >
                    <Text style={[a.cityOptionText, city === c && { color: accent, fontFamily: 'DMSans_500Medium' }]}>{c}</Text>
                    {city === c && <Ionicons name="checkmark" size={16} color={accent} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Modal>

          {isAttendee && (
            <View style={a.genderWrap}>
              <Text style={a.genderLabel}>Gender <Text style={a.genderOpt}>(optional)</Text></Text>
              <View style={a.genderRow}>
                {GENDERS.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[a.genderBtn, gender === g && { backgroundColor: accent + '1A', borderColor: accent }]}
                    onPress={() => setGender(gender === g ? '' : g)}
                    activeOpacity={0.7}
                  >
                    <Text style={[a.genderBtnText, gender === g && { color: accent }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {error && <ErrorBanner message={error} />}

          <CTAButton label="Create Account" accent={accent} loading={loading} onPress={handleSignUp} />

          <TouchableOpacity onPress={handleSignUp} style={a.skipBtn}>
            <Text style={a.skipText}>Skip and create account</Text>
          </TouchableOpacity>
        </View>
      </AuthShell>
    )
  }

  return null
}

/* ─── AuthShell wrapper ──────────────────────────────────────────────────── */
function AuthShell({
  children, accent, role, onBack, backLabel, insets,
}: {
  children: React.ReactNode
  accent: string
  role: Role
  onBack: () => void
  backLabel: string
  insets: { top: number; bottom: number }
}) {
  return (
    <SafeAreaView style={a.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[a.scroll, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity style={a.backBtn} onPress={onBack}>
            <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
            <Text style={a.backText}>{backLabel}</Text>
          </TouchableOpacity>

          {/* Role badge */}
          <View style={[a.roleBadge, { backgroundColor: accent + '18', borderColor: accent + '44' }]}>
            <View style={[a.roleDot, { backgroundColor: accent }]} />
            <Text style={[a.roleBadgeText, { color: accent }]}>
              {role === 'organizer' ? 'ORGANIZER ACCESS' : 'ATTENDEE ACCESS'}
            </Text>
          </View>

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

/* ─── Role card ──────────────────────────────────────────────────────────── */
function RoleCard({
  icon, accent, tagline, title, description, onSignIn, onJoin, style,
}: {
  icon: keyof typeof Ionicons.glyphMap
  accent: string
  tagline: string
  title: string
  description: string
  onSignIn: () => void
  onJoin: () => void
  style?: any
}) {
  return (
    <View style={[rc.card, { borderColor: accent + '30' }, style]}>
      {/* Top row */}
      <View style={rc.top}>
        <View style={[rc.iconWrap, { backgroundColor: accent + '18', borderColor: accent + '30' }]}>
          <Ionicons name={icon} size={24} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[rc.tagline, { color: accent }]}>{tagline}</Text>
          <Text style={rc.title}>{title}</Text>
          <Text style={rc.desc}>{description}</Text>
        </View>
      </View>

      {/* Button row */}
      <View style={rc.btnRow}>
        <TouchableOpacity style={rc.signInBtn} onPress={onSignIn} activeOpacity={0.8}>
          <Text style={rc.signInText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[rc.joinBtn, { backgroundColor: accent, shadowColor: accent }]}
          onPress={onJoin}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-forward" size={14} color={colors.white} />
          <Text style={rc.joinText}>Join</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

/* ─── Verify email screen ────────────────────────────────────────────────── */
function VerifyEmailScreen({ email, onBack, insets }: {
  email: string
  onBack: () => void
  insets: { top: number; bottom: number }
}) {
  const pulse = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <SafeAreaView style={a.root}>
      <StatusBar style="light" />
      <View style={[ve.root, { paddingBottom: insets.bottom + 32 }]}>
        {/* Animated mail icon */}
        <View style={ve.iconArea}>
          <Animated.View style={[ve.glow, { opacity: pulse }]} />
          <View style={ve.iconWrap}>
            <Ionicons name="mail-open-outline" size={36} color={colors.blue} />
          </View>
        </View>

        <Text style={ve.headline}>Check your inbox</Text>
        <Text style={ve.body}>
          We sent a verification link to
        </Text>
        <Text style={ve.email}>{email}</Text>
        <Text style={ve.hint}>
          Click the link in the email to activate your account, then come back and sign in.
        </Text>

        <TouchableOpacity
          style={[ve.btn, { backgroundColor: colors.blue, shadowColor: colors.blue }]}
          onPress={onBack}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={16} color={colors.white} />
          <Text style={ve.btnText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

// Welcome
const w = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  scroll: {
    flexGrow: 1, alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60,
  },
  logoWrap: {
    width: 100, height: 100,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, position: 'relative',
  },
  logoGlow: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: colors.blue + '18',
  },
  logo: { width: 72, height: 72, borderRadius: 16 },
  wordmark: {
    color: colors.textPrimary, fontSize: 36, fontFamily: 'Poppins_700Bold',
    letterSpacing: 6, marginBottom: 6,
  },
  tagline: {
    color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular',
    marginBottom: 40,
  },
})

// Auth shell form
const a = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 12 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20, alignSelf: 'flex-start' },
  backText: { color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_400Regular' },

  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderRadius: radius.full,
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 20,
  },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleBadgeText: { fontSize: 10, fontFamily: 'DMSans_500Medium', letterSpacing: 1.2 },

  headline: {
    color: colors.textPrimary, fontSize: 28, fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.5, marginBottom: 6,
  },
  subtext: {
    color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_400Regular',
    marginBottom: 24, lineHeight: 20,
  },

  form: { gap: 12 },

  forgotBtn: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },

  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 4 },
  switchText: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular' },
  switchLink: { fontSize: 13, fontFamily: 'DMSans_500Medium', fontWeight: '600' },

  skipBtn: { alignItems: 'center', paddingVertical: 4 },
  skipText: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', textDecorationLine: 'underline' },

  genderWrap: { gap: 8 },
  genderLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_500Medium' },
  genderOpt: { color: colors.textMuted, fontFamily: 'DMSans_400Regular' },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genderBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  genderBtnText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular' },

  cityPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cityPickerText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cityModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  cityModalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  cityModalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'DMSans_700Bold',
    marginBottom: 12,
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cityOptionText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
})

// Role cards
const rc = StyleSheet.create({
  card: {
    width: '100%', backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1,
    padding: 18, gap: 16,
  },
  top: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  iconWrap: {
    width: 50, height: 50, borderRadius: radius.md,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  tagline: { fontSize: 10, fontFamily: 'DMSans_500Medium', letterSpacing: 1.5, marginBottom: 3 },
  title: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  desc: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular', lineHeight: 17 },
  btnRow: {
    flexDirection: 'row', gap: 10,
    paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border,
  },
  signInBtn: {
    flex: 1, paddingVertical: 11, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  signInText: { color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  joinBtn: {
    flex: 1.4, paddingVertical: 11, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  joinText: { color: colors.white, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
})

// Scene / interest selection
const sc = StyleSheet.create({
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 9,
  },
  chipEmoji: { fontSize: 15 },
  chipLabel: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_500Medium' },
  selRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4,
  },
  selText: { color: colors.success, fontSize: 12, fontFamily: 'DMSans_500Medium' },
})

// Verify email
const ve = StyleSheet.create({
  root: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 12,
  },
  iconArea: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  glow: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.blueSubtle,
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.blueBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  headline: {
    color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold', textAlign: 'center',
  },
  body: { color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center' },
  email: {
    color: colors.blue, fontSize: 14, fontFamily: 'DMSans_500Medium',
    textAlign: 'center', marginTop: -4,
  },
  hint: {
    color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular',
    textAlign: 'center', lineHeight: 19, marginTop: 4,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 28,
    marginTop: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  btnText: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
})

// Forgot password
const fg = StyleSheet.create({
  sentWrap: { alignItems: 'center', paddingTop: 40, gap: 14 },
  sentIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.blueSubtle, borderWidth: 1, borderColor: colors.blueBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  sentTitle: { color: colors.textPrimary, fontSize: 24, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  sentBody: {
    color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_400Regular',
    textAlign: 'center', lineHeight: 21,
  },
  sentHint: {
    color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular',
    textAlign: 'center', lineHeight: 19, paddingHorizontal: 12,
  },
})

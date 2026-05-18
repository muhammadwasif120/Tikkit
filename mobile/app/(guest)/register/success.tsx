import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, radius } from '@/theme'

/**
 * Route params:
 *   status  — 'approved' | 'pending'
 *   title   — event title
 */
export default function RegistrationSuccessScreen() {
  const { status, title } = useLocalSearchParams<{ status: string; title: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const isApproved = status === 'approved'
  const accent     = isApproved ? colors.success : '#A855F7'

  // Scale-in pop animation
  const scale   = useRef(new Animated.Value(0.6)).current
  const opacity = useRef(new Animated.Value(0)).current

  // Glow pulse
  const glow    = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start()

    // Continuous glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: 1600, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      <View style={[s.content, { paddingBottom: insets.bottom + 24 }]}>

        {/* Icon */}
        <Animated.View style={[s.iconArea, { opacity, transform: [{ scale }] }]}>
          <Animated.View style={[s.glowRing, { opacity: glow, borderColor: accent + '60' }]} />
          <Animated.View style={[s.glowCore, { opacity: glow, backgroundColor: accent + '20' }]} />
          <LinearGradient
            colors={isApproved
              ? [colors.success + '30', colors.success + '10']
              : ['rgba(168,85,247,0.3)', 'rgba(168,85,247,0.1)']}
            style={s.iconCircle}
            start={[0, 0]} end={[1, 1]}
          >
            <Ionicons
              name={isApproved ? 'checkmark-circle' : 'document-text'}
              size={48}
              color={accent}
            />
          </LinearGradient>
        </Animated.View>

        {/* Copy */}
        <Animated.View style={[s.copy, { opacity }]}>
          <Text style={s.headline}>
            {isApproved ? '🎉 You\'re in!' : '📋 Application sent!'}
          </Text>

          {title ? (
            <Text style={s.eventTitle} numberOfLines={2}>{title}</Text>
          ) : null}

          <Text style={s.body}>
            {isApproved
              ? 'Your ticket is confirmed. Head to the Tickets tab to find your QR code — see you there.'
              : 'Your application is under review. The organizer will get back to you, and we\'ll notify you once a decision is made.'}
          </Text>
        </Animated.View>

        {/* Status pill */}
        <Animated.View style={[
          s.statusPill,
          { backgroundColor: accent + '18', borderColor: accent + '44' },
          { opacity },
        ]}>
          <View style={[s.statusDot, { backgroundColor: accent }]} />
          <Text style={[s.statusText, { color: accent }]}>
            {isApproved ? 'Registration Confirmed' : 'Pending Review'}
          </Text>
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[s.actions, { opacity }]}>
          {isApproved && (
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: accent, shadowColor: accent }]}
              onPress={() => router.replace('/(guest)/tickets')}
              activeOpacity={0.85}
            >
              <Ionicons name="qr-code-outline" size={18} color={colors.white} />
              <Text style={s.primaryBtnText}>View My Ticket</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              s.secondaryBtn,
              !isApproved && { backgroundColor: accent, shadowColor: accent },
            ]}
            onPress={() => router.replace('/(guest)/registrations')}
            activeOpacity={0.85}
          >
            {!isApproved && <Ionicons name="list-outline" size={18} color={colors.white} />}
            <Text style={[
              s.secondaryBtnText,
              !isApproved && { color: colors.white },
            ]}>
              {isApproved ? 'View All Registrations' : 'Track Application'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.ghostBtn}
            onPress={() => router.replace('/(guest)/explore')}
            activeOpacity={0.7}
          >
            <Text style={s.ghostBtnText}>Explore more events</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, gap: 20,
  },

  // Icon
  iconArea: { alignItems: 'center', justifyContent: 'center', width: 140, height: 140 },
  glowRing: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    borderWidth: 1,
  },
  glowCore: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
  },
  iconCircle: {
    width: 92, height: 92, borderRadius: 46,
    alignItems: 'center', justifyContent: 'center',
  },

  // Copy
  copy: { alignItems: 'center', gap: 8 },
  headline: {
    color: colors.textPrimary, fontSize: 28, fontFamily: 'Poppins_700Bold',
    textAlign: 'center', letterSpacing: -0.3,
  },
  eventTitle: {
    color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_500Medium',
    textAlign: 'center', paddingHorizontal: 16,
  },
  body: {
    color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular',
    textAlign: 'center', lineHeight: 21, paddingHorizontal: 8,
  },

  // Status pill
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: radius.full, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 12, fontFamily: 'DMSans_500Medium', letterSpacing: 0.5 },

  // Actions
  actions: { width: '100%', gap: 10 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: radius.md, paddingVertical: 15,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  primaryBtnText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold', fontWeight: '700' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: radius.md, paddingVertical: 14,
    borderWidth: 1.5, borderColor: colors.border,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  secondaryBtnText: { color: colors.textSecondary, fontSize: 15, fontFamily: 'DMSans_500Medium' },
  ghostBtn: { alignItems: 'center', paddingVertical: 6 },
  ghostBtnText: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', textDecorationLine: 'underline' },
})

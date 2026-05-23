import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  TouchableOpacity, RefreshControl, Linking, Alert,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { getVerifyStatus } from '@/lib/api'
import { Skeleton } from '@/components/Skeleton'
import { colors, radius } from '@/theme'

type CnicStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected' | null | undefined

const STATUS_META: Record<string, { label: string; desc: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  not_submitted: {
    label: 'Not Submitted',
    desc: 'You haven\'t submitted your CNIC for verification yet.',
    color: colors.textMuted,
    bg: 'rgba(107,114,128,0.1)',
    icon: 'document-outline',
  },
  pending: {
    label: 'Under Review',
    desc: 'Your CNIC has been submitted and is being reviewed by our team. This usually takes 1–2 business days.',
    color: colors.indigo,
    bg: colors.indigoSubtle,
    icon: 'time-outline',
  },
  verified: {
    label: 'Verified',
    desc: 'Your identity has been verified. You now have full organizer access and a verified badge.',
    color: colors.success,
    bg: colors.successSubtle,
    icon: 'shield-checkmark',
  },
  rejected: {
    label: 'Rejected',
    desc: 'Your CNIC submission was rejected. This may be due to a blurry image or mismatched information. Please re-submit.',
    color: colors.error,
    bg: colors.errorSubtle,
    icon: 'close-circle',
  },
}

export default function VerifyScreen() {
  const [status, setStatus] = useState<CnicStatus>(null)
  const [cnicNumber, setCnicNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await getVerifyStatus()
      // API returns status values: 'verified' | 'pending' | 'unverified'
      const mapped = data.status === 'unverified' ? 'not_submitted' : data.status
      setStatus(mapped as CnicStatus)
      setCnicNumber(data.cnic_number ?? null)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const handleSubmitOnWeb = () => {
    Alert.alert(
      'Verify on Web',
      'CNIC submission requires photo upload. Please visit the Tikkit web app to complete your verification.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Web App',
          onPress: () => Linking.openURL(`${process.env.EXPO_PUBLIC_APP_URL ?? 'https://www.tikkitx.com'}/dashboard/settings`),
        },
      ]
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar style="light" />
        <View style={s.header}>
          <Text style={s.heading}>ID Verification</Text>
          <Text style={s.subheading}>CNIC / National ID</Text>
        </View>
        <View style={{ padding: 16, gap: 16 }}>
          {/* Status card skeleton */}
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: 'center', gap: 12 }}>
            <Skeleton height={60} width={60} style={{ borderRadius: 30 }} />
            <Skeleton height={18} width={120} style={{ borderRadius: 9 }} />
            <Skeleton height={13} width={240} style={{ borderRadius: 6 }} />
            <Skeleton height={13} width={180} style={{ borderRadius: 6 }} />
          </View>
          {/* Benefits card skeleton */}
          <Skeleton height={14} width={130} style={{ borderRadius: 7 }} />
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 14 }}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Skeleton height={36} width={36} style={{ borderRadius: 18 }} />
                <View style={{ flex: 1, gap: 5 }}>
                  <Skeleton height={13} width={100} style={{ borderRadius: 6 }} />
                  <Skeleton height={11} width={200} style={{ borderRadius: 5 }} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    )
  }

  const sm = STATUS_META[status ?? 'not_submitted'] ?? STATUS_META.not_submitted
  const isVerified = status === 'verified'
  const isPending = status === 'pending'

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      <View style={s.header}>
        <Text style={s.heading}>ID Verification</Text>
        <Text style={s.subheading}>CNIC / National ID</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
      >
        {/* Status Card */}
        <View style={[s.statusCard, { borderLeftColor: sm.color, borderLeftWidth: 4 }]}>
          <LinearGradient colors={[sm.color + '30', 'transparent']} style={s.statusIcon}>
            <Ionicons name={sm.icon} size={28} color={sm.color} />
          </LinearGradient>
          <Text style={[s.statusLabel, { color: sm.color }]}>{sm.label}</Text>
          <Text style={s.statusDesc}>{sm.desc}</Text>

          {cnicNumber && (
            <View style={s.cnicRow}>
              <Ionicons name="card-outline" size={14} color={colors.textMuted} />
              <Text style={s.cnicNumber}>{cnicNumber}</Text>
            </View>
          )}
        </View>

        {/* Verified badge display */}
        {isVerified && (
          <View style={s.verifiedCard}>
            <View style={s.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={20} color={colors.success} />
              <Text style={s.verifiedBadgeText}>VERIFIED ORGANIZER</Text>
            </View>
            <Text style={s.verifiedDesc}>
              Your verified badge is now visible on your public profile. Attendees can see that you're a trusted organizer.
            </Text>
          </View>
        )}

        {/* Benefits */}
        <Text style={s.sectionLabel}>Why Get Verified?</Text>
        <View style={s.benefitsCard}>
          <Benefit
            icon="shield-checkmark-outline"
            title="Verified Badge"
            desc="A checkmark badge appears on your profile and event listings"
            color={colors.success}
          />
          <Divider />
          <Benefit
            icon="trending-up-outline"
            title="Higher Visibility"
            desc="Verified organizers rank higher in event search results"
            color={colors.blue}
          />
          <Divider />
          <Benefit
            icon="cash-outline"
            title="Faster Payouts"
            desc="Verified organizers get priority payout processing"
            color={colors.gold}
          />
          <Divider />
          <Benefit
            icon="people-outline"
            title="Guest Trust"
            desc="Attendees are more likely to register for verified events"
            color={colors.indigo}
          />
        </View>

        {/* Steps */}
        <Text style={s.sectionLabel}>How It Works</Text>
        <View style={s.stepsCard}>
          <Step number={1} title="Submit Your CNIC" desc="Upload front and back photos of your National ID card via the web app." />
          <Step number={2} title="Review Period" desc="Our team reviews your submission within 1–2 business days." />
          <Step number={3} title="Get Verified" desc="Once approved, your verified badge goes live immediately." />
        </View>

        {/* CTA */}
        {!isVerified && !isPending && (
          <TouchableOpacity style={s.cta} onPress={handleSubmitOnWeb} activeOpacity={0.8}>
            <Ionicons name="open-outline" size={18} color={colors.white} />
            <Text style={s.ctaText}>
              {status === 'rejected' ? 'Re-submit Verification' : 'Start Verification'}
            </Text>
          </TouchableOpacity>
        )}

        {isPending && (
          <View style={s.pendingBanner}>
            <Ionicons name="information-circle-outline" size={16} color={colors.indigo} />
            <Text style={s.pendingBannerText}>
              Your submission is under review. You'll be notified once it's processed.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Benefit({ icon, title, desc, color }: {
  icon: keyof typeof Ionicons.glyphMap; title: string; desc: string; color: string
}) {
  return (
    <View style={s.benefit}>
      <View style={[s.benefitIcon, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.benefitTitle}>{title}</Text>
        <Text style={s.benefitDesc}>{desc}</Text>
      </View>
    </View>
  )
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
}

function Step({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <View style={s.step}>
      <View style={s.stepNum}>
        <Text style={s.stepNumText}>{number}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.stepTitle}>{title}</Text>
        <Text style={s.stepDesc}>{desc}</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  heading: { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold' },
  subheading: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },

  scroll: { padding: 16, gap: 16, paddingBottom: 48 },

  statusCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: 20, alignItems: 'center', gap: 10,
  },
  statusIcon: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  statusLabel: { fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  statusDesc: {
    color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular',
    lineHeight: 20, textAlign: 'center',
  },
  cnicRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cnicNumber: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', letterSpacing: 1 },

  verifiedCard: {
    backgroundColor: colors.successSubtle, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.success + '44', padding: 16, gap: 10, alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.success + '1A', borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: colors.success + '44',
  },
  verifiedBadgeText: { color: colors.success, fontSize: 12, fontFamily: 'DMSans_500Medium', fontWeight: '700', letterSpacing: 0.5 },
  verifiedDesc: {
    color: colors.success, fontSize: 13, fontFamily: 'DMSans_400Regular',
    lineHeight: 20, textAlign: 'center',
  },

  sectionLabel: {
    color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_500Medium',
    letterSpacing: 1, textTransform: 'uppercase',
  },

  benefitsCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8,
  },
  benefit: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6 },
  benefitIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { color: colors.textPrimary, fontSize: 13, fontFamily: 'DMSans_500Medium', marginBottom: 2 },
  benefitDesc: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', lineHeight: 17 },

  stepsCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 14, gap: 16,
  },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.blueSubtle, borderWidth: 1, borderColor: colors.blueBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: colors.blue, fontSize: 13, fontFamily: 'Poppins_700Bold' },
  stepTitle: { color: colors.textPrimary, fontSize: 13, fontFamily: 'DMSans_500Medium', marginBottom: 2 },
  stepDesc: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', lineHeight: 17 },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.blue, borderRadius: radius.md, paddingVertical: 15,
  },
  ctaText: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },

  pendingBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.indigoSubtle, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.indigo + '44', padding: 14,
  },
  pendingBannerText: {
    color: colors.indigo, fontSize: 13, fontFamily: 'DMSans_400Regular',
    lineHeight: 20, flex: 1,
  },
})

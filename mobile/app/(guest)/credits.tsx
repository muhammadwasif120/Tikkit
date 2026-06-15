import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { getCredits, CreditTransaction } from '@/lib/api'
import { colors, radius, creditTiers } from '@/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'

/* ─── Tier config ─────────────────────────────────────────────────────────── */
const TIER_META: Record<string, {
  gradient: [string, string, string]
  glow: string
  icon: keyof typeof Ionicons.glyphMap
  next: string
}> = {
  newcomer: {
    gradient: ['#0C0E16', '#111420', '#0C0E16'],
    glow: '#6B7280',
    icon: 'person-outline',
    next: 'Rising',
  },
  rising: {
    gradient: ['#0A1A14', '#0D2318', '#071210'],
    glow: '#34D399',
    icon: 'trending-up-outline',
    next: 'Regular',
  },
  regular: {
    gradient: ['#080F28', '#0A1640', '#060C1E'],
    glow: '#1E5EFF',
    icon: 'star-outline',
    next: 'VIP',
  },
  vip: {
    gradient: ['#1A1000', '#261800', '#160E00'],
    glow: '#FFC745',
    icon: 'ribbon-outline',
    next: 'Elite',
  },
  elite: {
    gradient: ['#140820', '#1E0A38', '#100618'],
    glow: '#818CF8',
    icon: 'diamond-outline',
    next: null as any,
  },
}

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  scan: 'checkmark-circle',
  vip_bonus: 'star',
  first_event: 'gift',
  streak: 'flame',
  no_show: 'close-circle',
  register: 'ticket',
  attend: 'checkmark-done',
}

function getTier(balance: number) {
  const tiers = Object.entries(creditTiers).sort((a, b) => b[1].minPoints - a[1].minPoints)
  for (const [key, tier] of tiers) {
    if (balance >= tier.minPoints) return { key, ...tier }
  }
  return { key: 'newcomer', ...creditTiers.newcomer }
}

/* ─── Tier milestones strip ───────────────────────────────────────────────── */
function TierMilestones({ balance }: { balance: number }) {
  const entries = Object.entries(creditTiers)
  return (
    <View style={m.row}>
      {entries.map(([key, tier], i) => {
        const unlocked = balance >= tier.minPoints
        const meta = TIER_META[key]
        return (
          <View key={key} style={m.milestone}>
            <View style={[
              m.dot,
              { borderColor: unlocked ? tier.color : colors.surface3 },
              unlocked && { backgroundColor: tier.color + '30' },
            ]}>
              <Ionicons name={meta.icon} size={12} color={unlocked ? tier.color : colors.textMuted} />
            </View>
            <Text style={[m.label, { color: unlocked ? tier.color : colors.textMuted }]}>
              {tier.label}
            </Text>
            <Text style={m.pts}>{tier.minPoints > 0 ? `${tier.minPoints}` : 'Start'}</Text>
            {/* Connector line */}
            {i < entries.length - 1 && (
              <View style={[m.line, { backgroundColor: balance >= tier.minPoints ? tier.color + '55' : colors.surface3 }]} />
            )}
          </View>
        )
      })}
    </View>
  )
}
const m = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 16 },
  milestone: { alignItems: 'center', gap: 4, flex: 1, position: 'relative' },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 9, fontFamily: 'DMSans_500Medium', fontWeight: '600', textAlign: 'center' },
  pts: { fontSize: 8, fontFamily: 'DMSans_400Regular', color: colors.textMuted },
  line: {
    position: 'absolute',
    top: 14, left: '60%',
    width: '80%', height: 1,
  },
})

/* ─── Main screen ─────────────────────────────────────────────────────────── */
export default function CreditsScreen() {
  const router = useRouter()
  const toast = useToast()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await getCredits()
      setBalance(data.balance)
      setTransactions(data.transactions)
    } catch (e: any) {
      toast.show({ type: 'error', message: e?.message || 'Couldn\'t load credits. Pull down to retry.' })
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const tierInfo = getTier(balance)
  const tierMeta = TIER_META[tierInfo.key] ?? TIER_META.newcomer
  const nextTierEntry = Object.entries(creditTiers).find(([, t]) => t.minPoints > balance)
  const nextTier = nextTierEntry ? nextTierEntry[1] : null
  const progress = nextTier
    ? Math.min((balance - tierInfo.minPoints) / (nextTier.minPoints - tierInfo.minPoints), 1)
    : 1

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar style="light" />
        <View style={{ padding: 16, gap: 12 }}>
          {/* Prestige card skeleton */}
          <Skeleton height={220} borderRadius={20} style={{ marginBottom: 8 }} />
          {/* Section header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Skeleton width={160} height={18} />
            <Skeleton width={60} height={14} />
          </View>
          {/* Transaction rows */}
          {[0, 1, 2, 4].map(i => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Skeleton width={42} height={42} borderRadius={21} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="65%" height={14} />
                <Skeleton width="40%" height={12} />
              </View>
              <Skeleton width={40} height={18} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <FlatList
        data={transactions}
        keyExtractor={t => t.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <View>
            {/* ── Prestige card ── */}
            <LinearGradient
              colors={tierMeta.gradient}
              style={s.card}
              start={[0, 0]} end={[1, 1]}
            >
              {/* Glow accent — top right */}
              <View style={[s.cardGlowAccent, { backgroundColor: tierMeta.glow + '18' }]} />

              {/* Header row: label + tier badge */}
              <View style={s.cardTop}>
                <View>
                  <Text style={s.cardLabel}>TIKKIT CREDITS</Text>
                  <Text style={[s.balance, { color: tierInfo.color }]}>
                    {balance.toLocaleString()}
                    <Text style={s.balancePts}> pts</Text>
                  </Text>
                </View>
                <View style={[s.tierBadge, {
                  backgroundColor: tierInfo.color + '18',
                  borderColor: tierInfo.color + '55',
                }]}>
                  <Ionicons name={tierMeta.icon} size={16} color={tierInfo.color} />
                  <Text style={[s.tierLabel, { color: tierInfo.color }]}>{tierInfo.label}</Text>
                </View>
              </View>

              {/* Progress to next tier */}
              {nextTier ? (
                <View style={s.progressSection}>
                  <View style={s.progressHeader}>
                    <Text style={s.progressLabel}>
                      {nextTier.minPoints - balance} pts to <Text style={{ color: nextTier.color }}>{nextTier.label}</Text>
                    </Text>
                    <Text style={s.progressPct}>{Math.round(progress * 100)}%</Text>
                  </View>
                  <View style={s.progressTrack}>
                    <LinearGradient
                      colors={[tierInfo.color, tierInfo.color + 'AA']}
                      style={[s.progressFill, { width: `${progress * 100}%` as any }]}
                      start={[0, 0]} end={[1, 0]}
                    />
                  </View>
                </View>
              ) : (
                <View style={s.eliteRow}>
                  <Ionicons name="checkmark-circle" size={14} color={tierInfo.color} />
                  <Text style={[s.eliteText, { color: tierInfo.color }]}>Maximum tier reached — Elite status</Text>
                </View>
              )}

              {/* Tier milestones */}
              <TierMilestones balance={balance} />
            </LinearGradient>

            {/* Section header */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Transaction History</Text>
              <Text style={s.sectionCount}>{transactions.length} record{transactions.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="star-outline" size={28} color={colors.textMuted} />
            </View>
            <Text style={s.emptyTitle}>No transactions yet</Text>
            <Text style={s.emptyText}>Attend events to start earning credits and climb the tiers</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/(guest)/explore')}>
              <Text style={s.emptyBtnText}>Explore Events</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const isPos = item.points > 0
          const icon = TYPE_ICONS[item.type] ?? 'ellipse-outline'
          const label = item.description
            ?? item.type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

          return (
            <View style={s.txRow}>
              <View style={[s.txIcon, {
                backgroundColor: isPos ? colors.successSubtle : colors.errorSubtle,
              }]}>
                <Ionicons name={icon} size={18} color={isPos ? colors.success : colors.error} />
              </View>
              <View style={s.txBody}>
                <Text style={s.txEvent} numberOfLines={1}>{item.events?.title ?? 'Tikkit Rewards'}</Text>
                <Text style={s.txType}>{label}</Text>
                <Text style={s.txDate}>{format(new Date(item.created_at), 'd MMM yyyy')}</Text>
              </View>
              <Text style={[s.txPoints, { color: isPos ? colors.success : colors.error }]}>
                {isPos ? '+' : ''}{item.points}
              </Text>
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  centered: { flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },

  // Prestige card
  card: {
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: 20, marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  cardGlowAccent: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
  },

  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.4)', fontSize: 10,
    fontFamily: 'DMSans_500Medium', letterSpacing: 2,
    marginBottom: 4,
  },
  balance: {
    fontSize: 52, fontFamily: 'Poppins_700Bold', lineHeight: 56, letterSpacing: -1,
  },
  balancePts: {
    fontSize: 18, fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.4)',
  },
  tierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  tierLabel: { fontSize: 13, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  // Progress
  progressSection: { marginBottom: 4 },
  progressHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'DMSans_400Regular',
  },
  progressPct: {
    color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'DMSans_500Medium',
  },
  progressTrack: {
    height: 5, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full },

  eliteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  eliteText: { fontSize: 12, fontFamily: 'DMSans_500Medium' },

  // Section header
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold',
  },
  sectionCount: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },

  // Transactions
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 8,
  },
  txIcon: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  txBody: { flex: 1 },
  txEvent: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  txType: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  txDate: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  txPoints: { fontSize: 18, fontFamily: 'Poppins_700Bold' },

  // Empty
  empty: { alignItems: 'center', paddingTop: 48, gap: 12, paddingHorizontal: 24 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  emptyText: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 19 },
  emptyBtn: {
    backgroundColor: colors.blue, borderRadius: radius.md,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 8,
  },
  emptyBtnText: { color: colors.white, fontSize: 14, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
})

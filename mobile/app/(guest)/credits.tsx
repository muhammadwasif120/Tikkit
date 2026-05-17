import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { getCredits, CreditTransaction } from '@/lib/api'
import { colors, radius, creditTiers } from '@/theme'
import { LinearGradient } from 'expo-linear-gradient'

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

export default function CreditsScreen() {
  const [balance, setBalance] = useState(0)
  const [tier, setTier] = useState('')
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await getCredits()
      setBalance(data.balance)
      setTier(data.tier)
      setTransactions(data.transactions)
    } catch { /* silent */ }
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
  const nextTierEntry = Object.entries(creditTiers).find(([, t]) => t.minPoints > balance)
  const nextTier = nextTierEntry ? nextTierEntry[1] : null
  const progress = nextTier
    ? Math.min((balance - tierInfo.minPoints) / (nextTier.minPoints - tierInfo.minPoints), 1)
    : 1

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
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
            {/* Balance card */}
            <LinearGradient
              colors={[colors.surface, colors.surface2]}
              style={s.balanceCard}
              start={[0, 0]} end={[1, 1]}
            >
              <View style={s.balanceTop}>
                <View>
                  <Text style={s.balanceLabel}>Credit Balance</Text>
                  <Text style={s.balanceAmount}>{balance.toLocaleString()}</Text>
                </View>
                <View style={[s.tierBadge, { backgroundColor: tierInfo.color + '22', borderColor: tierInfo.color + '55' }]}>
                  <Ionicons name="ribbon" size={14} color={tierInfo.color} />
                  <Text style={[s.tierText, { color: tierInfo.color }]}>{tierInfo.label}</Text>
                </View>
              </View>

              {/* Progress to next tier */}
              {nextTier && (
                <View style={s.progressWrap}>
                  <View style={s.progressTrack}>
                    <View style={[s.progressBar, { width: `${progress * 100}%`, backgroundColor: tierInfo.color }]} />
                  </View>
                  <Text style={s.progressLabel}>
                    {nextTier.minPoints - balance} pts to {nextTier.label}
                  </Text>
                </View>
              )}

              {/* Tier milestones */}
              <View style={s.tiersRow}>
                {Object.entries(creditTiers).map(([key, t]) => (
                  <View key={key} style={s.tierMilestone}>
                    <View style={[s.tierDot, {
                      backgroundColor: balance >= t.minPoints ? t.color : colors.surface3,
                      borderColor: t.color + '66',
                    }]} />
                    <Text style={[s.tierMilestoneLabel, { color: balance >= t.minPoints ? t.color : colors.textMuted }]}>
                      {t.label}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            <Text style={s.historyTitle}>Transaction History</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="star-outline" size={32} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No transactions yet</Text>
            <Text style={s.emptyText}>Attend events to earn credits</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isPos = item.points > 0
          const icon = TYPE_ICONS[item.type] ?? 'ellipse-outline'
          return (
            <View style={s.txRow}>
              <View style={[s.txIcon, { backgroundColor: isPos ? colors.successSubtle : colors.errorSubtle }]}>
                <Ionicons name={icon} size={18} color={isPos ? colors.success : colors.error} />
              </View>
              <View style={s.txBody}>
                <Text style={s.txTitle} numberOfLines={1}>{item.events?.title ?? 'Tikkit'}</Text>
                <Text style={s.txType}>{item.description ?? item.type.replace(/_/g, ' ')}</Text>
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
  list: { padding: 16, paddingBottom: 32 },

  balanceCard: {
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: 20, marginBottom: 24,
  },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  balanceLabel: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_500Medium', marginBottom: 4 },
  balanceAmount: { color: colors.textPrimary, fontSize: 48, fontFamily: 'Poppins_700Bold', lineHeight: 52 },
  tierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  tierText: { fontSize: 12, fontFamily: 'DMSans_500Medium', fontWeight: '600' },

  progressWrap: { marginBottom: 16 },
  progressTrack: {
    height: 4, backgroundColor: colors.surface3,
    borderRadius: radius.full, overflow: 'hidden', marginBottom: 6,
  },
  progressBar: { height: '100%', borderRadius: radius.full },
  progressLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },

  tiersRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tierMilestone: { alignItems: 'center', gap: 4 },
  tierDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1 },
  tierMilestoneLabel: { fontSize: 9, fontFamily: 'DMSans_500Medium' },

  historyTitle: {
    color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_500Medium',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12,
  },

  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 8,
  },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txBody: { flex: 1 },
  txTitle: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  txType: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2, textTransform: 'capitalize' },
  txDate: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  txPoints: { fontSize: 16, fontFamily: 'Poppins_700Bold' },

  empty: { alignItems: 'center', marginTop: 40, gap: 10 },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  emptyText: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular' },
})

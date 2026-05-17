import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, ScrollView,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import QRCode from 'react-native-qrcode-svg'
import { getPasses, EventPass } from '@/lib/api'
import { colors, radius } from '@/theme'

export default function PassesScreen() {
  const [passes, setPasses] = useState<EventPass[]>([])
  const [newPassIds, setNewPassIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<EventPass | null>(null)

  const load = useCallback(async () => {
    try {
      const { passes: p, newPassIds: n } = await getPasses()
      setPasses(p)
      setNewPassIds(n)
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

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      <View style={s.header}>
        <Text style={s.heading}>My Passes</Text>
        <Text style={s.subheading}>{passes.length} pass{passes.length !== 1 ? 'es' : ''}</Text>
      </View>

      {loading
        ? <ActivityIndicator color={colors.blue} style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={passes}
            keyExtractor={p => p.id}
            contentContainerStyle={s.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="id-card-outline" size={48} color={colors.textMuted} />
                <Text style={s.emptyTitle}>No passes yet</Text>
                <Text style={s.emptyText}>Passes are issued when you attend an event or your registration is confirmed.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <PassCard
                pass={item}
                isNew={newPassIds.includes(item.id)}
                onPress={() => setSelected(item)}
              />
            )}
          />
        )
      }

      {/* QR Modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && <PassModal pass={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </SafeAreaView>
  )
}

function PassCard({ pass, isNew, onPress }: { pass: EventPass; isNew: boolean; onPress: () => void }) {
  const event = pass.event
  const passLabel = pass.pass_type === 'attendance' ? 'Attendance Pass' : 'Event Pass'

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      <View style={s.cardLeft}>
        <View style={s.passIconWrap}>
          <Ionicons name="id-card-outline" size={22} color={colors.gold} />
        </View>
      </View>
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <Text style={s.passLabel}>{passLabel}</Text>
          {isNew && (
            <View style={s.newBadge}>
              <Text style={s.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        {event && (
          <>
            <Text style={s.eventTitle} numberOfLines={1}>{event.title}</Text>
            <View style={s.metaRow}>
              <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
              <Text style={s.metaText}>{format(new Date(event.date_start), 'd MMM yyyy')}</Text>
              {event.venue_city && (
                <>
                  <Text style={s.metaDot}>·</Text>
                  <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                  <Text style={s.metaText}>{event.venue_city}</Text>
                </>
              )}
            </View>
          </>
        )}
        <Text style={s.issuedText}>Issued {format(new Date(pass.issued_at), 'd MMM yyyy')}</Text>
      </View>
      <Ionicons name="qr-code-outline" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  )
}

function PassModal({ pass, onClose }: { pass: EventPass; onClose: () => void }) {
  const event = pass.event
  const passLabel = pass.pass_type === 'attendance' ? 'Attendance Pass' : 'Event Pass'
  const qrValue = pass.qr_token ?? pass.id

  return (
    <SafeAreaView style={s.modal}>
      <View style={s.modalNav}>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.modalTitle}>{passLabel}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.modalContent} showsVerticalScrollIndicator={false}>
        {/* QR Code */}
        <View style={s.qrWrap}>
          <QRCode
            value={qrValue}
            size={220}
            color="#000000"
            backgroundColor="#FFFFFF"
          />
        </View>

        {/* Pass info */}
        {event && (
          <View style={s.passInfo}>
            <Text style={s.passEventTitle}>{event.title}</Text>
            <View style={s.passMetaRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={s.passMetaText}>{format(new Date(event.date_start), 'EEE, d MMM yyyy · h:mm a')}</Text>
            </View>
            {event.venue_name && (
              <View style={s.passMetaRow}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text style={s.passMetaText}>{event.venue_name}{event.venue_city ? `, ${event.venue_city}` : ''}</Text>
              </View>
            )}
          </View>
        )}

        <View style={s.tokenCard}>
          <Text style={s.tokenLabel}>Pass ID</Text>
          <Text style={s.tokenValue} numberOfLines={1}>{qrValue.slice(0, 24)}…</Text>
        </View>

        <Text style={s.issuedNote}>
          Issued {format(new Date(pass.issued_at), 'd MMM yyyy')} · Show this QR code to the organizer
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  heading: { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold' },
  subheading: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },

  list: { padding: 16, gap: 12, paddingBottom: 32 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14,
  },
  cardLeft: {},
  passIconWrap: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: colors.gold + '1A',
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  passLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
  newBadge: {
    backgroundColor: colors.gold + '1A',
    borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: colors.gold + '44',
  },
  newBadgeText: { color: colors.gold, fontSize: 9, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  eventTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  metaText: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  metaDot: { color: colors.textMuted, fontSize: 12 },
  issuedText: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  emptyText: { color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 22 },

  // Modal
  modal: { flex: 1, backgroundColor: colors.pageBg },
  modalNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  modalContent: { alignItems: 'center', padding: 24, gap: 24 },

  qrWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 24,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  passInfo: { alignSelf: 'stretch', alignItems: 'center', gap: 8 },
  passEventTitle: { color: colors.textPrimary, fontSize: 20, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  passMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  passMetaText: { color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_400Regular' },

  tokenCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 12, alignItems: 'center', gap: 4,
  },
  tokenLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_500Medium', textTransform: 'uppercase', letterSpacing: 1 },
  tokenValue: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular' },

  issuedNote: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', textAlign: 'center' },
})

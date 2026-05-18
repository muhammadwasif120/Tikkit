import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, TextInput,
  Alert, Modal,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import QRCode from 'react-native-qrcode-svg'
import { Skeleton } from '@/components/Skeleton'
import { getOrganizerGuests, updateOrgGuest, deleteOrgGuest, OrgGuest } from '@/lib/api'
import { colors, radius } from '@/theme'

type Tier = 'all' | 'vip' | 'regular' | 'waitlist'
const TIERS: { key: Tier; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'vip', label: 'VIP' },
  { key: 'regular', label: 'Regular' },
  { key: 'waitlist', label: 'Waitlist' },
]

const STATUS_META: Record<string, { color: string; bg: string }> = {
  invited:    { color: colors.indigo,   bg: colors.indigoSubtle },
  registered: { color: colors.blue,     bg: colors.blueSubtle },
  confirmed:  { color: colors.success,  bg: colors.successSubtle },
  checked_in: { color: colors.success,  bg: colors.successSubtle },
  checked_out:{ color: colors.textSecondary, bg: 'rgba(107,114,128,0.1)' },
  cancelled:  { color: colors.error,    bg: colors.errorSubtle },
}

function GuestSkeleton() {
  return (
    <View style={{ padding: 16, gap: 10 }}>
      {[0, 1, 2, 3, 4].map(i => (
        <View key={i} style={{ flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          <Skeleton height={40} width={40} style={{ borderRadius: 20 }} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Skeleton height={14} width={130} style={{ borderRadius: 7 }} />
              <Skeleton height={20} width={56} style={{ borderRadius: radius.full }} />
            </View>
            <Skeleton height={12} width={180} style={{ borderRadius: 6 }} />
            <Skeleton height={11} width={100} style={{ borderRadius: 5, marginTop: 2 }} />
          </View>
        </View>
      ))}
    </View>
  )
}

export default function GuestsScreen() {
  const [tier, setTier] = useState<Tier>('all')
  const [guests, setGuests] = useState<OrgGuest[]>([])
  const [events, setEvents] = useState<Array<{ id: string; title: string; status: string }>>([])
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [editGuest, setEditGuest] = useState<OrgGuest | null>(null)
  const [qrGuest, setQrGuest] = useState<OrgGuest | null>(null)
  const [saving, setSaving] = useState(false)
  // Edit form state
  const [eName, setEName] = useState('')
  const [eEmail, setEEmail] = useState('')
  const [ePhone, setEPhone] = useState('')
  const [eGender, setEGender] = useState('')
  const [eVip, setEVip] = useState(false)
  const [eWaitlist, setEWaitlist] = useState(false)

  const load = useCallback(async (t: Tier, evId?: string) => {
    try {
      const { guests: g, events: e } = await getOrganizerGuests(evId, t === 'all' ? undefined : t)
      setGuests(g)
      setEvents(e)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    setLoading(true)
    load(tier, selectedEventId).finally(() => setLoading(false))
  }, [tier, selectedEventId])

  const onRefresh = async () => {
    setRefreshing(true)
    await load(tier, selectedEventId)
    setRefreshing(false)
  }

  const filtered = guests.filter(g => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return g.full_name.toLowerCase().includes(q) || (g.email ?? '').toLowerCase().includes(q)
  })

  const openEdit = (g: OrgGuest) => {
    setEditGuest(g)
    setEName(g.full_name)
    setEEmail(g.email ?? '')
    setEPhone(g.phone ?? '')
    setEGender(g.gender ?? '')
    setEVip(g.is_vip)
    setEWaitlist(g.waitlist)
  }

  const handleSave = async () => {
    if (!editGuest) return
    setSaving(true)
    try {
      await updateOrgGuest(editGuest.id, {
        full_name: eName.trim() || editGuest.full_name,
        email: eEmail.trim() || null,
        phone: ePhone.trim() || null,
        gender: eGender.trim() || null,
        is_vip: eVip,
        waitlist: eWaitlist,
      })
      setEditGuest(null)
      await load(tier, selectedEventId)
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (g: OrgGuest) => {
    Alert.alert('Delete Guest', `Remove ${g.full_name} from the event?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteOrgGuest(g.id)
            await load(tier, selectedEventId)
          } catch (err: any) {
            Alert.alert('Error', err.message ?? 'Failed to delete')
          }
        }
      },
    ])
  }

  const eventMap = Object.fromEntries(events.map(e => [e.id, e]))

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      <View style={s.header}>
        <Text style={s.heading}>Guests</Text>
        <Text style={s.subheading}>{filtered.length} guest{filtered.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Tier tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabs}>
        {TIERS.map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, tier === t.key && s.tabActive]} onPress={() => setTier(t.key)}>
            <Text style={[s.tabText, tier === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
        <View style={s.divider} />
        {/* Event filter pills */}
        <TouchableOpacity
          style={[s.tab, !selectedEventId && s.tabActive]}
          onPress={() => setSelectedEventId(undefined)}
        >
          <Text style={[s.tabText, !selectedEventId && s.tabTextActive]}>All Events</Text>
        </TouchableOpacity>
        {events.slice(0, 5).map(e => (
          <TouchableOpacity
            key={e.id}
            style={[s.tab, selectedEventId === e.id && s.tabActive]}
            onPress={() => setSelectedEventId(e.id)}
          >
            <Text style={[s.tabText, selectedEventId === e.id && s.tabTextActive]} numberOfLines={1}>{e.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search guests…"
          placeholderTextColor={colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading
        ? <GuestSkeleton />
        : (
          <FlatList
            data={filtered}
            keyExtractor={g => g.id}
            contentContainerStyle={s.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
            ListEmptyComponent={
              <View style={s.empty}>
                <LinearGradient
                  colors={[colors.blue + '25', 'transparent']}
                  style={s.emptyIconCircle}
                >
                  <Ionicons name={search ? 'search-outline' : 'people-outline'} size={28} color={colors.blue} />
                </LinearGradient>
                <Text style={s.emptyTitle}>{search ? 'No results found' : 'No guests yet'}</Text>
                <Text style={s.emptyBody}>{search ? `No guests match "${search}"` : 'Guests added to your events will appear here'}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const statusMeta = STATUS_META[item.status] ?? { color: colors.textMuted, bg: colors.surface2 }
              const event = eventMap[item.event_id]
              return (
                <View style={s.card}>
                  <View style={s.cardLeft}>
                    <View style={[s.avatar, item.is_vip && { backgroundColor: colors.gold + '1A', borderColor: colors.gold }]}>
                      <Text style={[s.avatarLetter, item.is_vip && { color: colors.gold }]}>{item.full_name.charAt(0).toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={s.cardBody}>
                    <View style={s.cardTop}>
                      <Text style={s.cardName}>{item.full_name}</Text>
                      <View style={s.badges}>
                        {item.is_vip && (
                          <View style={[s.badge, { backgroundColor: colors.gold + '1A' }]}>
                            <Text style={[s.badgeText, { color: colors.gold }]}>VIP</Text>
                          </View>
                        )}
                        {item.waitlist && (
                          <View style={[s.badge, { backgroundColor: colors.warningSubtle }]}>
                            <Text style={[s.badgeText, { color: colors.warning }]}>Waitlist</Text>
                          </View>
                        )}
                        <View style={[s.badge, { backgroundColor: statusMeta.bg }]}>
                          <Text style={[s.badgeText, { color: statusMeta.color }]}>{item.status.replace('_', ' ')}</Text>
                        </View>
                      </View>
                    </View>
                    {item.email && <Text style={s.cardEmail} numberOfLines={1}>{item.email}</Text>}
                    {event && <Text style={s.cardEvent} numberOfLines={1}>{event.title}</Text>}
                    <View style={s.cardActions}>
                      <TouchableOpacity style={s.iconBtn} onPress={() => setQrGuest(item)}>
                        <Ionicons name="qr-code-outline" size={16} color={colors.blue} />
                        <Text style={[s.iconBtnText, { color: colors.blue }]}>QR</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.iconBtn} onPress={() => openEdit(item)}>
                        <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                        <Text style={s.iconBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.iconBtn} onPress={() => handleDelete(item)}>
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                        <Text style={[s.iconBtnText, { color: colors.error }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )
            }}
          />
        )
      }

      {/* Edit Modal */}
      <Modal visible={!!editGuest} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditGuest(null)}>
        {editGuest && (
          <SafeAreaView style={s.modal}>
            <View style={s.modalNav}>
              <TouchableOpacity style={s.closeBtn} onPress={() => setEditGuest(null)}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={s.modalTitle}>Edit Guest</Text>
              <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={s.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">
              <EField label="Full Name" value={eName} onChange={setEName} placeholder="Guest name" />
              <EField label="Email" value={eEmail} onChange={setEEmail} placeholder="email@example.com" keyboard="email-address" />
              <EField label="Phone" value={ePhone} onChange={setEPhone} placeholder="+92 300 000 0000" keyboard="phone-pad" />
              <EField label="Gender" value={eGender} onChange={setEGender} placeholder="male / female / other" />
              <Toggle label="VIP Guest" value={eVip} onChange={setEVip} color={colors.gold} />
              <Toggle label="Waitlist" value={eWaitlist} onChange={setEWaitlist} color={colors.warning} />
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* QR Modal */}
      <Modal visible={!!qrGuest} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setQrGuest(null)}>
        {qrGuest && (
          <SafeAreaView style={s.modal}>
            <View style={s.modalNav}>
              <TouchableOpacity style={s.closeBtn} onPress={() => setQrGuest(null)}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={s.modalTitle}>Guest QR Code</Text>
              <View style={{ width: 60 }} />
            </View>
            <View style={s.qrContainer}>
              <View style={s.qrWrap}>
                <QRCode value={qrGuest.id} size={220} color="#000000" backgroundColor="#FFFFFF" />
              </View>
              <Text style={s.qrName}>{qrGuest.full_name}</Text>
              {qrGuest.email && <Text style={s.qrEmail}>{qrGuest.email}</Text>}
              {qrGuest.is_vip && (
                <View style={s.vipBadge}>
                  <Ionicons name="star" size={12} color={colors.gold} />
                  <Text style={s.vipBadgeText}>VIP Guest</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  )
}

function EField({ label, value, onChange, placeholder, keyboard }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; keyboard?: any
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboard}
      />
    </View>
  )
}

function Toggle({ label, value, onChange, color }: { label: string; value: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <TouchableOpacity style={s.toggleRow} onPress={() => onChange(!value)} activeOpacity={0.7}>
      <Text style={s.toggleLabel}>{label}</Text>
      <View style={[s.togglePill, { backgroundColor: value ? color + '1A' : colors.surface2, borderColor: value ? color + '44' : colors.border }]}>
        <Text style={[s.togglePillText, { color: value ? color : colors.textMuted }]}>{value ? 'Yes' : 'No'}</Text>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  heading: { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold' },
  subheading: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },

  tabsScroll: { flexGrow: 0, marginBottom: 8 },
  tabs: { paddingHorizontal: 16, gap: 8, paddingVertical: 4, alignItems: 'center' },
  tab: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full },
  tabActive: { backgroundColor: colors.blueSubtle, borderColor: colors.blueBorder },
  tabText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_500Medium' },
  tabTextActive: { color: colors.blue },
  divider: { width: 1, height: 20, backgroundColor: colors.border },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular' },

  list: { padding: 16, gap: 10, paddingBottom: 32 },

  card: {
    flexDirection: 'row', gap: 12,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 14,
  },
  cardLeft: {},
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.blueSubtle, borderWidth: 1, borderColor: colors.blueBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { color: colors.blue, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  cardName: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium', flex: 1, marginRight: 8 },
  badges: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  badgeText: { fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '600' },
  cardEmail: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginBottom: 2 },
  cardEvent: { color: colors.blue, fontSize: 11, fontFamily: 'DMSans_400Regular', marginBottom: 6 },
  cardActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtnText: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular' },

  empty:          { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32, gap: 10 },
  emptyIconCircle:{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:     { color: colors.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  emptyBody:      { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 20 },

  // Modal shared
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
  saveBtn: { backgroundColor: colors.blue, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { color: colors.white, fontSize: 14, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  modalContent: { padding: 16, gap: 12, paddingBottom: 40 },

  fieldWrap: {},
  fieldLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_500Medium', marginBottom: 6 },
  fieldInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular',
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 14,
  },
  toggleLabel: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  togglePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1 },
  togglePillText: { fontSize: 13, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  // QR Modal
  qrContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  qrWrap: {
    backgroundColor: '#FFF', borderRadius: radius.lg, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  qrName: { color: colors.textPrimary, fontSize: 20, fontFamily: 'Poppins_600SemiBold' },
  qrEmail: { color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular' },
  vipBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.gold + '1A', borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: colors.gold + '44',
  },
  vipBadgeText: { color: colors.gold, fontSize: 12, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
})

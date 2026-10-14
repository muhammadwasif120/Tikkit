import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, FlatList,
} from 'react-native'
import { useState, useEffect, useRef, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { scanQRWithInvite, ScanResult } from '@/lib/api'
import { colors, radius } from '@/theme'
import { haptic } from '@/lib/haptics'

type InviteRole = 'admin' | 'manager' | 'gate_staff'
type Invite = { organizer_id: string; role: InviteRole; label: string; revoked: boolean; expires_at: string | null }
type TeamEvent = { id: string; title: string; date_start: string }

type LoadState = 'loading' | 'not_found' | 'expired' | 'ready'
type ScanState = 'idle' | 'scanning' | 'success' | 'duplicate' | 'error'

const ROLE_LABEL: Record<InviteRole, string> = { admin: 'Admin', manager: 'Manager', gate_staff: 'Gate Staff' }

const STATE_COLOR: Record<ScanState, string> = {
  idle: colors.blue, scanning: colors.blue, success: colors.success, duplicate: colors.warning, error: colors.error,
}

export default function TeamAccessScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const router = useRouter()
  const [permission, requestPermission] = useCameraPermissions()

  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [invite, setInvite] = useState<Invite | null>(null)
  const [events, setEvents] = useState<TeamEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<TeamEvent | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [view, setView] = useState<'scanner' | 'events'>('scanner')

  const [scanState, setScanState] = useState<ScanState>('idle')
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [sessionStats, setSessionStats] = useState({ success: 0, duplicate: 0, error: 0 })
  const cooldown = useRef(false)

  useEffect(() => {
    if (!token) return
    const load = async () => {
      const { data } = await (supabase as any)
        .from('team_invites')
        .select('organizer_id, role, label, revoked, expires_at')
        .eq('token', token)
        .eq('revoked', false)
        .maybeSingle()

      if (!data) { setLoadState('not_found'); return }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setLoadState('expired'); return }

      setInvite(data)
      setView(data.role === 'gate_staff' ? 'scanner' : 'events')

      const { data: eventRows } = await (supabase as any)
        .from('events')
        .select('id, title, date_start')
        .eq('organizer_id', data.organizer_id)
        .eq('status', 'published')
        .eq('is_private', false)
        .order('date_start', { ascending: false })

      const list: TeamEvent[] = eventRows ?? []
      setEvents(list)
      if (list.length > 0) setSelectedEvent(list[0])
      setLoadState('ready')
    }
    load().catch(() => setLoadState('not_found'))
  }, [token])

  const handleBarCode = useCallback(async ({ data }: { data: string }) => {
    if (cooldown.current || !selectedEvent || !data || !invite) return
    cooldown.current = true
    setScanState('scanning')

    try {
      const result = await scanQRWithInvite(String(token), data, selectedEvent.id, 'entry')
      setLastResult(result)
      const outcome: ScanState = !result.valid ? 'error' : result.already_checked_in ? 'duplicate' : 'success'
      setScanState(outcome)
      if (outcome === 'success') haptic.success()
      else if (outcome === 'duplicate') haptic.warning()
      else haptic.error()
      setSessionStats(prev => ({ ...prev, [outcome === 'error' ? 'error' : outcome === 'duplicate' ? 'duplicate' : 'success']: prev[outcome === 'error' ? 'error' : outcome === 'duplicate' ? 'duplicate' : 'success'] + 1 }))
    } catch {
      setScanState('error')
      haptic.error()
      setLastResult({ valid: false, error: 'Network error' })
      setSessionStats(prev => ({ ...prev, error: prev.error + 1 }))
    }

    setTimeout(() => { setScanState('idle'); setLastResult(null); cooldown.current = false }, 3000)
  }, [selectedEvent, invite, token])

  if (loadState === 'loading') {
    return <View style={s.centered}><ActivityIndicator color={colors.blue} /></View>
  }

  if (loadState === 'not_found') {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.centered}>
          <Ionicons name="close-circle-outline" size={40} color={colors.textMuted} />
          <Text style={s.stateTitle}>Invalid or revoked link</Text>
          <Text style={s.stateText}>Ask your organizer for a new access link.</Text>
          <TouchableOpacity style={s.backLink} onPress={() => router.replace('/(auth)/login')}>
            <Text style={s.backLinkText}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (loadState === 'expired') {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.centered}>
          <Ionicons name="time-outline" size={40} color={colors.textMuted} />
          <Text style={s.stateTitle}>Link expired</Text>
          <Text style={s.stateText}>Ask your organizer for a new access link.</Text>
          <TouchableOpacity style={s.backLink} onPress={() => router.replace('/(auth)/login')}>
            <Text style={s.backLinkText}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const overlayColor = STATE_COLOR[scanState]
  const isGateStaff = invite?.role === 'gate_staff'

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerLabel} numberOfLines={1}>{invite?.label}</Text>
        <View style={s.rolePill}>
          <Ionicons name="shield-checkmark-outline" size={11} color={colors.blue} />
          <Text style={s.rolePillText}>{invite ? ROLE_LABEL[invite.role] : ''}</Text>
        </View>
      </View>

      {/* View switch — admin/manager can browse events; gate staff only scans */}
      {!isGateStaff && (
        <View style={s.tabRow}>
          <TouchableOpacity style={[s.tabBtn, view === 'events' && s.tabBtnActive]} onPress={() => setView('events')}>
            <Text style={[s.tabText, view === 'events' && s.tabTextActive]}>Events</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tabBtn, view === 'scanner' && s.tabBtnActive]} onPress={() => setView('scanner')}>
            <Text style={[s.tabText, view === 'scanner' && s.tabTextActive]}>Scanner</Text>
          </TouchableOpacity>
        </View>
      )}

      {view === 'events' && !isGateStaff ? (
        <FlatList
          data={events}
          keyExtractor={e => e.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={<Text style={s.stateText}>No published events found.</Text>}
          renderItem={({ item }) => (
            <View style={s.eventRow}>
              <Text style={s.eventTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={s.eventDate}>{new Date(item.date_start).toLocaleDateString()}</Text>
            </View>
          )}
        />
      ) : (
        <>
          {!permission ? (
            <View style={s.centered}><ActivityIndicator color={colors.blue} /></View>
          ) : !permission.granted ? (
            <View style={s.centered}>
              <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
              <Text style={s.stateTitle}>Camera access required</Text>
              <Text style={s.stateText}>Allow camera access to scan guest QR codes</Text>
              <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
                <Text style={s.permBtnText}>Grant permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity style={s.eventPicker} onPress={() => setShowPicker(true)}>
                <Ionicons name="calendar-outline" size={16} color={colors.blue} />
                <Text style={s.pickerText} numberOfLines={1}>{selectedEvent?.title ?? 'Select an event'}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={s.cameraWrap}>
                <CameraView
                  style={{ flex: 1 }}
                  facing="back"
                  onBarcodeScanned={scanState === 'idle' && selectedEvent ? handleBarCode : undefined}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                />
                {scanState !== 'idle' && (
                  <View style={[s.resultOverlay, { backgroundColor: overlayColor + 'CC' }]}>
                    {scanState === 'scanning' && <ActivityIndicator color={colors.white} size="large" />}
                    {scanState === 'success' && (
                      <View style={s.resultContent}>
                        <Ionicons name="checkmark-circle" size={56} color={colors.white} />
                        <Text style={s.resultName}>{lastResult?.guest?.name}</Text>
                        <Text style={s.resultStatus}>Checked In!</Text>
                      </View>
                    )}
                    {scanState === 'duplicate' && (
                      <View style={s.resultContent}>
                        <Ionicons name="warning-outline" size={56} color={colors.white} />
                        <Text style={s.resultName}>{lastResult?.guest?.name}</Text>
                        <Text style={s.resultStatus}>Already Checked In</Text>
                      </View>
                    )}
                    {scanState === 'error' && (
                      <View style={s.resultContent}>
                        <Ionicons name="close-circle" size={56} color={colors.white} />
                        <Text style={s.resultStatus}>{lastResult?.error ?? 'Invalid QR Code'}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <Text style={s.hint}>Point camera at guest's QR ticket</Text>

              <View style={s.statsRow}>
                <View style={s.statPill}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                  <Text style={[s.statText, { color: colors.success }]}>{sessionStats.success} in</Text>
                </View>
                <View style={s.statPill}>
                  <Ionicons name="warning-outline" size={14} color={colors.warning} />
                  <Text style={[s.statText, { color: colors.warning }]}>{sessionStats.duplicate} dup</Text>
                </View>
                <View style={s.statPill}>
                  <Ionicons name="close-circle-outline" size={14} color={colors.error} />
                  <Text style={[s.statText, { color: colors.error }]}>{sessionStats.error} err</Text>
                </View>
              </View>
            </>
          )}
        </>
      )}

      <Modal visible={showPicker} animationType="slide" transparent>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setShowPicker(false)} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>Select event to scan</Text>
          <FlatList
            data={events}
            keyExtractor={e => e.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.sheetRow} onPress={() => { setSelectedEvent(item); setShowPicker(false) }}>
                <Text style={s.sheetRowTitle} numberOfLines={1}>{item.title}</Text>
                {selectedEvent?.id === item.id && <Ionicons name="checkmark-circle" size={20} color={colors.blue} />}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={s.stateText}>No published events found</Text>}
          />
          <TouchableOpacity style={s.sheetCancel} onPress={() => setShowPicker(false)}>
            <Text style={s.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  stateTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Sora_600SemiBold' },
  stateText: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', textAlign: 'center' },
  backLink: { marginTop: 8, padding: 10 },
  backLinkText: { color: colors.blue, fontSize: 13, fontFamily: 'DMSans_500Medium' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  headerLabel: { color: colors.textPrimary, fontSize: 15, fontFamily: 'Sora_600SemiBold', flex: 1, marginRight: 8 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.blueSubtle, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: colors.blueBorder,
  },
  rolePillText: { color: colors.blue, fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabBtnActive: { backgroundColor: colors.blueSubtle, borderColor: colors.blueBorder },
  tabText: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_500Medium' },
  tabTextActive: { color: colors.blue },

  eventRow: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14 },
  eventTitle: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  eventDate: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },

  permBtn: { backgroundColor: colors.blue, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  permBtnText: { color: colors.navy950, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  eventPicker: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16, marginBottom: 8, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
  },
  pickerText: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium', flex: 1 },

  cameraWrap: { flex: 1, marginHorizontal: 16, borderRadius: radius.xl, overflow: 'hidden' },
  resultOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  resultContent: { alignItems: 'center', gap: 10 },
  resultName: { color: colors.white, fontSize: 22, fontFamily: 'Sora_700Bold' },
  resultStatus: { color: colors.white, fontSize: 16, fontFamily: 'DMSans_500Medium' },

  hint: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', textAlign: 'center', paddingVertical: 10 },

  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingBottom: 12 },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.surface, borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.border,
  },
  statText: { fontSize: 12, fontFamily: 'DMSans_500Medium' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%', borderTopWidth: 1, borderColor: colors.border },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Sora_600SemiBold', marginBottom: 16 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetRowTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: 'DMSans_500Medium', flex: 1 },
  sheetCancel: { marginTop: 16, alignItems: 'center', padding: 14, backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  sheetCancelText: { color: colors.textSecondary, fontFamily: 'DMSans_500Medium' },
})

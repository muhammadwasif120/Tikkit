import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, FlatList, ScrollView,
} from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { format } from 'date-fns'
import { getOrganizerEvents, scanQR, ScanResult, OrganizerEvent } from '@/lib/api'
import { colors, radius } from '@/theme'

type ScanState = 'idle' | 'scanning' | 'success' | 'error' | 'duplicate'
type ScanType = 'entry' | 'exit'

type ScanLogEntry = {
  id: string
  name: string
  time: Date
  outcome: 'success' | 'duplicate' | 'error'
  message: string
}

const STATE_COLOR: Record<ScanState, string> = {
  idle: colors.blue,
  scanning: colors.blue,
  success: colors.success,
  duplicate: colors.warning,
  error: colors.error,
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<OrganizerEvent | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [scanType, setScanType] = useState<ScanType>('entry')
  const [scanLog, setScanLog] = useState<ScanLogEntry[]>([])
  const [sessionStats, setSessionStats] = useState({ success: 0, duplicate: 0, error: 0 })
  const cooldown = useRef(false)

  useEffect(() => {
    getOrganizerEvents('published').then(({ events: e }) => {
      setEvents(e)
      if (e.length > 0) setSelectedEvent(e[0])
    }).catch(() => {})
  }, [])

  const handleBarCode = async ({ data }: { data: string }) => {
    if (cooldown.current || !selectedEvent || !data) return
    cooldown.current = true
    setScanState('scanning')

    try {
      const result = await scanQR(data, selectedEvent.id, scanType)
      setLastResult(result)

      const outcome: ScanLogEntry['outcome'] = !result.valid ? 'error' : result.already_checked_in ? 'duplicate' : 'success'
      setScanState(outcome)

      setSessionStats(prev => ({ ...prev, [outcome]: prev[outcome] + 1 }))

      const entry: ScanLogEntry = {
        id: Date.now().toString(),
        name: result.guest?.name ?? 'Unknown',
        time: new Date(),
        outcome,
        message: !result.valid
          ? (result.error ?? 'Invalid QR')
          : result.already_checked_in
            ? 'Already checked in'
            : scanType === 'entry' ? 'Checked in' : 'Checked out',
      }
      setScanLog(prev => [entry, ...prev].slice(0, 20))
    } catch {
      setScanState('error')
      setLastResult({ valid: false, error: 'Network error' })
      setSessionStats(prev => ({ ...prev, error: prev.error + 1 }))
    }

    setTimeout(() => {
      setScanState('idle')
      setLastResult(null)
      cooldown.current = false
    }, 3000)
  }

  if (!permission) {
    return <View style={s.centered}><ActivityIndicator color={colors.blue} /></View>
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.centered}>
          <View style={s.permIcon}>
            <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={s.permTitle}>Camera Access Required</Text>
          <Text style={s.permText}>Allow camera access to scan guest QR codes</Text>
          <TouchableOpacity style={s.permBtn} onPress={requestPermission} activeOpacity={0.8}>
            <Text style={s.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const overlayColor = STATE_COLOR[scanState]

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* Event picker */}
      <TouchableOpacity style={s.eventPicker} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
        <View style={s.pickerIcon}>
          <Ionicons name="calendar-outline" size={16} color={colors.blue} />
        </View>
        <Text style={s.pickerText} numberOfLines={1}>
          {selectedEvent?.title ?? 'Select an event'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Entry / Exit toggle */}
      <View style={s.toggleRow}>
        <TouchableOpacity
          style={[s.toggleBtn, scanType === 'entry' && s.toggleBtnActive]}
          onPress={() => setScanType('entry')}
          activeOpacity={0.7}
        >
          <Ionicons name="log-in-outline" size={15} color={scanType === 'entry' ? colors.blue : colors.textMuted} />
          <Text style={[s.toggleText, scanType === 'entry' && s.toggleTextActive]}>Entry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.toggleBtn, scanType === 'exit' && s.toggleBtnExit]}
          onPress={() => setScanType('exit')}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={15} color={scanType === 'exit' ? colors.indigo : colors.textMuted} />
          <Text style={[s.toggleText, scanType === 'exit' && s.toggleTextExit]}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Camera */}
      <View style={s.cameraWrap}>
        <CameraView
          style={s.camera}
          facing="back"
          onBarcodeScanned={scanState === 'idle' ? handleBarCode : undefined}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        {/* Corner viewfinder */}
        <View style={s.viewfinderWrap}>
          <View style={[s.corner, s.cornerTL, { borderColor: overlayColor }]} />
          <View style={[s.corner, s.cornerTR, { borderColor: overlayColor }]} />
          <View style={[s.corner, s.cornerBL, { borderColor: overlayColor }]} />
          <View style={[s.corner, s.cornerBR, { borderColor: overlayColor }]} />
        </View>

        {/* Scan result overlay */}
        {scanState !== 'idle' && (
          <View style={[s.resultOverlay, { backgroundColor: overlayColor + 'CC' }]}>
            {scanState === 'scanning' && <ActivityIndicator color={colors.white} size="large" />}
            {scanState === 'success' && (
              <View style={s.resultContent}>
                <Ionicons name="checkmark-circle" size={56} color={colors.white} />
                <Text style={s.resultName}>{lastResult?.guest?.name}</Text>
                {lastResult?.guest?.is_vip && (
                  <View style={s.vipBadge}>
                    <Ionicons name="star" size={12} color={colors.gold} />
                    <Text style={s.vipText}>VIP Guest</Text>
                  </View>
                )}
                <Text style={s.resultStatus}>{scanType === 'entry' ? 'Checked In!' : 'Checked Out!'}</Text>
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

      {/* Session stats */}
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

      {/* Scan log */}
      {scanLog.length > 0 && (
        <ScrollView style={s.log} contentContainerStyle={s.logContent} showsVerticalScrollIndicator={false}>
          {scanLog.map(entry => (
            <View key={entry.id} style={s.logRow}>
              <Ionicons
                name={entry.outcome === 'success' ? 'checkmark-circle' : entry.outcome === 'duplicate' ? 'warning' : 'close-circle'}
                size={14}
                color={entry.outcome === 'success' ? colors.success : entry.outcome === 'duplicate' ? colors.warning : colors.error}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.logName} numberOfLines={1}>{entry.name}</Text>
                <Text style={s.logMsg}>{entry.message}</Text>
              </View>
              <Text style={s.logTime}>{format(entry.time, 'h:mm:ss a')}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Event picker modal */}
      <Modal visible={showPicker} animationType="slide" transparent>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setShowPicker(false)} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>Select Event to Scan</Text>
          <FlatList
            data={events}
            keyExtractor={e => e.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.sheetRow, selectedEvent?.id === item.id && s.sheetRowActive]}
                onPress={() => { setSelectedEvent(item); setShowPicker(false) }}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.sheetRowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={s.sheetRowMeta}>{item.registration_count} registered</Text>
                </View>
                {selectedEvent?.id === item.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.blue} />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={s.sheetEmpty}>No published events found</Text>
            }
          />
          <TouchableOpacity style={s.sheetCancel} onPress={() => setShowPicker(false)}>
            <Text style={s.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const CORNER_SIZE = 24
const CORNER_WIDTH = 3

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 },

  permIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  permTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  permText: { color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center' },
  permBtn: {
    backgroundColor: colors.blue, borderRadius: radius.md,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 8,
  },
  permBtnText: { color: colors.white, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  eventPicker: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
  },
  pickerIcon: {
    width: 30, height: 30, borderRadius: radius.sm,
    backgroundColor: colors.blueSubtle, alignItems: 'center', justifyContent: 'center',
  },
  pickerText: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium', flex: 1 },

  toggleRow: {
    flexDirection: 'row', gap: 8,
    marginHorizontal: 16, marginBottom: 10,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8, borderRadius: radius.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  toggleBtnActive: { backgroundColor: colors.blueSubtle, borderColor: colors.blueBorder },
  toggleBtnExit: { backgroundColor: colors.indigoSubtle, borderColor: 'rgba(129,140,248,0.3)' },
  toggleText: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_500Medium' },
  toggleTextActive: { color: colors.blue },
  toggleTextExit: { color: colors.indigo },

  cameraWrap: { flex: 1, marginHorizontal: 16, borderRadius: radius.xl, overflow: 'hidden' },
  camera: { flex: 1 },

  viewfinderWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderWidth: CORNER_WIDTH,
  },
  cornerTL: { top: '30%', left: '20%', borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: '30%', right: '20%', borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: '30%', left: '20%', borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: '30%', right: '20%', borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },

  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
  },
  resultContent: { alignItems: 'center', gap: 10 },
  resultName: { color: colors.white, fontSize: 22, fontFamily: 'Poppins_700Bold' },
  resultStatus: { color: colors.white, fontSize: 16, fontFamily: 'DMSans_500Medium' },
  vipBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,199,69,0.2)',
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  vipText: { color: colors.gold, fontSize: 12, fontFamily: 'DMSans_500Medium' },

  hint: {
    color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular',
    textAlign: 'center', paddingVertical: 10,
  },

  statsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 12,
    paddingBottom: 8,
  },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.surface, borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  statText: { fontSize: 12, fontFamily: 'DMSans_500Medium' },

  log: { maxHeight: 150, marginHorizontal: 16, marginBottom: 8 },
  logContent: { gap: 2 },
  logRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 2,
  },
  logName: { color: colors.textPrimary, fontSize: 12, fontFamily: 'DMSans_500Medium' },
  logMsg: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },
  logTime: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_400Regular' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '70%',
    borderTopWidth: 1, borderColor: colors.border,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_600SemiBold', marginBottom: 16 },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sheetRowActive: { opacity: 0.9 },
  sheetRowTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: 'DMSans_500Medium' },
  sheetRowMeta: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  sheetEmpty: { color: colors.textMuted, textAlign: 'center', marginTop: 20, fontFamily: 'DMSans_400Regular' },
  sheetCancel: {
    marginTop: 16, alignItems: 'center', padding: 14,
    backgroundColor: colors.surface2, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  sheetCancelText: { color: colors.textSecondary, fontFamily: 'DMSans_500Medium' },
})

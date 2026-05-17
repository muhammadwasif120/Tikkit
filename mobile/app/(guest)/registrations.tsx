import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, RefreshControl, Alert, Modal,
  Pressable,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import * as ImagePicker from 'expo-image-picker'
import { getMyRegistrations, submitPaymentScreenshot, MyRegistration } from '@/lib/api'
import { colors, radius } from '@/theme'

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS: Record<string, { label: string; color: string; bg: string; icon: string; info: string }> = {
  eoi_submitted: {
    label: 'Under Review',
    color: '#EAB308', bg: 'rgba(234,179,8,0.1)',
    icon: 'time-outline',
    info: 'Your application is being reviewed by the organizer.',
  },
  eoi_approved: {
    label: 'Approved — Pay Now',
    color: '#EF4444', bg: 'rgba(239,68,68,0.1)',
    icon: 'alert-circle-outline',
    info: "You've been approved! Upload your payment screenshot to confirm your spot.",
  },
  payment_pending: {
    label: 'Payment Verifying',
    color: '#818CF8', bg: 'rgba(129,140,248,0.1)',
    icon: 'hourglass-outline',
    info: 'Your payment screenshot is being verified.',
  },
  confirmed: {
    label: 'Confirmed',
    color: '#10B981', bg: 'rgba(16,185,129,0.1)',
    icon: 'checkmark-circle-outline',
    info: "You're all set! Check your Tickets tab for your QR code.",
  },
  approved: {
    label: 'Approved',
    color: '#10B981', bg: 'rgba(16,185,129,0.1)',
    icon: 'checkmark-circle-outline',
    info: 'Your registration has been approved.',
  },
  pending: {
    label: 'Pending',
    color: '#EAB308', bg: 'rgba(234,179,8,0.1)',
    icon: 'time-outline',
    info: 'Your registration is pending.',
  },
  rejected: {
    label: 'Not Approved',
    color: '#EF4444', bg: 'rgba(239,68,68,0.1)',
    icon: 'close-circle-outline',
    info: 'Your application was not approved for this event.',
  },
  waitlisted: {
    label: 'Waitlisted',
    color: colors.textMuted, bg: 'rgba(107,114,128,0.1)',
    icon: 'list-outline',
    info: "You're on the waitlist. We'll notify you if a spot opens up.",
  },
}

/* ─── Payment upload modal ───────────────────────────────────────────────── */
function PaymentModal({ registration, onClose, onSuccess }: {
  registration: MyRegistration
  onClose: () => void
  onSuccess: (updated: MyRegistration) => void
}) {
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload a payment screenshot.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    })
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri)
      setError(null)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take a photo.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    })
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri)
      setError(null)
    }
  }

  const upload = async () => {
    if (!imageUri) return
    setUploading(true)
    setError(null)
    try {
      const updated = await submitPaymentScreenshot(registration.id, imageUri)
      onSuccess(updated.registration)
    } catch (e: any) {
      setError(e.message ?? 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const event = registration.event

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={pm.backdrop} onPress={onClose} />
      <View style={pm.sheet}>
        {/* Handle */}
        <View style={pm.handle} />

        {/* Header */}
        <View style={pm.header}>
          <View style={{ flex: 1 }}>
            <Text style={pm.title}>Submit Payment</Text>
            <Text style={pm.subtitle} numberOfLines={1}>{event?.title ?? 'Event'}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={pm.closeBtn}>
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Price info */}
        {event?.ticket_price && event.ticket_price > 0 && (
          <View style={pm.priceRow}>
            <Ionicons name="pricetag-outline" size={14} color={colors.blue} />
            <Text style={pm.priceLabel}>Amount to pay:</Text>
            <Text style={pm.priceValue}>Rs. {event.ticket_price.toLocaleString()}</Text>
          </View>
        )}

        {/* Image preview or picker buttons */}
        {imageUri ? (
          <View style={pm.previewWrap}>
            <Image source={{ uri: imageUri }} style={pm.preview} resizeMode="cover" />
            <TouchableOpacity style={pm.changeBtn} onPress={pickImage}>
              <Ionicons name="swap-horizontal-outline" size={15} color={colors.blue} />
              <Text style={pm.changeBtnText}>Change image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={pm.pickerRow}>
            <TouchableOpacity style={pm.pickerBtn} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={24} color={colors.blue} />
              <Text style={pm.pickerBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pm.pickerBtn} onPress={pickImage}>
              <Ionicons name="images-outline" size={24} color={colors.blue} />
              <Text style={pm.pickerBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {error && (
          <View style={pm.errorRow}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
            <Text style={pm.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[pm.submitBtn, (!imageUri || uploading) && { opacity: 0.5 }]}
          onPress={upload}
          disabled={!imageUri || uploading}
        >
          {uploading
            ? <ActivityIndicator color={colors.white} size="small" />
            : <>
              <Ionicons name="cloud-upload-outline" size={18} color={colors.white} />
              <Text style={pm.submitText}>Submit Screenshot</Text>
            </>
          }
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

/* ─── Main screen ─────────────────────────────────────────────────────────── */
export default function RegistrationsScreen() {
  const router = useRouter()
  const [registrations, setRegistrations] = useState<MyRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [paymentTarget, setPaymentTarget] = useState<MyRegistration | null>(null)

  const load = useCallback(async () => {
    try {
      const { registrations: r } = await getMyRegistrations()
      setRegistrations(r)
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

  const handlePaymentSuccess = (updated: MyRegistration) => {
    setPaymentTarget(null)
    setRegistrations(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r))
    Alert.alert('Submitted!', 'Your payment screenshot has been submitted. We will verify it shortly.')
  }

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
      <View style={s.header}>
        <Text style={s.heading}>My Registrations</Text>
        <Text style={s.subheading}>{registrations.length} registration{registrations.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={registrations}
        keyExtractor={r => r.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="document-text-outline" size={28} color={colors.textMuted} />
            </View>
            <Text style={s.emptyTitle}>No registrations yet</Text>
            <Text style={s.emptyText}>Register for an event to track your application status here</Text>
            <TouchableOpacity style={s.exploreBtn} onPress={() => router.push('/(guest)/explore')}>
              <Text style={s.exploreBtnText}>Explore Events</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <RegistrationCard
            reg={item}
            onPay={() => setPaymentTarget(item)}
            onChat={() => router.push(`/(guest)/chat/${item.event?.id}`)}
            onViewEvent={() => router.push(`/(guest)/event/${item.event?.id}`)}
          />
        )}
      />

      {paymentTarget && (
        <PaymentModal
          registration={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </SafeAreaView>
  )
}

function RegistrationCard({ reg, onPay, onChat, onViewEvent }: {
  reg: MyRegistration
  onPay: () => void
  onChat: () => void
  onViewEvent: () => void
}) {
  const status = STATUS[reg.display_status ?? reg.status] ?? STATUS['pending']
  const event = reg.event
  const eventDate = event?.date_start
    ? format(new Date(event.date_start), 'EEE, d MMM yyyy · h:mm a')
    : null
  const canPay = reg.display_status === 'eoi_approved'
  const canChat = ['eoi_submitted', 'eoi_approved', 'payment_pending', 'confirmed', 'approved'].includes(reg.display_status ?? reg.status)

  return (
    <View style={s.card}>
      {/* Event cover */}
      {event?.cover_image_url
        ? <Image source={{ uri: event.cover_image_url }} style={s.cover} />
        : (
          <View style={[s.cover, s.coverFallback]}>
            <Ionicons name="calendar-outline" size={28} color={colors.textMuted} />
          </View>
        )
      }

      <View style={s.cardBody}>
        {/* Title + status */}
        <View style={s.cardTop}>
          <Text style={s.cardTitle} numberOfLines={2}>{event?.title ?? 'Event'}</Text>
          <View style={[s.badge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon as any} size={11} color={status.color} />
            <Text style={[s.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Status info */}
        <Text style={s.statusInfo}>{status.info}</Text>

        {/* Meta */}
        {eventDate && (
          <View style={s.metaRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={s.metaText}>{eventDate}</Text>
          </View>
        )}
        {event?.venue_name && (
          <View style={s.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text style={s.metaText}>{event.venue_name}</Text>
          </View>
        )}
        <View style={s.metaRow}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={s.metaText}>Applied {format(new Date(reg.created_at), 'd MMM yyyy')}</Text>
        </View>

        {/* Notes from organizer */}
        {reg.notes && (
          <View style={s.noteBox}>
            <Ionicons name="chatbubble-outline" size={12} color={colors.indigo} />
            <Text style={s.noteText}>{reg.notes}</Text>
          </View>
        )}

        {/* Action buttons */}
        {(canPay || canChat) && (
          <View style={s.actions}>
            {canPay && (
              <TouchableOpacity style={s.actionBtnPrimary} onPress={onPay}>
                <Ionicons name="cloud-upload-outline" size={15} color={colors.white} />
                <Text style={s.actionBtnPrimaryText}>Submit Payment</Text>
              </TouchableOpacity>
            )}
            {canChat && (
              <TouchableOpacity style={s.actionBtnSecondary} onPress={onChat}>
                <Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.blue} />
                <Text style={s.actionBtnSecondaryText}>Message Organizer</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity style={s.viewEventBtn} onPress={onViewEvent}>
          <Text style={s.viewEventText}>View Event</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  centered: { flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' },

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  heading: { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold' },
  subheading: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },

  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 16 },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  cover: { width: '100%', height: 100 },
  coverFallback: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },

  cardBody: { padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold', flex: 1 },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full,
  },
  badgeText: { fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '600' },

  statusInfo: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular', lineHeight: 17 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', flex: 1 },

  noteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: colors.indigoSubtle, borderRadius: radius.sm, padding: 10,
  },
  noteText: { color: colors.indigo, fontSize: 12, fontFamily: 'DMSans_400Regular', flex: 1, lineHeight: 17 },

  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtnPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.blue, borderRadius: radius.md, paddingVertical: 10,
  },
  actionBtnPrimaryText: { color: colors.white, fontSize: 13, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  actionBtnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.blueSubtle, borderRadius: radius.md, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.blueBorder,
  },
  actionBtnSecondaryText: { color: colors.blue, fontSize: 13, fontFamily: 'DMSans_500Medium' },

  viewEventBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
    marginTop: 2, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border,
  },
  viewEventText: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  emptyText: { color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center' },
  exploreBtn: {
    backgroundColor: colors.blue, borderRadius: radius.md,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 8,
  },
  exploreBtnText: { color: colors.white, fontSize: 14, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
})

const pm = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
    borderTopWidth: 1, borderColor: colors.border,
    gap: 16,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 4,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  subtitle: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  priceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.blueSubtle, borderRadius: radius.md, padding: 12,
  },
  priceLabel: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular', flex: 1 },
  priceValue: { color: colors.blue, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  pickerRow: { flexDirection: 'row', gap: 12 },
  pickerBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.surface2, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: 20,
  },
  pickerBtnText: { color: colors.blue, fontSize: 13, fontFamily: 'DMSans_500Medium' },
  previewWrap: { gap: 8 },
  preview: { width: '100%', height: 180, borderRadius: radius.lg, backgroundColor: colors.surface2 },
  changeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-end',
  },
  changeBtnText: { color: colors.blue, fontSize: 13, fontFamily: 'DMSans_400Regular' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { color: colors.error, fontSize: 13, fontFamily: 'DMSans_400Regular', flex: 1 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.blue, borderRadius: radius.md, paddingVertical: 14,
  },
  submitText: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
})

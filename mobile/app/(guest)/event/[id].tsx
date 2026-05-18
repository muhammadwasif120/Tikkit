import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Linking, Share,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'
import { getEvent, EventDetail, addFavourite, removeFavourite } from '@/lib/api'
import { colors, radius, getEventGradient } from '@/theme'

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [favourited, setFavourited] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)

  useEffect(() => {
    if (!id) return
    getEvent(id).then(({ event: e }) => {
      setEvent(e)
    }).catch(() => {
      Alert.alert('Error', 'Could not load event')
      router.back()
    }).finally(() => setLoading(false))
  }, [id])

  const toggleFav = async () => {
    if (!event) return
    try {
      if (favourited) { await removeFavourite('event', event.id); setFavourited(false) }
      else { await addFavourite('event', event.id); setFavourited(true) }
    } catch { /* silent */ }
  }

  const handleShare = async () => {
    if (!event) return
    try {
      await Share.share({
        title: event.title,
        message: `Check out "${event.title}" on Tikkit!\nhttps://tikkit.xyz/events/${event.id}`,
      })
    } catch { /* silent */ }
  }

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
    )
  }

  if (!event) return null

  const dateStr = format(new Date(event.date_start), 'EEEE, d MMMM yyyy')
  const timeStr = format(new Date(event.date_start), 'h:mm a')
  const price = event.ticket_price ? `Rs. ${event.ticket_price.toLocaleString()}` : 'Free'
  const reg = event.user_registration
  const gradient = getEventGradient(event.id)
  const catColor = event.event_categories?.color ?? colors.indigo

  const capPct = event.capacity && event.registered_count
    ? Math.min(event.registered_count / event.capacity, 1)
    : null

  const isEOI = event.registration_mode === 'expression_of_interest'
  const isInviteOnly = event.registration_mode === 'invite_only'
  const isLongDesc = (event.description?.length ?? 0) > 200

  const regStatus = (() => {
    if (!reg) return null
    const { status, payment_status } = reg
    if (status === 'rejected')
      return { color: colors.error, bg: colors.errorSubtle, label: 'Registration Rejected', icon: 'close-circle-outline' as const }
    if (status === 'pending')
      return { color: colors.warning, bg: colors.warningSubtle, label: 'Under Review', icon: 'time-outline' as const }
    if (status === 'approved') {
      if (payment_status === 'submitted')
        return { color: colors.indigo, bg: colors.indigoSubtle, label: 'Payment Under Review', icon: 'card-outline' as const }
      if (payment_status === 'pending')
        return { color: colors.warning, bg: colors.warningSubtle, label: 'Payment Required', icon: 'card-outline' as const }
      if (payment_status === 'confirmed')
        return { color: colors.success, bg: colors.successSubtle, label: 'Confirmed & Paid', icon: 'checkmark-circle-outline' as const }
      return { color: colors.success, bg: colors.successSubtle, label: isEOI ? 'Application Accepted' : 'Approved', icon: 'checkmark-circle-outline' as const }
    }
    return { color: colors.textMuted, bg: colors.surface2, label: status, icon: 'ellipse-outline' as const }
  })()

  const stickyBottomPad = Math.max(insets.bottom, 12)

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />

      {/* ── Scrollable content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero */}
        <View style={s.heroWrap}>
          {event.cover_image_url
            ? <Image source={{ uri: event.cover_image_url }} style={s.hero} resizeMode="cover" />
            : (
              <LinearGradient colors={gradient as [string, string]} style={s.hero} start={[0, 0]} end={[1, 1]}>
                <Text style={s.heroInitial}>{event.title.charAt(0)}</Text>
              </LinearGradient>
            )
          }
          <LinearGradient
            colors={['transparent', colors.pageBg]}
            style={s.heroOverlay}
            start={[0, 0.45]} end={[0, 1]}
          />

          {/* Top bar: back | share + heart */}
          <View style={s.topBar}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={colors.white} />
            </TouchableOpacity>
            <View style={s.topBarRight}>
              <TouchableOpacity style={s.iconBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn} onPress={toggleFav}>
                <Ionicons
                  name={favourited ? 'heart' : 'heart-outline'}
                  size={20}
                  color={favourited ? colors.error : colors.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={s.body}>

          {/* Category + reg mode badges */}
          <View style={s.badgeRow}>
            {event.event_categories && (
              <View style={[s.catBadge, { backgroundColor: catColor + '20', borderColor: catColor + '40' }]}>
                {event.event_categories.icon && (
                  <Text style={s.catEmoji}>{event.event_categories.icon}</Text>
                )}
                <Text style={[s.catText, { color: catColor }]}>{event.event_categories.name}</Text>
              </View>
            )}
            {isEOI && (
              <View style={s.eoiBadge}>
                <Ionicons name="document-text-outline" size={10} color="#A855F7" />
                <Text style={s.eoiText}>Application Required</Text>
              </View>
            )}
            {isInviteOnly && (
              <View style={s.inviteBadge}>
                <Ionicons name="lock-closed-outline" size={10} color={colors.textMuted} />
                <Text style={s.inviteText}>Invite Only</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={s.title}>{event.title}</Text>

          {/* Organizer chip */}
          {event.profiles && (
            <TouchableOpacity
              style={s.orgChip}
              activeOpacity={event.profiles.username ? 0.7 : 1}
              onPress={() => {
                if (event.profiles?.username) {
                  Linking.openURL(`https://tikkit.xyz/organizer/${event.profiles.username}`)
                }
              }}
            >
              {/* Avatar */}
              {event.profiles.logo_url
                ? <Image source={{ uri: event.profiles.logo_url }} style={s.orgAvatar} />
                : (
                  <View style={s.orgAvatarFallback}>
                    <Text style={s.orgAvatarInitial}>
                      {(event.profiles.full_name ?? 'O').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )
              }
              <View style={{ flex: 1 }}>
                <Text style={s.orgName} numberOfLines={1}>{event.profiles.full_name}</Text>
                {event.profiles.username && (
                  <Text style={s.orgUsername}>@{event.profiles.username}</Text>
                )}
              </View>
              <View style={s.orgLabel}>
                <Text style={s.orgLabelText}>Organizer</Text>
              </View>
              {event.profiles.username && (
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          )}

          {/* Info grid */}
          <View style={s.infoGrid}>
            {/* Date + Time */}
            <View style={s.infoCard}>
              <View style={s.infoIconWrap}>
                <Ionicons name="calendar-outline" size={16} color={colors.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>Date & Time</Text>
                <Text style={s.infoValue}>{dateStr}</Text>
                <Text style={s.infoSub}>{timeStr}</Text>
              </View>
            </View>

            {/* Venue */}
            {event.venue_name && (
              <TouchableOpacity
                style={s.infoCard}
                activeOpacity={event.venue_maps_url ? 0.7 : 1}
                onPress={() => { if (event.venue_maps_url) Linking.openURL(event.venue_maps_url) }}
              >
                <View style={s.infoIconWrap}>
                  <Ionicons name="location-outline" size={16} color={colors.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.infoLabel}>Venue</Text>
                  <Text style={s.infoValue}>{event.venue_name}</Text>
                  {event.venue_address && <Text style={s.infoSub}>{event.venue_address}</Text>}
                  {event.venue_city && <Text style={s.infoSub}>{event.venue_city}</Text>}
                </View>
                {event.venue_maps_url && (
                  <Ionicons name="map-outline" size={16} color={colors.blue} />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Price + capacity */}
          <View style={s.priceCard}>
            <View>
              <Text style={s.priceLabel}>Ticket Price</Text>
              <Text style={[s.price, { color: event.ticket_price ? colors.blue : colors.success }]}>
                {price}
              </Text>
            </View>
            {(event.registered_count > 0 || event.capacity) && (
              <View style={s.regInfo}>
                <Text style={s.regCount}>{event.registered_count.toLocaleString()}</Text>
                <Text style={s.regLabel}>
                  registered{event.capacity ? ` / ${event.capacity}` : ''}
                </Text>
                {capPct !== null && (
                  <View style={s.capTrack}>
                    <View style={[s.capBar, {
                      width: `${capPct * 100}%` as any,
                      backgroundColor: capPct > 0.9 ? colors.error : capPct > 0.7 ? colors.warning : colors.success,
                    }]} />
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Description */}
          {event.description && (
            <View style={s.descCard}>
              <Text style={s.descTitle}>About this event</Text>
              <Text
                style={s.desc}
                numberOfLines={descExpanded ? undefined : 4}
              >
                {event.description}
              </Text>
              {isLongDesc && (
                <TouchableOpacity
                  onPress={() => setDescExpanded(v => !v)}
                  style={s.readMoreBtn}
                >
                  <Text style={s.readMoreText}>
                    {descExpanded ? 'Show less' : 'Read more'}
                  </Text>
                  <Ionicons
                    name={descExpanded ? 'chevron-up' : 'chevron-down'}
                    size={13}
                    color={colors.blue}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Registered status + chat button (if already registered) */}
          {regStatus && (
            <TouchableOpacity
              style={s.chatBtn}
              onPress={() => router.push(`/(guest)/chat/${event.id}` as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.blue} />
              <Text style={s.chatBtnText}>Message Organizer</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ── Sticky bottom CTA ── */}
      <View style={[s.stickyBar, { paddingBottom: stickyBottomPad }]}>
        {regStatus ? (
          <View style={[s.statusCard, { backgroundColor: regStatus.bg, borderColor: regStatus.color + '55' }]}>
            <Ionicons name={regStatus.icon} size={20} color={regStatus.color} />
            <Text style={[s.statusText, { color: regStatus.color }]}>{regStatus.label}</Text>
          </View>
        ) : isInviteOnly ? (
          <View style={[s.statusCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
            <Text style={[s.statusText, { color: colors.textMuted }]}>Invite Only</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[s.registerBtn, isEOI && { backgroundColor: '#A855F7' }]}
            onPress={() => router.push(`/(guest)/register/${event.id}`)}
            activeOpacity={0.88}
          >
            <Text style={s.registerBtnText}>
              {isEOI ? 'Apply Now' : 'Register Now'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  centered: { flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' },

  // Hero
  heroWrap: { position: 'relative' },
  hero: {
    width: '100%', height: 320,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  heroInitial: { color: colors.white, fontSize: 72, fontFamily: 'Poppins_700Bold' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },

  topBar: {
    position: 'absolute', top: 12, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16,
  },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20, width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },

  // Body
  body: { padding: 20, paddingTop: 8, gap: 14 },

  // Badges
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.full, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  catEmoji: { fontSize: 11 },
  catText: { fontSize: 11, fontFamily: 'DMSans_500Medium', fontWeight: '600' },
  eoiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(168,85,247,0.12)', borderRadius: radius.full,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)',
  },
  eoiText: { color: '#A855F7', fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '600' },
  inviteBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surface2, borderRadius: radius.full,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  inviteText: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '600' },

  // Title
  title: {
    color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold',
    lineHeight: 32, letterSpacing: -0.3,
  },

  // Organizer chip
  orgChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: 12,
  },
  orgAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface2,
  },
  orgAvatarFallback: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.blueSubtle,
    borderWidth: 1, borderColor: colors.blueBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  orgAvatarInitial: { color: colors.blue, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  orgName: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  orgUsername: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  orgLabel: {
    backgroundColor: colors.surface2, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.border,
  },
  orgLabelText: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '600' },

  // Info grid
  infoGrid: { gap: 8 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: 14,
  },
  infoIconWrap: {
    width: 32, height: 32, borderRadius: radius.sm,
    backgroundColor: colors.blueSubtle,
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular', marginBottom: 2 },
  infoValue: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  infoSub: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 1 },

  // Price card
  priceCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 16,
  },
  priceLabel: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginBottom: 4 },
  price: { fontSize: 26, fontFamily: 'Poppins_700Bold' },
  regInfo: { alignItems: 'flex-end' },
  regCount: { color: colors.textPrimary, fontSize: 20, fontFamily: 'Poppins_700Bold' },
  regLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },
  capTrack: {
    width: 80, height: 4, backgroundColor: colors.surface2,
    borderRadius: radius.full, marginTop: 4, overflow: 'hidden',
  },
  capBar: { height: '100%', borderRadius: radius.full },

  // Description
  descCard: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 16, gap: 8,
  },
  descTitle: {
    color: colors.textSecondary, fontSize: 11, fontFamily: 'DMSans_500Medium',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  desc: { color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 22 },
  readMoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2,
  },
  readMoreText: { color: colors.blue, fontSize: 13, fontFamily: 'DMSans_500Medium' },

  // Chat button
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.blueSubtle, borderRadius: radius.md, padding: 14,
    borderWidth: 1, borderColor: colors.blueBorder,
  },
  chatBtnText: { color: colors.blue, fontSize: 15, fontFamily: 'DMSans_500Medium', fontWeight: '600' },

  // Sticky bottom bar
  stickyBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.pageBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: radius.md, borderWidth: 1, padding: 16,
  },
  statusText: { fontSize: 15, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  registerBtn: {
    backgroundColor: colors.blue, borderRadius: radius.md,
    paddingVertical: 16, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  registerBtnText: {
    color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold', fontWeight: '700',
  },
})

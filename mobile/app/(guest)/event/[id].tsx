import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Linking,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'
import { getEvent, EventDetail, addFavourite, removeFavourite } from '@/lib/api'
import { colors, radius, getEventGradient } from '@/theme'

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [favourited, setFavourited] = useState(false)

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
      if (favourited) {
        await removeFavourite('event', event.id)
        setFavourited(false)
      } else {
        await addFavourite('event', event.id)
        setFavourited(true)
      }
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

  const capPct = event.capacity && event.registered_count
    ? Math.min(event.registered_count / event.capacity, 1)
    : null

  const isEOI = event.registration_mode === 'expression_of_interest'
  const isInviteOnly = event.registration_mode === 'invite_only'

  const regStatus = (() => {
    if (!reg) return null
    const { status, payment_status } = reg
    if (status === 'rejected') return { color: colors.error, bg: colors.errorSubtle, label: 'Registration Rejected', icon: 'close-circle-outline' as const }
    if (status === 'pending') return { color: colors.warning, bg: colors.warningSubtle, label: 'Under Review', icon: 'time-outline' as const }
    if (status === 'approved') {
      if (payment_status === 'submitted') return { color: colors.indigo, bg: colors.indigoSubtle, label: 'Payment Under Review', icon: 'card-outline' as const }
      if (payment_status === 'pending') return { color: colors.warning, bg: colors.warningSubtle, label: 'Payment Required', icon: 'card-outline' as const }
      if (payment_status === 'confirmed') return { color: colors.success, bg: colors.successSubtle, label: 'Confirmed & Paid', icon: 'checkmark-circle-outline' as const }
      return { color: colors.success, bg: colors.successSubtle, label: isEOI ? 'Application Accepted' : 'Approved', icon: 'checkmark-circle-outline' as const }
    }
    return { color: colors.textMuted, bg: colors.surface2, label: status, icon: 'ellipse-outline' as const }
  })()

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.heroWrap}>
          {event.cover_image_url
            ? <Image source={{ uri: event.cover_image_url }} style={s.hero} />
            : (
              <LinearGradient colors={gradient as [string, string]} style={s.hero} start={[0, 0]} end={[1, 1]}>
                <Text style={s.heroInitial}>{event.title.charAt(0)}</Text>
              </LinearGradient>
            )
          }
          <LinearGradient
            colors={['transparent', colors.pageBg]}
            style={s.heroOverlay}
            start={[0, 0.4]} end={[0, 1]}
          />
        </View>

        {/* Back + Fav */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={toggleFav}>
            <Ionicons
              name={favourited ? 'heart' : 'heart-outline'}
              size={20}
              color={favourited ? colors.error : colors.white}
            />
          </TouchableOpacity>
        </View>

        <View style={s.body}>
          {/* Category */}
          {event.event_categories && (
            <View style={s.catBadge}>
              <Text style={s.catText}>{event.event_categories.name}</Text>
            </View>
          )}

          <Text style={s.title}>{event.title}</Text>

          {/* Info cards */}
          <View style={s.infoGrid}>
            <View style={s.infoCard}>
              <Ionicons name="calendar-outline" size={18} color={colors.blue} />
              <View>
                <Text style={s.infoLabel}>Date</Text>
                <Text style={s.infoValue}>{dateStr}</Text>
              </View>
            </View>
            <View style={s.infoCard}>
              <Ionicons name="time-outline" size={18} color={colors.blue} />
              <View>
                <Text style={s.infoLabel}>Time</Text>
                <Text style={s.infoValue}>{timeStr}</Text>
              </View>
            </View>
            {event.venue_name && (
              <TouchableOpacity
                style={s.infoCard}
                activeOpacity={event.venue_maps_url ? 0.7 : 1}
                onPress={() => {
                  if (event.venue_maps_url) Linking.openURL(event.venue_maps_url)
                }}
              >
                <Ionicons name="location-outline" size={18} color={colors.blue} />
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
            {event.profiles && (
              <View style={s.infoCard}>
                <Ionicons name="person-outline" size={18} color={colors.blue} />
                <View>
                  <Text style={s.infoLabel}>Organizer</Text>
                  <Text style={s.infoValue}>{event.profiles.full_name}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Price + capacity */}
          <View style={s.priceCard}>
            <View>
              <Text style={s.priceLabel}>Ticket Price</Text>
              <Text style={s.price}>{price}</Text>
            </View>
            <View style={s.regInfo}>
              <Text style={s.regCount}>{event.registered_count.toLocaleString()}</Text>
              <Text style={s.regLabel}>registered{event.capacity ? ` / ${event.capacity}` : ''}</Text>
              {capPct !== null && (
                <View style={s.capTrack}>
                  <View style={[s.capBar, {
                    width: `${capPct * 100}%` as any,
                    backgroundColor: capPct > 0.9 ? colors.error : capPct > 0.7 ? colors.warning : colors.success,
                  }]} />
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {event.description && (
            <View style={s.descCard}>
              <Text style={s.descTitle}>About</Text>
              <Text style={s.desc}>{event.description}</Text>
            </View>
          )}

          {/* CTA / Registration status */}
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
              activeOpacity={0.85}
            >
              <Text style={s.registerBtnText}>{isEOI ? 'Apply Now' : 'Register Now'}</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },
  centered: { flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' },

  heroWrap: { position: 'relative' },
  hero: { width: '100%', height: 260, alignItems: 'center', justifyContent: 'center' },
  heroInitial: { color: colors.white, fontSize: 64, fontFamily: 'Poppins_700Bold' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },

  topBar: {
    position: 'absolute', top: 12, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16,
  },
  iconBtn: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20, width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },

  body: { padding: 20, paddingTop: 0, gap: 12 },

  catBadge: {
    backgroundColor: colors.indigoSubtle,
    borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  catText: { color: colors.indigo, fontSize: 11, fontFamily: 'DMSans_500Medium', fontWeight: '600' },
  title: { color: colors.textPrimary, fontSize: 24, fontFamily: 'Poppins_700Bold', lineHeight: 30 },

  infoGrid: { gap: 8 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: 14,
  },
  infoLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular', marginBottom: 2 },
  infoValue: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  infoSub: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },

  priceCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 16,
  },
  priceLabel: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginBottom: 4 },
  price: { color: colors.blue, fontSize: 24, fontFamily: 'Poppins_700Bold' },
  regInfo: { alignItems: 'flex-end' },
  regCount: { color: colors.textPrimary, fontSize: 20, fontFamily: 'Poppins_700Bold' },
  regLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },
  capTrack: {
    width: 80, height: 4, backgroundColor: colors.surface2,
    borderRadius: radius.full, marginTop: 4, overflow: 'hidden',
  },
  capBar: { height: '100%', borderRadius: radius.full },

  descCard: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 16, gap: 8,
  },
  descTitle: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_500Medium', letterSpacing: 0.5 },
  desc: { color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 22 },

  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: radius.md, borderWidth: 1, padding: 16,
  },
  statusText: { fontSize: 15, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  registerBtn: {
    backgroundColor: colors.blue, borderRadius: radius.md,
    padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  registerBtnText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold', fontWeight: '700' },
})

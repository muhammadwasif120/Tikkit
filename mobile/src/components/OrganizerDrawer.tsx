/**
 * OrganizerDrawer — slide-in menu panel for the organizer role.
 *
 * Usage:
 *   const { openDrawer, DrawerOverlay } = useOrganizerDrawer()
 *   ...
 *   <DrawerOverlay />          ← render once at the root of the screen tree
 *   <Button onPress={openDrawer} />
 */

import {
  Animated, View, Text, TouchableOpacity, TouchableWithoutFeedback,
  StyleSheet, Dimensions, Platform, StatusBar as RNStatusBar,
} from 'react-native'
import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/contexts/AuthContext'
import { colors, radius } from '@/theme'

const SCREEN_WIDTH = Dimensions.get('window').width
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340)
const ANIM_DURATION = 260

/* ─── Module-level pending count — set by the layout after fetching stats ── */
let _pendingApprovals = 0
export function setPendingApprovals(count: number) { _pendingApprovals = count }

/* ─── Nav item shape ─────────────────────────────────────────────────────── */
type NavItem = {
  icon: string
  label: string
  route: string
  color: string
  badge?: number
}

const SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'OPERATIONS',
    items: [
      { icon: 'time-outline',             label: 'Approvals',        route: '/(organizer)/approvals',  color: '#F97316' },
      { icon: 'terminal-outline',         label: 'Command Center',   route: '/(organizer)/command',    color: '#818CF8' },
      { icon: 'qr-code-outline',          label: 'QR Scanner',       route: '/(organizer)/scan',       color: '#22C55E' },
      { icon: 'chatbubble-ellipses-outline', label: 'Messages',      route: '/(organizer)/messages',   color: '#818CF8' },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { icon: 'bar-chart-outline',        label: 'Analytics',        route: '/(organizer)/analytics',  color: '#38BDF8' },
      { icon: 'people-outline',           label: 'Guests',           route: '/(organizer)/guests',     color: '#A78BFA' },
      { icon: 'business-outline',         label: 'Vendors & Invoices', route: '/(organizer)/vendors',  color: '#EAB308' },
      { icon: 'shield-checkmark-outline', label: 'ID Verification',  route: '/(organizer)/verify',     color: '#10B981' },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { icon: 'settings-outline',         label: 'Profile & Settings', route: '/(organizer)/profile', color: colors.textSecondary },
    ],
  },
]

/* ─── Hook: useOrganizerDrawer ────────────────────────────────────────────── */
export function useOrganizerDrawer() {
  const [visible, setVisible] = useState(false)
  const slideAnim  = useRef(new Animated.Value(DRAWER_WIDTH)).current
  const backdropAnim = useRef(new Animated.Value(0)).current

  const openDrawer = useCallback(() => {
    setVisible(true)
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: 0,   duration: ANIM_DURATION, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1,  duration: ANIM_DURATION, useNativeDriver: true }),
    ]).start()
  }, [slideAnim, backdropAnim])

  const closeDrawer = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: DRAWER_WIDTH, duration: ANIM_DURATION, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0,           duration: ANIM_DURATION, useNativeDriver: true }),
    ]).start(() => setVisible(false))
  }, [slideAnim, backdropAnim])

  const DrawerOverlay = useCallback(() => {
    if (!visible) return null
    return (
      <DrawerPanel
        slideAnim={slideAnim}
        backdropAnim={backdropAnim}
        onClose={closeDrawer}
      />
    )
  }, [visible, slideAnim, backdropAnim, closeDrawer])

  return { openDrawer, closeDrawer, DrawerOverlay }
}

/* ─── DrawerPanel ─────────────────────────────────────────────────────────── */
function DrawerPanel({
  slideAnim,
  backdropAnim,
  onClose,
}: {
  slideAnim: Animated.Value
  backdropAnim: Animated.Value
  onClose: () => void
}) {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { profile, signOut } = useAuth()

  const initials = ((profile?.full_name ?? profile?.email ?? 'O')
    .split(' ').map(w => w[0]).join('').slice(0, 2) || 'O').toUpperCase()

  const navigate = (route: string) => {
    onClose()
    // Small delay so the drawer closes before navigating (avoids flash)
    setTimeout(() => router.push(route as any), 180)
  }

  const handleSignOut = () => {
    onClose()
    setTimeout(() => signOut(), 180)
  }

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            ds.backdrop,
            { opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Drawer panel */}
      <Animated.View
        style={[
          ds.panel,
          {
            paddingTop: insets.top + (Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0),
            paddingBottom: insets.bottom + 16,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Close button */}
        <TouchableOpacity style={ds.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Profile card */}
        <View style={ds.profileCard}>
          <View style={ds.profileAvatar}>
            <Text style={ds.profileInitials}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ds.profileName} numberOfLines={1}>{profile?.full_name ?? 'Organizer'}</Text>
            {profile?.username
              ? <Text style={ds.profileMeta}>@{profile.username}</Text>
              : <Text style={ds.profileMeta}>{profile?.email}</Text>
            }
          </View>
          <View style={ds.rolePill}>
            <Ionicons name="shield-checkmark" size={11} color={colors.blue} />
            <Text style={ds.rolePillText}>{(profile?.role ?? 'ORGANIZER').toUpperCase()}</Text>
          </View>
        </View>

        {/* Nav sections */}
        <View style={ds.nav}>
          {SECTIONS.map((section, si) => (
            <View key={section.title} style={si > 0 ? ds.sectionGap : undefined}>
              <Text style={ds.sectionTitle}>{section.title}</Text>
              <View style={ds.sectionCard}>
                {section.items.map((item, ii) => {
                  const badge = item.route === '/(organizer)/approvals' && _pendingApprovals > 0
                    ? _pendingApprovals
                    : undefined
                  return (
                    <View key={item.route}>
                      <TouchableOpacity
                        style={ds.navItem}
                        onPress={() => navigate(item.route)}
                        activeOpacity={0.7}
                      >
                        <View style={[ds.navIcon, { backgroundColor: item.color + '1A' }]}>
                          <Ionicons name={item.icon as any} size={16} color={item.color} />
                          {badge ? (
                            <View style={[ds.navBadge, { backgroundColor: item.color }]}>
                              <Text style={ds.navBadgeText}>{badge > 99 ? '99+' : badge}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={ds.navLabel}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.border} style={{ marginLeft: 'auto' } as any} />
                      </TouchableOpacity>
                      {ii < section.items.length - 1 && <View style={ds.itemDivider} />}
                    </View>
                  )
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={ds.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={17} color={colors.error} />
          <Text style={ds.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const ds = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 100,
  },
  panel: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.pageBg,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },

  closeBtn: {
    position: 'absolute',
    top: 56, left: 16,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
    zIndex: 1,
  },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    marginTop: 28,
  },
  profileAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.blueSubtle,
    borderWidth: 2, borderColor: colors.blue,
    alignItems: 'center', justifyContent: 'center',
  },
  profileInitials: { color: colors.blue, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  profileName: { color: colors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  profileMeta: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.blueSubtle, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.blueBorder,
  },
  rolePillText: { color: colors.blue, fontSize: 9, fontFamily: 'DMSans_500Medium', fontWeight: '700', letterSpacing: 0.5 },

  nav: { paddingHorizontal: 16, paddingTop: 16, flex: 1 },
  sectionGap: { marginTop: 16 },
  sectionTitle: {
    color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_500Medium',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginLeft: 2,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  navIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  navBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 15, height: 15, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
  },
  navBadgeText: { color: colors.black, fontSize: 8, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  navLabel: { color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  itemDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 12,
    padding: 13, borderRadius: radius.md,
    backgroundColor: colors.error + '11',
    borderWidth: 1, borderColor: colors.error + '33',
    justifyContent: 'center',
  },
  signOutText: { color: colors.error, fontSize: 14, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
})

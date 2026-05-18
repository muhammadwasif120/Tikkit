import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { View } from 'react-native'
import { useState, useEffect } from 'react'
import { colors, radius } from '@/theme'
import { useOrganizerDrawer, setPendingApprovals } from '@/components/OrganizerDrawer'
import { getOrganizerStats } from '@/lib/api'

export default function OrganizerLayout() {
  const { openDrawer, DrawerOverlay } = useOrganizerDrawer()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    getOrganizerStats()
      .then(r => {
        const count = r.stats?.pendingApprovals ?? 0
        setPendingCount(count)
        setPendingApprovals(count)   // sync to drawer module
      })
      .catch(() => {})
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: colors.blue,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontFamily: 'DMSans_500Medium',
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ backgroundColor: focused ? colors.blueSubtle : 'transparent', borderRadius: radius.sm, padding: 4 }}>
                <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ backgroundColor: focused ? colors.blueSubtle : 'transparent', borderRadius: radius.sm, padding: 4 }}>
                <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="approvals"
          options={{
            title: 'Approvals',
            tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
            tabBarBadgeStyle: {
              backgroundColor: colors.warning,
              color: '#000',
              fontSize: 10,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
            },
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ backgroundColor: focused ? colors.blueSubtle : 'transparent', borderRadius: radius.sm, padding: 4 }}>
                <Ionicons name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} size={size} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scanner',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ backgroundColor: focused ? colors.blueSubtle : 'transparent', borderRadius: radius.sm, padding: 4 }}>
                <Ionicons name={focused ? 'qr-code' : 'qr-code-outline'} size={size} color={color} />
              </View>
            ),
          }}
        />

        {/* ── Menu tab: intercepts press → opens drawer instead of navigating ── */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Menu',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ backgroundColor: focused ? colors.blueSubtle : 'transparent', borderRadius: radius.sm, padding: 4 }}>
                <Ionicons name="menu" size={size} color={color} />
              </View>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault()   // Don't navigate to the profile screen
              openDrawer()         // Open the slide-out drawer instead
            },
          }}
        />

        {/* ── Hidden screens — not in tab bar ── */}
        <Tabs.Screen name="analytics"                options={{ href: null }} />
        <Tabs.Screen name="command"                  options={{ href: null }} />
        <Tabs.Screen name="guests"                   options={{ href: null }} />
        <Tabs.Screen name="messages"                 options={{ href: null }} />
        <Tabs.Screen name="vendors"                  options={{ href: null }} />
        <Tabs.Screen name="verify"                   options={{ href: null }} />
        <Tabs.Screen name="registrations/[eventId]"  options={{ href: null }} />
        <Tabs.Screen name="events/new"               options={{ href: null }} />
        <Tabs.Screen name="events/[id]/index"        options={{ href: null }} />
        <Tabs.Screen name="events/[id]/edit"         options={{ href: null }} />
        <Tabs.Screen name="events/[id]/guests/add"   options={{ href: null }} />
        <Tabs.Screen name="command/[eventId]"        options={{ href: null }} />
      </Tabs>

      {/* Drawer overlay — rendered above all tabs, handles its own visibility */}
      <DrawerOverlay />
    </View>
  )
}

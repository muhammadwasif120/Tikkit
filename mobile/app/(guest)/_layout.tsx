import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius } from '@/theme'
import { View, Text, StyleSheet, AppState } from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { getNotifications } from '@/lib/api'

/* Fetch unread notification count and refresh when app comes to foreground */
function useUnreadCount() {
  const [count, setCount] = useState(0)
  const appState = useRef(AppState.currentState)

  const refresh = async () => {
    try {
      const { notifications } = await getNotifications()
      setCount(notifications.filter(n => !n.read_at).length)
    } catch { /* silent */ }
  }

  useEffect(() => {
    refresh()
    const sub = AppState.addEventListener('change', state => {
      if (appState.current.match(/inactive|background/) && state === 'active') {
        refresh()
      }
      appState.current = state
    })
    return () => sub.remove()
  }, [])

  return count
}

function TabIcon({ name, focusedName, color, size, focused }: {
  name: keyof typeof Ionicons.glyphMap
  focusedName: keyof typeof Ionicons.glyphMap
  color: string
  size: number
  focused: boolean
}) {
  return (
    <View style={[s.iconWrap, focused && s.iconWrapActive]}>
      <Ionicons name={focused ? focusedName : name} size={size} color={color} />
    </View>
  )
}

function BadgedTabIcon({ name, focusedName, color, size, focused, badge }: {
  name: keyof typeof Ionicons.glyphMap
  focusedName: keyof typeof Ionicons.glyphMap
  color: string
  size: number
  focused: boolean
  badge: number
}) {
  return (
    <View>
      <View style={[s.iconWrap, focused && s.iconWrapActive]}>
        <Ionicons name={focused ? focusedName : name} size={size} color={color} />
      </View>
      {badge > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </View>
  )
}

export default function GuestLayout() {
  const unreadCount = useUnreadCount()

  return (
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
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="compass-outline" focusedName="compass" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="ticket-outline" focusedName="ticket" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="registrations"
        options={{
          title: 'My Events',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="document-text-outline" focusedName="document-text" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="credits"
        options={{
          title: 'Credits',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="star-outline" focusedName="star" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <BadgedTabIcon
              name="person-outline"
              focusedName="person"
              color={color}
              size={size}
              focused={focused}
              badge={unreadCount}
            />
          ),
        }}
      />

      {/* Hidden screens */}
      <Tabs.Screen name="event/[id]"    options={{ href: null }} />
      <Tabs.Screen name="register/[id]" options={{ href: null }} />
      <Tabs.Screen name="ticket/[id]"   options={{ href: null }} />
      <Tabs.Screen name="notifications"  options={{ href: null }} />
      <Tabs.Screen name="passes"         options={{ href: null }} />
      <Tabs.Screen name="chat/[eventId]" options={{ href: null }} />
    </Tabs>
  )
}

const s = StyleSheet.create({
  iconWrap: {
    backgroundColor: 'transparent',
    borderRadius: radius.sm,
    padding: 4,
  },
  iconWrapActive: {
    backgroundColor: colors.blueSubtle,
  },
  badge: {
    position: 'absolute',
    top: -2, right: -6,
    minWidth: 16, height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: colors.surface,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '700',
  },
})

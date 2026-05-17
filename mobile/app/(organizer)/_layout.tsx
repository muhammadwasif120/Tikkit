import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { View } from 'react-native'
import { colors, radius } from '@/theme'

export default function OrganizerLayout() {
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
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              backgroundColor: focused ? colors.blueSubtle : 'transparent',
              borderRadius: radius.sm, padding: 4,
            }}>
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
            <View style={{
              backgroundColor: focused ? colors.blueSubtle : 'transparent',
              borderRadius: radius.sm, padding: 4,
            }}>
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="guests"
        options={{
          title: 'Guests',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              backgroundColor: focused ? colors.blueSubtle : 'transparent',
              borderRadius: radius.sm, padding: 4,
            }}>
              <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              backgroundColor: focused ? colors.blueSubtle : 'transparent',
              borderRadius: radius.sm, padding: 4,
            }}>
              <Ionicons name={focused ? 'qr-code' : 'qr-code-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              backgroundColor: focused ? colors.blueSubtle : 'transparent',
              borderRadius: radius.sm, padding: 4,
            }}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />

      {/* Hidden screens — not in tab bar */}
      <Tabs.Screen name="analytics"                     options={{ href: null }} />
      <Tabs.Screen name="approvals"                     options={{ href: null }} />
      <Tabs.Screen name="command"                       options={{ href: null }} />
      <Tabs.Screen name="messages"                      options={{ href: null }} />
      <Tabs.Screen name="vendors"                       options={{ href: null }} />
      <Tabs.Screen name="verify"                        options={{ href: null }} />
      <Tabs.Screen name="registrations/[eventId]"      options={{ href: null }} />
      <Tabs.Screen name="events/new"                   options={{ href: null }} />
      <Tabs.Screen name="events/[id]/index"            options={{ href: null }} />
      <Tabs.Screen name="events/[id]/edit"             options={{ href: null }} />
      <Tabs.Screen name="events/[id]/guests/add"       options={{ href: null }} />
      <Tabs.Screen name="command/[eventId]"            options={{ href: null }} />
    </Tabs>
  )
}

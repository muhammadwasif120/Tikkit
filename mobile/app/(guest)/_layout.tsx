import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius } from '@/theme'
import { View } from 'react-native'

export default function GuestLayout() {
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
            <View style={{
              backgroundColor: focused ? colors.blueSubtle : 'transparent',
              borderRadius: radius.sm,
              padding: 4,
            }}>
              <Ionicons name={focused ? 'compass' : 'compass-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              backgroundColor: focused ? colors.blueSubtle : 'transparent',
              borderRadius: radius.sm,
              padding: 4,
            }}>
              <Ionicons name={focused ? 'ticket' : 'ticket-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="passes"
        options={{
          title: 'Passes',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              backgroundColor: focused ? colors.blueSubtle : 'transparent',
              borderRadius: radius.sm,
              padding: 4,
            }}>
              <Ionicons name={focused ? 'id-card' : 'id-card-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="credits"
        options={{
          title: 'Credits',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              backgroundColor: focused ? colors.blueSubtle : 'transparent',
              borderRadius: radius.sm,
              padding: 4,
            }}>
              <Ionicons name={focused ? 'star' : 'star-outline'} size={size} color={color} />
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
              borderRadius: radius.sm,
              padding: 4,
            }}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="event/[id]" options={{ href: null }} />
      <Tabs.Screen name="register/[id]" options={{ href: null }} />
      <Tabs.Screen name="ticket/[id]" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  )
}

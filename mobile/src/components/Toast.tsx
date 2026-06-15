import React, {
  createContext, useContext, useRef, useState, useCallback,
} from 'react'
import {
  Animated, Text, View, StyleSheet, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radius } from '@/theme'

type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastOptions {
  type?: ToastType
  message: string
  duration?: number
}

interface ToastContextValue {
  show: (opts: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error:   'alert-circle',
  info:    'information-circle',
  warning: 'warning',
}

const TYPE_COLOR: Record<ToastType, string> = {
  success: colors.success,
  error:   colors.error,
  info:    colors.blue,
  warning: colors.warning,
}

const TYPE_BG: Record<ToastType, string> = {
  success: '#0B1F15',
  error:   '#1F0D0D',
  info:    '#0D1226',
  warning: '#1F1A0D',
}

function ToastBanner({
  message, type, translateY, opacity,
}: {
  message: string
  type: ToastType
  translateY: Animated.Value
  opacity: Animated.Value
}) {
  const insets = useSafeAreaInsets()
  const color  = TYPE_COLOR[type]
  const bg     = TYPE_BG[type]
  const icon   = ICONS[type]

  return (
    <Animated.View
      style={[
        s.toast,
        {
          backgroundColor: bg,
          borderColor: color + '40',
          top: insets.top + 8,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={s.text} numberOfLines={3}>{message}</Text>
    </Animated.View>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ message: string; type: ToastType }>({
    message: '', type: 'info',
  })
  const translateY = useRef(new Animated.Value(-120)).current
  const opacity    = useRef(new Animated.Value(0)).current
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isVisible  = useRef(false)

  const hide = useCallback(() => {
    isVisible.current = false
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start()
  }, [translateY, opacity])

  const show = useCallback(({ type = 'info', message, duration = 3500 }: ToastOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    setState({ message, type })

    if (isVisible.current) {
      // Already showing — snap to new content without re-animating in
      timerRef.current = setTimeout(hide, duration)
      return
    }

    isVisible.current = true
    translateY.setValue(-120)
    opacity.setValue(0)

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0, useNativeDriver: true, bounciness: 3, speed: 14,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start()

    timerRef.current = setTimeout(hide, duration)
  }, [translateY, opacity, hide])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastBanner
        message={state.message}
        type={state.type}
        translateY={translateY}
        opacity={opacity}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

const s = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
  text: {
    flex: 1,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    lineHeight: 18,
  },
})

import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, ViewStyle } from 'react-native'
import { colors, radius } from '@/theme'

interface SkeletonProps {
  width?: number | `${number}%`
  height: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({ width = '100%', height, borderRadius = radius.md, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View
      style={[
        sk.base,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  )
}

const sk = StyleSheet.create({
  base: {
    backgroundColor: colors.surface2,
  },
})

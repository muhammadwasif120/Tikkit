import React from 'react'
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing, typography } from '@/theme'

// ─── Button ──────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  icon?: keyof typeof Ionicons.glyphMap
  style?: ViewStyle
  fullWidth?: boolean
}

const btnBg: Record<ButtonVariant, string> = {
  primary: colors.blue,
  secondary: colors.surface2,
  ghost: 'transparent',
  danger: colors.errorSubtle,
  gold: colors.gold,
}
const btnText: Record<ButtonVariant, string> = {
  primary: colors.white,
  secondary: colors.textPrimary,
  ghost: colors.textSecondary,
  danger: colors.error,
  gold: '#0a0a0a',
}
const btnBorder: Record<ButtonVariant, string> = {
  primary: 'transparent',
  secondary: colors.border,
  ghost: 'transparent',
  danger: colors.error + '33',
  gold: 'transparent',
}
const btnPad: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number }> = {
  sm: { paddingVertical: 8, paddingHorizontal: 14 },
  md: { paddingVertical: 12, paddingHorizontal: 20 },
  lg: { paddingVertical: 15, paddingHorizontal: 24 },
}
const btnFontSize: Record<ButtonSize, number> = { sm: 13, md: 15, lg: 16 }

export function Button({
  label, onPress, variant = 'primary', size = 'md',
  loading, disabled, icon, style, fullWidth,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        {
          backgroundColor: btnBg[variant],
          borderColor: btnBorder[variant],
          borderWidth: 1,
          borderRadius: radius.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? undefined : 'flex-start',
        },
        btnPad[size],
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={btnText[variant]} size="small" />
        : <>
          {icon && <Ionicons name={icon} size={btnFontSize[size] + 2} color={btnText[variant]} />}
          <Text style={{
            ...typography.labelLG,
            fontSize: btnFontSize[size],
            color: btnText[variant],
            fontWeight: '600',
          }}>{label}</Text>
        </>
      }
    </TouchableOpacity>
  )
}

// ─── Badge / StatusBadge ─────────────────────────────────────────────────────

interface BadgeProps {
  label: string
  color?: string
  bg?: string
  size?: 'sm' | 'md'
}

export function Badge({ label, color = colors.textSecondary, bg = colors.surface2, size = 'md' }: BadgeProps) {
  return (
    <View style={{
      backgroundColor: bg,
      borderRadius: radius.full,
      paddingHorizontal: size === 'sm' ? 8 : 10,
      paddingVertical: size === 'sm' ? 2 : 4,
      alignSelf: 'flex-start',
    }}>
      <Text style={{
        ...typography.labelSM,
        fontSize: size === 'sm' ? 9 : 11,
        color,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>{label}</Text>
    </View>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  padding?: number
}

export function Card({ children, style, padding = 16 }: CardProps) {
  return (
    <View style={[{
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding,
    }, style]}>
      {children}
    </View>
  )
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string
  action?: string
  onAction?: () => void
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <Text style={{ ...typography.displaySM, color: colors.textPrimary }}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ ...typography.labelMD, color: colors.blue }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
      <View style={{
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: colors.surface2,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={24} color={colors.textMuted} />
      </View>
      <Text style={{ ...typography.displaySM, color: colors.textPrimary }}>{title}</Text>
      {subtitle && <Text style={{ ...typography.bodyMD, color: colors.textMuted, textAlign: 'center' }}>{subtitle}</Text>}
    </View>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  icon: keyof typeof Ionicons.glyphMap
  accentColor?: string
}

export function StatCard({ label, value, icon, accentColor = colors.blue }: StatCardProps) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 8,
    }}>
      <View style={{
        width: 32, height: 32, borderRadius: radius.sm,
        backgroundColor: accentColor + '1A',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={16} color={accentColor} />
      </View>
      <Text style={{ ...typography.displayMD, color: colors.textPrimary }}>{value}</Text>
      <Text style={{ ...typography.bodySM, color: colors.textMuted }}>{label}</Text>
    </View>
  )
}

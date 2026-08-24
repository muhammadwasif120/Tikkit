import React, { createContext, useContext, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius } from '@/theme'

/**
 * Themed drop-in replacement for React Native's Alert.alert — same
 * (title, message, buttons) shape so call sites need only swap the import,
 * but rendered as a modal matching the app's own dark UI instead of the
 * OS system alert.
 */
export interface ConfirmButton {
  text: string
  style?: 'default' | 'cancel' | 'destructive'
  onPress?: () => void
}

export interface ConfirmOptions {
  title: string
  message?: string
  buttons?: ConfirmButton[]
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => void
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

function ConfirmCard({ opts, onDismiss }: { opts: ConfirmOptions; onDismiss: () => void }) {
  const buttons = opts.buttons?.length ? opts.buttons : [{ text: 'OK', style: 'default' as const }]
  const hasDestructive = buttons.some(b => b.style === 'destructive')
  const cancelBtn = buttons.find(b => b.style === 'cancel')

  const press = (btn: ConfirmButton) => {
    onDismiss()
    // Let the dismiss animation/state update land before running the
    // caller's handler, in case it opens another modal or navigates.
    setTimeout(() => btn.onPress?.(), 0)
  }

  return (
    <Modal visible animationType="fade" transparent onRequestClose={() => cancelBtn && press(cancelBtn)}>
      <Pressable
        style={s.backdrop}
        onPress={() => cancelBtn && press(cancelBtn)}
        accessibilityLabel="Dismiss"
      />
      <View style={s.box}>
        {hasDestructive && (
          <View style={s.iconWrap}>
            <Ionicons name="warning-outline" size={30} color={colors.error} />
          </View>
        )}
        <Text style={s.title}>{opts.title}</Text>
        {opts.message ? <Text style={s.message}>{opts.message}</Text> : null}

        <View style={buttons.length > 2 ? s.btnCol : s.btnRow}>
          {buttons.map((btn, i) => (
            <TouchableOpacity
              key={i}
              style={[
                s.btn,
                buttons.length <= 2 && { flex: 1 },
                btn.style === 'destructive' && s.btnDestructive,
                btn.style === 'cancel' && s.btnCancel,
                btn.style !== 'destructive' && btn.style !== 'cancel' && s.btnDefault,
              ]}
              onPress={() => press(btn)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={btn.text}
            >
              <Text
                style={[
                  s.btnText,
                  btn.style === 'destructive' && { color: colors.white },
                  btn.style === 'cancel' && { color: colors.textSecondary },
                  btn.style !== 'destructive' && btn.style !== 'cancel' && { color: colors.white },
                ]}
              >
                {btn.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  )
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)

  const confirm = useCallback((next: ConfirmOptions) => setOpts(next), [])
  const dismiss = useCallback(() => setOpts(null), [])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {opts && <ConfirmCard opts={opts} onDismiss={dismiss} />}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider')
  return ctx.confirm
}

const s = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)' },
  box: {
    position: 'absolute', top: '50%', left: 24, right: 24,
    transform: [{ translateY: -110 }],
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, padding: 22, gap: 10, alignItems: 'center',
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.errorSubtle, alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  title: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  message: { color: colors.textSecondary, fontSize: 13.5, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 20 },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  btnCol: { flexDirection: 'column', gap: 8, width: '100%', marginTop: 8 },
  btn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: radius.md, minHeight: 44 },
  btnDefault: { backgroundColor: colors.blue },
  btnDestructive: { backgroundColor: colors.error },
  btnCancel: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  btnText: { fontSize: 14.5, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
})

// Tikkit design tokens — matches web app exactly

export const colors = {
  // Page backgrounds
  pageBg: '#080A10',
  surface: '#0C0E16',
  surface2: '#13151E',
  surface3: '#1A1D2A',

  // Brand
  blue: '#1E5EFF',
  blueHover: '#1448CC',
  blueLight: '#4D82FF',
  blueSubtle: 'rgba(30,94,255,0.1)',
  blueBorder: 'rgba(30,94,255,0.3)',

  gold: '#FFC745',
  goldHover: '#E5A800',
  goldSubtle: 'rgba(255,199,69,0.15)',
  goldBorder: 'rgba(255,199,69,0.3)',

  indigo: '#818CF8',
  indigoSubtle: 'rgba(129,140,248,0.15)',
  indigoBorder: 'rgba(129,140,248,0.3)',

  // Text
  textPrimary: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textDisabled: '#4B5563',

  // Borders
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.18)',

  // Status
  success: '#10B981',
  successSubtle: 'rgba(16,185,129,0.15)',
  successBorder: 'rgba(16,185,129,0.3)',
  warning: '#EAB308',
  warningSubtle: 'rgba(234,179,8,0.15)',
  warningBorder: 'rgba(234,179,8,0.3)',
  error: '#EF4444',
  errorSubtle: 'rgba(239,68,68,0.15)',
  errorBorder: 'rgba(239,68,68,0.3)',

  // White/black
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
}

export const typography = {
  // Display / headings — Clash Display (Poppins substitute)
  displayXL: { fontFamily: 'Poppins_700Bold', fontSize: 32, letterSpacing: -0.5 },
  displayLG: { fontFamily: 'Poppins_700Bold', fontSize: 24, letterSpacing: -0.3 },
  displayMD: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, letterSpacing: -0.2 },
  displaySM: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, letterSpacing: -0.1 },

  // Body — DM Sans
  bodyLG: { fontFamily: 'DMSans_400Regular', fontSize: 16 },
  bodyMD: { fontFamily: 'DMSans_400Regular', fontSize: 14 },
  bodySM: { fontFamily: 'DMSans_400Regular', fontSize: 12 },

  // Label / UI
  labelLG: { fontFamily: 'DMSans_500Medium', fontSize: 14, letterSpacing: 0.1 },
  labelMD: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 0.2 },
  labelSM: { fontFamily: 'DMSans_500Medium', fontSize: 10, letterSpacing: 0.5 },

  // Mono
  mono: { fontFamily: 'DMSans_400Regular', fontSize: 13, letterSpacing: 0.5 },
}

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}

// Event card gradient variants (web: --event-gradient-N, N = event.id modulo 8)
export const eventGradients = [
  ['#1E5EFF', '#0A2A80'],
  ['#818CF8', '#4338CA'],
  ['#10B981', '#065F46'],
  ['#FFC745', '#92400E'],
  ['#EF4444', '#7F1D1D'],
  ['#EC4899', '#831843'],
  ['#F97316', '#7C2D12'],
  ['#14B8A6', '#134E4A'],
]

export function getEventGradient(eventId: string) {
  const sum = eventId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return eventGradients[sum % eventGradients.length]
}

// Registration status
export const registrationStatus = {
  pending:         { color: colors.warning, bg: colors.warningSubtle, border: colors.warningBorder, label: 'Pending' },
  approved:        { color: colors.success, bg: colors.successSubtle, border: colors.successBorder, label: 'Approved' },
  rejected:        { color: colors.error,   bg: colors.errorSubtle,   border: colors.errorBorder,   label: 'Rejected' },
  cancelled:       { color: colors.textMuted, bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)', label: 'Cancelled' },
  payment_pending: { color: colors.indigo, bg: colors.indigoSubtle, border: colors.indigoBorder, label: 'Payment Pending' },
  checked_in:      { color: colors.success, bg: colors.successSubtle, border: colors.successBorder, label: 'Checked In' },
  registered:      { color: colors.blue,    bg: colors.blueSubtle,   border: colors.blueBorder,    label: 'Registered' },
}

// Credits tier system
export const creditTiers = {
  newcomer: { label: 'Newcomer', color: colors.textMuted, minPoints: 0 },
  rising: { label: 'Rising', color: '#34D399', minPoints: 100 },
  regular: { label: 'Regular', color: colors.blue, minPoints: 500 },
  vip: { label: 'VIP', color: colors.gold, minPoints: 1000 },
  elite: { label: 'Elite', color: colors.indigo, minPoints: 2500 },
}

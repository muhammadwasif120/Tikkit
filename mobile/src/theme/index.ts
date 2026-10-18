// Tikkit design tokens — "Navy Glass": dark navy base, cyan as the single
// loud accent (standing in for the reference system's gold), magenta as a
// rare secondary highlight. Mirrors the CSS custom properties in the web
// app's globals.css (no code sharing between the two, so kept in sync by
// hand) — dark mode only for now; mobile doesn't have a light/dark toggle.

export const colors = {
  // Navy base
  navy950: '#060B22',
  navy900: '#0B1437',
  navy800: '#132057',
  navy700: '#1D2E78',
  navy600: '#2B40A0',

  // Page backgrounds (aliases onto the navy scale, kept for call-site compat)
  pageBg: '#060B22',
  surface: '#0E1638',
  surface2: '#132057',
  surface3: '#1D2E78',

  // Brand accent — cyan takes gold's role, used sparingly by design
  blue: '#00E5FF',
  blueHover: '#33EBFF',
  blueLight: '#80F3FF',
  blueSubtle: 'rgba(0,229,255,0.1)',
  blueBorder: 'rgba(0,229,255,0.3)',

  // Secondary accent — magenta, rare highlight only
  gold: '#CC00FF',
  goldHover: '#E066FF',
  goldSubtle: 'rgba(204,0,255,0.12)',
  goldBorder: 'rgba(204,0,255,0.3)',

  // Data / status — sky (secondary data), same role as web's --sky-500
  indigo: '#7FA7FF',
  indigoSubtle: 'rgba(127,167,255,0.15)',
  indigoBorder: 'rgba(127,167,255,0.3)',

  // Text — mist scale
  textPrimary: '#E8ECF8',
  textSecondary: '#C3CAE0',
  textMuted: '#8C97B8',
  textDisabled: '#66708F',

  // Borders
  border: 'rgba(255,255,255,0.10)',
  borderHover: 'rgba(255,255,255,0.18)',
  borderStrong: 'rgba(255,255,255,0.24)',

  // Status
  success: '#3DD68C',
  successSubtle: 'rgba(61,214,140,0.15)',
  successBorder: 'rgba(61,214,140,0.3)',
  warning: '#7FA7FF',
  warningSubtle: 'rgba(127,167,255,0.15)',
  warningBorder: 'rgba(127,167,255,0.3)',
  error: '#FF6B6B',
  errorSubtle: 'rgba(255,107,107,0.15)',
  errorBorder: 'rgba(255,107,107,0.3)',

  // White/black
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
}

export const typography = {
  // Display / headings — Sora
  displayXL: { fontFamily: 'Sora_700Bold', fontSize: 32, letterSpacing: -0.5 },
  displayLG: { fontFamily: 'Sora_700Bold', fontSize: 24, letterSpacing: -0.3 },
  displayMD: { fontFamily: 'Sora_600SemiBold', fontSize: 20, letterSpacing: -0.2 },
  displaySM: { fontFamily: 'Sora_600SemiBold', fontSize: 16, letterSpacing: -0.1 },

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

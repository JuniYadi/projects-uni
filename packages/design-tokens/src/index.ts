// Platform-neutral design tokens, shared by mobile (Expo) and desktop (Electron).
// No react-native / DOM imports here. Each platform adapts these to its own components.

export const colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    border: '#D9DADF',
    accent: '#00C781',
    accentLight: '#E6FBF4',
    accentDark: '#009E68',
    onAccent: '#00261A',
    success: '#00C781',
    warning: '#B7791F',
    danger: '#D93025',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    border: '#2E3135',
    accent: '#00C781',
    accentLight: '#1A3A30',
    accentDark: '#00E08E',
    onAccent: '#00261A',
    success: '#00E08E',
    warning: '#F5B942',
    danger: '#FF6B61',
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ColorToken = keyof typeof colors.light;

export const spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

export const typography = {
  caption: { size: 12, lineHeight: 16, weight: '500' },
  body: { size: 15, lineHeight: 22, weight: '400' },
  bodyStrong: { size: 15, lineHeight: 22, weight: '600' },
  title: { size: 20, lineHeight: 28, weight: '600' },
  display: { size: 32, lineHeight: 40, weight: '700' },
} as const;

export type TypographyToken = keyof typeof typography;

/** Minimum width (dp / css px) where each breakpoint starts. */
export const breakpoints = { phone: 0, tablet: 600, desktop: 1024 } as const;

export type Breakpoint = keyof typeof breakpoints;

export function breakpointFor(width: number): Breakpoint {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'phone';
}

/** Max content width per breakpoint; phone fills the screen. */
export const maxContentWidth = { phone: Infinity, tablet: 720, desktop: 960 } as const;

/** Connection state -> color token. Shared contract for connect button + status badge. */
export const statusColor = {
  disconnected: 'textSecondary',
  connecting: 'warning',
  connected: 'success',
  disconnecting: 'warning',
} as const satisfies Record<string, ColorToken>;

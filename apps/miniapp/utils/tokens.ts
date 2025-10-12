export type ThemeName = 'light' | 'dark'

export interface ThemeColors {
  primary: string
  accent: string
  background: string
  surface: string
  surfaceMuted: string
  border: string
  text: string
  textMuted: string
  onPrimary: string
  onSurface: string
}

export interface ThemeRadius {
  sm: string
  md: string
  lg: string
  pill: string
}

export interface ThemeShadows {
  card: string
  overlay: string
  button: string
}

export interface ThemeTypography {
  title: string
  subtitle: string
  body: string
  caption: string
  button: string
}

export interface ThemeTokens {
  name: ThemeName
  colors: ThemeColors
  radius: ThemeRadius
  shadows: ThemeShadows
  typography: ThemeTypography
}

export const themeLight: ThemeTokens = {
  name: 'light',
  colors: {
    primary: '#7C6CFF',
    accent: '#FFB74D',
    background: '#F7F7F9',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F1F5',
    border: '#E2E3EB',
    text: '#1F1F27',
    textMuted: '#636378',
    onPrimary: '#FFFFFF',
    onSurface: '#1F1F27',
  },
  radius: {
    sm: '8rpx',
    md: '16rpx',
    lg: '24rpx',
    pill: '999rpx',
  },
  shadows: {
    card: '0 6rpx 18rpx rgba(15, 14, 35, 0.08)',
    overlay: '0 16rpx 48rpx rgba(15, 14, 35, 0.12)',
    button: '0 8rpx 20rpx rgba(15, 14, 35, 0.12)',
  },
  typography: {
    title: '40rpx',
    subtitle: '32rpx',
    body: '28rpx',
    caption: '24rpx',
    button: '26rpx',
  },
}

export const themeDark: ThemeTokens = {
  name: 'dark',
  colors: {
    primary: '#9B8BFF',
    accent: '#FFCA7A',
    background: '#13131A',
    surface: '#1E1E27',
    surfaceMuted: '#262633',
    border: '#30303F',
    text: '#F2F2F7',
    textMuted: '#A5A5C6',
    onPrimary: '#13131A',
    onSurface: '#F2F2F7',
  },
  radius: {
    sm: '8rpx',
    md: '16rpx',
    lg: '24rpx',
    pill: '999rpx',
  },
  shadows: {
    card: '0 6rpx 24rpx rgba(0, 0, 0, 0.45)',
    overlay: '0 20rpx 60rpx rgba(0, 0, 0, 0.55)',
    button: '0 10rpx 28rpx rgba(0, 0, 0, 0.48)',
  },
  typography: {
    title: '40rpx',
    subtitle: '32rpx',
    body: '28rpx',
    caption: '24rpx',
    button: '26rpx',
  },
}

export const themes: Record<ThemeName, ThemeTokens> = {
  light: themeLight,
  dark: themeDark,
}

export type ThemeCssVars = Record<`--${string}` | string, string>

export function tokensToCssVars(theme: ThemeTokens): ThemeCssVars {
  const vars: ThemeCssVars = {}
  const { colors, radius, shadows, typography } = theme

  const colorVars: Record<string, string> = {
    '--color-primary': colors.primary,
    '--color-accent': colors.accent,
    '--color-background': colors.background,
    '--color-surface': colors.surface,
    '--color-surface-muted': colors.surfaceMuted,
    '--color-border': colors.border,
    '--color-text': colors.text,
    '--color-text-muted': colors.textMuted,
    '--color-on-primary': colors.onPrimary,
    '--color-on-surface': colors.onSurface,
  }

  const radiusVars: Record<string, string> = {
    '--radius-sm': radius.sm,
    '--radius-md': radius.md,
    '--radius-lg': radius.lg,
    '--radius-pill': radius.pill,
  }

  const shadowVars: Record<string, string> = {
    '--shadow-card': shadows.card,
    '--shadow-overlay': shadows.overlay,
    '--shadow-button': shadows.button,
  }

  const typoVars: Record<string, string> = {
    '--font-title': typography.title,
    '--font-subtitle': typography.subtitle,
    '--font-body': typography.body,
    '--font-caption': typography.caption,
    '--font-button': typography.button,
  }

  return Object.assign(vars, colorVars, radiusVars, shadowVars, typoVars)
}

export function applyThemeCssVars(vars: ThemeCssVars, target?: HTMLElement) {
  if (typeof document === 'undefined' && !target) return
  const el = target || document.documentElement
  if (!el) return
  Object.entries(vars).forEach(([key, value]) => {
    el.style.setProperty(key, value)
  })
}

export function resolveTheme(name: ThemeName): ThemeTokens {
  return themes[name] || themeLight
}

import type { CalendarTheme } from './scene'

export interface EditorThemeToken {
  key: string
  name: string
  description: string
  primary: string
  secondary: string
  surface: string
  surfaceMuted: string
  text: string
  accent: string
}

const THEMES: EditorThemeToken[] = [
  {
    key: 'twilight',
    name: '暮光紫',
    description: '柔和紫调，适合梦幻主题',
    primary: '#7064FF',
    secondary: '#F7F6FF',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F2FF',
    text: '#1F2330',
    accent: '#FF8A80',
  },
  {
    key: 'sunny',
    name: '柑橘橙',
    description: '温暖活力，强调节日气氛',
    primary: '#FF8A3D',
    secondary: '#FFEFE2',
    surface: '#FFFFFF',
    surfaceMuted: '#FFF4EC',
    text: '#332820',
    accent: '#FFB74D',
  },
  {
    key: 'forest',
    name: '松林绿',
    description: '自然调性，适合露营与自然风',
    primary: '#4CAF50',
    secondary: '#E6F4EA',
    surface: '#FFFFFF',
    surfaceMuted: '#E9F7EE',
    text: '#1F2A1E',
    accent: '#8BC34A',
  },
  {
    key: 'noir',
    name: '冷杉蓝',
    description: '理性冷静，适合作品集',
    primary: '#1E88E5',
    secondary: '#E3F2FD',
    surface: '#FFFFFF',
    surfaceMuted: '#EAF3FE',
    text: '#1A212F',
    accent: '#64B5F6',
  },
]

export function listThemes() {
  return THEMES.slice()
}

export function getThemeByKey(key: string): EditorThemeToken {
  return THEMES.find((item) => item.key === key) ?? THEMES[0]
}

function normalizeHex(hex: string) {
  const value = hex.startsWith('#') ? hex.slice(1) : hex
  if (value.length === 3) {
    return value
      .split('')
      .map((char) => char + char)
      .join('')
  }
  return value.padEnd(6, '0').slice(0, 6)
}

function channelToLinear(channel: number) {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function getRelativeLuminance(hex: string) {
  const normalized = normalizeHex(hex)
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  const [lr, lg, lb] = [channelToLinear(r), channelToLinear(g), channelToLinear(b)]
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

export function estimateContrast(foreground: string, background: string) {
  const l1 = getRelativeLuminance(foreground)
  const l2 = getRelativeLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function meetsAA(foreground: string, background: string, largeText = false) {
  const ratio = estimateContrast(foreground, background)
  return largeText ? ratio >= 3 : ratio >= 4.5
}

export function createCalendarTheme(token: EditorThemeToken): CalendarTheme {
  return {
    background: token.surface,
    headerBackground: token.secondary,
    headerText: token.text,
    grid: `${token.primary}33`,
    text: token.text,
    secondaryText: '#8E93A6',
    weekendText: token.primary,
    todayBackground: token.primary,
    todayText: token.surface,
    holidayBadgeBackground: token.accent + '33',
    holidayBadgeText: token.accent,
  }
}

import { CalendarLayerProps } from './scene'
import { monthData as createMonthCells } from '../../../services/lunarService'
import type { MonthCell } from '../../../types/lunar'

export type CalendarWeekday = {
  index: number
  label: string
}

export type CalendarDay = MonthCell & {
  isoDate: string
  display: number
  monthOffset: -1 | 0 | 1
  weekday: number
  isToday: boolean
  isWeekend: boolean
  isoWeek: number
}

export type GeneratedMonth = {
  year: number
  month: number
  weekStart: number
  weeks: CalendarDay[][]
  weekdays: CalendarWeekday[]
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

const DEFAULT_THEME = {
  background: '#FFFFFF',
  headerBackground: '#F6F7FB',
  headerText: '#1F2330',
  grid: '#D7DBEC',
  text: '#1F2330',
  secondaryText: '#A0A4B5',
  weekendText: '#F5566C',
  todayBackground: '#7064FF',
  todayText: '#FFFFFF',
  holidayBadgeBackground: '#FFECE5',
  holidayBadgeText: '#FF6A3D',
} as const

const BASE_DEFAULTS = {
  weekStart: 1,
  radius: 32,
  padding: 40,
  showWeekNumber: false,
  showLunar: true,
  showSolarTerm: true,
  showFestivals: true,
  showHolidays: true,
  highlightToday: true,
  highlightWeekend: true,
  highlightHolidays: true,
  highlightExpression: '',
  holidays: [] as string[],
}

function normalizeWeekStart(weekStart: number) {
  const normalized = Math.round(weekStart) % 7
  return normalized < 0 ? normalized + 7 : normalized
}

function createWeekdays(weekStart: number): CalendarWeekday[] {
  const normalized = normalizeWeekStart(weekStart)
  return new Array(7).fill(0).map((_, index) => {
    const actual = (normalized + index) % 7
    return { index: actual, label: WEEKDAY_LABELS[actual] }
  })
}

function toISODate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function compareMonth(targetYear: number, targetMonth: number, date: Date): -1 | 0 | 1 {
  const monthIndex = targetMonth - 1
  if (date.getFullYear() === targetYear && date.getMonth() === monthIndex) return 0
  if (date.getFullYear() < targetYear) return -1
  if (date.getFullYear() > targetYear) return 1
  if (date.getMonth() < monthIndex) return -1
  return 1
}

function getISOWeek(date: Date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function warnInvalid(key: string, value: unknown, fallback: unknown) {
  console.warn(`[calendar] Invalid ${key}:`, value, '→ fallback to', fallback)
}

export function validateCalendarProps(input: unknown): Partial<CalendarLayerProps> {
  if (!input || typeof input !== 'object') return {}
  const props = input as Record<string, unknown>
  const result: Partial<CalendarLayerProps> = {}

  if (typeof props.year === 'number' && Number.isFinite(props.year)) result.year = Math.round(props.year)
  else if (props.year !== undefined) warnInvalid('year', props.year, 'current year')

  if (typeof props.month === 'number' && Number.isFinite(props.month)) {
    const value = Math.max(1, Math.min(12, Math.round(props.month)))
    result.month = value
  } else if (props.month !== undefined) warnInvalid('month', props.month, 'current month')

  if (typeof props.weekStart === 'number' && Number.isFinite(props.weekStart)) {
    result.weekStart = normalizeWeekStart(props.weekStart)
  } else if (props.weekStart !== undefined) warnInvalid('weekStart', props.weekStart, BASE_DEFAULTS.weekStart)

  if (typeof props.radius === 'number' && Number.isFinite(props.radius)) {
    result.radius = Math.max(0, props.radius)
  } else if (props.radius !== undefined) warnInvalid('radius', props.radius, BASE_DEFAULTS.radius)

  if (typeof props.padding === 'number' && Number.isFinite(props.padding)) {
    result.padding = Math.max(0, props.padding)
  } else if (props.padding !== undefined) warnInvalid('padding', props.padding, BASE_DEFAULTS.padding)

  const booleanKeys: (keyof CalendarLayerProps)[] = [
    'showWeekNumber',
    'showLunar',
    'showSolarTerm',
    'showFestivals',
    'showHolidays',
    'highlightToday',
    'highlightWeekend',
    'highlightHolidays',
  ]
  booleanKeys.forEach((key) => {
    if (typeof props[key] === 'boolean') result[key] = props[key] as any
    else if (props[key] !== undefined) warnInvalid(String(key), props[key], (BASE_DEFAULTS as any)[key])
  })

  if (typeof props.highlightExpression === 'string') result.highlightExpression = props.highlightExpression
  else if (props.highlightExpression !== undefined)
    warnInvalid('highlightExpression', props.highlightExpression, BASE_DEFAULTS.highlightExpression)

  if (Array.isArray(props.holidays)) {
    result.holidays = props.holidays.filter((item) => typeof item === 'string') as string[]
  } else if (props.holidays !== undefined) warnInvalid('holidays', props.holidays, [])

  if (props.theme && typeof props.theme === 'object') {
    const theme = props.theme as Record<string, unknown>
    result.theme = { ...DEFAULT_THEME }
    Object.keys(DEFAULT_THEME).forEach((key) => {
      if (typeof theme[key] === 'string') (result.theme as any)[key] = theme[key]
      else if (theme[key] !== undefined) warnInvalid(`theme.${key}`, theme[key], (DEFAULT_THEME as any)[key])
    })
  }

  return result
}

export function mergeWithDefaults(props: Partial<CalendarLayerProps> | undefined): CalendarLayerProps {
  const now = new Date()
  const defaults = {
    ...BASE_DEFAULTS,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }
  const theme = props?.theme ? { ...DEFAULT_THEME, ...props.theme } : { ...DEFAULT_THEME }
  const holidays = props?.holidays ? props.holidays.slice() : defaults.holidays.slice()
  return {
    ...defaults,
    ...props,
    holidays,
    theme,
  }
}

export function generateMonth(year: number, month: number, weekStart: number): GeneratedMonth {
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    throw new Error('[calendar] Invalid month payload')
  }
  const normalizedMonth = Math.min(12, Math.max(1, Math.round(month)))
  const normalizedYear = Math.round(year)
  const normalizedWeekStart = normalizeWeekStart(weekStart)

  const rawCells = createMonthCells(normalizedYear, normalizedMonth, normalizedWeekStart)
  const weeks: CalendarDay[][] = []
  const todayIso = toISODate(new Date())

  rawCells.forEach((cell, index) => {
    const weekIndex = Math.floor(index / 7)
    const dayIndex = index % 7
    if (!weeks[weekIndex]) weeks[weekIndex] = []
    const date = new Date(cell.date)
    const iso = toISODate(date)
    const weekday = (normalizedWeekStart + dayIndex) % 7
    const monthOffset = cell.isCurrentMonth ? 0 : compareMonth(normalizedYear, normalizedMonth, date)
    const isWeekend = weekday === 0 || weekday === 6
    const isoWeek = getISOWeek(date)

    weeks[weekIndex].push({
      ...cell,
      date,
      solar: { ...cell.solar },
      lunar: { ...cell.lunar },
      festivals: cell.festivals.slice(),
      isoDate: iso,
      display: cell.solar.day,
      monthOffset,
      weekday,
      isWeekend,
      isToday: iso === todayIso,
      isoWeek,
    })
  })

  return {
    year: normalizedYear,
    month: normalizedMonth,
    weekStart: normalizedWeekStart,
    weeks,
    weekdays: createWeekdays(normalizedWeekStart),
  }
}

export function resolveCalendarProps(props: Partial<CalendarLayerProps> | undefined): CalendarLayerProps {
  const validated = props ? validateCalendarProps(props) : {}
  return mergeWithDefaults(validated)
}

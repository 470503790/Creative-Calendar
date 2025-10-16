import { CalendarLayerProps } from './scene'

export type CalendarWeekday = {
  index: number
  label: string
}

export type CalendarDay = {
  date: Date
  isoDate: string
  display: number
  monthOffset: -1 | 0 | 1
  weekday: number
  isToday: boolean
  isWeekend: boolean
}

export type GeneratedMonth = {
  year: number
  month: number
  weekStart: number
  weeks: CalendarDay[][]
  weekdays: CalendarWeekday[]
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

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

export function generateMonth(year: number, month: number, weekStart: number): GeneratedMonth {
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    throw new Error('[calendar] Invalid month payload')
  }
  const normalizedMonth = Math.min(12, Math.max(1, Math.round(month)))
  const normalizedYear = Math.round(year)
  const normalizedWeekStart = normalizeWeekStart(weekStart)

  const firstDay = new Date(normalizedYear, normalizedMonth - 1, 1)
  const startOffset = (firstDay.getDay() - normalizedWeekStart + 7) % 7
  const cursor = new Date(firstDay)
  cursor.setDate(cursor.getDate() - startOffset)

  const weeks: CalendarDay[][] = []
  const today = new Date()

  for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
    const week: CalendarDay[] = []
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const current = new Date(cursor)
      const iso = toISODate(current)
      const monthDiff = compareMonth(normalizedYear, normalizedMonth, current)
      const weekday = (normalizedWeekStart + dayIndex) % 7
      const isWeekend = weekday === 0 || weekday === 6
      const isToday =
        current.getFullYear() === today.getFullYear() &&
        current.getMonth() === today.getMonth() &&
        current.getDate() === today.getDate()

      week.push({
        date: current,
        isoDate: iso,
        display: current.getDate(),
        monthOffset: monthDiff,
        weekday,
        isToday,
        isWeekend,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
    // Stop early if we've covered the end of target month and one trailing week
    const last = week[week.length - 1]
    if (last.monthOffset === 1 && last.date.getDate() >= 7) break
  }

  return {
    year: normalizedYear,
    month: normalizedMonth,
    weekStart: normalizedWeekStart,
    weeks,
    weekdays: createWeekdays(normalizedWeekStart),
  }
}

export function resolveCalendarProps(props: Partial<CalendarLayerProps> | undefined): CalendarLayerProps {
  const now = new Date()
  const theme = props?.theme ?? {
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
  }
  return {
    year: props?.year ?? now.getFullYear(),
    month: props?.month ?? now.getMonth() + 1,
    weekStart: props?.weekStart ?? 1,
    radius: props?.radius ?? 32,
    padding: props?.padding ?? 40,
    showWeekNumber: props?.showWeekNumber ?? false,
    holidays: props?.holidays ?? [],
    theme,
  }
}

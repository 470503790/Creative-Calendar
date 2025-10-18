import {
  buildMonthMatrix,
  describeDate,
  formatDateKey,
  getFestivals as getFestivalEntries,
  getLunarInfo,
  getSolarInfo,
  getSolarTermName,
  type LunarInfo,
  type MonthCell,
  type SolarInfo,
} from '../../../libs/lunar'

type DateInput = Date | string | number

type CachedDay = {
  solar: SolarInfo
  lunar: LunarInfo
  solarTerm: string
  festivals: string[]
  description: string
}

const dayCache = new Map<string, CachedDay>()
const monthCache = new Map<string, MonthCell[]>()

function toDate(input: DateInput): Date {
  if (input instanceof Date) return new Date(input.getTime())
  if (typeof input === 'number' || typeof input === 'string') {
    const parsed = new Date(input)
    if (!Number.isFinite(parsed.getTime())) {
      throw new Error(`[lunar] Invalid date input: ${input}`)
    }
    return parsed
  }
  throw new Error('[lunar] Unsupported date input')
}

function ensureDay(date: Date) {
  const key = formatDateKey(date)
  let cached = dayCache.get(key)
  if (!cached) {
    const solar = getSolarInfo(date)
    const lunar = getLunarInfo(date)
    const solarTerm = getSolarTermName(date)
    const festivalInfo = getFestivalEntries(date, lunar)
    const festivals = [...festivalInfo.solar, ...festivalInfo.lunar]
    cached = {
      solar,
      lunar,
      solarTerm,
      festivals,
      description: describeDate(date),
    }
    dayCache.set(key, cached)
  }
  return { key, cached }
}

export function clearLunarCache() {
  dayCache.clear()
  monthCache.clear()
}

export function getLunar(input: DateInput) {
  const date = toDate(input)
  const { cached } = ensureDay(date)
  return {
    date,
    solar: { ...cached.solar },
    lunar: { ...cached.lunar },
    solarTerm: cached.solarTerm,
    description: cached.description,
  }
}

export function getFestivals(input: DateInput): string[] {
  const date = toDate(input)
  const { cached } = ensureDay(date)
  return cached.festivals.slice()
}

export function monthData(year: number, month: number, weekStart = 0): MonthCell[] {
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    throw new Error('[lunar] Invalid month payload')
  }
  const normalizedYear = Math.round(year)
  const normalizedMonth = Math.min(12, Math.max(1, Math.round(month)))
  const normalizedWeekStart = ((weekStart % 7) + 7) % 7
  const cacheKey = `${normalizedYear}-${normalizedMonth}-${normalizedWeekStart}`
  const cached = monthCache.get(cacheKey)
  if (cached) {
    return cached.map((cell) => ({
      ...cell,
      date: new Date(cell.date),
      solar: { ...cell.solar },
      lunar: { ...cell.lunar },
      festivals: cell.festivals.slice(),
    }))
  }

  const dates = buildMonthMatrix(normalizedYear, normalizedMonth, normalizedWeekStart)
  const cells: MonthCell[] = dates.map((date) => {
    const { cached: day } = ensureDay(date)
    const isCurrentMonth = day.solar.year === normalizedYear && day.solar.month === normalizedMonth
    return {
      date: new Date(date),
      solar: { ...day.solar },
      lunar: { ...day.lunar },
      solarTerm: day.solarTerm,
      festivals: day.festivals.slice(),
      isCurrentMonth,
    }
  })

  monthCache.set(cacheKey, cells.map((cell) => ({
    ...cell,
    date: new Date(cell.date),
    solar: { ...cell.solar },
    lunar: { ...cell.lunar },
    festivals: cell.festivals.slice(),
  })))

  return cells
}

export type { MonthCell, LunarInfo, SolarInfo }

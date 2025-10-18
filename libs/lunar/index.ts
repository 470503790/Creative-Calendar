const LUNAR_MONTH_NAMES = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
const LUNAR_DAY_NAMES = [
  '',
  '初一',
  '初二',
  '初三',
  '初四',
  '初五',
  '初六',
  '初七',
  '初八',
  '初九',
  '初十',
  '十一',
  '十二',
  '十三',
  '十四',
  '十五',
  '十六',
  '十七',
  '十八',
  '十九',
  '二十',
  '廿一',
  '廿二',
  '廿三',
  '廿四',
  '廿五',
  '廿六',
  '廿七',
  '廿八',
  '廿九',
  '三十'
]
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const SOLAR_TERM_NAMES = [
  '小寒',
  '大寒',
  '立春',
  '雨水',
  '惊蛰',
  '春分',
  '清明',
  '谷雨',
  '立夏',
  '小满',
  '芒种',
  '夏至',
  '小暑',
  '大暑',
  '立秋',
  '处暑',
  '白露',
  '秋分',
  '寒露',
  '霜降',
  '立冬',
  '小雪',
  '大雪',
  '冬至'
]
const SOLAR_TERM_INFO = [
  0,
  21208,
  42467,
  63836,
  85337,
  107014,
  128867,
  150921,
  173149,
  195551,
  218072,
  240693,
  263343,
  285989,
  308563,
  331033,
  353350,
  375494,
  397447,
  419210,
  440795,
  462224,
  483532,
  504758
]
const SOLAR_FESTIVALS: Record<string, string[]> = {
  '01-01': ['元旦'],
  '02-14': ['情人节'],
  '03-08': ['妇女节'],
  '03-12': ['植树节'],
  '04-05': ['清明节'],
  '05-01': ['劳动节'],
  '05-04': ['青年节'],
  '06-01': ['儿童节'],
  '07-01': ['建党节'],
  '08-01': ['建军节'],
  '09-10': ['教师节'],
  '10-01': ['国庆节'],
  '12-25': ['圣诞节']
}
const LUNAR_FESTIVALS: Record<string, string[]> = {
  '1-1': ['春节'],
  '1-15': ['元宵节'],
  '2-2': ['龙抬头'],
  '5-5': ['端午节'],
  '7-7': ['七夕'],
  '7-15': ['中元节'],
  '8-15': ['中秋节'],
  '9-9': ['重阳节'],
  '12-8': ['腊八节'],
  '12-23': ['小年'],
  '12-30': ['除夕']
}

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

let lunarFormatter: Intl.DateTimeFormat | null = null
try {
  lunarFormatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
} catch (error) {
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn('[lunar] Chinese calendar formatter unavailable, lunar data will fallback to simplified mode', error)
  }
  lunarFormatter = null
}

const solarFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
})

const SOLAR_TERM_BASE = Date.UTC(1900, 0, 6, 2, 5)

export interface LunarInfo {
  year: number
  lunarYearName: string
  zodiac: string
  lunarMonth: number
  lunarMonthName: string
  lunarDay: number
  lunarDayName: string
  isLeapMonth: boolean
}

export interface SolarInfo {
  year: number
  month: number
  day: number
  key: string
}

export interface DayFestivals {
  solar: string[]
  lunar: string[]
}

export function formatDateKey(date: Date): string {
  return dateKeyFormatter.format(date)
}

function getLunarMonthIndex(name: string) {
  const clean = name.replace('闰', '')
  const index = LUNAR_MONTH_NAMES.indexOf(clean)
  return index >= 0 ? index + 1 : 0
}

function getLunarDayName(day: number) {
  if (day >= 1 && day <= 30) return LUNAR_DAY_NAMES[day]
  return `初${day}`
}

function getGanzhiYear(year: number) {
  const offset = (year - 4 + 6000) % 60
  const gan = HEAVENLY_STEMS[offset % 10]
  const zhi = EARTHLY_BRANCHES[offset % 12]
  return gan + zhi
}

function fallbackLunarInfo(date: Date): LunarInfo {
  const year = date.getFullYear()
  const zodiacIndex = (year - 4) % 12
  return {
    year,
    lunarYearName: getGanzhiYear(year),
    zodiac: ZODIAC[(zodiacIndex + 12) % 12],
    lunarMonth: 0,
    lunarMonthName: '',
    lunarDay: 0,
    lunarDayName: '',
    isLeapMonth: false,
  }
}

export function getLunarInfo(date: Date): LunarInfo {
  if (!lunarFormatter) {
    return fallbackLunarInfo(date)
  }
  const parts = lunarFormatter.formatToParts(date)
  const relatedYearPart = parts.find((part) => (part as Intl.DateTimeFormatPart & { type: string }).type === 'relatedYear')
  const relatedYear = parseInt(relatedYearPart?.value || String(date.getFullYear()), 10)
  const monthNameRaw = parts.find((part) => part.type === 'month')?.value || ''
  const dayValue = parseInt(parts.find((part) => part.type === 'day')?.value || '1', 10)
  const isLeapMonth = monthNameRaw.includes('闰')
  const monthName = monthNameRaw.replace('闰', '')
  const lunarMonth = getLunarMonthIndex(monthName)
  const lunarDayName = getLunarDayName(dayValue)
  return {
    year: relatedYear,
    lunarYearName: getGanzhiYear(relatedYear),
    zodiac: ZODIAC[((relatedYear - 4) % 12 + 12) % 12],
    lunarMonth,
    lunarMonthName: monthName,
    lunarDay: dayValue,
    lunarDayName,
    isLeapMonth,
  }
}

export function getSolarInfo(date: Date): SolarInfo {
  const key = formatDateKey(date)
  const [year, month, day] = key.split('-').map((item) => parseInt(item, 10))
  return { year, month, day, key }
}

function computeSolarTermDate(year: number, index: number): Date {
  const time = SOLAR_TERM_BASE + (year - 1900) * 31556925974.7 + SOLAR_TERM_INFO[index] * 60000
  return new Date(time)
}

export function getSolarTermName(date: Date): string {
  const key = formatDateKey(date)
  const year = parseInt(key.slice(0, 4), 10)
  for (let i = 0; i < SOLAR_TERM_NAMES.length; i += 1) {
    const termDate = computeSolarTermDate(year, i)
    if (formatDateKey(termDate) === key) return SOLAR_TERM_NAMES[i]
  }
  return ''
}

export function getFestivals(date: Date, lunar: LunarInfo): DayFestivals {
  const solarKey = formatDateKey(date).slice(5)
  const lunarKey = `${lunar.lunarMonth}-${lunar.lunarDay}`
  const solarFestivals = SOLAR_FESTIVALS[solarKey] ?? []
  let lunarFestivals = LUNAR_FESTIVALS[lunarKey] ?? []
  if (lunarFormatter && lunar.lunarMonth === 12 && lunar.lunarDay >= 29) {
    const lastDay = lunarFormatter
      .formatToParts(new Date(date.getFullYear(), 0, 1))
      .find((part) => part.type === 'day')?.value
    if (lastDay === '29' && lunar.lunarDay === 29) lunarFestivals = ['除夕']
  }
  return { solar: solarFestivals.slice(), lunar: lunarFestivals.slice() }
}

export interface MonthCell {
  date: Date
  solar: SolarInfo
  lunar: LunarInfo
  solarTerm: string
  festivals: string[]
  isCurrentMonth: boolean
}

export function buildMonthMatrix(year: number, month: number, weekStart = 0): Date[] {
  const firstDay = new Date(year, month - 1, 1)
  const firstWeekday = (firstDay.getDay() - weekStart + 7) % 7
  const startDate = new Date(year, month - 1, 1 - firstWeekday)
  const days: Date[] = []
  for (let i = 0; i < 42; i += 1) {
    const current = new Date(startDate)
    current.setDate(startDate.getDate() + i)
    days.push(current)
  }
  return days
}

export function describeDate(date: Date): string {
  return solarFormatter.format(date)
}

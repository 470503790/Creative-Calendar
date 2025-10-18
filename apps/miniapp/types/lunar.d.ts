import type { LunarInfo as VendorLunarInfo, SolarInfo as VendorSolarInfo, MonthCell as VendorMonthCell } from '../../../libs/lunar'

export type LunarInfo = VendorLunarInfo
export type SolarInfo = VendorSolarInfo
export type MonthCell = VendorMonthCell

export interface LunarDayDetail {
  date: Date
  solar: SolarInfo
  lunar: LunarInfo
  solarTerm: string
  festivals: string[]
  description: string
}

export interface MonthDataOptions {
  year: number
  month: number
  weekStart?: number
}

export type { LunarInfo as DefaultLunarInfo, SolarInfo as DefaultSolarInfo, MonthCell as DefaultMonthCell }

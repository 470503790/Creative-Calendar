export interface FirstScreenMetrics {
  duration: number
  timestamp: number
  state?: string
}

const GLOBAL_LAUNCH_KEY = '__CC_APP_LAUNCH_AT__'

let appLaunchAt = Date.now()
let firstScreenMetrics: FirstScreenMetrics | null = null

function setGlobalLaunch(value: number) {
  if (typeof globalThis !== 'undefined') {
    try {
      Object.defineProperty(globalThis, GLOBAL_LAUNCH_KEY, {
        value,
        writable: true,
        configurable: true,
      })
    } catch {
      ;(globalThis as Record<string, unknown>)[GLOBAL_LAUNCH_KEY] = value
    }
  }
}

function getGlobalLaunch(): number | undefined {
  if (typeof globalThis === 'undefined') return undefined
  const record = globalThis as Record<string, unknown>
  const value = record[GLOBAL_LAUNCH_KEY]
  return typeof value === 'number' ? value : undefined
}

export function markAppLaunch(timestamp?: number) {
  const resolved = typeof timestamp === 'number' ? timestamp : Date.now()
  appLaunchAt = resolved
  firstScreenMetrics = null
  setGlobalLaunch(resolved)
}

export function markFirstScreenReady(state?: string): FirstScreenMetrics | null {
  if (firstScreenMetrics) return null
  const start = getGlobalLaunch() ?? appLaunchAt ?? Date.now()
  const now = Date.now()
  const duration = Math.max(now - start, 0)
  firstScreenMetrics = {
    duration,
    timestamp: now,
    state,
  }
  return firstScreenMetrics
}

export function getFirstScreenMetrics(): FirstScreenMetrics | null {
  return firstScreenMetrics
}

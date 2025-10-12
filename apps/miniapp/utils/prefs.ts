import { computed } from 'vue'

const ONBOARDED_KEY = 'creative-calendar:onboarded'
const PREFS_KEY = 'creative-calendar:prefs'

export type OnboardingStep = 'welcome' | 'preferences' | 'permissions' | 'profile'

export interface UserProfilePrefs {
  nickname: string
  organization: string
  role: string
}

export interface UserPrefs {
  templateCategories: string[]
  notificationOptIn: boolean
  analyticsOptIn: boolean
  profile: UserProfilePrefs
  onboardingStep?: OnboardingStep
}

const defaultPrefs: UserPrefs = {
  templateCategories: [],
  notificationOptIn: true,
  analyticsOptIn: false,
  profile: {
    nickname: '',
    organization: '',
    role: '',
  },
}

function normalizePrefs(raw: unknown): UserPrefs {
  if (!raw)
    return { ...defaultPrefs }

  let parsed: Partial<UserPrefs> = {}

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw) as Partial<UserPrefs>
    }
    catch (error) {
      console.warn('[prefs] Failed to parse storage value', error)
    }
  }
  else if (typeof raw === 'object') {
    parsed = raw as Partial<UserPrefs>
  }

  const templateCategories = Array.isArray(parsed?.templateCategories)
    ? [...(parsed?.templateCategories as string[])]
    : [...defaultPrefs.templateCategories]

  return {
    ...defaultPrefs,
    ...parsed,
    templateCategories,
    notificationOptIn: typeof parsed?.notificationOptIn === 'boolean'
      ? parsed.notificationOptIn
      : defaultPrefs.notificationOptIn,
    analyticsOptIn: typeof parsed?.analyticsOptIn === 'boolean'
      ? parsed.analyticsOptIn
      : defaultPrefs.analyticsOptIn,
    profile: {
      ...defaultPrefs.profile,
      ...(parsed?.profile ?? {}),
    },
    onboardingStep: parsed?.onboardingStep,
  }
}

export function getOnboarded(): boolean {
  const value = uni.getStorageSync(ONBOARDED_KEY)
  if (value === '' || value === null || typeof value === 'undefined')
    return false
  if (typeof value === 'boolean')
    return value
  if (typeof value === 'number')
    return value === 1
  if (typeof value === 'string')
    return value === '1' || value.toLowerCase() === 'true'
  return false
}

export function setOnboarded(value: boolean): void {
  if (value)
    uni.setStorageSync(ONBOARDED_KEY, '1')
  else
    uni.removeStorageSync(ONBOARDED_KEY)
}

export function getPrefs(): UserPrefs {
  const stored = uni.getStorageSync(PREFS_KEY)
  return normalizePrefs(stored)
}

export function setPrefs(partial: Partial<UserPrefs>): UserPrefs {
  const current = getPrefs()
  const next: UserPrefs = {
    ...current,
    ...partial,
    templateCategories: Array.isArray(partial.templateCategories)
      ? [...partial.templateCategories]
      : current.templateCategories,
    notificationOptIn: typeof partial.notificationOptIn === 'boolean'
      ? partial.notificationOptIn
      : current.notificationOptIn,
    analyticsOptIn: typeof partial.analyticsOptIn === 'boolean'
      ? partial.analyticsOptIn
      : current.analyticsOptIn,
    profile: {
      ...current.profile,
      ...(partial.profile ?? {}),
    },
    onboardingStep: Object.prototype.hasOwnProperty.call(partial, 'onboardingStep')
      ? partial.onboardingStep
      : current.onboardingStep,
  }

  uni.setStorageSync(PREFS_KEY, JSON.stringify(next))
  return next
}

export function usePrefs() {
  const prefs = computed(() => getPrefs())
  return {
    prefs,
  }
}

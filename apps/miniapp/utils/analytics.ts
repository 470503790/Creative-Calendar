const APP_VERSION = '0.1.0'

export const AnalyticsEvents = {
  APP_LAUNCH: 'app_launch',
  HOME_OPEN_NOTIFICATIONS: 'home_open_notifications',
  HOME_OPEN_SEARCH: 'home_open_search',
  HOME_TOGGLE_THEME: 'home_toggle_theme',
  HOME_CREATE_ENTRY: 'home_create_entry',
  HOME_VIEW_TEMPLATE_DETAIL: 'home_view_template_detail',
  HOME_VIEW_TEMPLATES: 'home_view_templates',
  HOME_VIEW_WORKS: 'home_view_works',
  HOME_CONTINUE_EDIT: 'home_continue_edit',
  HOME_REFRESH: 'home_refresh',
  HOME_FIRST_SCREEN_READY: 'home_first_screen_ready',
  TEMPLATES_SEARCH: 'templates_search',
  TEMPLATES_CLEAR_SEARCH: 'templates_clear_search',
  TEMPLATES_FILTER_TOGGLE: 'templates_filter_toggle',
  TEMPLATES_RESET_FILTERS: 'templates_reset_filters',
  TEMPLATES_VIEW_DETAIL: 'templates_view_detail',
  TEMPLATES_GO_CREATE: 'templates_go_create',
  TEMPLATES_GO_WORKS: 'templates_go_works',
  TEMPLATES_RETRY: 'templates_retry',
  TEMPLATE_DETAIL_USE: 'template_detail_use',
  TEMPLATE_DETAIL_TOGGLE_FAVORITE: 'template_detail_toggle_favorite',
  TEMPLATE_DETAIL_SELECT_SIZE: 'template_detail_select_size',
  TEMPLATE_DETAIL_BACK_TO_LIST: 'template_detail_back_to_list',
  TEMPLATE_DETAIL_RETRY: 'template_detail_retry',
  WORKS_CREATE: 'works_create',
  WORKS_CONTINUE_EDIT: 'works_continue_edit',
  WORKS_PREVIEW: 'works_preview',
  WORKS_RELOAD: 'works_reload',
  SETTINGS_THEME_TOGGLE: 'settings_theme_toggle',
  SETTINGS_LANGUAGE_CHANGE: 'settings_language_change',
  SETTINGS_DATA_SOURCE_CHANGE: 'settings_data_source_change',
  SETTINGS_NOTIFICATIONS_TOGGLE: 'settings_notifications_toggle',
  SETTINGS_LABS_TOGGLE: 'settings_labs_toggle',
  SETTINGS_PRIVACY_TOGGLE: 'settings_privacy_toggle',
  SETTINGS_ACCOUNT_MANAGE: 'settings_account_manage',
  SETTINGS_FEEDBACK: 'settings_feedback',
  SETTINGS_VERSION: 'settings_version',
  SETTINGS_AGREEMENT_VIEW: 'settings_agreement_view',
} as const

export type AnalyticsEvent = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents]

type AnalyticsPayload = Record<string, unknown>

interface AnalyticsContext extends AnalyticsPayload {
  event: AnalyticsEvent
  timestamp: string
  appVersion: string
  platform: string
  pagePath?: string | null
}

function resolvePlatform(): string {
  if (typeof process !== 'undefined' && process.env?.UNI_PLATFORM) {
    return process.env.UNI_PLATFORM
  }

  try {
    if (typeof uni !== 'undefined' && typeof uni.getSystemInfoSync === 'function') {
      const info = uni.getSystemInfoSync()
      if (info?.platform) return info.platform
      if (info?.osName) return info.osName
    }
  }
  catch (error) {
    console.warn('[analytics] resolvePlatform failed', error)
  }

  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    return navigator.userAgent
  }

  return 'unknown'
}

function resolvePagePath(): string | null {
  try {
    if (typeof getCurrentPages === 'function') {
      const pages = getCurrentPages()
      if (pages?.length) {
        const current = pages[pages.length - 1] as { route?: string; $page?: { fullPath?: string } }
        if (current?.$page?.fullPath) return current.$page.fullPath
        if (current?.route) return `/${current.route}`
      }
    }
  }
  catch (error) {
    console.warn('[analytics] resolvePagePath failed', error)
  }

  return null
}

const commonFields = {
  appVersion: APP_VERSION,
  platform: resolvePlatform(),
}

export function track(event: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
  const context: AnalyticsContext = {
    ...commonFields,
    event,
    timestamp: new Date().toISOString(),
    pagePath: resolvePagePath(),
    ...payload,
  }

  // eslint-disable-next-line no-console
  console.info('[analytics]', context)
}

export function getAnalyticsEvents() {
  return AnalyticsEvents
}


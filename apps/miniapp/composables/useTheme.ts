import { computed, getCurrentInstance, onScopeDispose, ref, watch } from 'vue'
import {
  applyThemeCssVars,
  resolveTheme,
  ThemeCssVars,
  ThemeName,
  tokensToCssVars,
} from '../utils/tokens'

const STORAGE_KEY = 'creative-calendar-theme'
const themeName = ref<ThemeName>('light')
let hasBootstrapped = false

function readStoredTheme(): ThemeName | null {
  try {
    if (typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function') {
      const stored = uni.getStorageSync(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') return stored
    }
  }
  catch (error) {
    console.warn('[theme] failed to read uni storage', error)
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') return stored
    }
  }
  catch (error) {
    console.warn('[theme] failed to read localStorage', error)
  }

  return null
}

function persistTheme(name: ThemeName) {
  try {
    if (typeof uni !== 'undefined' && typeof uni.setStorageSync === 'function') {
      uni.setStorageSync(STORAGE_KEY, name)
      return
    }
  }
  catch (error) {
    console.warn('[theme] failed to write uni storage', error)
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, name)
    }
  }
  catch (error) {
    console.warn('[theme] failed to write localStorage', error)
  }
}

function bootstrapTheme() {
  if (hasBootstrapped) return
  const stored = readStoredTheme()
  if (stored) themeName.value = stored
  hasBootstrapped = true
}

function ensureValidName(name: ThemeName): ThemeName {
  return name === 'dark' ? 'dark' : 'light'
}

export function useTheme() {
  bootstrapTheme()
  const instance = getCurrentInstance()

  const tokens = computed(() => resolveTheme(themeName.value))
  const cssVars = computed<ThemeCssVars>(() => tokensToCssVars(tokens.value))
  const isDark = computed(() => themeName.value === 'dark')

  const stop = watch(
    () => ({ name: themeName.value, vars: cssVars.value }),
    ({ name, vars }) => {
      const validName = ensureValidName(name)
      if (validName !== themeName.value) themeName.value = validName
      persistTheme(validName)
      applyThemeCssVars(vars)
    },
    { immediate: true, deep: false }
  )

  if (instance) {
    onScopeDispose(() => {
      stop()
    })
  }

  function setTheme(name: ThemeName) {
    themeName.value = ensureValidName(name)
  }

  function toggleTheme() {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  return {
    themeName,
    isDark,
    cssVars,
    setTheme,
    toggleTheme,
  }
}

export type UseThemeReturn = ReturnType<typeof useTheme>
export { STORAGE_KEY as THEME_STORAGE_KEY }

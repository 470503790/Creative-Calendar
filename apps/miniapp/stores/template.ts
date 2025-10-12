import { computed, reactive, ref } from 'vue'
import type { TemplateItem } from '../utils/mock-api'
import { getTemplates } from '../utils/mock-api'

type FilterKey = 'style' | 'usage' | 'color' | 'payment' | 'motion'

type FilterOption = {
  label: string
  value: string
  hint?: string
  swatch?: string
}

type FilterGroup = {
  key: FilterKey
  label: string
  options: FilterOption[]
}

type TemplateStatus = 'idle' | 'loading' | 'ready' | 'error'

type TemplateRecord = TemplateItem & {
  styleKey: string
  styleLabel: string
  usageKey: string
  usageLabel: string
  toneKey: string
  toneLabel: string
  toneSwatch: string
  isDynamic: boolean
  isFavorite: boolean
}

const STYLE_OPTIONS: FilterOption[] = [
  { label: '奶油风', value: 'cream' },
  { label: '复古胶片', value: 'retro' },
  { label: '赛博霓虹', value: 'cyber' },
  { label: '手绘插画', value: 'handdrawn' },
  { label: '极简主义', value: 'minimal' },
  { label: 'Morandi', value: 'morandi' },
]

const USAGE_OPTIONS: FilterOption[] = [
  { label: '月历', value: 'monthly' },
  { label: '周计划', value: 'weekly' },
  { label: '倒数日', value: 'countdown' },
  { label: '打卡', value: 'habit' },
  { label: '节日海报', value: 'festival' },
  { label: '速记', value: 'note' },
]

const COLOR_OPTIONS: FilterOption[] = [
  { label: '暖橙', value: 'warm', swatch: '#ff7a59' },
  { label: '薄荷', value: 'mint', swatch: '#34d399' },
  { label: '靛蓝', value: 'indigo', swatch: '#6366f1' },
  { label: '暮色紫', value: 'violet', swatch: '#a855f7' },
  { label: '午夜黑', value: 'mono', swatch: '#111827' },
  { label: '天空蓝', value: 'sky', swatch: '#0ea5e9' },
]

const PAYMENT_OPTIONS: FilterOption[] = [
  { label: '免费', value: 'free' },
  { label: '会员专属', value: 'pro' },
]

const MOTION_OPTIONS: FilterOption[] = [
  { label: '静态', value: 'static' },
  { label: '动态', value: 'dynamic' },
]

const FILTER_GROUPS: FilterGroup[] = [
  { key: 'style', label: '风格', options: STYLE_OPTIONS },
  { key: 'usage', label: '用途', options: USAGE_OPTIONS },
  { key: 'color', label: '颜色', options: COLOR_OPTIONS },
  { key: 'payment', label: '付费', options: PAYMENT_OPTIONS },
  { key: 'motion', label: '动态', options: MOTION_OPTIONS },
]

const COLOR_SWATCH_MAP = COLOR_OPTIONS.reduce<Record<string, string>>((acc, option) => {
  acc[option.value] = option.swatch ?? '#7c6cff'
  return acc
}, {})

export const useTemplateStore = () => {
  if (internalStore) return internalStore
  internalStore = createTemplateStore()
  return internalStore
}

type TemplateStore = ReturnType<typeof createTemplateStore>

let internalStore: TemplateStore | null = null

function createTemplateStore() {
  const items = ref<TemplateRecord[]>([])
  const status = ref<TemplateStatus>('idle')
  const query = ref('')
  const activeFilters = reactive<Record<FilterKey, string[]>>({
    style: [],
    usage: [],
    color: [],
    payment: [],
    motion: [],
  })

  const filters = computed(() => FILTER_GROUPS)

  const normalizedQuery = computed(() => query.value.trim().toLowerCase())

  const filteredItems = computed(() => {
    const keyword = normalizedQuery.value
    return items.value.filter((item: TemplateRecord) => {
      if (keyword) {
        const inTitle = item.title.toLowerCase().includes(keyword)
        const inTags = item.tags.some((tag: string) => tag.toLowerCase().includes(keyword))
        const inMeta =
          item.styleLabel.toLowerCase().includes(keyword) ||
          item.usageLabel.toLowerCase().includes(keyword)
        if (!inTitle && !inTags && !inMeta) return false
      }

      if (activeFilters.style.length && !activeFilters.style.includes(item.styleKey)) return false
      if (activeFilters.usage.length && !activeFilters.usage.includes(item.usageKey)) return false
      if (activeFilters.color.length && !activeFilters.color.includes(item.toneKey)) return false

      if (activeFilters.payment.length) {
        const paymentMatched = activeFilters.payment.some((value: string) =>
          value === 'pro' ? item.isPro : value === 'free' ? !item.isPro : true
        )
        if (!paymentMatched) return false
      }

      if (activeFilters.motion.length) {
        const motionMatched = activeFilters.motion.some((value: string) =>
          value === 'dynamic' ? item.isDynamic : value === 'static' ? !item.isDynamic : true
        )
        if (!motionMatched) return false
      }

      return true
    })
  })

  const hasActiveFilters = computed(() =>
    (Object.values(activeFilters) as string[][]).some((group) => group.length > 0)
  )

  const isEmpty = computed(
    () => status.value === 'ready' && filteredItems.value.length === 0
  )

  async function loadTemplates(force = false) {
    if (status.value === 'loading') return
    if (!force && status.value === 'ready' && items.value.length) return

    status.value = 'loading'
    try {
      const raw = await getTemplates()
      const generated = buildTemplateLibrary(raw || [])
      items.value = generated
      status.value = 'ready'
    } catch (error) {
      console.warn('Failed to load templates', error)
      status.value = 'error'
    }
  }

  function setQuery(value: string) {
    query.value = value
  }

  function clearQuery() {
    query.value = ''
  }

  function toggleFilter(key: FilterKey, value: string) {
    const bucket = activeFilters[key]
    const index = bucket.indexOf(value)
    if (index >= 0) bucket.splice(index, 1)
    else bucket.push(value)
  }

  function clearFilters() {
    Object.keys(activeFilters).forEach((key) => {
      const bucket = activeFilters[key as FilterKey]
      bucket.splice(0, bucket.length)
    })
  }

  function reset() {
    clearQuery()
    clearFilters()
  }

  return {
    items,
    status,
    query,
    filters,
    activeFilters,
    filteredItems,
    hasActiveFilters,
    isEmpty,
    loadTemplates,
    setQuery,
    clearQuery,
    toggleFilter,
    clearFilters,
    reset,
  }
}

function buildTemplateLibrary(base: TemplateItem[]): TemplateRecord[] {
  const source = base.length ? base : createFallbackTemplates()
  const total = 240
  const records: TemplateRecord[] = []

  for (let i = 0; i < total; i += 1) {
    const baseItem = source[i % source.length]
    const styleOption = STYLE_OPTIONS[i % STYLE_OPTIONS.length]
    const usageOption = USAGE_OPTIONS[Math.floor(i / STYLE_OPTIONS.length) % USAGE_OPTIONS.length]
    const colorOption = COLOR_OPTIONS[Math.floor(i / (STYLE_OPTIONS.length * USAGE_OPTIONS.length)) % COLOR_OPTIONS.length]
    const isDynamic = i % 3 === 0
    const isFavorite = i % 7 === 0
    const isPro = i % 5 === 0 ? true : baseItem.isPro
    const toneSwatch = COLOR_SWATCH_MAP[colorOption.value] ?? '#7c6cff'
    const id = `tpl_${(i + 1).toString().padStart(4, '0')}`
    const title = `${styleOption.label}${usageOption.label}${i % 2 === 0 ? '模板' : '日历'}`
    const coverUrl = buildCoverUrl(toneSwatch, title)
    const tags = Array.from(
      new Set<string>([
        ...baseItem.tags,
        styleOption.label,
        usageOption.label,
        colorOption.label,
      ])
    )

    records.push({
      ...baseItem,
      id,
      title,
      coverUrl,
      tags,
      isPro,
      colors: [toneSwatch, ...baseItem.colors.slice(1)],
      styleKey: styleOption.value,
      styleLabel: styleOption.label,
      usageKey: usageOption.value,
      usageLabel: usageOption.label,
      toneKey: colorOption.value,
      toneLabel: colorOption.label,
      toneSwatch,
      isDynamic,
      isFavorite,
    })
  }

  return records
}

function buildCoverUrl(swatch: string, title: string) {
  const background = swatch.replace('#', '')
  const fg = '#ffffff'
  const text = encodeURIComponent(title.slice(0, 6))
  return `https://dummyimage.com/600x800/${background}/${fg.replace('#', '')}&text=${text}`
}

function createFallbackTemplates(): TemplateItem[] {
  return [
    {
      id: 'fallback_1',
      title: '默认月历',
      coverUrl: 'https://dummyimage.com/600x800/6366f1/ffffff&text=Default',
      tags: ['默认', '月历'],
      isPro: false,
      colors: ['#6366f1'],
      sizeHints: ['A4'],
    },
  ]
}

export type { FilterGroup, FilterKey, FilterOption, TemplateRecord }

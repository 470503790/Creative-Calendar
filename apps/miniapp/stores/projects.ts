import { computed, ref, watch } from 'vue'
import { isOfflineError, resolveMockRequest } from '../utils/mock-controls'

export type ProjectSortKey = 'updatedAt' | 'createdAt' | 'name'
export type ProjectSortOrder = 'asc' | 'desc'
export type ProjectSortPreset = 'recent' | 'created' | 'name-asc' | 'name-desc'

export interface ProjectItem {
  id: string
  name: string
  description: string
  coverColor: string
  accentColor: string
  category: string
  size: string
  tags: string[]
  createdAt: number
  updatedAt: number
  exportCount: number
}

export interface ProjectExportRecord {
  id: string
  projectId: string
  projectName: string
  createdAt: number
  format: 'png' | 'jpg' | 'pdf'
  preset: string
  size: string
}

interface SortOption {
  key: ProjectSortPreset
  label: string
  sortKey: ProjectSortKey
  order: ProjectSortOrder
}

type ProjectsStore = ReturnType<typeof createProjectsStore>

const PROJECT_STORAGE_KEY = 'cc_projects_items_v1'
const EXPORT_STORAGE_KEY = 'cc_projects_exports_v1'
const EXPORT_RECORD_LIMIT = 200

let singleton: ProjectsStore | null = null

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function readStorage<T>(key: string): T | null {
  try {
    if (typeof uni === 'undefined' || typeof uni.getStorageSync !== 'function') return null
    const raw = uni.getStorageSync(key)
    if (!raw) return null
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return parsed as T
  } catch (error) {
    console.warn('[projects] failed to read storage', key, error)
    return null
  }
}

function writeStorage<T>(key: string, value: T) {
  try {
    if (typeof uni === 'undefined' || typeof uni.setStorageSync !== 'function') return
    uni.setStorageSync(key, JSON.stringify(value))
  } catch (error) {
    console.warn('[projects] failed to write storage', key, error)
  }
}

function createMockProjects(): ProjectItem[] {
  const categories = [
    { name: '社媒海报', cover: ['#E8E5FF', '#C8C2FF'] },
    { name: '节气日历', cover: ['#DFF6F0', '#B8E4DA'] },
    { name: '品牌宣传', cover: ['#FFEFE0', '#FFD2A8'] },
    { name: '活动邀请', cover: ['#FFE6F2', '#FFBCD9'] },
    { name: '课程预告', cover: ['#FFF5D9', '#FFE1A1'] },
  ] as const

  const tagsPool = [
    ['日历', '节气'],
    ['推广', '新品'],
    ['直播', '倒计时'],
    ['节日', '分享'],
    ['品牌', '活动'],
    ['教育', '课程'],
  ]

  const titles = [
    '夏日清凉节日历',
    '品牌618倒计时',
    '插画风节气分享',
    '早安语录系列',
    '节日祝福模板',
    '新品发布预热',
    '课程招募预告',
    '旅行灵感计划',
    '节庆海报合集',
    '年度总结海报',
    '手账风周历',
    '摄影展倒计时',
    '社群运营海报',
    '主题活动邀请',
    '氛围感品牌封面',
    '周末市集宣传',
    '艺术节视觉稿',
    '新品上市卡片',
    '咖啡馆推广',
    '节日贺卡',
  ]

  const now = Date.now()
  const items: ProjectItem[] = []
  const total = 24

  for (let index = 0; index < total; index += 1) {
    const title = titles[index % titles.length]
    const category = categories[index % categories.length]
    const tags = tagsPool[index % tagsPool.length]
    const createdAt = now - (index + 1) * 36 * 60 * 1000
    const updatedAt = createdAt + (index % 7) * 12 * 60 * 1000

    items.push({
      id: createId('project'),
      name: title,
      description: `${title} 的创意稿件，包含多尺寸适配`,
      coverColor: category.cover[0],
      accentColor: category.cover[1],
      category: category.name,
      size: index % 3 === 0 ? '1080 × 1920' : index % 3 === 1 ? '1242 × 2688' : '1200 × 1200',
      tags,
      createdAt,
      updatedAt,
      exportCount: Math.floor(Math.random() * 5),
    })
  }

  return items
}

function normalizeProjects(input: any): ProjectItem[] {
  if (!Array.isArray(input)) return createMockProjects()
  return input
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      if (!item.id || !item.name) return null
      const createdAt = typeof item.createdAt === 'number' ? item.createdAt : Date.now()
      const updatedAt = typeof item.updatedAt === 'number' ? item.updatedAt : createdAt
      return {
        id: String(item.id),
        name: String(item.name),
        description: String(item.description ?? ''),
        coverColor: String(item.coverColor ?? '#E8E5FF'),
        accentColor: String(item.accentColor ?? '#C8C2FF'),
        category: String(item.category ?? '作品'),
        size: String(item.size ?? '1080 × 1920'),
        tags: Array.isArray(item.tags) ? item.tags.map((tag: any) => String(tag)) : [],
        createdAt,
        updatedAt,
        exportCount: typeof item.exportCount === 'number' ? item.exportCount : 0,
      } as ProjectItem
    })
    .filter((item): item is ProjectItem => Boolean(item))
}

function normalizeExports(input: any): ProjectExportRecord[] {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      if (!item.id || !item.projectId) return null
      return {
        id: String(item.id),
        projectId: String(item.projectId),
        projectName: String(item.projectName ?? ''),
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
        format: item.format === 'jpg' ? 'jpg' : item.format === 'pdf' ? 'pdf' : 'png',
        preset: String(item.preset ?? '快速导出'),
        size: String(item.size ?? ''),
      } as ProjectExportRecord
    })
    .filter((item): item is ProjectExportRecord => Boolean(item))
}

function loadProjects(): ProjectItem[] {
  const stored = readStorage<ProjectItem[]>(PROJECT_STORAGE_KEY)
  const normalized = normalizeProjects(stored)
  if (!normalized.length) return createMockProjects()
  return normalized
}

function loadExports(): ProjectExportRecord[] {
  const stored = readStorage<ProjectExportRecord[]>(EXPORT_STORAGE_KEY)
  return normalizeExports(stored)
}

export function useProjectsStore() {
  if (singleton) return singleton
  singleton = createProjectsStore()
  return singleton
}

function createProjectsStore() {
  const projects = ref<ProjectItem[]>([])
  const exports = ref<ProjectExportRecord[]>(loadExports())
  const status = ref<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('loading')
  const errorType = ref<'none' | 'offline' | 'error'>('none')
  const isHydrated = ref(false)

  const searchQuery = ref('')
  const sortPreset = ref<ProjectSortPreset>('recent')
  const sortKey = ref<ProjectSortKey>('updatedAt')
  const sortOrder = ref<ProjectSortOrder>('desc')

  const isSelectionMode = ref(false)
  const selectedIds = ref<string[]>([])

  const sortOptions: SortOption[] = [
    { key: 'recent', label: '最近更新', sortKey: 'updatedAt', order: 'desc' },
    { key: 'created', label: '最近创建', sortKey: 'createdAt', order: 'desc' },
    { key: 'name-asc', label: '名称 A-Z', sortKey: 'name', order: 'asc' },
    { key: 'name-desc', label: '名称 Z-A', sortKey: 'name', order: 'desc' },
  ]

  watch(
    projects,
    (value) => {
      if (!isHydrated.value) return
      writeStorage(PROJECT_STORAGE_KEY, value)
      pruneSelection()
    },
    { deep: true }
  )

  watch(
    exports,
    (value) => {
      writeStorage(EXPORT_STORAGE_KEY, value.slice(0, EXPORT_RECORD_LIMIT))
    },
    { deep: true }
  )

  watch(
    sortPreset,
    (preset) => {
      const option = sortOptions.find((item) => item.key === preset) ?? sortOptions[0]
      sortKey.value = option.sortKey
      sortOrder.value = option.order
    },
    { immediate: true }
  )

  function pruneSelection() {
    if (!selectedIds.value.length) return
    const ids = new Set(projects.value.map((item) => item.id))
    selectedIds.value = selectedIds.value.filter((id) => ids.has(id))
    if (!selectedIds.value.length) {
      isSelectionMode.value = false
    }
  }

  async function refresh(force = false) {
    if (status.value === 'loading' && !force) return
    status.value = 'loading'
    errorType.value = 'none'
    try {
      const dataset = await resolveMockRequest('projects', {
        normal: () => loadProjects(),
        empty: () => [],
      })
      projects.value = dataset
      status.value = dataset.length ? 'ready' : 'empty'
      errorType.value = 'none'
    } catch (error) {
      console.warn('[projects] failed to load projects', error)
      projects.value = []
      status.value = 'error'
      errorType.value = isOfflineError(error) ? 'offline' : 'error'
    } finally {
      isHydrated.value = true
      pruneSelection()
    }
  }

  refresh()

  const filteredProjects = computed<ProjectItem[]>(() => {
    const keyword = searchQuery.value.trim().toLowerCase()
    const dataset = keyword
      ? projects.value.filter((item) => {
          const haystack = [item.name, item.category, item.description, ...item.tags].join(' ').toLowerCase()
          return haystack.includes(keyword)
        })
      : projects.value.slice()

    const sorted = [...dataset]
    sorted.sort((a, b) => {
      if (sortKey.value === 'name') {
        const locale = typeof Intl !== 'undefined' ? undefined : 'zh-Hans'
        const result = a.name.localeCompare(b.name, locale, { sensitivity: 'base' })
        return sortOrder.value === 'asc' ? result : -result
      }
      const key = sortKey.value
      const result = (a[key] ?? 0) - (b[key] ?? 0)
      return sortOrder.value === 'asc' ? result : -result
    })

    return sorted
  })

  const totalCount = computed(() => projects.value.length)
  const selectedCount = computed(() => selectedIds.value.length)

  const isAllSelected = computed(() => {
    const visibleIds = filteredProjects.value.map((item) => item.id)
    if (!visibleIds.length) return false
    return visibleIds.every((id) => selectedIds.value.includes(id))
  })

  function setSearch(value: string) {
    searchQuery.value = value
  }

  function clearSearch() {
    searchQuery.value = ''
  }

  function setSortPreset(preset: ProjectSortPreset) {
    sortPreset.value = preset
  }

  function enterSelectionMode(initialId?: string) {
    if (!isSelectionMode.value) {
      isSelectionMode.value = true
    }
    if (initialId && !selectedIds.value.includes(initialId)) {
      selectedIds.value = [...selectedIds.value, initialId]
    }
  }

  function exitSelectionMode() {
    isSelectionMode.value = false
    selectedIds.value = []
  }

  function toggleSelection(id: string) {
    if (!isSelectionMode.value) {
      enterSelectionMode(id)
      return
    }
    const exists = selectedIds.value.includes(id)
    selectedIds.value = exists
      ? selectedIds.value.filter((item) => item !== id)
      : [...selectedIds.value, id]
  }

  function isSelected(id: string) {
    return selectedIds.value.includes(id)
  }

  function selectAllVisible() {
    const ids = filteredProjects.value.map((item) => item.id)
    selectedIds.value = ids
    if (ids.length) {
      isSelectionMode.value = true
    }
  }

  function clearSelection() {
    selectedIds.value = []
  }

  function removeProjectsByIds(ids: string[]) {
    if (!ids.length) return 0
    const idSet = new Set(ids)
    const before = projects.value.length
    projects.value = projects.value.filter((item) => !idSet.has(item.id))
    exports.value = exports.value.filter((record) => !idSet.has(record.projectId))
    selectedIds.value = []
    isSelectionMode.value = false
    if (!projects.value.length) {
      status.value = 'empty'
    }
    return before - projects.value.length
  }

  function removeSelected() {
    return removeProjectsByIds(selectedIds.value)
  }

  function recordExport(projectIds: string[], meta?: { format?: 'png' | 'jpg' | 'pdf'; preset?: string }) {
    if (!projectIds.length) return 0
    const now = Date.now()
    const format = meta?.format ?? 'png'
    const preset = meta?.preset ?? (projectIds.length > 1 ? '批量导出' : '快速导出')

    const records: ProjectExportRecord[] = []
    const idSet = new Set(projectIds)

    projects.value = projects.value.map((project) => {
      if (!idSet.has(project.id)) return project
      records.push({
        id: createId('export'),
        projectId: project.id,
        projectName: project.name,
        createdAt: now,
        format,
        preset,
        size: project.size,
      })
      return {
        ...project,
        exportCount: project.exportCount + 1,
        updatedAt: Math.max(project.updatedAt, now),
      }
    })

    if (!records.length) return 0
    exports.value = [...records, ...exports.value].slice(0, EXPORT_RECORD_LIMIT)
    return records.length
  }

  function recordExportForSelected(meta?: { format?: 'png' | 'jpg' | 'pdf'; preset?: string }) {
    return recordExport(selectedIds.value, meta)
  }

  function touchProject(id: string) {
    const now = Date.now()
    projects.value = projects.value.map((project) => {
      if (project.id !== id) return project
      return {
        ...project,
        updatedAt: now,
      }
    })
  }

  function upsertProject(payload: Partial<ProjectItem> & { name: string }) {
    const now = Date.now()
    if (payload.id) {
      let updated = false
      projects.value = projects.value.map((project) => {
        if (project.id !== payload.id) return project
        updated = true
        return {
          ...project,
          ...payload,
          name: payload.name ?? project.name,
          updatedAt: payload.updatedAt ?? now,
        } as ProjectItem
      })
      if (updated) return payload.id
    }

    const id = payload.id ?? createId('project')
    const baseCategory = payload.category ?? '社媒海报'
    const coverColor = payload.coverColor ?? '#E8E5FF'
    const accentColor = payload.accentColor ?? '#C8C2FF'

    const project: ProjectItem = {
      id,
      name: payload.name,
      description: payload.description ?? `${payload.name} 的创意稿件`,
      coverColor,
      accentColor,
      category: baseCategory,
      size: payload.size ?? '1080 × 1920',
      tags: payload.tags ?? [],
      createdAt: payload.createdAt ?? now,
      updatedAt: payload.updatedAt ?? now,
      exportCount: payload.exportCount ?? 0,
    }
    projects.value = [project, ...projects.value]
    status.value = 'ready'
    return id
  }

  return {
    projects,
    exports,
    status,
    errorType,
    filteredProjects,
    searchQuery,
    sortOptions,
    sortPreset,
    sortKey,
    sortOrder,
    totalCount,
    selectedIds,
    selectedCount,
    isSelectionMode,
    isAllSelected,
    setSearch,
    clearSearch,
    setSortPreset,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelection,
    isSelected,
    selectAllVisible,
    clearSelection,
    removeProjectsByIds,
    removeSelected,
    recordExport,
    recordExportForSelected,
    touchProject,
    upsertProject,
    refresh,
  }
}

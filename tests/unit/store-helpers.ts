import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { nextTick } from 'vue'

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

type Scenario = 'default' | 'empty' | 'error' | 'offline'

const PROJECTS_KEY = 'cc_projects_items_v1'
const EXPORTS_KEY = 'cc_projects_exports_v1'
const SCENARIO_KEY = 'creative-calendar:mock:scenario:projects'

function createProject(id: string, overrides: Partial<ProjectItem> = {}): ProjectItem {
  const now = overrides.updatedAt ?? overrides.createdAt ?? Date.now()
  return {
    id,
    name: overrides.name ?? `项目-${id}`,
    description: overrides.description ?? `描述-${id}`,
    coverColor: overrides.coverColor ?? '#EEEEEE',
    accentColor: overrides.accentColor ?? '#DDDDDD',
    category: overrides.category ?? '社媒海报',
    size: overrides.size ?? '1080 × 1920',
    tags: overrides.tags ?? ['节气'],
    createdAt: overrides.createdAt ?? now - 1000,
    updatedAt: overrides.updatedAt ?? now,
    exportCount: overrides.exportCount ?? 0,
  }
}

export function buildProjects(count: number): ProjectItem[] {
  const base = Date.now()
  return Array.from({ length: count }).map((_, index) =>
    createProject(`p${index + 1}`, {
      name: index % 2 === 0 ? `案例 ${String.fromCharCode(65 + index)}` : `模板 ${index + 1}`,
      category: index % 3 === 0 ? '品牌宣传' : '节气日历',
      tags: index % 2 === 0 ? ['节日', '活动'] : ['日历'],
      updatedAt: base - index * 1000,
      createdAt: base - index * 2000,
    })
  )
}

type StoragePredicate = boolean | ((key: string, value?: any) => boolean)

interface StorageBehavior {
  throwOnRead?: StoragePredicate
  throwOnWrite?: StoragePredicate
}

export interface SetupOptions {
  projects?: ProjectItem[]
  scenario?: Scenario
  rawProjects?: any
  rawExports?: any
  storageBehavior?: StorageBehavior
}

export type ProjectsStore = any

export interface StoreSetupResult {
  store: ProjectsStore
  projects: ProjectItem[]
  storage: Map<string, any>
  module: any
}

function createFileUrlWithQuery(path: string) {
  const absolute = resolve(process.cwd(), path)
  const url = new URL(pathToFileURL(absolute).href)
  url.searchParams.set('t', `${Date.now()}-${Math.random()}`)
  return url.href
}

export async function flushStoreEffects(times = 3) {
  for (let index = 0; index < times; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

function overrideTimers() {
  const original = globalThis.setTimeout
  globalThis.setTimeout = ((handler: (...args: any[]) => void, _timeout?: number, ...args: any[]) => {
    handler(...args)
    return 0 as unknown as ReturnType<typeof setTimeout>
  }) as typeof setTimeout
  return () => {
    globalThis.setTimeout = original
  }
}

function shouldTrigger(predicate: StoragePredicate | undefined, key: string, value?: any) {
  if (!predicate) return false
  if (typeof predicate === 'function') {
    return predicate(key, value)
  }
  return Boolean(predicate)
}

export async function setupProjectsStore(options: SetupOptions = {}): Promise<StoreSetupResult> {
  const cleanupTimer = overrideTimers()

  const projects = options.projects ?? buildProjects(5)
  const storage = new Map<string, any>()

  if (options.rawProjects !== undefined) {
    storage.set(
      PROJECTS_KEY,
      typeof options.rawProjects === 'string' ? options.rawProjects : JSON.stringify(options.rawProjects)
    )
  } else {
    storage.set(PROJECTS_KEY, JSON.stringify(projects))
  }

  if (options.rawExports !== undefined) {
    storage.set(
      EXPORTS_KEY,
      typeof options.rawExports === 'string' ? options.rawExports : JSON.stringify(options.rawExports)
    )
  }

  if (options.scenario && options.scenario !== 'default') {
    storage.set(SCENARIO_KEY, options.scenario)
  }

  const behavior = options.storageBehavior ?? {}

  ;(globalThis as any).uni = {
    getStorageSync(key: string) {
      if (shouldTrigger(behavior.throwOnRead, key)) {
        throw new Error(`read denied for ${key}`)
      }
      if (storage.has(key)) return storage.get(key)
      return null
    },
    setStorageSync(key: string, value: any) {
      if (shouldTrigger(behavior.throwOnWrite, key, value)) {
        throw new Error(`write denied for ${key}`)
      }
      storage.set(key, typeof value === 'string' ? value : JSON.stringify(value))
    },
    removeStorageSync(key: string) {
      storage.delete(key)
    },
  }

  const moduleUrl = createFileUrlWithQuery('apps/miniapp/stores/projects.ts')
  const module = await import(moduleUrl)
  const store = module.useProjectsStore()

  await store.refresh(true)
  await flushStoreEffects(4)
  cleanupTimer()

  return { store, projects, storage, module }
}

export function readStoredProjects() {
  const raw = (globalThis as any).uni?.getStorageSync?.(PROJECTS_KEY) as string | null
  return raw ? JSON.parse(raw) : []
}

export function readStoredExports() {
  const raw = (globalThis as any).uni?.getStorageSync?.(EXPORTS_KEY) as string | null
  return raw ? JSON.parse(raw) : []
}

export function cleanupProjectsStore() {
  delete (globalThis as any).uni
}

import { describe, it, expect, afterEach } from '../vitest-lite.js'
import { nextTick } from 'vue'
import {
  setupProjectsStore,
  buildProjects,
  flushStoreEffects,
  readStoredProjects,
  readStoredExports,
  cleanupProjectsStore,
  type ProjectItem,
} from './store-helpers.js'

async function ensureHydrated() {
  await flushStoreEffects(4)
  await nextTick()
}

describe('projects store', () => {
  afterEach(() => {
    cleanupProjectsStore()
  })

  it('loads projects via mock request and sorts by updated time desc', async () => {
    const projects = buildProjects(3).map((item, index) => ({
      ...item,
      updatedAt: 1000 * index,
    }))
    const { store } = await setupProjectsStore({ projects })
    await ensureHydrated()

    expect(store.status.value).toBe('ready')
    expect(store.filteredProjects.value.map((item) => item.id)).toEqual(['p3', 'p2', 'p1'])
    expect(readStoredProjects()).toHaveLength(3)
  })

  it('filters projects by search keyword across fields', async () => {
    const projects: ProjectItem[] = [
      {
        id: 'a',
        name: '品牌618倒计时',
        description: '促销活动',
        coverColor: '#fff',
        accentColor: '#000',
        category: '品牌宣传',
        size: '1080 × 1920',
        tags: ['品牌', '促销'],
        createdAt: 1,
        updatedAt: 3,
        exportCount: 0,
      },
      {
        id: 'b',
        name: '节气插画',
        description: '二十四节气',
        coverColor: '#fff',
        accentColor: '#000',
        category: '节气日历',
        size: '1080 × 1920',
        tags: ['节气'],
        createdAt: 2,
        updatedAt: 4,
        exportCount: 0,
      },
    ]

    const { store } = await setupProjectsStore({ projects })
    await ensureHydrated()

    store.setSearch('品牌')
    await flushStoreEffects()

    expect(store.filteredProjects.value).toHaveLength(1)
    expect(store.filteredProjects.value[0].id).toBe('a')

    store.setSearch('节气')
    await flushStoreEffects()
    const ids = store.filteredProjects.value.map((item) => item.id)
    expect(ids).toHaveLength(1)
    expect(ids[0]).toBe('b')

    store.clearSearch()
    await flushStoreEffects()
    expect(store.filteredProjects.value).toHaveLength(2)
  })

  it('switches sort preset to name ascending', async () => {
    const projects = buildProjects(3).map((item) => ({
      ...item,
      name: item.id === 'p1' ? 'Zeta' : item.id === 'p2' ? 'Alpha' : 'Beta',
    }))
    const { store } = await setupProjectsStore({ projects })
    await ensureHydrated()

    store.setSortPreset('name-asc')
    await flushStoreEffects()

    expect(store.filteredProjects.value.map((item) => item.name)).toEqual(['Alpha', 'Beta', 'Zeta'])
    expect(store.sortKey.value).toBe('name')
    expect(store.sortOrder.value).toBe('asc')
  })

  it('supports toggling selection mode and tracking selected ids', async () => {
    const { store } = await setupProjectsStore()
    await ensureHydrated()

    store.enterSelectionMode('p1')
    expect(store.isSelectionMode.value).toBe(true)
    expect(store.selectedIds.value).toContain('p1')

    store.toggleSelection('p2')
    expect(store.selectedIds.value).toEqual(['p1', 'p2'])

    store.toggleSelection('p1')
    expect(store.selectedIds.value).toEqual(['p2'])

    store.exitSelectionMode()
    expect(store.isSelectionMode.value).toBe(false)
    expect(store.selectedIds.value).toHaveLength(0)
  })

  it('selects all visible items and exposes computed helpers', async () => {
    const { store } = await setupProjectsStore()
    await ensureHydrated()

    store.selectAllVisible()
    await flushStoreEffects()
    expect(store.isSelectionMode.value).toBe(true)
    const visible = store.filteredProjects.value.map((item) => item.id)
    const selected = new Set(store.selectedIds.value)
    expect(selected.size).toBe(visible.length)
    visible.forEach((id) => expect(selected.has(id)).toBe(true))

    store.clearSelection()
    expect(store.selectedCount.value).toBe(0)
  })

  it('toggles selection from idle state', async () => {
    const { store } = await setupProjectsStore()
    await ensureHydrated()

    store.toggleSelection('p1')
    await flushStoreEffects()
    expect(store.isSelectionMode.value).toBe(true)
    expect(store.isSelected('p1')).toBe(true)
  })

  it('removes projects by id and prunes export records', async () => {
    const projects = buildProjects(2)
    const { store } = await setupProjectsStore({ projects })
    await ensureHydrated()

    store.recordExport([projects[0].id])
    await flushStoreEffects()
    expect(store.exports.value).toHaveLength(1)

    const removed = store.removeProjectsByIds([projects[0].id])
    expect(removed).toBe(1)
    expect(store.projects.value).toHaveLength(1)
    expect(store.exports.value).toHaveLength(0)
    expect(store.status.value).toBe('ready')
  })

  it('records exports with metadata and updates counts', async () => {
    const projects = buildProjects(1)
    const { store } = await setupProjectsStore({ projects })
    await ensureHydrated()

    const count = store.recordExport([projects[0].id], { format: 'pdf', preset: '高质量导出' })
    await flushStoreEffects()
    expect(count).toBe(1)
    expect(store.exports.value[0]).toMatchObject({
      projectId: projects[0].id,
      format: 'pdf',
      preset: '高质量导出',
    })
    expect(store.projects.value[0].exportCount).toBe(1)
    expect(readStoredExports()).toHaveLength(1)
  })

  it('records batch export for selected projects', async () => {
    const projects = buildProjects(3)
    const { store } = await setupProjectsStore({ projects })
    await ensureHydrated()

    store.selectAllVisible()
    await flushStoreEffects()
    const exported = store.recordExportForSelected({ format: 'png' })
    await flushStoreEffects()
    expect(exported).toBe(store.projects.value.length)
    expect(store.exports.value[0]?.preset).toBe('批量导出')
  })

  it('upserts project data for existing entries', async () => {
    const projects = buildProjects(1)
    const { store } = await setupProjectsStore({ projects })
    await ensureHydrated()

    const originalName = store.projects.value[0].name
    const updatedId = store.upsertProject({ id: projects[0].id, name: '全新模板' })
    expect(updatedId).toBe(projects[0].id)
    expect(store.projects.value[0].name).not.toBe(originalName)
    expect(store.projects.value[0].name).toBe('全新模板')
  })

  it('creates new project when id missing', async () => {
    const { store } = await setupProjectsStore({ projects: [] })
    await ensureHydrated()

    const newId = store.upsertProject({ name: '新建日历' })
    expect(typeof newId).toBe('string')
    expect(store.projects.value[0].name).toBe('新建日历')
    expect(store.status.value).toBe('ready')
  })

  it('handles offline error during refresh', async () => {
    const { store } = await setupProjectsStore({ scenario: 'offline' })
    await ensureHydrated()

    expect(store.status.value).toBe('error')
    expect(store.errorType.value).toBe('offline')
  })

  it('touches project to update timestamp', async () => {
    const { store, projects } = await setupProjectsStore()
    await ensureHydrated()

    const target = store.projects.value[0]
    const before = target.updatedAt
    store.touchProject(target.id)
    await flushStoreEffects()
    const refreshed = store.projects.value.find((item) => item.id === target.id)
    expect((refreshed?.updatedAt ?? 0) >= before).toBe(true)
  })

  it('refreshes to empty state when backend returns empty list', async () => {
    const { store } = await setupProjectsStore({ scenario: 'empty' })
    await ensureHydrated()

    expect(store.status.value).toBe('empty')
    expect(store.projects.value).toHaveLength(0)
  })

  it('normalizes stored data and filters invalid records', async () => {
    const rawProjects = [
      {
        id: 'raw-1',
        name: '原始条目',
        description: 123,
        coverColor: null,
        accentColor: undefined,
        category: null,
        size: undefined,
        tags: ['节日', { label: '活动' }],
        createdAt: 'not-a-number',
        updatedAt: undefined,
        exportCount: undefined,
      },
      null,
      { foo: 'bar' },
    ]

    const rawExports = [
      {
        id: 'exp-1',
        projectId: 'raw-1',
        projectName: 999,
        createdAt: 'yesterday',
        format: 'docx',
        preset: undefined,
        size: null,
      },
      { id: null, projectId: null },
    ]

    const { store } = await setupProjectsStore({ projects: [], rawProjects, rawExports })
    await ensureHydrated()

    expect(store.projects.value).toHaveLength(1)
    const normalized = store.projects.value[0]
    expect(normalized.id).toBe('raw-1')
    expect(typeof normalized.createdAt).toBe('number')
    expect(typeof normalized.updatedAt).toBe('number')
    expect(normalized.tags.every((tag) => typeof tag === 'string')).toBe(true)

    expect(store.exports.value).toHaveLength(1)
    const exportRecord = store.exports.value[0]
    expect(exportRecord.projectId).toBe('raw-1')
    expect(exportRecord.format).toBe('png')
    expect(exportRecord.preset).toBe('快速导出')
    expect(typeof exportRecord.createdAt).toBe('number')
  })

  it('gracefully logs storage errors during read and write', async () => {
    const warnMessages: any[][] = []
    const originalWarn = console.warn
    console.warn = (...args: any[]) => {
      warnMessages.push(args)
    }

    try {
      const { store } = await setupProjectsStore({
        projects: [],
        storageBehavior: {
          throwOnRead: (key) => key === 'cc_projects_items_v1' || key === 'cc_projects_exports_v1',
        },
      })

      await ensureHydrated()

      expect(store.projects.value.length).toBeGreaterThan(0)
      expect(
        warnMessages.some((args) =>
          typeof args[0] === 'string' && args[0].includes('failed to read storage')
        )
      ).toBe(true)

      warnMessages.length = 0

      ;(globalThis as any).uni.setStorageSync = () => {
        throw new Error('write-blocked')
      }

      const firstId = store.projects.value[0]?.id
      if (firstId) {
        store.upsertProject({ id: firstId, name: '再次更新' })
        store.recordExport([firstId])
      }

      await flushStoreEffects(2)

      expect(
        warnMessages.some((args) =>
          typeof args[0] === 'string' && args[0].includes('failed to write storage')
        )
      ).toBe(true)
    } finally {
      console.warn = originalWarn
    }
  })

  it('falls back to mocks when storage API is missing and reuses singleton', async () => {
    const { store, module } = await setupProjectsStore({ projects: [] })
    await ensureHydrated()

    const originalUni = (globalThis as any).uni
    try {
      delete (globalThis as any).uni
      const pending = store.refresh()
      store.refresh()
      await pending

      expect(store.status.value).toBe('ready')
      expect(store.projects.value.length).toBeGreaterThan(0)

      ;(globalThis as any).uni = { getStorageSync: undefined, setStorageSync: undefined }

      const noExport = store.recordExport([])
      expect(noExport).toBe(0)
      store.upsertProject({ id: store.projects.value[0]?.id, name: '保底更新' })
      await flushStoreEffects(2)

      const reused = module.useProjectsStore()
      expect(reused).toBe(store)
    } finally {
      (globalThis as any).uni = originalUni
    }
  })

  it('returns mock dataset when stored payload is not an array', async () => {
    const { store } = await setupProjectsStore({
      projects: [],
      rawProjects: { foo: 'bar' },
      rawExports: { nope: true },
    })

    await ensureHydrated()

    expect(store.projects.value.length).toBeGreaterThan(1)
    expect(store.exports.value).toHaveLength(0)
  })
})

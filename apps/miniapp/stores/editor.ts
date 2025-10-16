import { computed, reactive, ref, watch } from 'vue'
import { EditorEngine } from '../pages/editor/core/engine'
import {
  cloneLayer,
  createEmptyScene,
  type LayerBase,
  type Page,
  type Scene
} from '../pages/editor/core/scene'
import type { AlignGuide, DragOverlay } from '../pages/editor/core/renderer'
import {
  createCalendarTheme,
  getThemeByKey,
  listThemes,
  type EditorThemeToken
} from '../pages/editor/core/theme'

const STORAGE_KEY = 'cc_editor_scene_draft_v1'
const AUTOSAVE_INTERVAL = 5000

type LayerKind = 'calendar' | 'text' | 'shape'

type EditorEventKey =
  | 'layer:add'
  | 'layer:update'
  | 'layer:remove'
  | 'selection-change'
  | 'history-change'
  | 'render'

interface EditorEventPayloads {
  'layer:add': LayerBase
  'layer:update': LayerBase
  'layer:remove': { id: string }
  'selection-change': string[]
  'history-change': { canUndo: boolean; canRedo: boolean }
  render: Scene
}

type EventHandler<K extends EditorEventKey> = (payload: EditorEventPayloads[K]) => void

type EditorStore = ReturnType<typeof createEditorStore>

let singleton: EditorStore | null = null

function createEventBus() {
  const listeners = new Map<EditorEventKey, Set<(payload: any) => void>>()
  function ensure<K extends EditorEventKey>(key: K) {
    if (!listeners.has(key)) listeners.set(key, new Set())
    return listeners.get(key) as Set<EventHandler<K>>
  }
  return {
    on<K extends EditorEventKey>(key: K, handler: EventHandler<K>) {
      ensure(key).add(handler as EventHandler<K>)
      return () => {
        ensure(key).delete(handler as EventHandler<K>)
      }
    },
    off<K extends EditorEventKey>(key: K, handler: EventHandler<K>) {
      ensure(key).delete(handler as EventHandler<K>)
    },
    emit<K extends EditorEventKey>(key: K, payload: EditorEventPayloads[K]) {
      ensure(key).forEach((listener) => (listener as EventHandler<K>)(payload))
    },
  }
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function loadDraft(): Scene | null {
  try {
    if (typeof uni === 'undefined' || typeof uni.getStorageSync !== 'function') return null
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return null
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!parsed || typeof parsed !== 'object' || !parsed.scene) return null
    return parsed.scene as Scene
  } catch (error) {
    console.warn('[editor] Failed to load draft', error)
    return null
  }
}

function persistDraft(scene: Scene) {
  try {
    if (typeof uni === 'undefined' || typeof uni.setStorageSync !== 'function') return
    const payload = { scene, updatedAt: Date.now() }
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.warn('[editor] Failed to persist draft', error)
  }
}

function createEditorStore() {
  const stored = loadDraft()
  const initialScene = stored ? deepClone(stored) : createEmptyScene()
  const engine = new EditorEngine(initialScene)
  const renderer = engine.getRenderer()
  const eventBus = createEventBus()
  const availableThemes = listThemes()
  const theme = ref<EditorThemeToken>(availableThemes[0])

  const sceneRef = ref<Scene>(engine.serialize())
  const selectedIds = ref<string[]>([])
  const canUndoRef = ref(engine.canUndo())
  const canRedoRef = ref(engine.canRedo())
  const viewportState = ref(engine.getViewport())
  const viewportBounds = ref({ width: 0, height: 0, dpr: 1 })
  const autosaveState = reactive({ timer: null as ReturnType<typeof setInterval> | null })
  const isDirty = ref(false)
  const lastSavedSnapshot = ref(JSON.stringify(sceneRef.value))
  const insertionCursor = ref(0)

  function startAutosave() {
    if (autosaveState.timer) return
    autosaveState.timer = setInterval(() => {
      saveDraft()
    }, AUTOSAVE_INTERVAL)
  }

  function stopAutosave() {
    if (!autosaveState.timer) return
    clearInterval(autosaveState.timer)
    autosaveState.timer = null
  }

  startAutosave()

  engine.on((event) => {
    switch (event.type) {
      case 'scene:change': {
        sceneRef.value = engine.serialize()
        isDirty.value = JSON.stringify(sceneRef.value) !== lastSavedSnapshot.value
        eventBus.emit('render', sceneRef.value)
        break
      }
      case 'selection:change': {
        selectedIds.value = [...event.selection]
        eventBus.emit('selection-change', selectedIds.value)
        break
      }
      case 'history:change': {
        canUndoRef.value = event.canUndo
        canRedoRef.value = event.canRedo
        eventBus.emit('history-change', { canUndo: event.canUndo, canRedo: event.canRedo })
        break
      }
      case 'viewport:change': {
        viewportState.value = { ...event.viewport }
        break
      }
    }
  })

  function getActivePage(): Page | null {
    const page = sceneRef.value.project.pages[sceneRef.value.activePageIndex]
    return page ?? null
  }

  const activePage = computed(() => getActivePage())
  const layerCount = computed(() => activePage.value?.layers.length ?? 0)
  const activeLayer = computed<LayerBase | null>(() => {
    const page = activePage.value
    if (!page) return null
    const id = selectedIds.value[selectedIds.value.length - 1]
    if (!id) return null
    return page.layers.find((layer) => layer.id === id) ?? null
  })

  const activeTextLayer = computed(() => (activeLayer.value?.type === 'text' ? activeLayer.value : null))
  const activeShapeLayer = computed(() => (activeLayer.value?.type === 'shape' ? activeLayer.value : null))
  const activeCalendarLayer = computed(() => (activeLayer.value?.type === 'calendar' ? activeLayer.value : null))

  const canUndo = computed(() => canUndoRef.value)
  const canRedo = computed(() => canRedoRef.value)
  const hasUnsavedChanges = computed(() => isDirty.value)

  function ensurePageBounds(width: number, height: number) {
    const page = getActivePage()
    if (!page) return
    page.width = width
    page.height = height
  }

  function attachContext(ctx: CanvasRenderingContext2D, options: { width: number; height: number; dpr: number }) {
    engine.attachContext(ctx)
    fitViewport(options.width, options.height, options.dpr)
  }

  function fitViewport(width?: number, height?: number, dpr?: number) {
    if (typeof width === 'number') viewportBounds.value.width = width
    if (typeof height === 'number') viewportBounds.value.height = height
    if (typeof dpr === 'number') viewportBounds.value.dpr = dpr
    const page = getActivePage()
    const bounds = viewportBounds.value
    if (!page || !bounds.width || !bounds.height) return
    const scale = Math.min(bounds.width / page.width, bounds.height / page.height) || 1
    const worldWidth = bounds.width / scale
    const worldHeight = bounds.height / scale
    const tx = (worldWidth - page.width) / 2
    const ty = (worldHeight - page.height) / 2
    engine.updateViewport({ scale, tx, ty, dpr: bounds.dpr })
  }

  function resizeViewport(width: number, height: number, dpr: number) {
    fitViewport(width, height, dpr)
  }

  function markSaved() {
    lastSavedSnapshot.value = JSON.stringify(sceneRef.value)
    isDirty.value = false
  }

  function saveDraft(force = false) {
    if (!force && !isDirty.value) return
    persistDraft(deepClone(sceneRef.value))
    markSaved()
  }

  function clearDraft() {
    if (typeof uni === 'undefined' || typeof uni.removeStorageSync !== 'function') return
    uni.removeStorageSync(STORAGE_KEY)
    markSaved()
  }

  function addLayer(kind: LayerKind) {
    const page = getActivePage()
    if (!page) return null
    const baseOffset = (insertionCursor.value++ % 5) * 18
    let frame: Partial<LayerBase['frame']> = {}
    let props: Record<string, any> = {}
    switch (kind) {
      case 'calendar': {
        const width = page.width * 0.9
        const height = page.height * 0.7
        frame = {
          x: Math.max(0, (page.width - width) / 2 + baseOffset),
          y: Math.max(0, (page.height - height) / 2 + baseOffset),
          w: width,
          h: height,
        }
        props = {
          theme: createCalendarTheme(theme.value),
        }
        break
      }
      case 'text': {
        const width = page.width * 0.6
        const activeProps = { fontSize: 28, lineHeight: 1.4 }
        const height = activeProps.fontSize * activeProps.lineHeight * 2.4
        frame = {
          x: Math.max(0, (page.width - width) / 2 + baseOffset),
          y: Math.max(0, page.height * 0.3 + baseOffset),
          w: width,
          h: height,
        }
        props = {
          text: '双击编辑',
          fontSize: 28,
          lineHeight: 1.4,
          align: 'center',
          color: theme.value.primary,
        }
        break
      }
      case 'shape': {
        const width = page.width * 0.32
        const height = width * 0.62
        frame = {
          x: Math.max(0, (page.width - width) / 2 + baseOffset),
          y: Math.max(0, (page.height - height) * 0.65 + baseOffset),
          w: width,
          h: height,
        }
        props = {
          stroke: theme.value.primary,
          fill: theme.value.surfaceMuted,
        }
        break
      }
    }
    const layer = engine.addLayer(kind, props, frame)
    if (layer) {
      eventBus.emit('layer:add', cloneLayer(layer))
      return layer
    }
    return null
  }

  function updateLayer(id: string, payload: { frame?: Partial<LayerBase['frame']>; props?: Record<string, any> }) {
    let updated = false
    if (payload.frame) {
      updated = engine.updateLayerFrame(id, payload.frame) || updated
    }
    if (payload.props) {
      updated = engine.updateLayerProps(id, payload.props) || updated
    }
    if (updated) {
      const page = getActivePage()
      const layer = page?.layers.find((item) => item.id === id)
      if (layer) eventBus.emit('layer:update', cloneLayer(layer))
    }
    return updated
  }

  function removeLayer(id: string) {
    const removed = engine.removeLayer(id)
    if (removed) {
      eventBus.emit('layer:remove', { id })
    }
    return removed
  }

  function selectLayer(id: string | null) {
    if (!id) {
      engine.clearSelection()
      return
    }
    engine.select(id)
  }

  function addSelection(id: string) {
    engine.select(id, true)
  }

  function clearSelection() {
    engine.clearSelection()
  }

  function undo() {
    const result = engine.undo()
    if (result) saveDraft()
    return result
  }

  function redo() {
    const result = engine.redo()
    if (result) saveDraft()
    return result
  }

  function setGuides(guides: AlignGuide[]) {
    engine.setGuides(guides)
  }

  function clearGuides() {
    engine.clearGuides()
  }

  function setDragOverlay(overlay: DragOverlay | null) {
    engine.setDragOverlay(overlay)
  }

  function hitTest(sx: number, sy: number) {
    return renderer.hitTest(sx, sy)
  }

  function exportScene() {
    saveDraft(true)
    return deepClone(sceneRef.value)
  }

  function setTheme(key: string) {
    theme.value = getThemeByKey(key)
  }

  function applyThemeToExisting() {
    const page = getActivePage()
    if (!page) return
    let mutated = false
    page.layers.forEach((layer) => {
      if (layer.type === 'text') {
        mutated = engine.updateLayerProps(layer.id, { color: theme.value.primary }) || mutated
      }
      if (layer.type === 'shape') {
        mutated =
          engine.updateLayerProps(layer.id, {
            stroke: theme.value.primary,
            fill: theme.value.surfaceMuted,
          }) || mutated
      }
      if (layer.type === 'calendar') {
        mutated = engine.updateLayerProps(layer.id, { theme: createCalendarTheme(theme.value) }) || mutated
      }
    })
    if (mutated) renderer.invalidate()
  }

  watch(
    () => [sceneRef.value.project.pages.length, sceneRef.value.activePageIndex],
    () => {
      fitViewport()
    }
  )

  return {
    scene: sceneRef,
    renderer,
    eventBus,
    selectedIds,
    activePage,
    activeLayer,
    activeTextLayer,
    activeShapeLayer,
    activeCalendarLayer,
    layerCount,
    canUndo,
    canRedo,
    hasUnsavedChanges,
    viewport: viewportState,
    attachContext,
    resizeViewport,
    ensurePageBounds,
    addLayer,
    updateLayer,
    removeLayer,
    selectLayer,
    addSelection,
    clearSelection,
    undo,
    redo,
    setGuides,
    clearGuides,
    setDragOverlay,
    hitTest,
    saveDraft,
    clearDraft,
    exportScene,
    stopAutosave,
    theme,
    themes: availableThemes,
    setTheme,
    applyThemeToExisting,
  }
}

export function useEditorStore() {
  if (!singleton) singleton = createEditorStore()
  return singleton
}

export type { EditorEventKey, EditorEventPayloads, LayerKind }

import { computed, ref } from 'vue'
import { EditorEngine } from '../pages/editor/core/engine'
import { createEmptyScene, type LayerBase, type Page, type Scene } from '../pages/editor/core/scene'

const STORAGE_KEY = 'cc_editor_scene_state_v2'
type EditorPanelSide = 'left' | 'right'

type LeftPanelKey = 'materials' | 'text' | 'photos'
type RightPanelKey = 'properties' | 'layers' | 'page'
type ToolbarKey = 'undo' | 'redo' | 'group' | 'ungroup' | 'align' | 'distribute'

type EditorStore = ReturnType<typeof createEditorStore>

interface EditorUIState {
  activePageId: string | null
  activeLayerId: string | null
}

interface StoredState {
  scene: Scene
  uiState: EditorUIState
}

const LEFT_PANEL_TABS: { key: LeftPanelKey; label: string; description: string }[] = [
  { key: 'materials', label: '素材中心', description: '贴纸、形状、插画等' },
  { key: 'text', label: '文字模板', description: '标题、段落样式' },
  { key: 'photos', label: '图库', description: '示例图库占位' },
]

const RIGHT_PANEL_TABS: { key: RightPanelKey; label: string; description: string }[] = [
  { key: 'properties', label: '元素属性', description: '尺寸、位置、透明度' },
  { key: 'layers', label: '图层', description: '图层顺序与锁定' },
  { key: 'page', label: '页面设置', description: '尺寸与背景' },
]

const TOOLBAR_ACTIONS: { key: ToolbarKey; label: string }[] = [
  { key: 'undo', label: '撤销' },
  { key: 'redo', label: '重做' },
  { key: 'group', label: '组合' },
  { key: 'ungroup', label: '取消组合' },
  { key: 'align', label: '对齐' },
  { key: 'distribute', label: '分布' },
]

let singleton: EditorStore | null = null

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function loadStoredState(): StoredState | null {
  try {
    if (typeof uni === 'undefined' || typeof uni.getStorageSync !== 'function') return null
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return null
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!data || typeof data !== 'object') return null
    if (!data.scene || !data.uiState) return null
    return { scene: data.scene as Scene, uiState: data.uiState as EditorUIState }
  } catch (error) {
    console.warn('[editor] Failed to load stored scene', error)
    return null
  }
}

function persistState(scene: Scene, uiState: EditorUIState) {
  try {
    if (typeof uni === 'undefined' || typeof uni.setStorageSync !== 'function') return
    const payload: StoredState = { scene, uiState }
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.warn('[editor] Failed to persist scene', error)
  }
}

function normalizeUiState(scene: Scene, uiState: EditorUIState): EditorUIState {
  const normalized: EditorUIState = { ...uiState }
  const page = scene.project.pages.find((item) => item.id === normalized.activePageId) ?? scene.project.pages[0]
  normalized.activePageId = page?.id ?? null
  if (!page) {
    normalized.activeLayerId = null
    return normalized
  }
  const hasLayer = page.layers.some((layer) => layer.id === normalized.activeLayerId)
  if (!hasLayer) normalized.activeLayerId = page.layers[page.layers.length - 1]?.id ?? null
  return normalized
}

export function useEditorStore() {
  if (singleton) return singleton
  singleton = createEditorStore()
  return singleton
}

function createEditorStore() {
  const stored = loadStoredState()
  const initialScene = stored ? deepClone(stored.scene) : createEmptyScene()
  const initialUiState = stored
    ? normalizeUiState(initialScene, deepClone(stored.uiState))
    : {
        activePageId: initialScene.project.pages[0]?.id ?? null,
        activeLayerId: null,
      }

  const engine = new EditorEngine(deepClone(initialScene))
  const sceneRef = ref<Scene>(engine.serialize())
  const uiState = ref<EditorUIState>(initialUiState)

  const leftActiveTab = ref<LeftPanelKey>('materials')
  const rightActiveTab = ref<RightPanelKey>('properties')
  const isLeftExpanded = ref(true)
  const isRightExpanded = ref(true)
  const zoom = ref(100)
  const activeToolbarKey = ref<ToolbarKey | null>(null)
  const canUndoRef = ref(false)
  const canRedoRef = ref(false)

  const leftTabs = LEFT_PANEL_TABS
  const rightTabs = RIGHT_PANEL_TABS
  const toolbarActions = TOOLBAR_ACTIONS

  engine.on((event) => {
    if (event.type === 'scene:change') {
      sceneRef.value = engine.serialize()
      uiState.value = normalizeUiState(sceneRef.value, uiState.value)
      persistState(sceneRef.value, uiState.value)
    }
    if (event.type === 'history:change') {
      canUndoRef.value = event.canUndo
      canRedoRef.value = event.canRedo
    }
    if (event.type === 'selection:change') {
      const next = event.selection[event.selection.length - 1] ?? null
      if (uiState.value.activeLayerId !== next) {
        uiState.value = { ...uiState.value, activeLayerId: next }
        persistState(sceneRef.value, uiState.value)
      }
    }
  })
  canUndoRef.value = engine.canUndo()
  canRedoRef.value = engine.canRedo()

  function getActivePage(): Page | null {
    const pageId = uiState.value.activePageId
    return sceneRef.value.project.pages.find((page) => page.id === pageId) ?? sceneRef.value.project.pages[0] ?? null
  }

  const activePage = computed(() => getActivePage())
  const activeLayer = computed<LayerBase | null>(() => {
    const page = getActivePage()
    if (!page) return null
    return page.layers.find((layer) => layer.id === uiState.value.activeLayerId) ?? null
  })
  const layerCount = computed(() => activePage.value?.layers.length ?? 0)
  const zoomLabel = computed(() => `${zoom.value}%`)
  const leftActiveMeta = computed(() => leftTabs.find((tab) => tab.key === leftActiveTab.value) ?? leftTabs[0])
  const rightActiveMeta = computed(() => rightTabs.find((tab) => tab.key === rightActiveTab.value) ?? rightTabs[0])
  const canUndo = computed(() => canUndoRef.value)
  const canRedo = computed(() => canRedoRef.value)

  function setLeftTab(key: LeftPanelKey) {
    leftActiveTab.value = key
    isLeftExpanded.value = true
  }

  function setRightTab(key: RightPanelKey) {
    rightActiveTab.value = key
    isRightExpanded.value = true
  }

  function togglePanel(side: EditorPanelSide) {
    if (side === 'left') isLeftExpanded.value = !isLeftExpanded.value
    else isRightExpanded.value = !isRightExpanded.value
  }

  function normalizeZoom(value: number) {
    const clamped = Math.max(25, Math.min(240, Math.round(value)))
    return clamped % 5 === 0 ? clamped : Math.round(clamped / 5) * 5
  }

  function setZoom(value: number) {
    zoom.value = normalizeZoom(value)
  }

  function zoomIn() {
    setZoom(zoom.value + 10)
  }

  function zoomOut() {
    setZoom(zoom.value - 10)
  }

  function resetZoom() {
    setZoom(100)
  }

  function toggleToolbarAction(key: ToolbarKey) {
    activeToolbarKey.value = activeToolbarKey.value === key ? null : key
  }

  function ensureActivePage() {
    const page = getActivePage()
    if (!page) {
      if (sceneRef.value.project.pages.length === 0) {
        const scene = createEmptyScene()
        sceneRef.value = scene
        engine.restore(scene)
      }
      uiState.value = normalizeUiState(sceneRef.value, uiState.value)
    }
    return getActivePage()
  }

  function addMaterialLayer(sourceId: number) {
    const page = ensureActivePage()
    if (!page) return null
    const layer = engine.addLayer('material', {
      sourceId,
      variant: `mock-${(page.layers.length % 5) + 1}`,
      tone: ['柔和', '活力', '冷静'][sourceId % 3],
    })
    uiState.value = { ...uiState.value, activeLayerId: layer.id }
    persistState(sceneRef.value, uiState.value)
    return layer
  }

  function updateActiveLayerProps(patch: Record<string, any>) {
    const layer = activeLayer.value
    if (!layer) return false
    engine.updateLayerProps(layer.id, patch)
    return true
  }

  function removeActiveLayer() {
    const layer = activeLayer.value
    if (!layer) return false
    const result = engine.removeLayer(layer.id)
    if (result) {
      uiState.value = normalizeUiState(sceneRef.value, uiState.value)
      persistState(sceneRef.value, uiState.value)
    }
    return result
  }

  function undo() {
    const done = engine.undo()
    if (done) persistState(sceneRef.value, uiState.value)
    return done
  }

  function redo() {
    const done = engine.redo()
    if (done) persistState(sceneRef.value, uiState.value)
    return done
  }

  function setActiveLayer(id: string | null) {
    if (!id) {
      engine.clearSelection()
      uiState.value = { ...uiState.value, activeLayerId: null }
      persistState(sceneRef.value, uiState.value)
      return
    }
    const page = getActivePage()
    const exists = page?.layers.some((layer) => layer.id === id)
    if (!exists) return
    engine.select(id)
    uiState.value = { ...uiState.value, activeLayerId: id }
    persistState(sceneRef.value, uiState.value)
  }

  return {
    scene: sceneRef,
    uiState,
    leftTabs,
    rightTabs,
    toolbarActions,
    leftActiveTab,
    rightActiveTab,
    isLeftExpanded,
    isRightExpanded,
    zoom,
    zoomLabel,
    leftActiveMeta,
    rightActiveMeta,
    activeToolbarKey,
    activePage,
    activeLayer,
    layerCount,
    canUndo,
    canRedo,
    setLeftTab,
    setRightTab,
    togglePanel,
    toggleToolbarAction,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    addMaterialLayer,
    updateActiveLayerProps,
    removeActiveLayer,
    undo,
    redo,
    setActiveLayer,
  }
}

export type { EditorPanelSide, LeftPanelKey, RightPanelKey, ToolbarKey }

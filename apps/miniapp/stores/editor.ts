import { computed, ref } from 'vue'

type SceneLayerType = 'material' | 'text' | 'image'

interface SceneLayer {
  id: string
  type: SceneLayerType
  name: string
  props: Record<string, any>
  createdAt: number
  updatedAt: number
}

interface ScenePage {
  id: string
  name: string
  width: number
  height: number
  layers: SceneLayer[]
}

interface SceneDocument {
  id: string
  title: string
  pages: ScenePage[]
  updatedAt: number
}

interface EditorUIState {
  activePageId: string | null
  activeLayerId: string | null
}

interface SceneSnapshot {
  scene: SceneDocument
  uiState: EditorUIState
  timestamp: number
}

const STORAGE_KEY = 'cc_editor_scene_state_v1'
const HISTORY_LIMIT = 50

type EditorPanelSide = 'left' | 'right'

const LEFT_PANEL_TABS = [
  { key: 'materials', label: '素材中心', description: '贴纸、形状、插画等' },
  { key: 'text', label: '文字模板', description: '标题、段落样式' },
  { key: 'photos', label: '图库', description: '示例图库占位' },
] as const

const RIGHT_PANEL_TABS = [
  { key: 'properties', label: '元素属性', description: '尺寸、位置、透明度' },
  { key: 'layers', label: '图层', description: '图层顺序与锁定' },
  { key: 'page', label: '页面设置', description: '尺寸与背景' },
] as const

const TOOLBAR_ACTIONS = [
  { key: 'undo', label: '撤销' },
  { key: 'redo', label: '重做' },
  { key: 'group', label: '组合' },
  { key: 'ungroup', label: '取消组合' },
  { key: 'align', label: '对齐' },
  { key: 'distribute', label: '分布' },
] as const

type LeftPanelKey = (typeof LEFT_PANEL_TABS)[number]['key']
type RightPanelKey = (typeof RIGHT_PANEL_TABS)[number]['key']
type ToolbarKey = (typeof TOOLBAR_ACTIONS)[number]['key']

type EditorStore = ReturnType<typeof createEditorStore>

let singleton: EditorStore | null = null

function createLayerId() {
  return `layer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function createDefaultScene(): SceneDocument {
  const now = Date.now()
  return {
    id: 'scene_default',
    title: '空白画布',
    pages: [
      {
        id: 'page_1',
        name: '页面 1',
        width: 1080,
        height: 1920,
        layers: [],
      },
    ],
    updatedAt: now,
  }
}

function createDefaultUiState(scene: SceneDocument): EditorUIState {
  const firstPage = scene.pages[0]
  return {
    activePageId: firstPage?.id ?? null,
    activeLayerId: firstPage?.layers[0]?.id ?? null,
  }
}

function loadStoredState(): { scene: SceneDocument; uiState: EditorUIState } | null {
  try {
    if (typeof uni === 'undefined' || typeof uni.getStorageSync !== 'function') {
      return null
    }
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return null
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!data || typeof data !== 'object') return null
    if (!data.scene || !data.uiState) return null
    return {
      scene: data.scene as SceneDocument,
      uiState: data.uiState as EditorUIState,
    }
  } catch (error) {
    console.warn('[editor] Failed to load stored scene', error)
    return null
  }
}

function normalizeUiState(scene: SceneDocument, uiState?: EditorUIState): EditorUIState {
  const normalized: EditorUIState = {
    activePageId: uiState?.activePageId ?? null,
    activeLayerId: uiState?.activeLayerId ?? null,
  }
  const fallbackPage = scene.pages[0]
  const activePage = scene.pages.find((page) => page.id === normalized.activePageId) ?? fallbackPage
  normalized.activePageId = activePage?.id ?? null

  if (!activePage) {
    normalized.activeLayerId = null
    return normalized
  }

  const hasActiveLayer = activePage.layers.some((layer) => layer.id === normalized.activeLayerId)
  if (!hasActiveLayer) {
    normalized.activeLayerId = activePage.layers[activePage.layers.length - 1]?.id ?? null
  }

  return normalized
}

export function useEditorStore() {
  if (singleton) return singleton
  singleton = createEditorStore()
  return singleton
}

function createEditorStore() {
  const stored = loadStoredState()
  const initialScene = stored ? deepClone(stored.scene) : createDefaultScene()
  const scene = ref<SceneDocument>(initialScene)
  const initialUiState = stored ? deepClone(stored.uiState) : createDefaultUiState(initialScene)
  const uiState = ref<EditorUIState>(normalizeUiState(scene.value, initialUiState))
  const history = ref<SceneSnapshot[]>([])
  const historyIndex = ref(-1)

  const leftActiveTab = ref<LeftPanelKey>('materials')
  const rightActiveTab = ref<RightPanelKey>('properties')
  const isLeftExpanded = ref(true)
  const isRightExpanded = ref(true)
  const zoom = ref(100)
  const activeToolbarKey = ref<ToolbarKey | null>(null)

  const leftTabs = LEFT_PANEL_TABS
  const rightTabs = RIGHT_PANEL_TABS
  const toolbarActions = TOOLBAR_ACTIONS

  function persistState() {
    try {
      if (typeof uni === 'undefined' || typeof uni.setStorageSync !== 'function') return
      const payload = { scene: scene.value, uiState: uiState.value }
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(payload))
    } catch (error) {
      console.warn('[editor] Failed to persist scene', error)
    }
  }

  function snapshotState(): SceneSnapshot {
    return {
      scene: deepClone(scene.value),
      uiState: deepClone(uiState.value),
      timestamp: Date.now(),
    }
  }

  function ensureStateConsistency() {
    uiState.value = normalizeUiState(scene.value, uiState.value)
  }

  function resetHistory() {
    history.value = [snapshotState()]
    historyIndex.value = 0
    persistState()
  }

  function commitHistory() {
    ensureStateConsistency()
    const snapshot = snapshotState()
    if (historyIndex.value < history.value.length - 1) {
      history.value.splice(historyIndex.value + 1)
    }
    history.value.push(snapshot)
    if (history.value.length > HISTORY_LIMIT) {
      const overflow = history.value.length - HISTORY_LIMIT
      history.value.splice(0, overflow)
    }
    historyIndex.value = history.value.length - 1
    persistState()
  }

  function restoreFromSnapshot(index: number) {
    const target = history.value[index]
    if (!target) return false
    scene.value = deepClone(target.scene)
    uiState.value = normalizeUiState(scene.value, target.uiState)
    persistState()
    return true
  }

  function undo() {
    if (historyIndex.value <= 0) return false
    historyIndex.value -= 1
    return restoreFromSnapshot(historyIndex.value)
  }

  function redo() {
    if (historyIndex.value >= history.value.length - 1) return false
    historyIndex.value += 1
    return restoreFromSnapshot(historyIndex.value)
  }

  function setActiveLayer(layerId: string | null) {
    uiState.value.activeLayerId = layerId
    ensureStateConsistency()
    persistState()
  }

  function addMaterialLayer(sourceId: number) {
    const page =
      scene.value.pages.find((item) => item.id === uiState.value.activePageId) || scene.value.pages[0]
    if (!page) return null
    const now = Date.now()
    const layer: SceneLayer = {
      id: createLayerId(),
      type: 'material',
      name: `素材 ${sourceId}`,
      props: {
        sourceId,
        tone: ['柔和', '活力', '冷静'][now % 3],
        variant: `mock-${(page.layers.length % 5) + 1}`,
      },
      createdAt: now,
      updatedAt: now,
    }
    page.layers.push(layer)
    scene.value.updatedAt = now
    uiState.value.activeLayerId = layer.id
    commitHistory()
    return layer
  }

  function updateActiveLayerProps(patch: Record<string, any>) {
    const page =
      scene.value.pages.find((item) => item.id === uiState.value.activePageId) || scene.value.pages[0]
    if (!page) return false
    const layer = page.layers.find((item) => item.id === uiState.value.activeLayerId)
    if (!layer) return false
    layer.props = { ...layer.props, ...patch }
    layer.updatedAt = Date.now()
    scene.value.updatedAt = layer.updatedAt
    commitHistory()
    return true
  }

  function removeActiveLayer() {
    const page =
      scene.value.pages.find((item) => item.id === uiState.value.activePageId) || scene.value.pages[0]
    if (!page || !uiState.value.activeLayerId) return false
    const index = page.layers.findIndex((item) => item.id === uiState.value.activeLayerId)
    if (index === -1) return false
    page.layers.splice(index, 1)
    const fallback = page.layers[index] ?? page.layers[index - 1] ?? page.layers[page.layers.length - 1]
    uiState.value.activeLayerId = fallback?.id ?? null
    scene.value.updatedAt = Date.now()
    commitHistory()
    return true
  }

  ensureStateConsistency()
  resetHistory()

  const zoomLabel = computed(() => `${zoom.value}%`)
  const leftActiveMeta = computed(() =>
    leftTabs.find((tab) => tab.key === leftActiveTab.value) ?? leftTabs[0]
  )
  const rightActiveMeta = computed(() =>
    rightTabs.find((tab) => tab.key === rightActiveTab.value) ?? rightTabs[0]
  )
  const activePage = computed(() =>
    scene.value.pages.find((page) => page.id === uiState.value.activePageId) ?? scene.value.pages[0] ?? null
  )
  const activeLayer = computed(() =>
    activePage.value?.layers.find((layer) => layer.id === uiState.value.activeLayerId) ?? null
  )
  const layerCount = computed(() => activePage.value?.layers.length ?? 0)
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

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

  function toggleToolbarAction(key: ToolbarKey) {
    activeToolbarKey.value = activeToolbarKey.value === key ? null : key
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

  return {
    scene,
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
    undo,
    redo,
    addMaterialLayer,
    updateActiveLayerProps,
    removeActiveLayer,
    setActiveLayer,
  }
}

function normalizeZoom(value: number) {
  const clamped = Math.max(25, Math.min(240, Math.round(value)))
  if (clamped % 5 === 0) return clamped
  return Math.round(clamped / 5) * 5
}

export type { EditorPanelSide, LeftPanelKey, RightPanelKey, ToolbarKey }

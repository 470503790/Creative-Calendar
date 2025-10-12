import { computed, ref } from 'vue'

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

export function useEditorStore() {
  if (singleton) return singleton
  singleton = createEditorStore()
  return singleton
}

function createEditorStore() {
  const leftActiveTab = ref<LeftPanelKey>('materials')
  const rightActiveTab = ref<RightPanelKey>('properties')
  const isLeftExpanded = ref(true)
  const isRightExpanded = ref(true)
  const zoom = ref(100)
  const activeToolbarKey = ref<ToolbarKey | null>(null)

  const leftTabs = LEFT_PANEL_TABS
  const rightTabs = RIGHT_PANEL_TABS
  const toolbarActions = TOOLBAR_ACTIONS

  const zoomLabel = computed(() => `${zoom.value}%`)
  const leftActiveMeta = computed(() =>
    leftTabs.find((tab) => tab.key === leftActiveTab.value) ?? leftTabs[0]
  )
  const rightActiveMeta = computed(() =>
    rightTabs.find((tab) => tab.key === rightActiveTab.value) ?? rightTabs[0]
  )

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
    setLeftTab,
    setRightTab,
    togglePanel,
    toggleToolbarAction,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
  }
}

function normalizeZoom(value: number) {
  const clamped = Math.max(25, Math.min(240, Math.round(value)))
  if (clamped % 5 === 0) return clamped
  return Math.round(clamped / 5) * 5
}

export type { EditorPanelSide, LeftPanelKey, RightPanelKey, ToolbarKey }

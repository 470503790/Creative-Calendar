<template>
  <view class="editor-page">
    <TopBar
      class="page-top-bar"
      title="编辑"
      subtitle="创意日历"
      :actions="topBarActions"
      @action="handleTopBarAction"
    />

    <view class="canvas-section">
      <view class="canvas-chip">{{ monthChip }}</view>
      <view class="canvas-card">
        <view class="canvas-viewport" ref="viewportRef">
          <view class="canvas-stage" :style="{ paddingBottom: canvasPadding }">
            <canvas
              id="editor-canvas"
              class="editor-canvas"
              type="2d"
              disable-scroll="true"
              @touchstart="handlePointerStart"
              @touchmove.stop.prevent="handlePointerMove"
              @touchend="handlePointerEnd"
              @touchcancel="handlePointerCancel"
              @mousedown.prevent="handlePointerStart"
              @mousemove.prevent="handlePointerMove"
              @mouseup.prevent="handlePointerEnd"
              @mouseleave="handlePointerCancel"
            ></canvas>
            <textarea
              v-if="textEditor.visible"
              ref="textareaRef"
              class="text-editor"
              v-model="textEditor.value"
              :style="textEditor.style"
              auto-height
              @blur="commitText"
              @confirm="commitText"
            />
          </view>
        </view>
      </view>
    </view>

    <view class="tool-panel" :class="{ 'is-editing': textEditor.visible }">
      <view class="tool-tabs">
        <view
          v-for="tab in toolTabs"
          :key="tab.key"
          class="tool-tab"
          :class="{ active: tab.key === activeTab }"
          @tap="setActiveTab(tab.key)"
        >
          {{ tab.label }}
        </view>
      </view>
      <scroll-view scroll-y class="tool-content">
        <view v-if="activeTab === 'elements'" class="tool-pane">
          <ElementsTab />
        </view>
        <view v-else-if="activeTab === 'text'" class="tool-pane">
          <TextTab />
        </view>
        <view v-else-if="activeTab === 'theme'" class="tool-pane">
          <ThemeTab />
        </view>
        <view v-else class="tool-pane">
          <ExportFull />
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch
} from 'vue'
import TopBar from '../../components/editor/TopBar.vue'
import ElementsTab from './tabs/Elements.vue'
import TextTab from './tabs/Text.vue'
import ThemeTab from './tabs/Theme.vue'
import ExportFull from './sheets/ExportFull.vue'
import { useEditorStore } from '../../stores/editor'
import type { Rect } from './core/scene'
import type { AlignGuide } from './core/renderer'

type ToolTabKey = 'elements' | 'text' | 'theme' | 'export'
type TopBarActionKey = 'undo' | 'redo' | 'preview' | 'export'

type PointerEventLike = TouchEvent & MouseEvent

const store = useEditorStore()

const toolTabs: { key: ToolTabKey; label: string }[] = [
  { key: 'elements', label: '元素' },
  { key: 'text', label: '文本' },
  { key: 'theme', label: '主题' },
  { key: 'export', label: '导出' },
]

const activeTab = ref<ToolTabKey>('elements')

const viewportRef = ref<HTMLElement | null>(null)
const canvasNode = ref<any>(null)
const textareaRef = ref()
const dpr = ref(1)
const canvasPadding = computed(() => `${canvasRatio.value * 100}%`)

const pointerState = reactive({
  layerId: '',
  dragging: false,
  moved: false,
  startScreen: { x: 0, y: 0 },
  startFrame: null as Rect | null,
  lastFrame: null as Rect | null,
  lastTapTime: 0,
  lastTapId: '',
  longPressTimer: null as ReturnType<typeof setTimeout> | null,
})

const textEditor = reactive({
  visible: false,
  layerId: '',
  value: '',
  style: { left: '0px', top: '0px', width: '0px', height: '0px' },
})

const monthChip = computed(() => {
  const layer = store.activeCalendarLayer.value
  const now = new Date()
  const year = layer?.props?.year ?? now.getFullYear()
  const month = layer?.props?.month ?? now.getMonth() + 1
  return `${year}·${month.toString().padStart(2, '0')}`
})

const topBarActions = computed(() => [
  { key: 'undo', label: '撤销', disabled: !store.canUndo.value },
  { key: 'redo', label: '重做', disabled: !store.canRedo.value },
  { key: 'preview', label: '预览' },
  { key: 'export', label: '导出' },
])

const canvasRatio = computed(() => {
  const page = store.activePage.value
  if (!page) return 1.6
  return page.height / page.width
})

function setActiveTab(key: ToolTabKey) {
  activeTab.value = key
}

function handleTopBarAction(action: TopBarActionKey) {
  switch (action) {
    case 'undo':
      if (!store.undo()) uni.showToast({ title: '没有可撤销的操作', icon: 'none' })
      break
    case 'redo':
      if (!store.redo()) uni.showToast({ title: '没有可重做的操作', icon: 'none' })
      break
    case 'preview':
      uni.showToast({ title: '预览功能后续开放', icon: 'none' })
      break
    case 'export':
      setActiveTab('export')
      break
  }
}

function getCanvasBounds() {
  if (process.env.UNI_PLATFORM === 'h5') {
    const canvas = document.getElementById('editor-canvas')
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      return { left: rect.left, top: rect.top }
    }
  }
  return { left: 0, top: 0 }
}

function getPointerPoint(event: PointerEventLike) {
  if ('touches' in event && event.touches?.length) {
    const touch = event.touches[0]
    if (typeof touch.x === 'number' && typeof touch.y === 'number') {
      return { x: touch.x, y: touch.y }
    }
    const bounds = getCanvasBounds()
    return { x: touch.clientX - bounds.left, y: touch.clientY - bounds.top }
  }
  if ('changedTouches' in event && event.changedTouches?.length) {
    const touch = event.changedTouches[0]
    if (typeof touch.x === 'number' && typeof touch.y === 'number') {
      return { x: touch.x, y: touch.y }
    }
    const bounds = getCanvasBounds()
    return { x: touch.clientX - bounds.left, y: touch.clientY - bounds.top }
  }
  const anyEvent = event as unknown as MouseEvent
  if (typeof anyEvent.offsetX === 'number' && typeof anyEvent.offsetY === 'number') {
    return { x: anyEvent.offsetX, y: anyEvent.offsetY }
  }
  const bounds = getCanvasBounds()
  return { x: anyEvent.clientX - bounds.left, y: anyEvent.clientY - bounds.top }
}

function cancelLongPress() {
  if (pointerState.longPressTimer) {
    clearTimeout(pointerState.longPressTimer)
    pointerState.longPressTimer = null
  }
}

function handlePointerStart(event: PointerEventLike) {
  const point = getPointerPoint(event)
  pointerState.moved = false
  pointerState.dragging = false
  pointerState.startScreen = { x: point.x, y: point.y }
  pointerState.lastFrame = null

  const viewport = store.viewport.value
  const hitId = store.hitTest(point.x * viewport.dpr, point.y * viewport.dpr)
  pointerState.layerId = hitId ?? ''
  if (hitId) {
    store.selectLayer(hitId)
    const page = store.activePage.value
    const layer = page?.layers.find((item) => item.id === hitId)
    pointerState.startFrame = layer ? { ...layer.frame } : null
    cancelLongPress()
    pointerState.longPressTimer = setTimeout(() => {
      if (!pointerState.moved) openTextEditor(hitId)
    }, 320)
  } else {
    pointerState.startFrame = null
    cancelLongPress()
  }
}

function handlePointerMove(event: PointerEventLike) {
  if (!pointerState.layerId || !pointerState.startFrame) return
  const point = getPointerPoint(event)
  const viewport = store.viewport.value
  const startSx = pointerState.startScreen.x * viewport.dpr
  const startSy = pointerState.startScreen.y * viewport.dpr
  const currentSx = point.x * viewport.dpr
  const currentSy = point.y * viewport.dpr
  const invScale = 1 / (viewport.scale * viewport.dpr)
  let dx = (currentSx - startSx) * invScale
  let dy = (currentSy - startSy) * invScale

  if (!pointerState.dragging) {
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance > 2) {
      pointerState.dragging = true
      pointerState.moved = true
      cancelLongPress()
    }
  }
  if (!pointerState.dragging) return

  const frame = pointerState.startFrame
  const page = store.activePage.value
  if (!page) return

  let nextX = frame.x + dx
  let nextY = frame.y + dy
  const guides: AlignGuide[] = []
  const tolerance = 6 / viewport.scale

  const snap = (value: number, target: number) => {
    if (Math.abs(value - target) <= tolerance) return target
    return value
  }

  const centerX = nextX + frame.w / 2
  const centerY = nextY + frame.h / 2
  const pageCenterX = page.width / 2
  const pageCenterY = page.height / 2

  const snappedCenterX = snap(centerX, pageCenterX)
  if (snappedCenterX !== centerX) {
    nextX = snappedCenterX - frame.w / 2
    guides.push({ orientation: 'vertical', position: pageCenterX })
  }
  const snappedCenterY = snap(centerY, pageCenterY)
  if (snappedCenterY !== centerY) {
    nextY = snappedCenterY - frame.h / 2
    guides.push({ orientation: 'horizontal', position: pageCenterY })
  }

  const snappedLeft = snap(nextX, 0)
  if (snappedLeft !== nextX) {
    nextX = snappedLeft
    guides.push({ orientation: 'vertical', position: 0 })
  }
  const snappedRight = snap(nextX + frame.w, page.width)
  if (snappedRight !== nextX + frame.w) {
    nextX = page.width - frame.w
    guides.push({ orientation: 'vertical', position: page.width })
  }
  const snappedTop = snap(nextY, 0)
  if (snappedTop !== nextY) {
    nextY = snappedTop
    guides.push({ orientation: 'horizontal', position: 0 })
  }
  const snappedBottom = snap(nextY + frame.h, page.height)
  if (snappedBottom !== nextY + frame.h) {
    nextY = page.height - frame.h
    guides.push({ orientation: 'horizontal', position: page.height })
  }

  const nextFrame: Rect = { x: nextX, y: nextY, w: frame.w, h: frame.h }
  pointerState.lastFrame = nextFrame
  store.setDragOverlay({ layerId: pointerState.layerId, frame: nextFrame })
  store.setGuides(guides)
}

function finalizeDrag() {
  if (pointerState.dragging && pointerState.layerId && pointerState.lastFrame) {
    store.updateLayer(pointerState.layerId, { frame: pointerState.lastFrame })
  }
  store.setDragOverlay(null)
  store.clearGuides()
}

function handlePointerEnd(event: PointerEventLike) {
  cancelLongPress()
  finalizeDrag()
  const now = Date.now()
  if (!pointerState.dragging && pointerState.layerId) {
    const tapInterval = now - pointerState.lastTapTime
    if (pointerState.lastTapId === pointerState.layerId && tapInterval < 320) {
      openTextEditor(pointerState.layerId)
      pointerState.lastTapTime = 0
      pointerState.lastTapId = ''
    } else {
      pointerState.lastTapTime = now
      pointerState.lastTapId = pointerState.layerId
    }
  }
  pointerState.layerId = ''
  pointerState.startFrame = null
  pointerState.dragging = false
}

function handlePointerCancel() {
  cancelLongPress()
  finalizeDrag()
  pointerState.layerId = ''
  pointerState.startFrame = null
  pointerState.dragging = false
}

function updateTextEditorPosition() {
  if (!textEditor.visible) return
  const page = store.activePage.value
  if (!page) return
  const layer = page.layers.find((item) => item.id === textEditor.layerId)
  if (!layer || layer.type !== 'text') {
    closeTextEditor(false)
    return
  }
  const viewport = store.viewport.value
  const left = (layer.frame.x + viewport.tx) * viewport.scale
  const top = (layer.frame.y + viewport.ty) * viewport.scale
  const width = layer.frame.w * viewport.scale
  const height = layer.frame.h * viewport.scale
  textEditor.style = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  }
}

function openTextEditor(layerId: string) {
  const page = store.activePage.value
  const layer = page?.layers.find((item) => item.id === layerId)
  if (!layer || layer.type !== 'text') return
  textEditor.visible = true
  textEditor.layerId = layerId
  textEditor.value = layer.props?.text ?? ''
  updateTextEditorPosition()
  nextTick(() => {
    textareaRef.value?.focus?.()
  })
}

function commitText() {
  if (!textEditor.visible) return
  const page = store.activePage.value
  const layer = page?.layers.find((item) => item.id === textEditor.layerId)
  if (layer) {
    store.updateLayer(layer.id, { props: { text: textEditor.value } })
  }
  closeTextEditor(false)
}

function closeTextEditor(resetSelection = false) {
  textEditor.visible = false
  textEditor.layerId = ''
  if (resetSelection) store.clearSelection()
}

function measureCanvas() {
  const instance = getCurrentInstance()
  const system = uni.getSystemInfoSync()
  dpr.value = system.pixelRatio || 1
  if (process.env.UNI_PLATFORM === 'h5') {
    nextTick(() => {
      const canvas = document.getElementById('editor-canvas') as HTMLCanvasElement | null
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      canvasNode.value = canvas
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      store.attachContext(ctx as unknown as CanvasRenderingContext2D, {
        width: rect.width,
        height: rect.height,
        dpr: dpr.value,
      })
      updateTextEditorPosition()
    })
    return
  }
  nextTick(() => {
    uni
      .createSelectorQuery()
      .in(instance?.proxy)
      .select('#editor-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const data = res?.[0]
        if (!data) return
        const { node, width, height } = data
        canvasNode.value = node
        const ctx = node.getContext('2d') as CanvasRenderingContext2D
        store.attachContext(ctx, { width, height, dpr: dpr.value })
        updateTextEditorPosition()
      })
  })
}

function handleResize() {
  if (!canvasNode.value) return
  if (process.env.UNI_PLATFORM === 'h5') {
    const canvas = document.getElementById('editor-canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    store.resizeViewport(rect.width, rect.height, dpr.value)
  } else {
    const instance = getCurrentInstance()
    uni
      .createSelectorQuery()
      .in(instance?.proxy)
      .select('#editor-canvas')
      .fields({ size: true })
      .exec((res) => {
        const data = res?.[0]
        if (!data) return
        store.resizeViewport(data.width, data.height, dpr.value)
      })
  }
}

onMounted(() => {
  measureCanvas()
  if (typeof uni.onWindowResize === 'function') {
    uni.onWindowResize(handleResize)
  } else if (process.env.UNI_PLATFORM === 'h5') {
    window.addEventListener('resize', handleResize)
  }
})

onBeforeUnmount(() => {
  if (typeof uni.offWindowResize === 'function') {
    uni.offWindowResize(handleResize)
  } else if (process.env.UNI_PLATFORM === 'h5') {
    window.removeEventListener('resize', handleResize)
  }
  store.stopAutosave()
})

watch(
  () => store.viewport.value,
  () => {
    updateTextEditorPosition()
  },
  { deep: true }
)

watch(
  () => store.activeTextLayer.value,
  (layer) => {
    if (!layer && textEditor.visible) closeTextEditor()
  }
)

watch(
  () => store.scene.value,
  () => {
    updateTextEditorPosition()
  },
  { deep: true }
)
</script>

<style lang="scss">
@import './theme.css';

.editor-page {
  min-height: 100vh;
  background: var(--editor-background);
  display: flex;
  flex-direction: column;
}

.page-top-bar {
  flex-shrink: 0;
}

.canvas-section {
  flex: 1;
  min-height: 0;
  padding: 32rpx 32rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.canvas-chip {
  align-self: flex-start;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background: var(--editor-chip-bg);
  color: var(--editor-chip-text);
  font-size: 24rpx;
  font-weight: 500;
}

.canvas-card {
  flex: 1;
  min-height: 0;
  background: var(--editor-surface);
  border-radius: var(--editor-radius-lg);
  padding: 28rpx;
  box-shadow: 0 24rpx 60rpx rgba(31, 35, 48, 0.08);
}

.canvas-viewport {
  position: relative;
  width: 100%;
  height: 100%;
}

.canvas-stage {
  position: relative;
  width: 100%;
  height: 0;
  border-radius: var(--editor-radius-md);
  background: var(--editor-surface-subtle);
  border: 2rpx dashed var(--editor-border);
  overflow: hidden;
}

.editor-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.text-editor {
  position: absolute;
  border: 2rpx solid var(--editor-primary);
  border-radius: 12rpx;
  padding: 12rpx;
  font-size: 28rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12rpx 24rpx rgba(31, 35, 48, 0.12);
  z-index: 10;
}

.tool-panel {
  flex-shrink: 0;
  height: 440rpx;
  padding: 0 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: var(--editor-surface);
  box-shadow: var(--editor-panel-shadow);
  border-radius: var(--editor-radius-lg) var(--editor-radius-lg) 0 0;
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease;
}

.tool-panel.is-editing {
  transform: translateY(80rpx);
}

.tool-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  padding: 24rpx 0 12rpx;
}

.tool-tab {
  text-align: center;
  line-height: 64rpx;
  border-radius: var(--editor-radius-sm);
  background: rgba(124, 108, 255, 0.08);
  color: var(--editor-text-secondary);
  font-size: 26rpx;
  transition: background var(--editor-transition), color var(--editor-transition);
}

.tool-tab.active {
  background: var(--editor-primary);
  color: #ffffff;
  font-weight: 600;
}

.tool-content {
  flex: 1;
  min-height: 0;
  background: var(--editor-surface-subtle);
  border-radius: var(--editor-radius-md);
  padding: 24rpx;
}

.tool-pane {
  min-height: 100%;
}
</style>

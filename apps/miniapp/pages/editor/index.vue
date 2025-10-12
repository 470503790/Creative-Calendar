<template>
  <view class="editor-page">
    <view class="top-bar">
      <view class="brand">
        <text class="brand-title">创意日历编辑器</text>
        <text class="brand-sub">轻编辑 · Mock 版本</text>
      </view>
      <view class="top-actions">
        <button plain class="ghost" @click="handleAction('saveDraft')">保存草稿</button>
        <button plain class="ghost" @click="handleAction('preview')">预览</button>
        <button plain class="ghost" @click="openExportPanel('form')">导出</button>
        <button plain class="ghost" @click="openExportPanel('records')">导出记录</button>
        <button class="primary" @click="handleAction('publish')">发布</button>
      </view>
    </view>

    <view class="workspace">
      <view class="sidebar left" :class="{ collapsed: !isLeftExpanded }">
        <view class="sidebar-header">
          <text class="sidebar-title">素材面板</text>
          <button plain class="mini" @click="togglePanel('left')">
            {{ isLeftExpanded ? '收起' : '展开' }}
          </button>
        </view>
        <view class="sidebar-tabs" v-if="isLeftExpanded">
          <button
            v-for="tab in leftTabs"
            :key="tab.key"
            plain
            class="tab"
            :class="{ active: tab.key === leftActiveTab }"
            @click="setLeftTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </view>
        <scroll-view v-if="isLeftExpanded" class="sidebar-body" scroll-y>
          <view class="panel-placeholder">
            <text class="panel-title">{{ leftActiveMeta.label }}</text>
            <text class="panel-desc">{{ leftActiveMeta.description }}</text>
            <view class="placeholder-list">
              <view v-for="n in 6" :key="n" class="placeholder-item">
                <view class="thumb" />
                <view class="meta">
                  <text class="meta-title">示例素材 {{ n }}</text>
                  <text class="meta-desc">点击后会在画布添加元素（mock）</text>
                </view>
                <button plain class="mini" @click="handleMaterialClick(n)">添加</button>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="stage">
        <view class="stage-toolbar">
          <button
            v-for="tool in toolbarActions"
            :key="tool.key"
            plain
            class="tool"
            :class="{ active: activeToolbarKey === tool.key }"
            :disabled="tool.key === 'undo' ? !canUndo : tool.key === 'redo' ? !canRedo : false"
            @click="handleToolbarClick(tool.key, tool.label)"
          >
            {{ tool.label }}
          </button>
        </view>
        <view class="canvas-area">
          <view class="canvas-frame">
            <view class="canvas-wrapper" :style="canvasStyle">
              <view class="canvas" id="canvas">
                <view class="canvas-placeholder">
                  <text class="canvas-title">画布区域占位</text>
                  <text class="canvas-desc">保持等比居中，后续将接入真实渲染</text>
                  <text class="canvas-info">当前页面：{{ activePage?.name || '未选择' }}</text>
                  <text class="canvas-info">页面元素数量：{{ layerCount }}</text>
                  <text v-if="activeLayer" class="canvas-info">选中元素：{{ activeLayer.name }}</text>
                  <text v-else class="canvas-info">暂无选中元素</text>
                </view>
              </view>
            </view>
          </view>
          <view class="zoom-controls">
            <button plain class="mini" @click="zoomOut">-</button>
            <text class="zoom-label">{{ zoomLabel }}</text>
            <button plain class="mini" @click="zoomIn">+</button>
            <button plain class="mini" @click="resetZoom">重置</button>
          </view>
        </view>
      </view>

      <view class="sidebar right" :class="{ collapsed: !isRightExpanded }">
        <view class="sidebar-header">
          <text class="sidebar-title">属性面板</text>
          <button plain class="mini" @click="togglePanel('right')">
            {{ isRightExpanded ? '收起' : '展开' }}
          </button>
        </view>
        <view class="sidebar-tabs" v-if="isRightExpanded">
          <button
            v-for="tab in rightTabs"
            :key="tab.key"
            plain
            class="tab"
            :class="{ active: tab.key === rightActiveTab }"
            @click="setRightTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </view>
        <scroll-view v-if="isRightExpanded" class="sidebar-body" scroll-y>
          <view class="panel-placeholder">
            <text class="panel-title">{{ rightActiveMeta.label }}</text>
            <text class="panel-desc">{{ rightActiveMeta.description }}</text>
            <view class="form-placeholder">
              <view class="form-item">
                <text class="form-label">当前页面</text>
                <text class="form-meta">{{ activePage?.name || '未选择' }}</text>
              </view>
              <view class="form-item">
                <text class="form-label">图层数量</text>
                <text class="form-meta">{{ layerCount }}</text>
              </view>
              <view v-if="activeLayer" class="form-item">
                <text class="form-label">选中元素</text>
                <text class="form-meta">{{ activeLayer.name }}</text>
              </view>
              <view v-if="activeLayer" class="form-item">
                <text class="form-label">属性快照</text>
                <text class="form-meta code">{{ activeLayerProps }}</text>
              </view>
              <view v-else class="form-empty">暂无选中元素，先从左侧添加素材</view>
              <view class="form-actions">
                <button plain class="mini" @click="handlePropertySubmit" :disabled="!activeLayer">
                  同步到画布
                </button>
                <button
                  plain
                  class="mini danger"
                  @click="handleLayerRemove"
                  :disabled="!activeLayer"
                >
                  删除当前元素
                </button>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
    <ExportPanel
      :visible="exportPanelVisible"
      :default-tab="exportPanelTab"
      @close="closeExportPanel"
    />
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref, watch } from 'vue'
import { useEditorStore } from '../../stores/editor'
import type { LeftPanelKey, RightPanelKey, ToolbarKey } from '../../stores/editor'
import { ExportPanel } from '../../components'
import { useExportStore } from '../../stores/export'

const pid = ref('')

onLoad((q) => {
  pid.value = (q?.pid as string) || ''
})

const editor = useEditorStore()
const exportStore = useExportStore()

const leftTabs = editor.leftTabs
const rightTabs = editor.rightTabs
const toolbarActions = editor.toolbarActions

const leftActiveTab = computed(() => editor.leftActiveTab.value)
const rightActiveTab = computed(() => editor.rightActiveTab.value)
const leftActiveMeta = computed(() => editor.leftActiveMeta.value)
const rightActiveMeta = computed(() => editor.rightActiveMeta.value)
const isLeftExpanded = computed(() => editor.isLeftExpanded.value)
const isRightExpanded = computed(() => editor.isRightExpanded.value)
const zoomLabel = computed(() => editor.zoomLabel.value)
const activeToolbarKey = computed(() => editor.activeToolbarKey.value)
const activePage = computed(() => editor.activePage.value)
const activeLayer = computed(() => editor.activeLayer.value)
const layerCount = computed(() => editor.layerCount.value)
const canUndo = computed(() => editor.canUndo.value)
const canRedo = computed(() => editor.canRedo.value)
const activeLayerProps = computed(() =>
  activeLayer.value ? JSON.stringify(activeLayer.value.props) : ''
)

const canvasStyle = computed(() => {
  const scale = editor.zoom.value / 100
  return { transform: `scale(${scale.toFixed(2)})` }
})

const exportPanelVisible = ref(false)
const exportPanelTab = ref<'form' | 'records'>('form')

watch(
  () => activePage.value,
  (page) => {
    if (page) {
      exportStore.setBaseSize(page.width, page.height)
    }
  },
  { immediate: true }
)

function setLeftTab(key: LeftPanelKey) {
  editor.setLeftTab(key)
}

function setRightTab(key: RightPanelKey) {
  editor.setRightTab(key)
}

function togglePanel(side: 'left' | 'right') {
  editor.togglePanel(side)
}

function zoomIn() {
  editor.zoomIn()
  uni.showToast({ title: `缩放至 ${editor.zoomLabel.value}`, icon: 'none' })
}

function zoomOut() {
  editor.zoomOut()
  uni.showToast({ title: `缩放至 ${editor.zoomLabel.value}`, icon: 'none' })
}

function resetZoom() {
  editor.resetZoom()
  uni.showToast({ title: '回到 100%', icon: 'none' })
}

function handleMaterialClick(id: number) {
  const layer = editor.addMaterialLayer(id)
  if (layer) {
    uni.showToast({ title: `已添加 ${layer.name}`, icon: 'none' })
  } else {
    uni.showToast({ title: '暂无可添加的画布', icon: 'none' })
  }
}

function handleAction(type: 'saveDraft' | 'preview' | 'publish') {
  const map = {
    saveDraft: '已保存草稿（mock）',
    preview: '打开预览（mock）',
    publish: '发布流程占位（mock）',
  }
  uni.showToast({ title: map[type], icon: 'none' })
}

function handleToolbarClick(key: ToolbarKey, label: string) {
  if (key === 'undo') {
    const done = editor.undo()
    uni.showToast({ title: done ? '已撤销一步' : '无法继续撤销', icon: 'none' })
    return
  }
  if (key === 'redo') {
    const done = editor.redo()
    uni.showToast({ title: done ? '已重做一步' : '无法继续重做', icon: 'none' })
    return
  }
  editor.toggleToolbarAction(key)
  uni.showToast({ title: `${label} 功能占位`, icon: 'none' })
}

function handlePropertySubmit() {
  const mockPalette = ['#7c6cff', '#f7931a', '#1abc9c']
  const mockFonts = ['思源黑体', '站酷快乐体', '霞鹜文楷']
  const updated = editor.updateActiveLayerProps({
    lastSyncedAt: new Date().toISOString(),
    themeColor: mockPalette[Math.floor(Math.random() * mockPalette.length)],
    fontFamily: mockFonts[Math.floor(Math.random() * mockFonts.length)],
  })
  uni.showToast({
    title: updated ? '属性已同步至画布' : '请先选择元素',
    icon: 'none',
  })
}

function handleLayerRemove() {
  const removed = editor.removeActiveLayer()
  uni.showToast({
    title: removed ? '已删除当前元素' : '没有可删除的元素',
    icon: 'none',
  })
}

function openExportPanel(tab: 'form' | 'records' = 'form') {
  exportPanelTab.value = tab
  exportPanelVisible.value = true
}

function closeExportPanel() {
  exportPanelVisible.value = false
}
</script>

<style lang="scss">
.editor-page {
  min-height: 100vh;
  background: var(--color-background);
  display: flex;
  flex-direction: column;
}

.top-bar {
  padding: 24rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  gap: 24rpx;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.brand-title {
  font-size: 36rpx;
  font-weight: 600;
}

.brand-sub {
  font-size: 24rpx;
  color: var(--color-text-muted);
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.workspace {
  flex: 1;
  display: flex;
  padding: 24rpx;
  gap: 24rpx;
  min-height: 0;
}

.sidebar {
  width: 280rpx;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  padding: 24rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  transition: width 0.2s ease;
}

.sidebar.collapsed {
  width: 96rpx;
  padding: 24rpx 16rpx;
}

.sidebar.collapsed .sidebar-tabs,
.sidebar.collapsed .sidebar-body {
  display: none;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.sidebar-title {
  font-size: 28rpx;
  font-weight: 500;
}

.sidebar-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.sidebar-body {
  flex: 1;
  min-height: 0;
}

.panel-placeholder {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.panel-title {
  font-size: 28rpx;
  font-weight: 600;
}

.panel-desc {
  font-size: 24rpx;
  color: var(--color-text-muted);
}

.placeholder-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.placeholder-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  background: var(--color-surface-variant, rgba(255, 255, 255, 0.6));
  border-radius: var(--radius-lg);
}

.thumb {
  width: 88rpx;
  height: 88rpx;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, rgba(124, 108, 255, 0.25), rgba(124, 108, 255, 0.5));
}

.meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.meta-title {
  font-size: 26rpx;
  font-weight: 500;
}

.meta-desc {
  font-size: 22rpx;
  color: var(--color-text-muted);
}

.stage {
  flex: 1;
  min-width: 0;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.stage-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tool {
  font-size: 24rpx;
  line-height: 56rpx;
  padding: 0 20rpx;
}

.tool.active {
  background: var(--color-primary-soft, rgba(124, 108, 255, 0.2));
  color: var(--color-primary);
}

.canvas-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
}

.canvas-frame {
  flex: 1;
  width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-linear-gradient(
      45deg,
      rgba(124, 108, 255, 0.05),
      rgba(124, 108, 255, 0.05) 16rpx,
      transparent 16rpx,
      transparent 32rpx
    );
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.canvas-wrapper {
  width: 560rpx;
  height: 760rpx;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  transform-origin: center;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas {
  width: 520rpx;
  height: 720rpx;
  border-radius: var(--radius-md);
  border: 2rpx dashed rgba(124, 108, 255, 0.6);
  background: rgba(124, 108, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32rpx;
  gap: 12rpx;
}

.canvas-title {
  font-size: 30rpx;
  font-weight: 600;
}

.canvas-desc {
  font-size: 24rpx;
  color: var(--color-text-muted);
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.zoom-label {
  min-width: 100rpx;
  text-align: center;
  font-size: 26rpx;
}

.form-placeholder {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.form-label {
  font-size: 24rpx;
  color: var(--color-text-muted);
}

.form-meta {
  font-size: 24rpx;
  color: var(--color-text-primary, #333);
  word-break: break-all;
}

.form-meta.code {
  font-family: 'SFMono-Regular', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 22rpx;
  color: var(--color-text-muted);
}

.form-empty {
  font-size: 22rpx;
  color: var(--color-text-muted);
  background: rgba(124, 108, 255, 0.08);
  border-radius: var(--radius-lg);
  padding: 24rpx;
}

.form-actions {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

button.danger {
  color: #d14343;
  border-color: rgba(209, 67, 67, 0.45);
}

button.danger[disabled] {
  color: rgba(209, 67, 67, 0.4);
  border-color: rgba(209, 67, 67, 0.2);
}

.canvas-info {
  font-size: 22rpx;
  color: var(--color-text-muted);
}

button.ghost {
  background: rgba(124, 108, 255, 0.12);
  color: var(--color-primary);
}

button.primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

button.mini {
  line-height: 48rpx;
  padding: 0 16rpx;
  font-size: 22rpx;
}

button.tab {
  line-height: 54rpx;
  padding: 0 20rpx;
  border-radius: var(--radius-lg);
  background: rgba(124, 108, 255, 0.08);
  color: var(--color-text-muted);
}

button.tab.active {
  background: var(--color-primary);
  color: var(--color-on-primary);
  box-shadow: var(--shadow-button);
}
</style>

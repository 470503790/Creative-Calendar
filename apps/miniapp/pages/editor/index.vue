<template>
  <!-- E1 Layout: top bar + canvas viewport + bottom tool panel -->
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
        <view class="canvas-viewport">
          <view class="canvas-viewport__inner">
            <text class="canvas-title">画布占位</text>
            <text class="canvas-desc">E2 将接入 Renderer，当前为视觉占位</text>
          </view>
        </view>
      </view>
    </view>

    <view class="tool-panel">
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
        <view class="tool-placeholder">
          <text class="tool-placeholder-title">{{ activeTabContent.title }}</text>
          <text class="tool-placeholder-desc">{{ activeTabContent.description }}</text>
          <view class="tool-placeholder-meta">当前 Tab：{{ activeTabLabel }}</view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import TopBar from '../../components/editor/TopBar.vue'

type ToolTabKey = 'elements' | 'text' | 'stickers' | 'shapes' | 'theme' | 'export'

type TopBarActionKey = 'undo' | 'redo' | 'preview' | 'export'

interface ToolTabMeta {
  key: ToolTabKey
  label: string
}

interface ToolTabCopy {
  title: string
  description: string
}

interface TopBarAction {
  key: TopBarActionKey
  label: string
  disabled?: boolean
}

const monthChip = '2025·10'

const toolTabs: ToolTabMeta[] = [
  { key: 'elements', label: '元素' },
  { key: 'text', label: '文本' },
  { key: 'stickers', label: '贴纸' },
  { key: 'shapes', label: '形状' },
  { key: 'theme', label: '主题' },
  { key: 'export', label: '导出' },
]

const tabCopy: Record<ToolTabKey, ToolTabCopy> = {
  elements: { title: '元素面板占位', description: '展示网格卡片，E4 将接入真实数据与添加逻辑。' },
  text: { title: '文本面板占位', description: '将支持字体、字号等设置，当前为说明文案。' },
  stickers: { title: '贴纸面板占位', description: '横向贴纸包列表，E6 中实现内容与交互。' },
  shapes: { title: '形状面板占位', description: '基础几何形状入口，E7 将接入默认样式。' },
  theme: { title: '主题面板占位', description: '主题色与取色工具，E8 引入主题 token。' },
  export: { title: '导出面板占位', description: '导出配置与预览，E10 将开启完整流程。' },
}

const activeTab = ref<ToolTabKey>('elements')

const activeTabContent = computed(() => tabCopy[activeTab.value])
const activeTabLabel = computed(() => toolTabs.find((tab) => tab.key === activeTab.value)?.label ?? '')

const topBarActions = computed<TopBarAction[]>(() => [
  { key: 'undo', label: '撤销', disabled: true },
  { key: 'redo', label: '重做', disabled: true },
  { key: 'preview', label: '预览' },
  { key: 'export', label: '导出' },
])

function setActiveTab(key: ToolTabKey) {
  activeTab.value = key
}

function handleTopBarAction(action: TopBarActionKey) {
  const tips: Record<TopBarActionKey, string> = {
    undo: '撤销功能将在后续状态管理中接入',
    redo: '重做功能将在后续状态管理中接入',
    preview: '预览流程占位',
    export: '导出流程占位',
  }
  uni.showToast({ title: tips[action], icon: 'none' })
}
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
  /* Canvas occupies remaining height between top bar and bottom tools */
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
  height: 0;
  padding-bottom: 130%;
  border-radius: var(--editor-radius-md);
  background: var(--editor-surface-subtle);
  border: 2rpx dashed var(--editor-border);
  overflow: hidden;
}

.canvas-viewport__inner {
  /* Maintain aspect ratio canvas placeholder */
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  color: var(--editor-text-secondary);
  text-align: center;
  padding: 32rpx;
}

.canvas-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--editor-text-primary);
}

.canvas-desc {
  font-size: 24rpx;
}

.tool-panel {
  /* Fixed-height bottom tool drawer + safe-area */
  flex-shrink: 0;
  height: 440rpx;
  padding: 0 32rpx;
  padding-bottom: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  padding-bottom: calc(24rpx + constant(safe-area-inset-bottom));
  background: var(--editor-surface);
  box-shadow: var(--editor-panel-shadow);
  border-radius: var(--editor-radius-lg) var(--editor-radius-lg) 0 0;
  display: flex;
  flex-direction: column;
}

.tool-tabs {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
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

.tool-placeholder {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  color: var(--editor-text-secondary);
}

.tool-placeholder-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--editor-text-primary);
}

.tool-placeholder-desc {
  font-size: 24rpx;
}

.tool-placeholder-meta {
  margin-top: 12rpx;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(124, 108, 255, 0.12);
  color: var(--editor-primary);
  font-size: 22rpx;
  align-self: flex-start;
}
</style>

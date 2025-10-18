<template>
  <view class="elements-tab">
    <CalendarProps class="calendar-panel" />
    <view class="elements-grid">
      <view v-for="card in cards" :key="card.key" class="element-card">
        <view class="element-card__header">
          <view class="element-card__title">{{ card.title }}</view>
          <view class="element-card__badge">{{ card.badge }}</view>
        </view>
        <view class="element-card__description">{{ card.description }}</view>
        <view class="element-card__meta">{{ card.meta }}</view>
        <button class="element-card__action" @tap="handleAdd(card.kind)">添加</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore, type LayerKind } from '../../../stores/editor'
import CalendarProps from './CalendarProps.vue'

interface ElementCard {
  key: string
  kind: LayerKind
  title: string
  description: string
  badge: string
  meta: string
}

const store = useEditorStore()

const cards = computed<ElementCard[]>(() => [
  {
    key: 'calendar',
    kind: 'calendar',
    title: '月历网格',
    badge: '核心',
    description: '自动生成月历格子，含周标题与今日高亮。',
    meta: '按当前月份生成，可调起主题色。',
  },
  {
    key: 'text',
    kind: 'text',
    title: '文本框',
    badge: '双击编辑',
    description: '用于标题或段落内容，支持行距与对齐。',
    meta: '默认居中 14pt，可在属性面板调整。',
  },
  {
    key: 'shape',
    kind: 'shape',
    title: '形状描边',
    badge: '基础',
    description: '圆角矩形，描边继承主题主色。',
    meta: '适合作为强调区块或背景。',
  },
])

function handleAdd(kind: LayerKind) {
  const layer = store.addLayer(kind)
  if (layer) {
    store.selectLayer(layer.id)
    store.renderer.requestRender()
  }
}
</script>

<style scoped lang="scss">
.elements-tab {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.calendar-panel {
  width: 100%;
}

.elements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260rpx, 1fr));
  gap: 24rpx;
}

.element-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 24rpx;
  border-radius: var(--editor-radius-md);
  background: var(--editor-surface);
  box-shadow: 0 12rpx 32rpx rgba(31, 35, 48, 0.08);
}

.element-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.element-card__title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--editor-text-primary);
}

.element-card__badge {
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(112, 100, 255, 0.12);
  color: var(--editor-primary);
  font-size: 22rpx;
}

.element-card__description {
  font-size: 26rpx;
  color: var(--editor-text-secondary);
  line-height: 1.5;
}

.element-card__meta {
  font-size: 22rpx;
  color: rgba(31, 35, 48, 0.45);
}

.element-card__action {
  margin-top: 12rpx;
  align-self: flex-start;
  padding: 0 28rpx;
  line-height: 64rpx;
  font-size: 26rpx;
  border-radius: 999rpx;
  background: var(--editor-primary);
  color: #ffffff;
}
</style>

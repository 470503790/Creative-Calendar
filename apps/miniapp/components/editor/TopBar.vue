<template>
  <view class="editor-top-bar">
    <view class="title-block">
      <text class="title">{{ title }}</text>
      <text v-if="subtitle" class="subtitle">{{ subtitle }}</text>
    </view>
    <view class="actions">
      <button
        v-for="action in actions"
        :key="action.key"
        class="top-action"
        plain
        :disabled="action.disabled"
        @tap="handleAction(action.key)"
      >
        {{ action.label }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { toRefs } from 'vue'

interface TopBarAction {
  key: TopBarActionKey
  label: string
  disabled?: boolean
}

type TopBarActionKey = 'undo' | 'redo' | 'preview' | 'export'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    actions: TopBarAction[]
  }>(),
  {
    subtitle: '',
  }
)

const emit = defineEmits<{ (e: 'action', key: TopBarActionKey): void }>()

const { title, subtitle, actions } = toRefs(props)

function handleAction(key: TopBarActionKey) {
  emit('action', key)
}
</script>

<style scoped lang="scss">
.editor-top-bar {
  /* Layout: pin to the top, keep above canvas content */
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  padding: 24rpx 32rpx;
  padding-top: 24rpx;
  padding-top: calc(24rpx + env(safe-area-inset-top));
  padding-top: calc(24rpx + constant(safe-area-inset-top));
  background: var(--editor-surface);
  box-shadow: 0 16rpx 40rpx rgba(31, 35, 48, 0.08);
  border-radius: 0 0 var(--editor-radius-lg) var(--editor-radius-lg);
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  color: var(--editor-text-primary);
}

.title {
  font-size: 36rpx;
  font-weight: 600;
}

.subtitle {
  font-size: 24rpx;
  color: var(--editor-text-secondary);
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16rpx;
  flex-wrap: wrap;
}

.top-action {
  line-height: 52rpx;
  padding: 0 28rpx;
  font-size: 26rpx;
  border-radius: 999rpx;
  border: 2rpx solid rgba(124, 108, 255, 0.4);
  color: var(--editor-primary);
  background: rgba(124, 108, 255, 0.1);
}

.top-action[disabled] {
  opacity: 0.4;
}
</style>

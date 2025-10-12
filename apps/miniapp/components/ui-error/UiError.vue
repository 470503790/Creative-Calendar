<template>
  <view class="ui-error">
    <view class="ui-error__icon">
      <slot name="icon">
        <view class="ui-error__badge">{{ type === 'offline' ? '📡' : '⚠️' }}</view>
      </slot>
    </view>
    <view class="ui-error__title">{{ displayTitle }}</view>
    <view v-if="displayDescription" class="ui-error__description">{{ displayDescription }}</view>
    <view v-if="hasActions" class="ui-error__actions">
      <slot v-if="hasActionSlot" name="actions" />
      <ui-button v-else size="sm" @click="handleRetry">{{ retryText }}</ui-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, toRefs, useSlots } from 'vue'
import UiButton from '../ui-button/UiButton.vue'

type ErrorType = 'error' | 'offline'

interface Props {
  title?: string
  description?: string
  retryText?: string
  showRetry?: boolean
  type?: ErrorType
}

const props = withDefaults(defineProps<Props>(), {
  retryText: '重新加载',
  showRetry: true,
  type: 'error' as ErrorType,
})

const emit = defineEmits<{
  (event: 'retry'): void
}>()

const slots = useSlots()
const { type, retryText } = toRefs(props)

const defaultTexts: Record<ErrorType, { title: string; description: string }> = {
  error: {
    title: '加载失败',
    description: '请稍后再试，或检查网络连接',
  },
  offline: {
    title: '网络不可用',
    description: '请检查网络状态后再次尝试',
  },
}

const displayTitle = computed(() => props.title ?? defaultTexts[type.value].title)
const displayDescription = computed(() => props.description ?? defaultTexts[type.value].description)

const hasActionSlot = computed(() => Boolean(slots.actions))
const hasActions = computed(() => props.showRetry || hasActionSlot.value)

function handleRetry() {
  emit('retry')
}
</script>

<style scoped>
.ui-error {
  padding: 80rpx 40rpx;
  text-align: center;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.ui-error__icon {
  width: 140rpx;
  height: 140rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ui-error__badge {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, rgba(244, 114, 182, 0.28), rgba(248, 113, 113, 0.24));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
}

.ui-error__title {
  font-size: var(--font-subtitle);
  font-weight: 600;
  color: var(--color-text);
}

.ui-error__description {
  font-size: var(--font-body);
  color: var(--color-text-muted);
  line-height: 1.5;
}

.ui-error__actions {
  margin-top: 12rpx;
  display: flex;
  gap: 16rpx;
  justify-content: center;
}
</style>

<template>
  <view :class="classes">
    <slot />
    <view v-if="closable" class="ui-tag__close" role="button" @tap.stop="handleClose">
      ×
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * UiTag 展示轻量标签信息，支持多种语义色彩并可选择是否可关闭。
 * @property variant 视觉风格，可选 `default` | `primary` | `accent` | `outline`。
 * @property size 尺寸，可选 `md` | `sm`。
 * @property closable 是否展示关闭按钮。
 */
interface Props {
  variant?: 'default' | 'primary' | 'accent' | 'outline'
  size?: 'md' | 'sm'
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  closable: false,
})

defineOptions({
  name: 'UiTag',
})

const emit = defineEmits<{
  (event: 'close'): void
}>()

const classes = computed(() => [
  'ui-tag',
  `ui-tag--${props.variant}`,
  `ui-tag--${props.size}`,
  props.closable ? 'ui-tag--closable' : '',
])

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.ui-tag {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 6rpx 20rpx;
  border-radius: var(--radius-pill);
  font-size: 24rpx;
  color: var(--color-text);
  background: var(--color-surface-muted);
  line-height: 1.2;
}

.ui-tag--sm {
  padding: 4rpx 16rpx;
  font-size: 22rpx;
}

.ui-tag--primary {
  background: rgba(124, 108, 255, 0.16);
  color: var(--color-primary);
}

.ui-tag--accent {
  background: rgba(255, 183, 77, 0.18);
  color: var(--color-accent);
}

.ui-tag--outline {
  background: transparent;
  border: 2rpx solid var(--color-border);
}

.ui-tag--closable {
  padding-right: 12rpx;
}

.ui-tag__close {
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill);
  color: inherit;
  background: transparent;
}

.ui-tag__close:active {
  background: rgba(31, 31, 39, 0.08);
}
</style>

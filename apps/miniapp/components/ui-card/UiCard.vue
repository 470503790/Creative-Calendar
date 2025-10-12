<template>
  <view :class="classes" :hover-class="hoverClass" :hover-stay-time="40" @tap="onTap">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * UiCard 提供统一的卡片容器，可配置内边距、是否带阴影及是否可点击。
 * @property padding 内边距尺寸，可选 `none` | `sm` | `md` | `lg`，默认为 `md`。
 * @property elevated 是否显示卡片阴影。
 * @property outlined 是否渲染描边边框。
 * @property clickable 是否启用点击态并发出 `click` 事件。
 */
interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  elevated?: boolean
  outlined?: boolean
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
  elevated: true,
  outlined: false,
  clickable: false,
})

defineOptions({
  name: 'UiCard',
})

const emit = defineEmits<{
  (event: 'click', payload: Event): void
}>()

const classes = computed(() => [
  'ui-card',
  `ui-card--padding-${props.padding}`,
  props.elevated ? 'ui-card--elevated' : '',
  props.outlined ? 'ui-card--outlined' : '',
  props.clickable ? 'ui-card--clickable' : '',
])

const hoverClass = computed(() => (props.clickable ? 'ui-card--hover' : ''))

function onTap(event: Event) {
  if (!props.clickable) return
  emit('click', event)
}
</script>

<style scoped>
.ui-card {
  display: block;
  background: var(--color-surface);
  color: var(--color-on-surface);
  border-radius: var(--radius-lg);
  border: 2rpx solid transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.ui-card--outlined {
  border-color: var(--color-border);
  box-shadow: none;
}

.ui-card--elevated {
  box-shadow: var(--shadow-card);
}

.ui-card--padding-none {
  padding: 0;
}

.ui-card--padding-sm {
  padding: 16rpx 20rpx;
}

.ui-card--padding-md {
  padding: 24rpx 28rpx;
}

.ui-card--padding-lg {
  padding: 32rpx 36rpx;
}

.ui-card--clickable {
  position: relative;
}

.ui-card--hover {
  transform: translateY(-2rpx);
  box-shadow: var(--shadow-overlay);
}
</style>

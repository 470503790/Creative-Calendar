<template>
  <view
    :class="classes"
    :hover-class="disabled ? '' : 'ui-button--pressed'"
    :hover-stay-time="50"
    role="button"
    @tap="onTap"
  >
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * UiButton 在小程序中提供统一的按钮样式，支持主按钮、次按钮与幽灵按钮三种视觉风格。
 * @property variant 视觉风格，可选 `primary` | `secondary` | `ghost`，默认为 `primary`。
 * @property size 尺寸，可选 `md` | `sm`，默认为 `md`。
 * @property block 是否占据整行宽度。
 * @property disabled 是否禁用按钮，禁用时不会触发点击事件。
 */
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'sm'
  block?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  block: false,
  disabled: false,
})

defineOptions({
  name: 'UiButton',
})

const emit = defineEmits<{
  (event: 'click', payload: Event): void
}>()

const classes = computed(() => [
  'ui-button',
  `ui-button--${props.variant}`,
  `ui-button--${props.size}`,
  props.block ? 'ui-button--block' : '',
  props.disabled ? 'ui-button--disabled' : '',
])

function onTap(event: Event) {
  if (props.disabled) return
  emit('click', event)
}
</script>

<style scoped>
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 88rpx;
  padding: 0 32rpx;
  position: relative;
  border-radius: var(--radius-md);
  font-size: var(--font-button);
  font-weight: 600;
  line-height: 1;
  color: var(--color-on-primary);
  background: var(--color-primary);
  box-shadow: var(--shadow-button);
  transition: opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
  text-align: center;
}

.ui-button--block {
  width: 100%;
  display: flex;
}

.ui-button--sm {
  min-height: 64rpx;
  padding: 0 24rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.ui-button--secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 2rpx solid var(--color-border);
  box-shadow: none;
}

.ui-button--ghost {
  background: transparent;
  color: var(--color-primary);
  border: 2rpx solid transparent;
  box-shadow: none;
}

.ui-button--ghost::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 2rpx solid rgba(124, 108, 255, 0.28);
  pointer-events: none;
}

.ui-button--pressed {
  transform: translateY(2rpx);
  opacity: 0.88;
}

.ui-button--disabled {
  opacity: 0.45;
  box-shadow: none;
}

.ui-button--disabled.ui-button--ghost::after {
  border-color: rgba(124, 108, 255, 0.12);
}
</style>

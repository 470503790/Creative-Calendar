<template>
  <view
    class="lazy-image"
    :class="{
      'lazy-image--loaded': isLoaded,
      'lazy-image--error': hasError,
    }"
    :style="wrapperStyle"
  >
    <image
      v-if="resolvedSrc && !hasError"
      class="lazy-image__img"
      :class="{ 'is-visible': isLoaded }"
      :src="resolvedSrc"
      :mode="mode"
      :fade-show="fade"
      lazy-load
      @load="handleLoad"
      @error="handleError"
    />
    <view v-if="!isLoaded && !hasError" class="lazy-image__placeholder">
      <slot name="placeholder">
        <view class="lazy-image__placeholder-default" />
      </slot>
    </view>
    <view v-else-if="hasError" class="lazy-image__error">
      <slot name="error">
        <text class="lazy-image__error-text">图片加载失败</text>
      </slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  src?: string
  mode?: string
  fade?: boolean
  radius?: string | number
  background?: string
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  mode: 'aspectFill',
  fade: false,
  radius: undefined,
  background: undefined,
})

const emit = defineEmits<{
  (event: 'load'): void
  (event: 'error'): void
}>()

const isLoaded = ref(false)
const hasError = ref(false)

const resolvedSrc = computed(() => props.src?.trim() || '')

watch(
  () => resolvedSrc.value,
  () => {
    isLoaded.value = false
    hasError.value = false
  }
)

const wrapperStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.radius !== undefined) {
    style.borderRadius = typeof props.radius === 'number' ? `${props.radius}rpx` : props.radius
  }
  if (props.background) {
    style.background = props.background
  }
  return style
})

function handleLoad() {
  isLoaded.value = true
  emit('load')
}

function handleError() {
  hasError.value = true
  emit('error')
}
</script>

<style scoped>
.lazy-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--color-surface-muted);
}

.lazy-image__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.lazy-image__img.is-visible {
  opacity: 1;
}

.lazy-image__placeholder,
.lazy-image__error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.lazy-image__placeholder-default {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(124, 108, 255, 0.18), rgba(14, 165, 233, 0.16));
  animation: lazy-image-sheen 1.6s ease-in-out infinite;
}

.lazy-image__error {
  background: rgba(15, 23, 42, 0.08);
}

.lazy-image__error-text {
  font-size: var(--font-caption);
  color: var(--color-text-muted);
}

@keyframes lazy-image-sheen {
  0% {
    transform: translateX(-20%);
    opacity: 0.6;
  }
  50% {
    transform: translateX(20%);
    opacity: 1;
  }
  100% {
    transform: translateX(-20%);
    opacity: 0.6;
  }
}
</style>

<template>
  <view class="ui-skeleton" :class="[variantClass, { 'is-animated': animated }]" :style="style" />
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'

type SkeletonVariant = 'line' | 'block' | 'circle'

interface Props {
  width?: string | number
  height?: string | number
  radius?: string | number
  variant?: SkeletonVariant
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '24rpx',
  variant: 'line' as SkeletonVariant,
  animated: true,
})

const { variant, animated } = toRefs(props)
const variantClass = computed(() => `is-${variant.value}`)

function resolveSize(size: string | number | undefined) {
  if (typeof size === 'number') return `${size}rpx`
  return size
}

const style = computed(() => {
  const baseRadius = variant.value === 'circle' ? '50%' : props.radius ?? '12rpx'
  return {
    width: resolveSize(props.width),
    height: resolveSize(variant.value === 'line' ? props.height ?? '20rpx' : props.height),
    borderRadius: typeof baseRadius === 'number' ? `${baseRadius}rpx` : baseRadius,
  }
})
</script>

<style scoped>
.ui-skeleton {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.22), rgba(203, 213, 225, 0.26));
  border-radius: 12rpx;
}

.ui-skeleton.is-line {
  height: 20rpx;
}

.ui-skeleton.is-circle {
  border-radius: 50%;
}

.ui-skeleton.is-animated::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0));
  animation: ui-skeleton-shimmer 1.3s ease-in-out infinite;
}

@keyframes ui-skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>

<template>
  <view class="canvas-stage" :style="{ paddingBottom }" :catchtouchmove="catchTouchMove">
    <canvas
      id="editor-canvas"
      class="editor-canvas"
      type="2d"
      disable-scroll="true"
      v-on="listeners"
    ></canvas>
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type PointerEventType = 'pointer-start' | 'pointer-move' | 'pointer-end' | 'pointer-cancel'

type PointerEventPayload = TouchEvent & MouseEvent

const props = defineProps<{
  paddingBottom: string
  active: boolean
}>()

const emit = defineEmits<{
  (e: PointerEventType, event: PointerEventPayload): void
}>()

const catchTouchMove = computed(() => (props.active ? 'true' : 'false'))

function emitPointer(type: PointerEventType, event: Event) {
  if (!props.active) return
  if ('stopPropagation' in event && typeof event.stopPropagation === 'function') {
    event.stopPropagation()
  }
  if ('preventDefault' in event && typeof event.preventDefault === 'function') {
    event.preventDefault()
  }
  emit(type, event as PointerEventPayload)
}

const listeners = computed(() => {
  if (!props.active) {
    return {}
  }
  return {
    touchstart: (event: Event) => emitPointer('pointer-start', event),
    touchmove: (event: Event) => emitPointer('pointer-move', event),
    touchend: (event: Event) => emitPointer('pointer-end', event),
    touchcancel: (event: Event) => emitPointer('pointer-cancel', event),
    mousedown: (event: Event) => emitPointer('pointer-start', event),
    mousemove: (event: Event) => emitPointer('pointer-move', event),
    mouseup: (event: Event) => emitPointer('pointer-end', event),
    mouseleave: (event: Event) => emitPointer('pointer-cancel', event),
  }
})
</script>

<style scoped>
.canvas-stage {
  position: relative;
  width: 100%;
  height: 0;
  border-radius: var(--editor-radius-md);
  background: var(--editor-surface-subtle);
  border: 2rpx dashed var(--editor-border);
  overflow: hidden;
}

.editor-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}
</style>

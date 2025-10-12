<template>
  <view :class="sectionClass">
    <view v-if="hasHeader" class="ui-section__header">
      <view class="ui-section__titles">
        <view v-if="title" class="ui-section__title">{{ title }}</view>
        <view v-if="description" class="ui-section__description">{{ description }}</view>
      </view>
      <view v-if="$slots.action" class="ui-section__action">
        <slot name="action" />
      </view>
    </view>
    <view class="ui-section__body">
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

/**
 * UiSection 作为页面区块容器，提供标题、副标题与操作区域，统一区块间距与分割线。
 * @property title 区块标题。
 * @property description 区块描述。
 * @property spacing 内容内边距，可选 `none` | `sm` | `md`，默认为 `md`。
 * @property divider 是否在区块底部展示分隔线。
 */
interface Props {
  title?: string
  description?: string
  spacing?: 'none' | 'sm' | 'md'
  divider?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  spacing: 'md',
  divider: false,
})

const slots = useSlots()

const hasHeader = computed(() => !!(props.title || props.description || slots.action))

const sectionClass = computed(() => [
  'ui-section',
  `ui-section--spacing-${props.spacing}`,
  props.divider ? 'ui-section--divider' : '',
])

defineOptions({
  name: 'UiSection',
})
</script>

<style scoped>
.ui-section {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  width: 100%;
}

.ui-section--spacing-none {
  padding: 0;
}

.ui-section--spacing-sm {
  padding: 16rpx 0;
}

.ui-section--spacing-md {
  padding: 24rpx 0;
}

.ui-section--divider {
  border-bottom: 2rpx solid var(--color-border);
}

.ui-section__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}

.ui-section__titles {
  flex: 1;
  min-width: 0;
}

.ui-section__title {
  font-size: var(--font-title);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.2;
}

.ui-section__description {
  margin-top: 8rpx;
  font-size: var(--font-body);
  color: var(--color-text-muted);
  line-height: 1.4;
}

.ui-section__action {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.ui-section__body {
  width: 100%;
}
</style>

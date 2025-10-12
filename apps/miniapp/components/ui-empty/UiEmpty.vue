<template>
  <view class="ui-empty">
    <view class="ui-empty__icon">
      <slot name="icon">
        <view class="ui-empty__placeholder" />
      </slot>
    </view>
    <view v-if="title" class="ui-empty__title">{{ title }}</view>
    <view v-if="description" class="ui-empty__description">{{ description }}</view>
    <view v-if="$slots.actions" class="ui-empty__actions">
      <slot name="actions" />
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * UiEmpty 用于展示空状态，支持自定义图标、标题、描述与操作区插槽。
 * @property title 主标题文案。
 * @property description 描述文案。
 */
interface Props {
  title?: string
  description?: string
}

defineOptions({
  name: 'UiEmpty',
})

withDefaults(defineProps<Props>(), {
  title: '暂无数据',
  description: '稍后再来看看吧～',
})
</script>

<style scoped>
.ui-empty {
  padding: 80rpx 40rpx;
  text-align: center;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.ui-empty__icon {
  width: 140rpx;
  height: 140rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ui-empty__placeholder {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, rgba(124, 108, 255, 0.28), rgba(56, 189, 248, 0.22));
}

.ui-empty__title {
  font-size: var(--font-subtitle);
  font-weight: 600;
  color: var(--color-text);
}

.ui-empty__description {
  font-size: var(--font-body);
  color: var(--color-text-muted);
  line-height: 1.5;
}

.ui-empty__actions {
  margin-top: 12rpx;
  display: flex;
  gap: 16rpx;
  justify-content: center;
}
</style>

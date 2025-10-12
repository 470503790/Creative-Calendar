<template>
  <view v-if="visible" class="sheet">
    <view class="mask" @click="emitClose" />
    <view class="panel">
      <view class="panel-header">
        <view class="panel-title">快速新建</view>
        <text class="panel-close" @click="emitClose">×</text>
      </view>
      <view class="panel-body">
        <view
          v-for="action in actions"
          :key="action.id"
          class="action"
          @click="() => handleSelect(action)"
        >
          <view class="action-icon">{{ action.icon }}</view>
          <view class="action-main">
            <view class="action-title">{{ action.title }}</view>
            <view class="action-desc">{{ action.description }}</view>
          </view>
          <text class="action-arrow">→</text>
        </view>
      </view>
      <view class="panel-safe" />
    </view>
  </view>
</template>

<script setup lang="ts">
interface CreateAction {
  id: string
  title: string
  description: string
  icon: string
  route: string
}

defineProps<{
  visible: boolean
  actions: CreateAction[]
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'select', action: CreateAction): void
}>()

function emitClose() {
  emit('close')
}

function handleSelect(action: CreateAction) {
  emit('select', action)
}
</script>

<style scoped>
.sheet {
  position: fixed;
  inset: 0;
  z-index: 99;
}

.mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.36);
}

.panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx;
  box-shadow: 0 -24rpx 48rpx rgba(23, 15, 71, 0.12);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.panel-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1f1f2b;
}

.panel-close {
  font-size: 40rpx;
  color: #8f8fa3;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.action {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: #f7f7f9;
  border-radius: 28rpx;
  padding: 28rpx 32rpx;
}

.action-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}

.action-main {
  flex: 1;
}

.action-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f1f2b;
}

.action-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6f6f81;
}

.action-arrow {
  font-size: 32rpx;
  color: #c0c0d1;
}

.panel-safe {
  height: calc(env(safe-area-inset-bottom, 0) + 12rpx);
}
</style>

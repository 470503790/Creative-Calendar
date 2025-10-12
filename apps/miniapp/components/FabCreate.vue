<template>
  <view class="fab" @click="handleClick">
    <view class="fab-icon">+</view>
  </view>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (event: 'click'): void
}>()

function handleClick() {
  emit('click')
}
</script>

<style scoped>
.fab {
  position: fixed;
  right: 48rpx;
  bottom: calc(env(safe-area-inset-bottom, 0) + 144rpx);
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: linear-gradient(135deg, #7c6cff 0%, #a494ff 100%);
  box-shadow: 0 32rpx 48rpx rgba(79, 70, 184, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 98;
}

.fab-icon {
  font-size: 64rpx;
  font-weight: 600;
  color: #ffffff;
  line-height: 1;
}
</style>

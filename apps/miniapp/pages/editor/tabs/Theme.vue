<template>
  <view class="theme-tab">
    <view class="theme-grid">
      <view
        v-for="item in themes"
        :key="item.key"
        class="theme-card"
        :class="{ active: item.key === theme.key }"
        @tap="() => setTheme(item.key)"
      >
        <view class="theme-swatches">
          <view class="swatch" :style="{ background: item.primary }" />
          <view class="swatch" :style="{ background: item.surfaceMuted }" />
          <view class="swatch" :style="{ background: item.accent }" />
        </view>
        <view class="theme-info">
          <text class="theme-title">{{ item.name }}</text>
          <text class="theme-desc">{{ item.description }}</text>
        </view>
      </view>
    </view>
    <button class="apply-btn" @tap="apply">应用到现有元素</button>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../../../stores/editor'

const store = useEditorStore()
const theme = computed(() => store.theme.value)
const themes = computed(() => store.themes)

function setTheme(key: string) {
  store.setTheme(key)
}

function apply() {
  store.applyThemeToExisting()
  uni.showToast({ title: '已应用主题', icon: 'success', duration: 800 })
}
</script>

<style scoped lang="scss">
.theme-tab {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.theme-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.theme-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  border-radius: var(--editor-radius-md);
  background: var(--editor-surface);
  box-shadow: 0 6rpx 18rpx rgba(31, 35, 48, 0.08);
  border: 2rpx solid transparent;
}

.theme-card.active {
  border-color: var(--editor-primary);
}

.theme-swatches {
  display: flex;
  gap: 8rpx;
}

.swatch {
  width: 40rpx;
  height: 40rpx;
  border-radius: 12rpx;
  border: 2rpx solid rgba(31, 35, 48, 0.12);
}

.theme-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex: 1;
}

.theme-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--editor-text-primary);
}

.theme-desc {
  font-size: 24rpx;
  color: var(--editor-text-secondary);
}

.apply-btn {
  line-height: 72rpx;
  border-radius: var(--editor-radius-md);
  background: var(--editor-primary);
  color: #ffffff;
  font-size: 28rpx;
}
</style>

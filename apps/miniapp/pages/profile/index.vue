<template>
  <view class="wrap">
    <view class="hero">
      <UiLazyImage
        class="avatar"
        src="https://dummyimage.com/200x200/7c6cff/ffffff&text=ME"
        mode="aspectFill"
        :fade="true"
      />
      <view class="info">
        <view class="name">创意星球</view>
        <view class="meta">设计师 · 深圳</view>
      </view>
    </view>
    <view class="menu">
      <button plain @click="goWorks">我的作品</button>
      <button plain @click="goTemplates">收藏的模板</button>
      <button plain @click="openSettings">账号设置</button>
    </view>
    <view class="footer">版本 0.1.0 · Mock 数据</view>
  </view>
</template>
<script setup lang="ts">
import UiLazyImage from '../../components/ui-lazy-image/UiLazyImage.vue'

function goWorks() {
  uni.switchTab({ url: '/pages/works/index' })
}
function goTemplates() {
  uni.switchTab({ url: '/pages/templates/index' })
}
function openSettings() {
  uni.showToast({ title: '设置功能开发中', icon: 'none' })
}
</script>
<style>
.wrap {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}
.hero {
  display: flex;
  align-items: center;
  gap: 24rpx;
}
.avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  box-shadow: var(--shadow-card);
}
.info .name {
  font-size: var(--font-subtitle);
  font-weight: 700;
  color: var(--color-text);
}
.info .meta {
  color: var(--color-text-muted);
  margin-top: 8rpx;
  font-size: var(--font-caption);
}
.menu button {
  margin-bottom: 16rpx;
  border-radius: var(--radius-lg);
  border-color: var(--color-border);
  color: var(--color-text);
}
.footer {
  margin-top: 24rpx;
  color: var(--color-text-muted);
  text-align: center;
  font-size: var(--font-caption);
}
</style>

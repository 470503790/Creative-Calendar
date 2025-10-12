<template>
  <view class="onboarding-page">
    <view class="hero">
      <text class="badge">CREATIVE CALENDAR</text>
      <view class="title">欢迎加入创意日历</view>
      <view class="subtitle">我们将帮助你在几分钟内完成设置，打造高效的创作流程。</view>
    </view>

    <view class="illustration" role="presentation" aria-hidden="true">
      <view class="illustration-circle" />
      <view class="illustration-card" />
    </view>

    <view class="actions">
      <button class="primary" @click="handleStart">开始体验</button>
      <button class="secondary" plain @click="handleSkip">稍后再说</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { setOnboarded, setPrefs } from '../../../utils/prefs'

onLoad(() => {
  setPrefs({ onboardingStep: 'welcome' })
})

function handleStart() {
  setPrefs({ onboardingStep: 'preferences' })
  uni.navigateTo({ url: '/pages/onboarding/preferences/index' })
}

function handleSkip() {
  setOnboarded(true)
  setPrefs({ onboardingStep: undefined })
  uni.showToast({ title: '已跳过引导', icon: 'none' })
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/index/index' })
  }, 300)
}
</script>

<style scoped>
.onboarding-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 96rpx 56rpx 48rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, #ffffff 0%, #f3f2ff 100%);
}

.hero {
  margin-bottom: 64rpx;
}

.badge {
  font-size: 24rpx;
  letter-spacing: 4rpx;
  color: #7c6cff;
  font-weight: 600;
}

.title {
  font-size: 56rpx;
  font-weight: 700;
  line-height: 72rpx;
  margin-top: 24rpx;
  color: #1f1f2b;
}

.subtitle {
  margin-top: 24rpx;
  font-size: 30rpx;
  line-height: 48rpx;
  color: #5d5d6d;
}

.illustration {
  position: relative;
  flex: 1;
  min-height: 360rpx;
  margin-bottom: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.illustration-circle {
  width: 320rpx;
  height: 320rpx;
  border-radius: 160rpx;
  background: rgba(124, 108, 255, 0.16);
}

.illustration-card {
  position: absolute;
  width: 360rpx;
  height: 240rpx;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 24rpx 48rpx rgba(56, 49, 125, 0.12);
  transform: rotate(-6deg);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.primary {
  line-height: 80rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #7c6cff 0%, #9c8dff 100%);
}

.secondary {
  line-height: 80rpx;
  border-radius: 999rpx;
  color: #7c6cff;
  border: 2rpx solid #7c6cff;
}
</style>

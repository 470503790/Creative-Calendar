<template>
  <view class="onboarding-page">
    <view class="header">
      <button class="link" plain @click="handleBack">返回</button>
      <text class="step">3 / 4</text>
    </view>

    <view class="content">
      <view class="title">通知与数据使用</view>
      <view class="description">选择你期望开启的提醒，我们暂不会弹出系统权限，后续可在设置中修改。</view>

      <view class="card">
        <view class="row">
          <view class="row-text">
            <view class="row-title">创作提醒</view>
            <view class="row-desc">在活动开始前提醒准备素材</view>
          </view>
          <switch :checked="notify" :color="primaryColor" @change="onNotifyChange" />
        </view>

        <view class="row">
          <view class="row-text">
            <view class="row-title">洞察报告</view>
            <view class="row-desc">允许我们收集匿名使用数据以优化体验</view>
          </view>
          <switch :checked="analytics" :color="primaryColor" @change="onAnalyticsChange" />
        </view>
      </view>
    </view>

    <view class="footer">
      <button class="next" @click="handleNext">继续</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getPrefs, setPrefs } from '../../../utils/prefs'
import { useTheme } from '../../../composables/useTheme'

interface SwitchChangeEvent {
  detail: {
    value: boolean
  }
}

const notify = ref(true)
const analytics = ref(false)

const { cssVars } = useTheme()
const primaryColor = computed(() => cssVars.value['--color-primary'] || '#7c6cff')

onLoad(() => {
  const stored = getPrefs()
  notify.value = stored.notificationOptIn
  analytics.value = stored.analyticsOptIn
  setPrefs({ onboardingStep: 'permissions' })
})

function onNotifyChange(event: SwitchChangeEvent) {
  notify.value = !!event.detail.value
}

function onAnalyticsChange(event: SwitchChangeEvent) {
  analytics.value = !!event.detail.value
}

function handleBack() {
  uni.navigateBack()
}

function handleNext() {
  setPrefs({
    notificationOptIn: notify.value,
    analyticsOptIn: analytics.value,
    onboardingStep: 'profile',
  })
  uni.navigateTo({ url: '/pages/onboarding/profile/index' })
}
</script>

<style scoped>
.onboarding-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 48rpx 40rpx;
  box-sizing: border-box;
  background: #ffffff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.link {
  font-size: 28rpx;
  color: #7c6cff;
  line-height: 56rpx;
  background: transparent;
  padding: 0;
}

.step {
  font-size: 26rpx;
  color: #8f8fa3;
}

.content {
  flex: 1;
}

.title {
  font-size: 48rpx;
  font-weight: 700;
  color: #1f1f2b;
}

.description {
  margin-top: 16rpx;
  font-size: 30rpx;
  color: #5d5d6d;
  line-height: 46rpx;
}

.card {
  margin-top: 48rpx;
  padding: 32rpx;
  border-radius: 32rpx;
  background: #f7f7f9;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.row-text {
  flex: 1;
}

.row-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1f1f2b;
}

.row-desc {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #6f6f81;
  line-height: 40rpx;
}

.footer {
  margin-top: 48rpx;
}

.next {
  width: 100%;
  line-height: 80rpx;
  border-radius: 999rpx;
  background: #7c6cff;
  color: #ffffff;
}
</style>

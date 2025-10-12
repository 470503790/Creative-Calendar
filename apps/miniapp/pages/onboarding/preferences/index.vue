<template>
  <view class="onboarding-page">
    <view class="header">
      <button class="link" plain @click="handleBack">返回</button>
      <text class="step">2 / 4</text>
    </view>

    <view class="content">
      <view class="title">偏好主题</view>
      <view class="description">选择你最常用的内容类型，我们会优先推荐对应模板。</view>

      <view class="options">
        <view
          v-for="option in options"
          :key="option.id"
          :class="['option', isSelected(option.id) ? 'is-active' : '']"
          @click="toggleOption(option.id)"
        >
          <view class="option-title">{{ option.label }}</view>
          <view class="option-desc">{{ option.desc }}</view>
        </view>
      </view>
    </view>

    <view class="footer">
      <button class="next" :disabled="!canProceed" @click="handleNext">继续</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getPrefs, setPrefs } from '../../../utils/prefs'

type Option = {
  id: string
  label: string
  desc: string
}

const options: Option[] = [
  { id: 'campaign', label: '营销活动', desc: '活动预热、促销节奏安排' },
  { id: 'brand', label: '品牌日历', desc: '品牌心智运营与新品发布' },
  { id: 'education', label: '教育培训', desc: '课程节奏、知识分享与讲座' },
  { id: 'community', label: '社群运营', desc: '会员关怀、签到与互动玩法' },
]

const selectedIds = ref<string[]>([])

onLoad(() => {
  const stored = getPrefs()
  selectedIds.value = [...stored.templateCategories]
  setPrefs({ onboardingStep: 'preferences' })
})

const canProceed = computed(() => selectedIds.value.length > 0)

function isSelected(id: string) {
  return selectedIds.value.includes(id)
}

function toggleOption(id: string) {
  if (isSelected(id))
    selectedIds.value = selectedIds.value.filter(item => item !== id)
  else
    selectedIds.value = [...selectedIds.value, id]
}

function handleBack() {
  uni.navigateBack()
}

function handleNext() {
  setPrefs({
    templateCategories: selectedIds.value,
    onboardingStep: 'permissions',
  })
  uni.navigateTo({ url: '/pages/onboarding/permissions/index' })
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

.options {
  margin-top: 48rpx;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280rpx, 1fr));
  gap: 24rpx;
}

.option {
  border: 2rpx solid #ececf3;
  border-radius: 32rpx;
  padding: 40rpx 32rpx;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.option-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1f1f2b;
}

.option-desc {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #6f6f81;
  line-height: 40rpx;
}

.option.is-active {
  border-color: #7c6cff;
  box-shadow: 0 16rpx 32rpx rgba(124, 108, 255, 0.16);
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

.next[disabled] {
  opacity: 0.4;
}
</style>

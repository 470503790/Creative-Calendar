<template>
  <view class="onboarding-page">
    <view class="header">
      <button class="link" plain @click="handleBack">返回</button>
      <text class="step">4 / 4</text>
    </view>

    <view class="content">
      <view class="title">完善个人资料</view>
      <view class="description">留下你的基本信息，便于我们生成个性化的创作建议。</view>

      <view class="form">
        <view class="field">
          <view class="field-label">昵称</view>
          <input
            v-model="nickname"
            class="field-input"
            type="text"
            placeholder="用于展示的称呼"
          />
        </view>

        <view class="field">
          <view class="field-label">团队 / 机构</view>
          <input
            v-model="organization"
            class="field-input"
            type="text"
            placeholder="可选填写"
          />
        </view>

        <view class="field">
          <view class="field-label">角色</view>
          <input
            v-model="role"
            class="field-input"
            type="text"
            placeholder="如：市场经理 / 运营策划"
          />
        </view>
      </view>
    </view>

    <view class="footer">
      <button class="complete" :disabled="!canSubmit" @click="handleComplete">完成引导</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getPrefs, setOnboarded, setPrefs } from '../../../utils/prefs'

const nickname = ref('')
const organization = ref('')
const role = ref('')

onLoad(() => {
  const stored = getPrefs()
  nickname.value = stored.profile.nickname
  organization.value = stored.profile.organization
  role.value = stored.profile.role
  setPrefs({ onboardingStep: 'profile' })
})

const canSubmit = computed(() => nickname.value.trim().length > 0)

function handleBack() {
  uni.navigateBack()
}

function handleComplete() {
  setPrefs({
    profile: {
      nickname: nickname.value.trim(),
      organization: organization.value.trim(),
      role: role.value.trim(),
    },
    onboardingStep: undefined,
  })
  setOnboarded(true)
  uni.showToast({ title: '设置完成', icon: 'success' })
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/index/index' })
  }, 400)
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

.form {
  margin-top: 56rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.field-label {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f1f2b;
  margin-bottom: 16rpx;
}

.field-input {
  width: 100%;
  background: #f7f7f9;
  border-radius: 24rpx;
  padding: 28rpx;
  font-size: 30rpx;
  color: #1f1f2b;
}

.field-input::placeholder {
  color: #a0a0b2;
}

.footer {
  margin-top: 48rpx;
}

.complete {
  width: 100%;
  line-height: 80rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #7c6cff 0%, #9c8dff 100%);
  color: #ffffff;
}

.complete[disabled] {
  opacity: 0.4;
}
</style>

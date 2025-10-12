<template>
  <view class="settings-page">
    <view class="section">
      <view class="section-title">主题</view>
      <view class="card">
        <view class="item">
          <view class="item-text">
            <view class="item-title">深色模式</view>
            <view class="item-desc">根据个人喜好切换界面主题</view>
          </view>
          <switch
            class="item-switch"
            :checked="isDark"
            :color="primaryColor"
            @change="onThemeChange"
          />
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">账户</view>
      <view class="card">
        <view class="item" @click="handleManageAccount">
          <view class="item-text">
            <view class="item-title">账户与安全</view>
            <view class="item-desc">Mock 账号：creative@demo.dev</view>
          </view>
          <text class="item-action">管理</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">偏好</view>
      <view class="card">
        <view class="item" @click="handleSelectLanguage">
          <view class="item-text">
            <view class="item-title">界面语言</view>
            <view class="item-desc">影响文案与时间格式显示</view>
          </view>
          <text class="item-action">{{ languageLabel }}</text>
        </view>
        <view class="item" @click="handleSelectDataSource">
          <view class="item-text">
            <view class="item-title">数据源</view>
            <view class="item-desc">使用 Mock 数据，更多来源即将支持</view>
          </view>
          <text class="item-action">{{ dataSourceLabel }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">通知</view>
      <view class="card">
        <view class="item">
          <view class="item-text">
            <view class="item-title">创作提醒</view>
            <view class="item-desc">在日程前一小时提醒准备素材</view>
          </view>
          <switch
            class="item-switch"
            :checked="settings.notifications.creationReminder"
            :color="primaryColor"
            @change="(event) => handleNotificationChange('creationReminder', event)"
          />
        </view>
        <view class="item">
          <view class="item-text">
            <view class="item-title">精选推荐</view>
            <view class="item-desc">订阅最新模板与运营灵感</view>
          </view>
          <switch
            class="item-switch"
            :checked="settings.notifications.curatedDigest"
            :color="primaryColor"
            @change="(event) => handleNotificationChange('curatedDigest', event)"
          />
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">实验室</view>
      <view class="card">
        <view class="item">
          <view class="item-text">
            <view class="item-title">AI 建议</view>
            <view class="item-desc">基于活动信息给出内容灵感</view>
          </view>
          <switch
            class="item-switch"
            :checked="settings.labs.aiSuggestions"
            :color="primaryColor"
            @change="(event) => handleLabsChange('aiSuggestions', event)"
          />
        </view>
        <view class="item">
          <view class="item-text">
            <view class="item-title">智能调色</view>
            <view class="item-desc">根据品牌色智能生成配色方案</view>
          </view>
          <switch
            class="item-switch"
            :checked="settings.labs.smartPalette"
            :color="primaryColor"
            @change="(event) => handleLabsChange('smartPalette', event)"
          />
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">隐私</view>
      <view class="card">
        <view class="item">
          <view class="item-text">
            <view class="item-title">使用数据分析</view>
            <view class="item-desc">帮助我们了解功能使用情况以持续优化</view>
          </view>
          <switch
            class="item-switch"
            :checked="settings.privacy.analytics"
            :color="primaryColor"
            @change="(event) => handlePrivacyChange('analytics', event)"
          />
        </view>
        <view class="item">
          <view class="item-text">
            <view class="item-title">云端备份</view>
            <view class="item-desc">在多设备间同步创作数据</view>
          </view>
          <switch
            class="item-switch"
            :checked="settings.privacy.cloudBackup"
            :color="primaryColor"
            @change="(event) => handlePrivacyChange('cloudBackup', event)"
          />
        </view>
      </view>
    </view>

    <view class="section">
      <view class="card links">
        <view class="link-item" @click="handleShowVersion">
          <view class="item-title">版本信息</view>
          <text class="item-action">{{ version }}</text>
        </view>
        <view class="link-item" @click="openAgreement('service')">
          <view class="item-title">用户协议</view>
          <text class="link-arrow">查看</text>
        </view>
        <view class="link-item" @click="openAgreement('privacy')">
          <view class="item-title">隐私条款</view>
          <text class="link-arrow">查看</text>
        </view>
        <view class="link-item" @click="handleFeedback">
          <view class="item-title">意见反馈</view>
          <text class="link-arrow">提交</text>
        </view>
      </view>
    </view>

    <view v-if="currentAgreement" class="dialog-mask" @click="closeAgreement">
      <view class="dialog" @click.stop>
        <view class="dialog-header">
          <view class="dialog-title">{{ currentAgreement.title }}</view>
          <text class="dialog-close" @click="closeAgreement">×</text>
        </view>
        <scroll-view scroll-y class="dialog-body">
          <view
            v-for="(paragraph, index) in currentAgreement.paragraphs"
            :key="index"
            class="dialog-paragraph"
          >
            {{ paragraph }}
          </view>
        </scroll-view>
        <button class="dialog-confirm" @click="closeAgreement">我已知晓</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useTheme } from '../../composables/useTheme'
import { AnalyticsEvents, track } from '../../utils/analytics'

const STORAGE_KEY = 'creative-calendar-settings'

type LanguageCode = 'zh-CN' | 'en-US'
type DataSourceCode = 'mock' | 'notion'

interface SettingsState {
  language: LanguageCode
  dataSource: DataSourceCode
  notifications: {
    creationReminder: boolean
    curatedDigest: boolean
  }
  labs: {
    aiSuggestions: boolean
    smartPalette: boolean
  }
  privacy: {
    analytics: boolean
    cloudBackup: boolean
  }
}

const defaultSettings: SettingsState = {
  language: 'zh-CN',
  dataSource: 'mock',
  notifications: {
    creationReminder: true,
    curatedDigest: false,
  },
  labs: {
    aiSuggestions: false,
    smartPalette: false,
  },
  privacy: {
    analytics: false,
    cloudBackup: false,
  },
}

const languageOptions: ReadonlyArray<{ label: string; value: LanguageCode }> = [
  { label: '中文（简体）', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
]

const dataSourceOptions: ReadonlyArray<{ label: string; value: DataSourceCode; disabled?: boolean }> = [
  { label: 'Mock 数据', value: 'mock' },
  { label: 'Notion（即将支持）', value: 'notion', disabled: true },
]

function parseSettings(raw: unknown): Partial<SettingsState> | null {
  if (!raw) return null
  try {
    if (typeof raw === 'string') {
      return JSON.parse(raw) as Partial<SettingsState>
    }
    if (typeof raw === 'object') {
      return raw as Partial<SettingsState>
    }
  }
  catch (error) {
    console.warn('[settings] failed to parse stored settings', error)
  }
  return null
}

function readStoredSettings(): Partial<SettingsState> | null {
  try {
    if (typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function') {
      const value = uni.getStorageSync(STORAGE_KEY)
      const parsed = parseSettings(value)
      if (parsed) return parsed
    }
  }
  catch (error) {
    console.warn('[settings] failed to read uni storage', error)
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const value = localStorage.getItem(STORAGE_KEY)
      const parsed = parseSettings(value)
      if (parsed) return parsed
    }
  }
  catch (error) {
    console.warn('[settings] failed to read localStorage', error)
  }

  return null
}

function mergeSettings(stored: Partial<SettingsState> | null): SettingsState {
  if (!stored) return { ...defaultSettings }
  return {
    ...defaultSettings,
    ...stored,
    notifications: {
      ...defaultSettings.notifications,
      ...(stored.notifications ?? {}),
    },
    labs: {
      ...defaultSettings.labs,
      ...(stored.labs ?? {}),
    },
    privacy: {
      ...defaultSettings.privacy,
      ...(stored.privacy ?? {}),
    },
  }
}

function persistSettings(value: SettingsState) {
  const payload = JSON.stringify(value)
  try {
    if (typeof uni !== 'undefined' && typeof uni.setStorageSync === 'function') {
      uni.setStorageSync(STORAGE_KEY, payload)
    }
  }
  catch (error) {
    console.warn('[settings] failed to write uni storage', error)
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, payload)
    }
  }
  catch (error) {
    console.warn('[settings] failed to write localStorage', error)
  }
}

const settings = reactive<SettingsState>(mergeSettings(readStoredSettings()))

watch(
  () => JSON.stringify(settings),
  (serialized) => {
    try {
      persistSettings(JSON.parse(serialized) as SettingsState)
    }
    catch (error) {
      console.warn('[settings] failed to persist', error)
    }
  },
  { immediate: true }
)

const version = '0.1.0'

const agreements = {
  service: {
    title: '用户协议',
    paragraphs: [
      '欢迎使用创意日历，在使用服务前请仔细阅读本协议。',
      '1. 我们将以 Mock 数据展示产品功能，所有数据仅供演示。',
      '2. 请勿上传含有侵犯他人权益的内容。',
      '3. 体验期间的功能可能会调整或下线。',
      '如对协议有任何疑问，可通过意见反馈联系我们。',
    ],
  },
  privacy: {
    title: '隐私条款',
    paragraphs: [
      '我们高度重视您的隐私与数据安全。',
      '1. Mock 环境中不会收集真实的个人身份信息。',
      '2. 启用使用数据分析后，我们仅会采集匿名统计信息。',
      '3. 您可随时关闭云端备份并清除本地缓存。',
      '详细隐私政策将在正式版本上线后补充说明。',
    ],
  },
} as const

type AgreementKey = keyof typeof agreements

type SwitchChangeEvent = { detail: { value: boolean } }

const activeAgreement = ref<AgreementKey | null>(null)

const currentAgreement = computed(() => {
  if (!activeAgreement.value) return null
  return agreements[activeAgreement.value]
})

function openAgreement(key: AgreementKey) {
  activeAgreement.value = key
  track(AnalyticsEvents.SETTINGS_AGREEMENT_VIEW, { agreement: key })
}

function closeAgreement() {
  activeAgreement.value = null
}

const { isDark, setTheme } = useTheme()

const primaryColor = '#7C6CFF'

function onThemeChange(event: SwitchChangeEvent) {
  const nextTheme = event.detail.value ? 'dark' : 'light'
  setTheme(nextTheme)
  track(AnalyticsEvents.SETTINGS_THEME_TOGGLE, { theme: nextTheme })
}

function handleNotificationChange(
  key: keyof SettingsState['notifications'],
  event: SwitchChangeEvent
) {
  const enabled = Boolean(event.detail.value)
  settings.notifications[key] = enabled
  track(AnalyticsEvents.SETTINGS_NOTIFICATIONS_TOGGLE, { key, enabled })
}

function handleLabsChange(key: keyof SettingsState['labs'], event: SwitchChangeEvent) {
  const enabled = Boolean(event.detail.value)
  settings.labs[key] = enabled
  track(AnalyticsEvents.SETTINGS_LABS_TOGGLE, { key, enabled })
}

function handlePrivacyChange(key: keyof SettingsState['privacy'], event: SwitchChangeEvent) {
  const enabled = Boolean(event.detail.value)
  settings.privacy[key] = enabled
  track(AnalyticsEvents.SETTINGS_PRIVACY_TOGGLE, { key, enabled })
}

const languageLabel = computed(() => {
  return languageOptions.find((item) => item.value === settings.language)?.label ?? '系统默认'
})

const dataSourceLabel = computed(() => {
  const option = dataSourceOptions.find((item) => item.value === settings.dataSource)
  return option?.label ?? '未选择'
})

function handleSelectLanguage() {
  uni.showActionSheet({
    itemList: languageOptions.map((item) => item.label),
    success: ({ tapIndex }) => {
      const option = languageOptions[tapIndex]
      if (option) {
        settings.language = option.value
        track(AnalyticsEvents.SETTINGS_LANGUAGE_CHANGE, {
          value: option.value,
          label: option.label,
        })
      }
    },
  })
}

function handleSelectDataSource() {
  uni.showActionSheet({
    itemList: dataSourceOptions.map((item) => item.label),
    success: ({ tapIndex }) => {
      const option = dataSourceOptions[tapIndex]
      if (!option) return
      if (option.disabled) {
        track(AnalyticsEvents.SETTINGS_DATA_SOURCE_CHANGE, {
          value: option.value,
          label: option.label,
          enabled: false,
        })
        uni.showToast({ title: '即将上线，敬请期待', icon: 'none' })
        return
      }
      settings.dataSource = option.value
      track(AnalyticsEvents.SETTINGS_DATA_SOURCE_CHANGE, {
        value: option.value,
        label: option.label,
        enabled: true,
      })
    },
  })
}

function handleManageAccount() {
  track(AnalyticsEvents.SETTINGS_ACCOUNT_MANAGE)
  uni.showToast({ title: '账号功能开发中', icon: 'none' })
}

function handleFeedback() {
  track(AnalyticsEvents.SETTINGS_FEEDBACK)
  uni.showToast({ title: '感谢反馈，已记录', icon: 'none' })
}

function handleShowVersion() {
  track(AnalyticsEvents.SETTINGS_VERSION, { version })
  uni.showToast({ title: `当前版本 ${version}`, icon: 'none' })
}
</script>

<style scoped>
.settings-page {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  background-color: var(--color-bg-page, #f7f7f9);
  min-height: 100vh;
  box-sizing: border-box;
}

.section-title {
  font-size: var(--font-caption);
  color: var(--color-text-muted);
  margin-bottom: 16rpx;
  text-transform: uppercase;
  letter-spacing: 6rpx;
}

.card {
  border-radius: var(--radius-lg);
  background-color: var(--color-surface, #ffffff);
  box-shadow: var(--shadow-card);
  padding: 16rpx 24rpx;
  display: flex;
  flex-direction: column;
}

.card.links {
  padding: 0;
}

.item,
.link-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  gap: 16rpx;
}

.item + .item,
.link-item + .link-item {
  border-top: 1px solid var(--color-divider, rgba(0, 0, 0, 0.06));
}

.item-text {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.item-title {
  font-size: var(--font-body);
  color: var(--color-text);
}

.item-desc {
  font-size: var(--font-caption);
  color: var(--color-text-muted);
}

.item-action,
.link-arrow {
  font-size: var(--font-caption);
  color: var(--color-primary, #7c6cff);
}

.item-switch {
  transform: scale(0.9);
}

.link-item {
  padding: 24rpx;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 32rpx;
  box-sizing: border-box;
  z-index: 99;
}

.dialog {
  width: 100%;
  max-height: 80vh;
  background-color: var(--color-surface, #ffffff);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  padding: 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-divider, rgba(0, 0, 0, 0.06));
}

.dialog-title {
  font-size: var(--font-subtitle);
  font-weight: 600;
  color: var(--color-text);
}

.dialog-close {
  font-size: 40rpx;
  color: var(--color-text-muted);
  line-height: 1;
}

.dialog-body {
  padding: 24rpx 32rpx;
  flex: 1;
}

.dialog-paragraph {
  font-size: var(--font-body);
  color: var(--color-text);
  line-height: 1.6;
  margin-bottom: 24rpx;
}

.dialog-paragraph:last-child {
  margin-bottom: 0;
}

.dialog-confirm {
  margin: 32rpx;
  border-radius: var(--radius-lg);
  background-color: var(--color-primary, #7c6cff);
  color: #ffffff;
}
</style>

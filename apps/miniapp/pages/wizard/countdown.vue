<template>
  <view class="wizard-page">
    <view class="wizard-header">
      <view class="wizard-title">倒数日创建向导</view>
      <view class="wizard-sub">三步完成倒数日作品设置，随时可返回继续</view>
    </view>

    <view class="stepper">
      <view
        v-for="(item, index) in steps"
        :key="item.key"
        class="stepper-item"
        :class="{
          'is-active': index === currentStepIndex,
          'is-complete': index < currentStepIndex,
        }"
        @tap="goStep(index)"
      >
        <view class="stepper-index">{{ index + 1 }}</view>
        <view class="stepper-meta">
          <view class="stepper-title">{{ item.title }}</view>
          <view class="stepper-desc">{{ item.description }}</view>
        </view>
      </view>
    </view>

    <view class="progress">
      <view class="progress-bar" :style="{ width: progressPercent }" />
    </view>

    <scroll-view scroll-y class="wizard-body" :show-scrollbar="false">
      <view v-if="currentStep.key === 'date'" class="step step-date">
        <UiSection
          title="选择倒数日期"
          description="我们会基于目标日期生成倒数信息，支持后续在编辑器中修改"
        >
          <view class="date-picker">
            <picker
              mode="date"
              :value="state.targetDate"
              :start="minDate"
              :end="maxDate"
              @change="onDateChange"
            >
              <view class="picker-trigger">
                <view v-if="state.targetDate" class="picker-value">
                  {{ targetDateLabel }}
                </view>
                <view v-else class="picker-placeholder">请选择目标日期</view>
                <view class="picker-icon">📅</view>
              </view>
            </picker>
            <view class="quick-select">
              <view class="quick-label">快捷选择</view>
              <view class="quick-list">
                <view
                  v-for="preset in datePresets"
                  :key="preset.label"
                  class="quick-item"
                  @tap="applyPreset(preset.offset)"
                >
                  {{ preset.label }}
                </view>
              </view>
            </view>
          </view>
        </UiSection>

        <view v-if="state.targetDate" class="date-summary">
          <view class="summary-badge" :class="{ 'is-past': countdownInfo.isPast }">
            {{ countdownInfo.isPast ? '已过期' : '进行中' }}
          </view>
          <view class="summary-main">
            <view class="summary-number">{{ countdownInfo.daysLabel }}</view>
            <view class="summary-tip">{{ countdownInfo.tip }}</view>
          </view>
        </view>
      </view>

      <view v-else-if="currentStep.key === 'style'" class="step step-style">
        <UiSection
          title="选择风格布局"
          description="不同风格会决定倒数日卡片的排版和装饰，后续仍可在编辑器中调整"
        >
          <view class="style-grid">
            <UiCard
              v-for="option in styleOptions"
              :key="option.key"
              clickable
              :class="['style-card', { 'is-active': option.key === state.styleKey }]"
              @click="selectStyle(option.key)"
            >
              <view class="style-preview" :style="createGradient(option.preview)">
                <view class="style-preview__body">
                  <view class="style-preview__date" :style="{ color: option.accent }">
                    {{ previewDateLabel }}
                  </view>
                  <view class="style-preview__count" :style="{ color: option.accent }">
                    {{ countdownInfo.shortLabel }}
                  </view>
                  <view class="style-preview__note">{{ option.note }}</view>
                </view>
              </view>
              <view class="style-body">
                <view class="style-title">{{ option.title }}</view>
                <view class="style-desc">{{ option.description }}</view>
                <view class="style-tags">
                  <view v-for="tag in option.highlights" :key="tag" class="style-tag">
                    {{ tag }}
                  </view>
                </view>
              </view>
            </UiCard>
          </view>
        </UiSection>
      </view>

      <view v-else class="step step-theme">
        <UiSection
          title="选择主题色"
          description="主题色会决定封面渐变与重点强调色，可随时在作品集中修改"
        >
          <view class="theme-grid">
            <view
              v-for="option in themeOptions"
              :key="option.key"
              class="theme-card"
              :class="{ 'is-active': option.key === state.themeKey }"
              @tap="selectTheme(option.key)"
            >
              <view class="theme-swatch" :style="createGradient(option.colors)">
                <view class="theme-accent" :style="{ background: option.accent }" />
              </view>
              <view class="theme-info">
                <view class="theme-title">{{ option.label }}</view>
                <view class="theme-desc">{{ option.description }}</view>
              </view>
            </view>
          </view>
        </UiSection>

        <view class="preview-card" :style="previewStyle">
          <view class="preview-header">{{ previewTitle }}</view>
          <view class="preview-date">{{ targetDateLabel || '请选择日期' }}</view>
          <view class="preview-count">{{ countdownInfo.daysLabel }}</view>
          <view class="preview-foot">
            <view class="preview-tag">{{ selectedStyle.title }}</view>
            <view class="preview-tag">主题色 · {{ selectedTheme.label }}</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="wizard-actions">
      <UiButton v-if="currentStepIndex > 0" variant="ghost" size="sm" @click="goPrev">
        上一步
      </UiButton>
      <view class="actions-spacer" />
      <UiButton
        v-if="!isLastStep"
        size="sm"
        :disabled="!canProceed"
        @click="goNext"
      >
        下一步
      </UiButton>
      <UiButton
        v-else
        size="sm"
        :disabled="!canSubmit || submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '生成中…' : '生成作品并进入编辑器' }}
      </UiButton>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { UiButton, UiCard, UiSection } from '../../components'
import { useProjectsStore } from '../../stores/projects'

type StepKey = 'date' | 'style' | 'theme'

interface StepItem {
  key: StepKey
  title: string
  description: string
}

interface StyleOption {
  key: string
  title: string
  description: string
  note: string
  accent: string
  preview: [string, string]
  highlights: string[]
}

interface ThemeOption {
  key: string
  label: string
  description: string
  colors: [string, string]
  accent: string
}

interface WizardState {
  stepIndex: number
  targetDate: string
  styleKey: string
  themeKey: string
}

interface DatePreset {
  label: string
  offset: number
}

const STORAGE_KEY = 'creative-calendar:wizard-countdown'
const projectsStore = useProjectsStore()

const steps: StepItem[] = [
  { key: 'date', title: '选择日期', description: '目标日期与倒数天数' },
  { key: 'style', title: '选择风格', description: '确定排版样式' },
  { key: 'theme', title: '选择主题色', description: '确定封面渐变' },
]

const styleOptions: StyleOption[] = [
  {
    key: 'minimal-digits',
    title: '极简大数字',
    description: '以大字号数字突出倒计时，适合干净留白的视觉呈现。',
    note: '还有 30 天',
    accent: '#505CFF',
    preview: ['#EEF1FF', '#D7DBFF'],
    highlights: ['大字号提示', '留白布局', '适合品牌活动'],
  },
  {
    key: 'warm-handdrawn',
    title: '手绘插画',
    description: '带插画与贴纸的卡片风格，营造轻松活泼的氛围。',
    note: '加油鸭！',
    accent: '#FF8A65',
    preview: ['#FFE9D6', '#FFD3BA'],
    highlights: ['插画贴纸', '适合社群运营', '配合暖色'],
  },
  {
    key: 'retro-board',
    title: '复古翻牌',
    description: '仿翻页日历的对齐设计，兼具秩序感与仪式感。',
    note: '第 02 轮',
    accent: '#1D3557',
    preview: ['#F5EFE6', '#E9DAC6'],
    highlights: ['翻页质感', '适合活动预热', '强化层次'],
  },
  {
    key: 'cyber-gradient',
    title: '赛博霓虹',
    description: '高饱和渐变与霓虹描边，适合科技与品牌发布场景。',
    note: '倒计时 14 天',
    accent: '#41D6FF',
    preview: ['#0F172A', '#1E3A8A'],
    highlights: ['暗色底', '霓虹描边', '适合新品发布'],
  },
]

const themeOptions: ThemeOption[] = [
  {
    key: 'sunset',
    label: '日落橙',
    description: '暖色系渐变，适合活动与节日氛围。',
    colors: ['#FFB15E', '#FF6B4A'],
    accent: '#FF8548',
  },
  {
    key: 'mint',
    label: '薄荷青',
    description: '清新自然，适合健康、签到类倒数。',
    colors: ['#BFF2D5', '#5CD6B6'],
    accent: '#2BBFA4',
  },
  {
    key: 'lavender',
    label: '暮光紫',
    description: '柔和梦幻，适合品牌或插画风格。',
    colors: ['#D9D5FF', '#7C6CFF'],
    accent: '#5A4CE3',
  },
  {
    key: 'skyline',
    label: '天际蓝',
    description: '高饱和蓝紫过渡，科技质感强。',
    colors: ['#8EC5FC', '#6A8BFF'],
    accent: '#4C64FF',
  },
  {
    key: 'mono',
    label: '黑白极简',
    description: '高对比单色风格，突出信息表达。',
    colors: ['#F4F4F6', '#CFCFD4'],
    accent: '#1E1E22',
  },
]

const datePresets: DatePreset[] = [
  { label: '7 天后', offset: 7 },
  { label: '30 天后', offset: 30 },
  { label: '100 天后', offset: 100 },
]

const state = reactive<WizardState>(createDefaultState())
const shouldPersist = ref(false)
const submitting = ref(false)

onLoad(() => {
  hydrateState()
  shouldPersist.value = true
})

watch(
  state,
  (value) => {
    if (!shouldPersist.value) return
    persistState(value)
  },
  { deep: true }
)

const currentStepIndex = computed(() => clamp(state.stepIndex, 0, steps.length - 1))
const currentStep = computed(() => steps[currentStepIndex.value])
const isLastStep = computed(() => currentStepIndex.value === steps.length - 1)
const progressPercent = computed(
  () => `${Math.round(((currentStepIndex.value + 1) / steps.length) * 100)}%`
)

const selectedStyle = computed(() =>
  styleOptions.find((item) => item.key === state.styleKey) ?? styleOptions[0]
)
const selectedTheme = computed(() =>
  themeOptions.find((item) => item.key === state.themeKey) ?? themeOptions[0]
)

const targetDateLabel = computed(() => formatDateLabel(state.targetDate))
const previewDateLabel = computed(() => formatPreviewDate(state.targetDate))

const countdownInfo = computed(() => createCountdownInfo(state.targetDate))

const previewTitle = computed(
  () => `${selectedStyle.value.title} · 倒数日${targetDateLabel.value ? '' : '（预览）'}`
)

const previewStyle = computed(() => ({
  backgroundImage: createGradient(selectedTheme.value.colors),
  borderColor: selectedTheme.value.accent,
}))

const canProceed = computed(() => {
  if (currentStep.value.key === 'date') return Boolean(state.targetDate)
  if (currentStep.value.key === 'style') return Boolean(state.styleKey)
  return Boolean(state.themeKey)
})

const canSubmit = computed(
  () => Boolean(state.targetDate && state.styleKey && state.themeKey)
)

const minDate = computed(() => formatDateValue(new Date()))
const maxDate = computed(() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 2)
  return formatDateValue(date)
})

function createDefaultState(): WizardState {
  const defaultTarget = new Date()
  defaultTarget.setDate(defaultTarget.getDate() + 30)
  return {
    stepIndex: 0,
    targetDate: formatDateValue(defaultTarget),
    styleKey: styleOptions[0].key,
    themeKey: themeOptions[2]?.key ?? themeOptions[0].key,
  }
}

function hydrateState() {
  try {
    const stored = typeof uni !== 'undefined' ? uni.getStorageSync(STORAGE_KEY) : null
    if (!stored) {
      resetState(createDefaultState())
      return
    }
    const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored
    const merged = normalizeState(parsed)
    resetState(merged)
  } catch (error) {
    console.warn('[wizard] failed to hydrate state', error)
    resetState(createDefaultState())
  }
}

function normalizeState(input: any): WizardState {
  const defaults = createDefaultState()
  if (!input || typeof input !== 'object') return defaults
  const targetDate = typeof input.targetDate === 'string' ? input.targetDate : defaults.targetDate
  const stepIndex = typeof input.stepIndex === 'number' ? input.stepIndex : defaults.stepIndex
  const styleKey =
    typeof input.styleKey === 'string' && styleOptions.some((item) => item.key === input.styleKey)
      ? input.styleKey
      : defaults.styleKey
  const themeKey =
    typeof input.themeKey === 'string' && themeOptions.some((item) => item.key === input.themeKey)
      ? input.themeKey
      : defaults.themeKey

  return {
    stepIndex: clamp(stepIndex, 0, steps.length - 1),
    targetDate,
    styleKey,
    themeKey,
  }
}

function persistState(value: WizardState) {
  try {
    if (typeof uni === 'undefined') return
    const payload: WizardState = {
      stepIndex: value.stepIndex,
      targetDate: value.targetDate,
      styleKey: value.styleKey,
      themeKey: value.themeKey,
    }
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.warn('[wizard] failed to persist state', error)
  }
}

function clearPersistedState() {
  try {
    if (typeof uni === 'undefined') return
    uni.removeStorageSync(STORAGE_KEY)
  } catch (error) {
    console.warn('[wizard] failed to clear state', error)
  }
}

function resetState(next: WizardState) {
  state.stepIndex = next.stepIndex
  state.targetDate = next.targetDate
  state.styleKey = next.styleKey
  state.themeKey = next.themeKey
}

function goPrev() {
  const nextIndex = clamp(currentStepIndex.value - 1, 0, steps.length - 1)
  state.stepIndex = nextIndex
}

function goNext() {
  if (!canProceed.value) {
    uni.showToast({ title: '请先完成当前步骤', icon: 'none' })
    return
  }
  const nextIndex = clamp(currentStepIndex.value + 1, 0, steps.length - 1)
  state.stepIndex = nextIndex
}

function goStep(index: number) {
  const normalized = clamp(index, 0, steps.length - 1)
  if (normalized <= currentStepIndex.value) {
    state.stepIndex = normalized
  }
}

function onDateChange(event: any) {
  const value = event?.detail?.value
  if (typeof value === 'string') {
    state.targetDate = value
  }
}

function applyPreset(offset: number) {
  const base = new Date()
  base.setDate(base.getDate() + offset)
  state.targetDate = formatDateValue(base)
}

function selectStyle(key: string) {
  state.styleKey = key
}

function selectTheme(key: string) {
  state.themeKey = key
}

async function handleSubmit() {
  if (!canSubmit.value) {
    uni.showToast({ title: '请确认日期、风格与主题色', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  try {
    const style = selectedStyle.value
    const theme = selectedTheme.value
    const countdown = countdownInfo.value
    const projectName = `${style.title} · ${formatShortDate(state.targetDate)}`
    const description = `目标日期：${targetDateLabel.value} · ${countdown.daysLabel}`
    const tags = ['倒数日', style.title, theme.label]
    if (countdown.isUpcoming) {
      tags.push('进行中')
    } else if (countdown.isPast) {
      tags.push('已结束')
    }

    const projectId = projectsStore.upsertProject({
      name: projectName,
      description,
      coverColor: theme.colors[0],
      accentColor: theme.colors[1],
      category: '倒数日',
      tags,
    })

    shouldPersist.value = false
    clearPersistedState()
    resetState(createDefaultState())
    uni.showToast({ title: '已生成作品', icon: 'success', duration: 1200 })
    setTimeout(() => {
      uni.navigateTo({ url: `/pages/editor/index?pid=${projectId}` })
    }, 360)
  } catch (error) {
    console.warn('[wizard] submit failed', error)
    uni.showToast({ title: '生成失败，请稍后再试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateLabel(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year} 年 ${month} 月 ${day} 日`
}

function formatShortDate(value: string) {
  if (!value) return '倒数日'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '倒数日'
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}/${day}`
}

function formatPreviewDate(value: string) {
  if (!value) return '目标日期'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '目标日期'
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}.${day}`
}

function createCountdownInfo(value: string) {
  if (!value) {
    return {
      daysLabel: '请选择日期',
      shortLabel: '00 天',
      tip: '选择日期后将自动计算倒数',
      isPast: false,
      isUpcoming: false,
    }
  }
  const target = startOfDay(new Date(value))
  const today = startOfDay(new Date())
  const diff = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  if (diff > 0) {
    return {
      daysLabel: `还有 ${diff} 天`,
      shortLabel: `${diff} 天`,
      tip: `距离 ${formatDateLabel(value)} 还有 ${diff} 天`,
      isPast: false,
      isUpcoming: true,
    }
  }
  if (diff === 0) {
    return {
      daysLabel: '今天就是目标日',
      shortLabel: '0 天',
      tip: `今天（${formatDateLabel(value)}）就是目标日`,
      isPast: false,
      isUpcoming: true,
    }
  }
  const pastDays = Math.abs(diff)
  return {
    daysLabel: `已过去 ${pastDays} 天`,
    shortLabel: `${pastDays} 天`,
    tip: `${formatDateLabel(value)} 已过去 ${pastDays} 天`,
    isPast: true,
    isUpcoming: false,
  }
}

function createGradient([from, to]: [string, string]) {
  return `linear-gradient(135deg, ${from}, ${to})`
}

function startOfDay(date: Date) {
  const clone = new Date(date)
  clone.setHours(0, 0, 0, 0)
  return clone
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
</script>

<style scoped>
.wizard-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-background);
  padding: 32rpx 28rpx 40rpx;
  gap: 24rpx;
  box-sizing: border-box;
}

.wizard-header {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.wizard-title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--color-text);
}

.wizard-sub {
  font-size: 26rpx;
  color: var(--color-text-muted);
}

.stepper {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  background: var(--color-surface);
  padding: 20rpx 24rpx;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.stepper-item {
  display: flex;
  gap: 16rpx;
  align-items: center;
  border-radius: var(--radius-md);
  padding: 16rpx;
  transition: background 0.2s ease, transform 0.2s ease;
}

.stepper-item.is-active {
  background: rgba(124, 108, 255, 0.1);
}

.stepper-item.is-complete {
  opacity: 0.7;
}

.stepper-index {
  width: 56rpx;
  height: 56rpx;
  border-radius: var(--radius-pill);
  background: var(--color-surface-muted);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.stepper-item.is-active .stepper-index {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.stepper-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.stepper-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text);
}

.stepper-desc {
  font-size: 24rpx;
  color: var(--color-text-muted);
}

.progress {
  height: 12rpx;
  background: var(--color-surface);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.wizard-body {
  flex: 1;
  background: transparent;
  border-radius: var(--radius-lg);
  padding-right: 8rpx;
}

.step {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding-bottom: 40rpx;
}

.date-picker {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.picker-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  color: var(--color-text);
}

.picker-value {
  font-size: 32rpx;
  font-weight: 600;
}

.picker-placeholder {
  font-size: 28rpx;
  color: var(--color-text-muted);
}

.picker-icon {
  font-size: 32rpx;
}

.quick-select {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.quick-label {
  font-size: 24rpx;
  color: var(--color-text-muted);
}

.quick-list {
  display: flex;
  gap: 16rpx;
}

.quick-item {
  padding: 12rpx 24rpx;
  border-radius: var(--radius-pill);
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 24rpx;
  line-height: 1;
}

.quick-item:active {
  background: rgba(124, 108, 255, 0.16);
}

.date-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  background: var(--color-surface);
  padding: 24rpx;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.summary-badge {
  padding: 12rpx 20rpx;
  border-radius: var(--radius-pill);
  background: rgba(92, 214, 182, 0.16);
  color: #2bbfa4;
  font-size: 24rpx;
  font-weight: 600;
}

.summary-badge.is-past {
  background: rgba(255, 122, 89, 0.16);
  color: #ff6b4a;
}

.summary-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.summary-number {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--color-text);
}

.summary-tip {
  font-size: 24rpx;
  color: var(--color-text-muted);
}

.style-grid {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.style-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  border: 2rpx solid transparent;
}

.style-card.is-active {
  border-color: var(--color-primary);
}

.style-preview {
  border-radius: var(--radius-lg);
  padding: 28rpx;
  color: var(--color-text);
  display: flex;
  align-items: flex-end;
  min-height: 200rpx;
}

.style-preview__body {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.style-preview__date {
  font-size: 28rpx;
  font-weight: 600;
}

.style-preview__count {
  font-size: 40rpx;
  font-weight: 700;
}

.style-preview__note {
  font-size: 24rpx;
  color: rgba(17, 24, 39, 0.8);
}

.style-body {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.style-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--color-text);
}

.style-desc {
  font-size: 24rpx;
  color: var(--color-text-muted);
}

.style-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.style-tag {
  padding: 8rpx 16rpx;
  border-radius: var(--radius-pill);
  background: var(--color-surface-muted);
  font-size: 22rpx;
  color: var(--color-text);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}

.theme-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 20rpx;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  border: 2rpx solid transparent;
}

.theme-card.is-active {
  border-color: var(--color-primary);
}

.theme-swatch {
  position: relative;
  height: 120rpx;
  border-radius: var(--radius-md);
}

.theme-accent {
  position: absolute;
  right: 16rpx;
  bottom: 16rpx;
  width: 32rpx;
  height: 32rpx;
  border-radius: var(--radius-pill);
  box-shadow: 0 6rpx 12rpx rgba(0, 0, 0, 0.16);
}

.theme-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.theme-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text);
}

.theme-desc {
  font-size: 24rpx;
  color: var(--color-text-muted);
}

.preview-card {
  margin-top: 12rpx;
  border-radius: var(--radius-xl, 48rpx);
  padding: 36rpx 32rpx;
  color: #1f2937;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  border: 2rpx solid transparent;
  box-shadow: var(--shadow-overlay);
}

.preview-header {
  font-size: 28rpx;
  font-weight: 600;
}

.preview-date {
  font-size: 36rpx;
  font-weight: 700;
}

.preview-count {
  font-size: 48rpx;
  font-weight: 700;
}

.preview-foot {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.preview-tag {
  padding: 8rpx 16rpx;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.64);
  color: #1f2937;
  font-size: 22rpx;
  font-weight: 600;
}

.wizard-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding-top: 12rpx;
}

.actions-spacer {
  flex: 1;
}

@media (max-width: 420px) {
  .wizard-page {
    padding: 24rpx 20rpx 32rpx;
  }

  .theme-grid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>

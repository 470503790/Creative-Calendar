<template>
  <view v-if="visible" class="export-overlay">
    <view class="export-mask" @tap="handleMask" />
    <view class="export-panel">
      <view class="export-header">
        <view class="header-info">
          <view class="header-title">导出设置</view>
          <view class="header-sub">配置尺寸、格式与水印，模拟导出流程</view>
        </view>
        <view class="header-tabs">
          <view
            class="tab"
            :class="{ active: activeTab === 'form', disabled: exporting }"
            role="button"
            @tap="() => switchTab('form')"
          >
            参数面板
          </view>
          <view
            class="tab"
            :class="{ active: activeTab === 'records' }"
            role="button"
            @tap="() => switchTab('records')"
          >
            导出记录
          </view>
        </view>
        <view class="header-close" :class="{ disabled: exporting }" role="button" @tap="handleClose">
          ×
        </view>
      </view>

      <scroll-view scroll-y class="export-body">
        <template v-if="activeTab === 'form'">
          <view class="section">
            <view class="section-title">尺寸与分辨率</view>
            <view class="section-desc">选择导出尺寸或自定义宽高，分辨率将影响打印清晰度</view>
            <view class="size-list">
              <view
                v-for="option in sizeOptionsList"
                :key="option.key"
                class="size-item"
                :class="{ selected: option.key === form.presetKey }"
                role="button"
                @tap="() => handlePreset(option.key)"
              >
                <view class="size-name">{{ option.label }}</view>
                <view class="size-meta">比例 {{ option.ratio }} · {{ option.description }}</view>
                <view v-if="option.category === 'print'" class="size-tag">打印推荐</view>
              </view>
            </view>
            <view v-if="isCustom" class="custom-grid">
              <view class="field">
                <view class="field-label">自定义宽度（px）</view>
                <UiInput v-model="widthInput" type="number" placeholder="如 2480" @blur="handleWidthBlur" />
                <view v-if="formErrors.width" class="field-error">{{ formErrors.width }}</view>
              </view>
              <view class="field">
                <view class="field-label">自定义高度（px）</view>
                <UiInput v-model="heightInput" type="number" placeholder="如 3508" @blur="handleHeightBlur" />
                <view v-if="formErrors.height" class="field-error">{{ formErrors.height }}</view>
              </view>
            </view>
            <view class="field">
              <view class="field-label">分辨率（DPI）</view>
              <picker mode="selector" :range="dpiOptions" @change="handleDpiChange">
                <view class="picker-display">
                  {{ form.dpi }} DPI
                </view>
              </picker>
              <view v-if="formErrors.dpi" class="field-error">{{ formErrors.dpi }}</view>
            </view>
            <view v-if="selectedPreset?.category === 'print'" class="bleed-notice">
              <view class="bleed-title">打印出血说明</view>
              <view class="bleed-text">
                已自动为打印尺寸保留 {{ form.bleed }}mm 出血，请确认设计元素延伸到安全线外以避免裁切留白。
              </view>
            </view>
          </view>

          <view class="section">
            <view class="section-title">文件输出</view>
            <view class="section-desc">选择输出格式与文件命名方式</view>
            <view class="field">
              <view class="field-label">格式</view>
              <picker mode="selector" :range="formatOptions" range-key="label" @change="handleFormatChange">
                <view class="picker-display">
                  {{ currentFormat.label }} · {{ currentFormat.description }}
                </view>
              </picker>
            </view>
            <view class="field">
              <view class="field-label">导出文件名</view>
              <UiInput v-model="naming" placeholder="例如 创意日历-三月" @blur="handleNamingBlur" />
              <view v-if="formErrors.naming" class="field-error">{{ formErrors.naming }}</view>
            </view>
          </view>

          <view class="section">
            <view class="section-title">水印与附加设置</view>
            <view class="section-desc">可选添加轻量水印或自定义文案</view>
            <view class="field">
              <view class="field-label">水印</view>
              <picker mode="selector" :range="watermarkOptions" range-key="label" @change="handleWatermarkChange">
                <view class="picker-display">
                  {{ currentWatermark.label }} · {{ currentWatermark.description }}
                </view>
              </picker>
            </view>
            <view v-if="form.watermark === 'text'" class="field">
              <view class="field-label">水印文案</view>
              <UiInput v-model="watermarkText" placeholder="输入要叠加的水印" @blur="handleWatermarkBlur" />
              <view v-if="formErrors.watermarkText" class="field-error">{{ formErrors.watermarkText }}</view>
            </view>
            <view class="switch-row">
              <view>
                <view class="switch-title">保留出血区域</view>
                <view class="switch-desc">打印时建议开启，导出 PNG/JPG 可关闭</view>
              </view>
              <switch :checked="form.includeBleed" :disabled="selectedPreset?.category === 'print'" @change="handleBleedToggle" />
            </view>
            <view v-if="form.includeBleed" class="field bleed-field">
              <view class="field-label">出血宽度（mm）</view>
              <UiInput v-model="bleedInput" type="number" placeholder="例如 3" @blur="handleBleedBlur" />
            </view>
          </view>
        </template>

        <template v-else>
          <view v-if="!recordList.length" class="empty-records">
            <view class="empty-title">暂未生成记录</view>
            <view class="empty-desc">完成一次导出后将在此展示历史记录。</view>
          </view>
          <view v-else class="record-list">
            <view class="record-toolbar">
              <view class="record-count">共 {{ recordList.length }} 条导出记录</view>
              <UiButton variant="ghost" size="sm" @click="clearHistory">清空</UiButton>
            </view>
            <UiCard
              v-for="record in recordList"
              :key="record.id"
              padding="md"
              class="record-card"
            >
              <view class="record-header">
                <view>
                  <view class="record-name">{{ record.naming }}</view>
                  <view class="record-meta">
                    {{ formatTime(record.createdAt) }} · {{ record.format.toUpperCase() }} · {{ record.dpi }} DPI
                  </view>
                </view>
                <UiButton size="sm" variant="secondary" @click="() => reuseRecord(record)">
                  复用参数
                </UiButton>
              </view>
              <view class="record-body">
                <view class="record-line">尺寸：{{ record.width }} × {{ record.height }} px</view>
                <view class="record-line">预设：{{ record.presetLabel }}</view>
                <view class="record-line">
                  出血：{{ record.includeBleed ? record.bleed + 'mm' : '未保留' }} · 水印：{{ describeWatermark(record) }}
                </view>
                <view class="record-line">耗时：{{ Math.max(1, Math.round(record.durationMs / 1000)) }}s（mock）</view>
              </view>
            </UiCard>
          </view>
        </template>
      </scroll-view>

      <view v-if="activeTab === 'form'" class="export-footer">
        <view v-if="exporting" class="progress-block">
          <view class="progress-status">{{ progressMessage }}</view>
          <view class="progress-bar">
            <view class="progress-inner" :style="{ width: progress + '%' }" />
          </view>
        </view>
        <UiButton :disabled="exporting" block @click="handleExport">
          {{ exporting ? '正在导出…' : '开始导出' }}
        </UiButton>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import UiButton from '../ui-button/UiButton.vue'
import UiCard from '../ui-card/UiCard.vue'
import UiInput from '../ui-input/UiInput.vue'
import { useExportStore } from '../../stores/export'
import type { ExportPresetKey, ExportRecord } from '../../stores/export'

defineOptions({
  name: 'ExportPanel',
})

interface Props {
  visible: boolean
  defaultTab?: 'form' | 'records'
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  defaultTab: 'form',
})

const emit = defineEmits<{ (event: 'close'): void }>()

const exportStore = useExportStore()

const activeTab = ref<'form' | 'records'>(props.defaultTab)

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      activeTab.value = props.defaultTab
      syncInputs()
    }
  }
)

watch(
  () => props.defaultTab,
  (tab) => {
    if (props.visible) {
      activeTab.value = tab
    }
  }
)

const form = exportStore.form
const errors = exportStore.errors
const sizeOptions = exportStore.sizeOptions
const dpiOptions = exportStore.dpiOptions
const formatOptions = exportStore.formatOptions
const watermarkOptions = exportStore.watermarkOptions
const records = exportStore.records

const exportingRef = exportStore.isExporting as unknown as { value: boolean }
const progressRef = exportStore.progress as unknown as { value: number }
const progressMessageRef = exportStore.progressMessage as unknown as { value: string }

const progress = computed(() => progressRef.value)
const progressMessage = computed(() => progressMessageRef.value || '准备导出…')
const exporting = computed(() => exportingRef.value)

const sizeOptionsList = computed(() => sizeOptions.value)
const formErrors = computed(() => errors.value)
const recordList = computed(() => records.value)

const selectedPreset = exportStore.selectedPreset
const isCustom = exportStore.isCustomPreset

const currentFormat = computed(() =>
  formatOptions.find((item) => item.value === form.format) ?? formatOptions[0]
)

const currentWatermark = computed(() =>
  watermarkOptions.find((item) => item.value === form.watermark) ?? watermarkOptions[0]
)

const naming = ref(form.naming)
const widthInput = ref(form.width.toString())
const heightInput = ref(form.height.toString())
const bleedInput = ref(form.bleed.toString())
const watermarkText = ref(form.watermarkText)

function syncInputs() {
  naming.value = form.naming
  widthInput.value = form.width.toString()
  heightInput.value = form.height.toString()
  bleedInput.value = form.bleed.toString()
  watermarkText.value = form.watermarkText
}

watch(
  () => form.presetKey,
  () => {
    widthInput.value = form.width.toString()
    heightInput.value = form.height.toString()
  }
)

watch(
  () => form.includeBleed,
  (val) => {
    if (!val) {
      bleedInput.value = '0'
    } else {
      bleedInput.value = form.bleed.toString()
    }
  }
)

watch(
  () => form.watermark,
  () => {
    watermarkText.value = form.watermarkText
  }
)

function switchTab(tab: 'form' | 'records') {
  if (tab === 'form' && exportingRef.value) return
  activeTab.value = tab
}

function handleClose() {
  if (exportingRef.value) return
  emit('close')
}

function handleMask() {
  handleClose()
}

function handlePreset(key: ExportPresetKey) {
  exportStore.setPreset(key)
}

function handleDpiChange(event: any) {
  const index = Number(event?.detail?.value ?? 0)
  const next = dpiOptions[index] ?? form.dpi
  exportStore.updateDpi(Number(next))
}

function handleFormatChange(event: any) {
  const index = Number(event?.detail?.value ?? 0)
  const option = formatOptions[index] ?? formatOptions[0]
  exportStore.updateFormat(option.value)
}

function handleWatermarkChange(event: any) {
  const index = Number(event?.detail?.value ?? 0)
  const option = watermarkOptions[index] ?? watermarkOptions[0]
  exportStore.updateWatermark(option.value)
}

function handleBleedToggle(event: any) {
  const checked = !!(event?.detail?.value ?? false)
  exportStore.updateIncludeBleed(checked)
  if (checked && !Number(bleedInput.value)) {
    bleedInput.value = form.bleed.toString()
  }
}

function parseNumber(value: string) {
  const cleaned = value.replace(/[^0-9]/g, '')
  return cleaned ? Number(cleaned) : NaN
}

function handleWidthBlur() {
  const value = parseNumber(widthInput.value)
  if (!Number.isNaN(value)) {
    exportStore.updateWidth(value)
    widthInput.value = exportStore.form.width.toString()
  } else {
    widthInput.value = exportStore.form.width.toString()
  }
}

function handleHeightBlur() {
  const value = parseNumber(heightInput.value)
  if (!Number.isNaN(value)) {
    exportStore.updateHeight(value)
    heightInput.value = exportStore.form.height.toString()
  } else {
    heightInput.value = exportStore.form.height.toString()
  }
}

function handleBleedBlur() {
  const value = parseNumber(bleedInput.value)
  if (!Number.isNaN(value)) {
    exportStore.updateBleed(value)
    bleedInput.value = exportStore.form.bleed.toString()
  } else {
    bleedInput.value = exportStore.form.bleed.toString()
  }
}

function handleNamingBlur() {
  exportStore.updateNaming(naming.value)
}

function handleWatermarkBlur() {
  exportStore.updateWatermarkText(watermarkText.value)
}

function handleExport() {
  exportStore.updateNaming(naming.value)
  if (form.watermark === 'text') {
    exportStore.updateWatermarkText(watermarkText.value)
  }
  if (isCustom.value) {
    handleWidthBlur()
    handleHeightBlur()
  }
  if (form.includeBleed) {
    handleBleedBlur()
  }
  exportStore.startExport()
}

function reuseRecord(record: ExportRecord) {
  exportStore.applyRecord(record)
  syncInputs()
  activeTab.value = 'form'
}

function clearHistory() {
  if (!records.value.length) return
  if (typeof uni !== 'undefined' && typeof uni.showModal === 'function') {
    uni.showModal({
      title: '清空导出记录',
      content: '确定清空所有导出记录吗？',
      success(res) {
        if (res.confirm) {
          exportStore.clearRecords()
        }
      },
    })
  } else {
    exportStore.clearRecords()
  }
}

function describeWatermark(record: ExportRecord) {
  if (record.watermark === 'none') return '未添加'
  if (record.watermark === 'logo') return 'LOGO 水印'
  return record.watermarkText ? `自定义文本「${record.watermarkText}」` : '自定义文本'
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '--'
  const pad = (value: number) => (value < 10 ? `0${value}` : `${value}`)
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  return `${year}-${month}-${day} ${hour}:${minute}`
}
</script>

<style scoped>
.export-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.export-mask {
  position: absolute;
  inset: 0;
  background: rgba(17, 24, 39, 0.48);
  backdrop-filter: blur(4px);
}

.export-panel {
  position: relative;
  width: 86vw;
  max-width: 640px;
  max-height: 92vh;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-overlay);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.export-header {
  padding: 24rpx 28rpx;
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: var(--color-surface);
  border-bottom: 2rpx solid var(--color-border);
}

.header-info {
  flex: 1;
  min-width: 0;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--color-text);
}

.header-sub {
  font-size: 24rpx;
  color: var(--color-text-muted);
  margin-top: 4rpx;
}

.header-tabs {
  display: flex;
  gap: 12rpx;
}

.tab {
  padding: 12rpx 20rpx;
  border-radius: var(--radius-lg);
  border: 2rpx solid transparent;
  font-size: 24rpx;
  color: var(--color-text-muted);
  background: var(--color-surface-muted, rgba(124, 108, 255, 0.08));
}

.tab.active {
  border-color: rgba(124, 108, 255, 0.32);
  color: var(--color-primary);
  background: rgba(124, 108, 255, 0.12);
}

.tab.disabled {
  opacity: 0.4;
}

.header-close {
  font-size: 40rpx;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.header-close.disabled {
  opacity: 0.4;
}

.export-body {
  flex: 1;
  padding: 24rpx 28rpx 32rpx;
  display: flex;
  flex-direction: column;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text);
}

.section-desc {
  font-size: 24rpx;
  color: var(--color-text-muted);
}

.size-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.size-item {
  padding: 20rpx 24rpx;
  border-radius: var(--radius-lg);
  border: 2rpx solid var(--color-border);
  background: var(--color-surface-muted, rgba(255, 255, 255, 0.6));
}

.size-item.selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4rpx rgba(124, 108, 255, 0.16);
}

.size-name {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-text);
}

.size-meta {
  font-size: 22rpx;
  margin-top: 6rpx;
  color: var(--color-text-muted);
}

.size-tag {
  margin-top: 8rpx;
  display: inline-flex;
  padding: 6rpx 12rpx;
  border-radius: var(--radius-pill);
  background: rgba(124, 108, 255, 0.12);
  color: var(--color-primary);
  font-size: 20rpx;
}

.custom-grid {
  display: flex;
  gap: 16rpx;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.field-label {
  font-size: 24rpx;
  color: var(--color-text);
}

.field-error {
  font-size: 22rpx;
  color: #ff4d4f;
}

.picker-display {
  min-height: 88rpx;
  padding: 0 24rpx;
  border-radius: var(--radius-md);
  border: 2rpx solid var(--color-border);
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: var(--color-text);
  background: var(--color-surface-muted, rgba(255, 255, 255, 0.6));
}

.bleed-notice {
  padding: 20rpx 24rpx;
  border-radius: var(--radius-lg);
  background: rgba(12, 83, 62, 0.08);
  border: 2rpx solid rgba(12, 83, 62, 0.18);
  color: #0c533e;
}

.bleed-title {
  font-size: 24rpx;
  font-weight: 600;
}

.bleed-text {
  font-size: 22rpx;
  margin-top: 6rpx;
  line-height: 1.6;
}

.switch-row {
  margin-top: 12rpx;
  padding: 20rpx 24rpx;
  border-radius: var(--radius-lg);
  border: 2rpx solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  background: var(--color-surface-muted, rgba(255, 255, 255, 0.6));
}

.switch-title {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-text);
}

.switch-desc {
  font-size: 22rpx;
  color: var(--color-text-muted);
  margin-top: 6rpx;
}

.bleed-field {
  margin-top: 16rpx;
  max-width: 240rpx;
}

.export-footer {
  padding: 24rpx 28rpx;
  border-top: 2rpx solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  background: var(--color-surface);
}

.progress-block {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.progress-status {
  font-size: 24rpx;
  color: var(--color-text-muted);
}

.progress-bar {
  height: 16rpx;
  border-radius: var(--radius-pill);
  background: rgba(124, 108, 255, 0.12);
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.empty-records {
  margin: 160rpx 0 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  color: var(--color-text-muted);
}

.empty-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--color-text);
}

.empty-desc {
  font-size: 24rpx;
  text-align: center;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.record-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-text-muted);
  font-size: 24rpx;
}

.record-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.record-name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text);
}

.record-meta {
  font-size: 22rpx;
  color: var(--color-text-muted);
  margin-top: 6rpx;
}

.record-body {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  font-size: 24rpx;
  color: var(--color-text);
}

.record-line {
  color: var(--color-text-muted);
  font-size: 24rpx;
}
</style>

<template>
  <view class="calendar-props">
    <view v-if="!calendarLayer" class="calendar-props__empty">
      <text class="empty-title">未选中日历元素</text>
      <text class="empty-desc">选择画布中的日历图层后，可在此调整参数。</text>
    </view>
    <view v-else class="calendar-props__form">
      <view class="form-section">
        <text class="section-title">结构</text>
        <view class="form-row">
          <text class="row-label">周起始</text>
          <picker :range="weekStartOptions" range-key="label" :value="currentWeekStartIndex" @change="onWeekStartChange">
            <view class="picker-value">{{ currentWeekStart.label }}</view>
          </picker>
        </view>
        <view class="form-row">
          <text class="row-label">显示周序号</text>
          <switch :checked="form.showWeekNumber" @change="(e) => updateBoolean('showWeekNumber', e.detail.value)" />
        </view>
      </view>

      <view class="form-section">
        <text class="section-title">显示内容</text>
        <view class="form-row" v-for="item in displayToggles" :key="item.key">
          <text class="row-label">{{ item.label }}</text>
          <switch :checked="form[item.key]" @change="(e) => updateBoolean(item.key, e.detail.value)" />
        </view>
      </view>

      <view class="form-section">
        <text class="section-title">高亮规则</text>
        <view class="form-row" v-for="item in highlightToggles" :key="item.key">
          <text class="row-label">{{ item.label }}</text>
          <switch :checked="form[item.key]" @change="(e) => updateBoolean(item.key, e.detail.value)" />
        </view>
        <view class="form-row multiline">
          <text class="row-label">自定义</text>
          <input
            class="text-input"
            type="text"
            :value="form.highlightExpression"
            placeholder="示例：2024-02-10, weekday=6"
            @input="onHighlightInput"
          />
        </view>
        <text class="tip">可使用逗号分隔多个条件，支持 weekday=0~6、weekend、today、festival=节日名、lunar=初一、ISO 日期。</text>
      </view>

      <view class="form-section">
        <text class="section-title">样式</text>
        <view class="form-row slider-row">
          <text class="row-label">圆角</text>
          <slider
            class="slider"
            :min="0"
            :max="120"
            :step="1"
            :value="form.radius"
            @changing="(e) => updateRadius(Number(e.detail.value))"
            @change="(e) => updateRadius(Number(e.detail.value))"
          />
          <text class="slider-value">{{ form.radius }} px</text>
        </view>
        <view class="form-row slider-row">
          <text class="row-label">内边距</text>
          <slider
            class="slider"
            :min="0"
            :max="160"
            :step="2"
            :value="form.padding"
            @changing="(e) => updatePadding(Number(e.detail.value))"
            @change="(e) => updatePadding(Number(e.detail.value))"
          />
          <text class="slider-value">{{ form.padding }} px</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, watch } from 'vue'
import { useEditorStore } from '../../../stores/editor'
import { debounce } from '../utils/timing'

const store = useEditorStore()
const calendarLayer = computed(() => store.activeCalendarLayer.value)

const weekStartOptions = [
  { label: '周一开始', value: 1 },
  { label: '周日开始', value: 0 },
]

const displayToggles = [
  { key: 'showLunar' as const, label: '显示农历' },
  { key: 'showSolarTerm' as const, label: '显示节气' },
  { key: 'showFestivals' as const, label: '显示节日' },
  { key: 'showHolidays' as const, label: '假期角标' },
]

const highlightToggles = [
  { key: 'highlightToday' as const, label: '高亮今日' },
  { key: 'highlightWeekend' as const, label: '高亮周末' },
  { key: 'highlightHolidays' as const, label: '高亮假期' },
]

const form = reactive({
  weekStart: 1,
  showWeekNumber: false,
  showLunar: true,
  showSolarTerm: true,
  showFestivals: true,
  showHolidays: true,
  highlightToday: true,
  highlightWeekend: true,
  highlightHolidays: true,
  highlightExpression: '',
  radius: 32,
  padding: 40,
})

const currentWeekStart = computed(() => {
  return weekStartOptions.find((item) => item.value === form.weekStart) ?? weekStartOptions[0]
})

const currentWeekStartIndex = computed(() => {
  const index = weekStartOptions.findIndex((item) => item.value === form.weekStart)
  return index >= 0 ? index : 0
})

const commitRadius = debounce((value: number) => {
  const layer = calendarLayer.value
  if (!layer) return
  store.updateLayer(layer.id, { props: { radius: value } })
}, 120)

const commitPadding = debounce((value: number) => {
  const layer = calendarLayer.value
  if (!layer) return
  store.updateLayer(layer.id, { props: { padding: value } })
}, 120)

const commitHighlightExpression = debounce((value: string) => {
  const layer = calendarLayer.value
  if (!layer) return
  store.updateLayer(layer.id, { props: { highlightExpression: value } })
}, 200)

function updateBoolean(key: keyof typeof form, value: boolean) {
  const layer = calendarLayer.value
  if (!layer) return
  ;(form as any)[key] = value
  store.updateLayer(layer.id, { props: { [key]: value } })
}

function onWeekStartChange(event: any) {
  const index = Number(event.detail.value || 0)
  const option = weekStartOptions[index] ?? weekStartOptions[0]
  form.weekStart = option.value
  const layer = calendarLayer.value
  if (!layer) return
  store.updateLayer(layer.id, { props: { weekStart: option.value } })
}

function updateRadius(value: number) {
  const normalized = Math.max(0, Math.round(value))
  form.radius = normalized
  commitRadius(normalized)
}

function updatePadding(value: number) {
  const normalized = Math.max(0, Math.round(value))
  form.padding = normalized
  commitPadding(normalized)
}

function onHighlightInput(event: any) {
  const value = String(event.detail.value ?? '')
  form.highlightExpression = value
  commitHighlightExpression(value)
}

watch(
  calendarLayer,
  (layer) => {
    if (!layer) return
    const props = layer.props
    form.weekStart = props.weekStart ?? 1
    form.showWeekNumber = !!props.showWeekNumber
    form.showLunar = props.showLunar !== false
    form.showSolarTerm = props.showSolarTerm !== false
    form.showFestivals = props.showFestivals !== false
    form.showHolidays = props.showHolidays !== false
    form.highlightToday = props.highlightToday !== false
    form.highlightWeekend = props.highlightWeekend !== false
    form.highlightHolidays = props.highlightHolidays !== false
    form.highlightExpression = props.highlightExpression ?? ''
    form.radius = props.radius ?? 32
    form.padding = props.padding ?? 40
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  commitRadius.cancel()
  commitPadding.cancel()
  commitHighlightExpression.cancel()
})
</script>

<style scoped lang="scss">
.calendar-props {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.calendar-props__empty {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 24rpx;
  border-radius: var(--editor-radius-md);
  background: rgba(112, 100, 255, 0.08);
  color: var(--editor-primary);
}

.empty-title {
  font-size: 28rpx;
  font-weight: 600;
}

.empty-desc {
  font-size: 24rpx;
  opacity: 0.8;
}

.calendar-props__form {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 24rpx;
  border-radius: var(--editor-radius-md);
  background: var(--editor-surface);
  box-shadow: 0 8rpx 24rpx rgba(31, 35, 48, 0.08);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.section-title {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--editor-text-primary);
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.form-row.multiline {
  align-items: flex-start;
}

.row-label {
  font-size: 24rpx;
  color: var(--editor-text-secondary);
}

.picker-value {
  min-width: 160rpx;
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: var(--editor-surface-subtle);
  color: var(--editor-text-primary);
  font-size: 24rpx;
  text-align: center;
}

.text-input {
  flex: 1;
  min-height: 64rpx;
  padding: 12rpx 18rpx;
  border-radius: var(--editor-radius-sm);
  background: var(--editor-surface-subtle);
  font-size: 24rpx;
  color: var(--editor-text-primary);
}

.tip {
  font-size: 22rpx;
  color: rgba(31, 35, 48, 0.55);
  line-height: 1.4;
}

.slider-row {
  flex-direction: column;
  align-items: stretch;
  gap: 12rpx;
}

.slider {
  width: 100%;
}

.slider-value {
  align-self: flex-end;
  font-size: 24rpx;
  color: var(--editor-text-secondary);
}
</style>

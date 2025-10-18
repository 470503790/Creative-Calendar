<template>
  <view class="text-tab">
    <view v-if="!textLayer" class="text-tab__empty">
      <text class="empty-title">未选中文本</text>
      <text class="empty-desc">请选择画布上的文本元素以调整样式。</text>
    </view>
    <view v-else class="text-tab__form">
      <view class="form-group">
        <text class="form-label">字体</text>
        <picker :range="fontFamilies" range-key="label" @change="onFontFamilyChange">
          <view class="picker-value">{{ currentFontFamily.label }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="form-label">字号</text>
        <view class="number-input">
          <button class="number-btn" @tap="updateFontSize(form.fontSize - 2)" :disabled="form.fontSize <= 12">-</button>
          <text class="number-value">{{ form.fontSize }} px</text>
          <button class="number-btn" @tap="updateFontSize(form.fontSize + 2)" :disabled="form.fontSize >= 96">+</button>
        </view>
      </view>
      <view class="form-group">
        <text class="form-label">字距</text>
        <slider
          class="slider"
          :min="-5"
          :max="20"
          :step="0.5"
          :value="form.letterSpacing"
          @changing="(e) => updateLetterSpacing(e.detail.value)"
          @change="(e) => updateLetterSpacing(e.detail.value)"
        />
        <text class="slider-value">{{ form.letterSpacing.toFixed(1) }} px</text>
      </view>
      <view class="form-group">
        <text class="form-label">行距</text>
        <slider
          class="slider"
          :min="1"
          :max="2.6"
          :step="0.1"
          :value="form.lineHeight"
          @changing="(e) => updateLineHeight(e.detail.value)"
          @change="(e) => updateLineHeight(e.detail.value)"
        />
        <text class="slider-value">× {{ form.lineHeight.toFixed(1) }}</text>
      </view>
      <view class="form-group">
        <text class="form-label">对齐</text>
        <view class="align-group">
          <button
            v-for="item in alignOptions"
            :key="item.value"
            class="align-btn"
            :class="{ active: form.align === item.value }"
            @tap="() => updateAlign(item.value)"
          >
            {{ item.label }}
          </button>
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
const textLayer = computed(() => store.activeTextLayer.value)

const fontFamilies = [
  { label: '苹方', value: 'PingFang SC' },
  { label: '思源黑体', value: 'Source Han Sans' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Karla', value: 'Karla' },
]

const alignOptions = [
  { label: '左', value: 'left' as CanvasTextAlign },
  { label: '中', value: 'center' as CanvasTextAlign },
  { label: '右', value: 'right' as CanvasTextAlign },
]

const form = reactive({
  fontFamily: 'PingFang SC',
  fontSize: 28,
  letterSpacing: 0,
  lineHeight: 1.4,
  align: 'center' as CanvasTextAlign,
})

const currentFontFamily = computed(() => fontFamilies.find((item) => item.value === form.fontFamily) ?? fontFamilies[0])

const commitFontSize = debounce((size: number) => {
  const layer = textLayer.value
  if (!layer) return
  store.updateLayer(layer.id, { props: { fontSize: size } })
}, 120)

const commitLetterSpacing = debounce((value: number) => {
  const layer = textLayer.value
  if (!layer) return
  store.updateLayer(layer.id, { props: { letterSpacing: value } })
}, 120)

const commitLineHeight = debounce((value: number) => {
  const layer = textLayer.value
  if (!layer) return
  store.updateLayer(layer.id, { props: { lineHeight: value } })
}, 120)

const commitAlign = debounce((value: CanvasTextAlign) => {
  const layer = textLayer.value
  if (!layer) return
  store.updateLayer(layer.id, { props: { align: value } })
}, 120)

const commitFontFamily = debounce((value: string) => {
  const layer = textLayer.value
  if (!layer) return
  store.updateLayer(layer.id, { props: { fontFamily: value } })
}, 120)

watch(
  textLayer,
  (layer) => {
    if (!layer) return
    form.fontFamily = layer.props?.fontFamily ?? 'PingFang SC'
    form.fontSize = layer.props?.fontSize ?? 28
    form.letterSpacing = layer.props?.letterSpacing ?? 0
    form.lineHeight = layer.props?.lineHeight ?? 1.4
    form.align = layer.props?.align ?? 'center'
  },
  { immediate: true }
)

function updateFontSize(size: number) {
  if (!textLayer.value) return
  const next = Math.max(12, Math.min(120, Math.round(size)))
  form.fontSize = next
  commitFontSize(next)
}

function updateLetterSpacing(value: number) {
  if (!textLayer.value) return
  form.letterSpacing = Number(value)
  commitLetterSpacing(form.letterSpacing)
}

function updateLineHeight(value: number) {
  if (!textLayer.value) return
  const normalized = Number(value)
  form.lineHeight = normalized
  commitLineHeight(normalized)
}

function updateAlign(value: CanvasTextAlign) {
  if (!textLayer.value) return
  form.align = value
  commitAlign(value)
}

function onFontFamilyChange(event: any) {
  const index = Number(event.detail.value || 0)
  const option = fontFamilies[index] ?? fontFamilies[0]
  if (!textLayer.value) return
  form.fontFamily = option.value
  commitFontFamily(option.value)
}

onBeforeUnmount(() => {
  commitFontSize.cancel()
  commitLetterSpacing.cancel()
  commitLineHeight.cancel()
  commitAlign.cancel()
  commitFontFamily.cancel()
})
</script>

<style scoped lang="scss">
.text-tab {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.text-tab__empty {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  align-items: flex-start;
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
  color: rgba(112, 100, 255, 0.7);
}

.text-tab__form {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 20rpx;
  border-radius: var(--editor-radius-md);
  background: var(--editor-surface);
  box-shadow: 0 6rpx 16rpx rgba(31, 35, 48, 0.08);
}

.form-label {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--editor-text-primary);
}

.picker-value {
  font-size: 26rpx;
  color: var(--editor-text-secondary);
}

.number-input {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.number-btn {
  width: 64rpx;
  line-height: 64rpx;
  text-align: center;
  border-radius: var(--editor-radius-sm);
  background: rgba(112, 100, 255, 0.12);
  color: var(--editor-primary);
}

.number-btn[disabled] {
  opacity: 0.4;
}

.number-value {
  font-size: 26rpx;
  color: var(--editor-text-primary);
}

.slider {
  margin-top: 12rpx;
}

.slider-value {
  font-size: 22rpx;
  color: var(--editor-text-secondary);
}

.align-group {
  display: flex;
  gap: 12rpx;
}

.align-btn {
  flex: 1;
  line-height: 64rpx;
  text-align: center;
  border-radius: var(--editor-radius-sm);
  background: rgba(112, 100, 255, 0.08);
  color: var(--editor-primary);
}

.align-btn.active {
  background: var(--editor-primary);
  color: #ffffff;
  font-weight: 600;
}
</style>

<template>
  <view class="export-sheet">
    <view class="export-meta">
      <text class="meta-title">导出设置</text>
      <view class="meta-row">
        <text class="meta-label">像素尺寸</text>
        <text class="meta-value">{{ resolution.width }} × {{ resolution.height }} px</text>
      </view>
      <view class="meta-row">
        <text class="meta-label">DPI</text>
        <text class="meta-value">{{ dpi }} dpi</text>
      </view>
    </view>
    <button class="export-btn" @tap="handleExport">{{ exportLabel }}</button>
    <view v-if="preview" class="export-preview">
      <image :src="preview" mode="widthFix" class="preview-image" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '../../../stores/editor'

const store = useEditorStore()
const dpi = 300
const preview = ref('')
const isH5 = process.env.UNI_PLATFORM === 'h5'

const resolution = computed(() => {
  const page = store.activePage.value
  return {
    width: Math.round(page?.width ?? 1242),
    height: Math.round(page?.height ?? 2208),
  }
})

const exportLabel = computed(() => (isH5 ? '导出 PNG' : '保存到本地（占位）'))

async function handleExport() {
  if (!isH5) {
    uni.showToast({ title: '将接入保存相册权限', icon: 'none' })
    return
  }
  await new Promise((resolve) => setTimeout(resolve, 16))
  const canvas = document.getElementById('editor-canvas') as HTMLCanvasElement | null
  if (!canvas) {
    uni.showToast({ title: '未找到画布', icon: 'none' })
    return
  }
  const dataUrl = canvas.toDataURL('image/png')
  preview.value = dataUrl
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = 'creative-calendar.png'
  link.click()
  uni.showToast({ title: '已下载 PNG', icon: 'success' })
}
</script>

<style scoped lang="scss">
.export-sheet {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.export-meta {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 24rpx;
  border-radius: var(--editor-radius-md);
  background: var(--editor-surface);
  box-shadow: 0 6rpx 18rpx rgba(31, 35, 48, 0.08);
}

.meta-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--editor-text-primary);
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: var(--editor-text-secondary);
}

.meta-label {
  font-weight: 500;
}

.meta-value {
  font-weight: 600;
  color: var(--editor-text-primary);
}

.export-btn {
  line-height: 72rpx;
  border-radius: var(--editor-radius-md);
  background: var(--editor-primary);
  color: #ffffff;
  font-size: 28rpx;
}

.export-preview {
  margin-top: 12rpx;
  border-radius: var(--editor-radius-md);
  overflow: hidden;
  background: var(--editor-surface);
}

.preview-image {
  width: 100%;
  display: block;
}
</style>

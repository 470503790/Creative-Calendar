<template>
  <view class="page">
    <view v-if="tpl" class="wrap">
      <view class="hero-card">
        <view class="preview" :style="{ paddingBottom: previewPadding }">
          <image class="preview-img" :src="tpl.coverUrl" mode="aspectFill" />
          <view class="preview-overlay" />
          <view class="preview-label">
            <text class="label-primary">{{ activeSizeLabel }}</text>
            <text class="label-sub">{{ activeSizeMeta }}</text>
          </view>
        </view>
        <view class="hero-info">
          <view class="title">{{ tpl.title }}</view>
          <view class="meta">
            <text v-for="tag in tpl.tags" :key="tag" class="tag">#{{ tag }}</text>
          </view>
          <view class="author-card">
            <view class="author-avatar">{{ authorInitial }}</view>
            <view class="author-info">
              <view class="author-name">{{ authorName }}</view>
              <view class="author-desc">创意日历 · 认证创作者</view>
            </view>
          </view>
          <view v-if="tpl.colors?.length" class="color-palette">
            <view
              v-for="color in tpl.colors"
              :key="color"
              class="color-dot"
              :style="{ background: color }"
            />
          </view>
          <view class="actions">
            <button
              class="use"
              :loading="isUsing"
              :disabled="isUsing"
              @click="useThis"
            >
              {{ isUsing ? '生成中…' : '使用此模板' }}
            </button>
            <button class="fav" :class="{ 'is-active': isFavorite }" @click="toggleFavorite">
              {{ isFavorite ? '已收藏' : '收藏' }}
            </button>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-title">适配尺寸</view>
        <view class="chips">
          <view
            v-for="size in sizeOptions"
            :key="size.key"
            class="chip"
            :class="{ 'is-active': size.key === activeSizeKey }"
            @click="selectSize(size.key)"
          >
            <view class="chip-label">{{ size.label }}</view>
            <view class="chip-meta">{{ size.width }}×{{ size.height }}</view>
            <view class="chip-hint">{{ size.ratioLabel }}</view>
          </view>
        </view>
        <view v-if="sizeHint" class="size-hint">{{ sizeHint }}</view>
      </view>

      <view class="section">
        <view class="section-title">模板描述</view>
        <view class="section-body">
          <text>
            适合用于 {{ highlightedTags }} 等场景，支持以上尺寸一键生成，切换尺寸时预览比例会即时更新。
          </text>
        </view>
      </view>
    </view>
    <view v-else class="empty">
      <view class="hint">未找到对应模板，返回模板库看看其他灵感吧。</view>
      <button size="mini" @click="goTemplates">返回模板库</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref, watch } from 'vue'
import type { TemplateDetail, TemplateSizeOption } from '../../utils/mock-api'
import { createProjectFromTemplate, getTemplateDetail } from '../../utils/mock-api'

const FAVORITE_STORAGE_KEY = 'cc.favorites.templates'

const id = ref('')
const detail = ref<TemplateDetail | null>(null)
const tpl = computed(() => detail.value)
const activeSizeKey = ref('')
const isUsing = ref(false)
const favoriteIds = ref<string[]>([])

const sizeOptions = computed<TemplateSizeOption[]>(() => tpl.value?.sizes ?? [])
const selectedSize = computed<TemplateSizeOption | null>(() => {
  if (!sizeOptions.value.length) return null
  return sizeOptions.value.find((size) => size.key === activeSizeKey.value) ?? sizeOptions.value[0]
})

const previewPadding = computed(() => {
  const { width, height } = resolvePreviewSize()
  if (!width || !height) return '160%'
  const ratio = clamp(height / width, 0.5, 2.4)
  return `${(ratio * 100).toFixed(2)}%`
})

const activeSizeLabel = computed(() => selectedSize.value?.label ?? '默认尺寸')
const activeSizeMeta = computed(() => {
  const { width, height } = resolvePreviewSize()
  if (!width || !height) return '1080×1920'
  return `${width}×${height}`
})

const sizeHint = computed(() => selectedSize.value?.hint ?? '切换不同尺寸可即时预览对应比例')

const isFavorite = computed(() => {
  if (!id.value) return false
  if (detail.value?.isFavorite !== undefined) return !!detail.value.isFavorite
  return favoriteIds.value.includes(id.value)
})

const highlightedTags = computed(() => {
  if (!tpl.value?.tags?.length) return '多种日历' 
  return tpl.value.tags.slice(0, 3).join('、')
})

const authorName = computed(() => detail.value?.author?.name || '未知创作者')
const authorInitial = computed(() => authorName.value.slice(0, 1).toUpperCase())

onLoad(async (q) => {
  loadFavorites()
  id.value = (q?.id as string) || ''
  if (!id.value) return
  const fetched = await getTemplateDetail(id.value)
  if (!fetched) {
    detail.value = null
    return
  }
  const isFav = favoriteIds.value.includes(fetched.id)
  detail.value = { ...fetched, isFavorite: isFav }
})

watch(sizeOptions, (options) => {
  if (!options.length) {
    activeSizeKey.value = ''
    return
  }
  if (!options.some((option) => option.key === activeSizeKey.value)) {
    activeSizeKey.value = options[0].key
  }
}, { immediate: true })

function resolvePreviewSize() {
  const size = selectedSize.value
  if (size) return { width: size.width, height: size.height }
  const page = detail.value?.schema?.pages?.[0]
  return {
    width: Number(page?.width) || 1080,
    height: Number(page?.height) || 1920,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function loadFavorites() {
  try {
    const stored = uni.getStorageSync(FAVORITE_STORAGE_KEY)
    if (Array.isArray(stored)) {
      favoriteIds.value = stored
    } else if (typeof stored === 'string' && stored) {
      const parsed = JSON.parse(stored)
      favoriteIds.value = Array.isArray(parsed) ? parsed : []
    } else {
      favoriteIds.value = []
    }
  } catch (error) {
    console.warn('Failed to load favorites', error)
    favoriteIds.value = []
  }
}

function persistFavorites(next: string[]) {
  favoriteIds.value = next
  uni.setStorageSync(FAVORITE_STORAGE_KEY, next)
}

function toggleFavorite() {
  if (!id.value) return
  const nextState = !isFavorite.value
  const set = new Set(favoriteIds.value)
  if (nextState) set.add(id.value)
  else set.delete(id.value)
  const next = Array.from(set)
  persistFavorites(next)
  if (detail.value) {
    detail.value = { ...detail.value, isFavorite: nextState }
  }
  uni.showToast({ title: nextState ? '已加入收藏' : '已取消收藏', icon: 'none' })
}

async function useThis() {
  if (!id.value || isUsing.value) return
  isUsing.value = true
  uni.showLoading({ title: '生成中', mask: true })
  try {
    const { projectId } = await createProjectFromTemplate(id.value)
    uni.navigateTo({ url: `/pages/editor/index?pid=${projectId}` })
  } catch (error) {
    console.warn('Failed to create project', error)
    uni.showToast({ title: '生成失败，请稍后重试', icon: 'none' })
  } finally {
    uni.hideLoading()
    isUsing.value = false
  }
}

function selectSize(key: string) {
  activeSizeKey.value = key
}

function goTemplates() {
  uni.switchTab({ url: '/pages/templates/index' })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-background);
  padding: 24rpx;
  box-sizing: border-box;
}

.wrap {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.hero-card {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 24rpx;
  box-shadow: var(--shadow-card);
}

.preview {
  position: relative;
  width: 100%;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--color-surface-muted);
  transition: padding-bottom 0.2s ease;
}

.preview-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(17, 24, 39, 0) 0%, rgba(17, 24, 39, 0.4) 100%);
}

.preview-label {
  position: absolute;
  left: 24rpx;
  bottom: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(17, 24, 39, 0.68);
  color: #fff;
  backdrop-filter: blur(12rpx);
}

.label-primary {
  font-size: 28rpx;
  font-weight: 600;
}

.label-sub {
  font-size: 22rpx;
  opacity: 0.8;
}

.hero-info {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.title {
  font-size: var(--font-subtitle);
  font-weight: 700;
  color: var(--color-text);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  color: var(--color-text-muted);
}

.tag {
  font-size: var(--font-caption);
}

.author-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx;
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
}

.author-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(124, 108, 255, 0.4), rgba(14, 165, 233, 0.4));
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  color: var(--color-text);
}

.author-name {
  font-size: var(--font-body);
  font-weight: 600;
}

.author-desc {
  font-size: var(--font-caption);
  color: var(--color-text-muted);
}

.color-palette {
  display: flex;
  gap: 12rpx;
}

.color-dot {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4rpx 12rpx rgba(15, 23, 42, 0.1);
}

.actions {
  display: flex;
  gap: 16rpx;
}

.use {
  flex: 1;
  background: var(--color-primary);
  color: var(--color-on-primary);
  border-radius: var(--radius-lg);
}

.fav {
  min-width: 160rpx;
  border-radius: var(--radius-lg);
  background: rgba(124, 108, 255, 0.12);
  color: var(--color-primary);
  border: 2rpx solid transparent;
}

.fav.is-active {
  background: rgba(236, 72, 153, 0.12);
  color: #ec4899;
  border-color: rgba(236, 72, 153, 0.3);
}

.section {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 24rpx;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.section-title {
  font-size: var(--font-body);
  font-weight: 600;
  color: var(--color-text);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.chip {
  width: calc(50% - 8rpx);
  min-width: 240rpx;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  padding: 16rpx 20rpx;
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
  color: var(--color-text);
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  box-shadow: inset 0 0 0 2rpx rgba(124, 108, 255, 0);
}

.chip.is-active {
  background: rgba(124, 108, 255, 0.12);
  box-shadow: inset 0 0 0 2rpx rgba(124, 108, 255, 0.5);
  transform: translateY(-4rpx);
}

.chip-label {
  font-size: var(--font-body);
  font-weight: 600;
}

.chip-meta {
  font-size: var(--font-caption);
  color: var(--color-text);
  opacity: 0.8;
}

.chip-hint {
  font-size: 22rpx;
  color: var(--color-text-muted);
}

.size-hint {
  font-size: var(--font-caption);
  color: var(--color-text-muted);
}

.section-body {
  font-size: var(--font-body);
  color: var(--color-text);
  line-height: 1.6;
}

.empty {
  padding: 48rpx 24rpx;
  text-align: center;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.hint {
  font-size: var(--font-body);
}
</style>

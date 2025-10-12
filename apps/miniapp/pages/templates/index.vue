<template>
  <view class="page">
    <view class="search-bar">
      <view class="input-wrapper">
        <input
          v-model="searchTerm"
          placeholder="搜索模板关键字…"
          confirm-type="search"
          @confirm="doSearch"
        />
        <view v-if="searchTerm" class="clear" @click="clearSearch">✕</view>
      </view>
      <button v-if="showReset" class="search-reset" plain size="mini" @click="resetAll">
        重置
      </button>
    </view>

    <view class="result-summary">
      <text class="result-count">共 {{ resultCount }} 个模板</text>
      <text v-if="hasFiltersApplied" class="result-hint">已应用筛选</text>
    </view>

    <view class="filters">
      <view v-for="group in filters" :key="group.key" class="filter-group">
        <view class="filter-label">{{ group.label }}</view>
        <scroll-view
          class="filter-scroll"
          scroll-x
          :show-scrollbar="false"
          enable-flex="true"
        >
          <view class="filter-options">
            <view
              v-for="option in group.options"
              :key="option.value"
              class="filter-chip"
              :class="{ 'is-active': isActive(group.key, option.value) }"
              @click="onToggle(group.key, option.value)"
            >
              <view
                v-if="option.swatch"
                class="chip-swatch"
                :style="{ background: option.swatch }"
              />
              <text class="chip-label">{{ option.label }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <view v-if="status === 'loading'" class="state state-loading">
      <view class="skeleton-grid">
        <view v-for="n in 8" :key="n" class="skeleton-tile" />
      </view>
    </view>
    <view v-else-if="status === 'error'" class="state state-error">
      <text class="state-title">模板加载失败</text>
      <text class="state-desc">请检查网络后再次尝试</text>
      <button size="mini" @click="retry">重新加载</button>
    </view>
    <view v-else>
      <view v-if="isEmpty" class="state state-empty">
        <text class="state-title">没有找到匹配的模板</text>
        <text class="state-desc">尝试修改筛选条件或重置搜索</text>
        <button size="mini" @click="resetAll">清空条件</button>
      </view>
      <view v-else class="grid">
        <view
          v-for="item in filteredItems"
          :key="item.id"
          class="tile"
          @click="goDetail(item.id)"
        >
          <view class="cover-wrap">
            <image class="cover" :src="item.coverUrl" mode="aspectFill" />
            <view class="badges">
              <text v-if="item.isPro" class="badge badge-pro">会员</text>
              <text v-if="item.isDynamic" class="badge badge-dynamic">动态</text>
              <text v-if="item.isFavorite" class="badge badge-favorite">收藏</text>
            </view>
          </view>
          <view class="info">
            <view class="title">{{ item.title }}</view>
            <view class="meta">
              <text v-for="tag in item.tags" :key="tag" class="tag">#{{ tag }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="cta">
      <button size="mini" @click="goCreate">去创作</button>
      <button size="mini" plain @click="goWorks">看作品</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { FilterKey } from '../../stores/template'
import { useTemplateStore } from '../../stores/template'

const templateStore = useTemplateStore()

const filters = templateStore.filters
const filteredItems = templateStore.filteredItems
const status = templateStore.status
const isEmpty = templateStore.isEmpty

const searchTerm = computed({
  get: () => templateStore.query.value,
  set: (value: string) => templateStore.setQuery(value),
})

const resultCount = computed(() => filteredItems.value.length)
const hasFiltersApplied = computed(
  () => templateStore.hasActiveFilters.value || !!templateStore.query.value
)
const showReset = computed(() => hasFiltersApplied.value)

function doSearch() {
  templateStore.setQuery(searchTerm.value.trim())
}

function clearSearch() {
  templateStore.clearQuery()
}

function onToggle(key: FilterKey, value: string) {
  templateStore.toggleFilter(key, value)
}

function isActive(key: FilterKey, value: string) {
  return templateStore.activeFilters[key].includes(value)
}

function resetAll() {
  templateStore.reset()
}

function retry() {
  templateStore.loadTemplates(true)
}

onMounted(() => {
  templateStore.loadTemplates()
})

function goDetail(id: string) {
  if (!id) return
  uni.navigateTo({ url: `/pages/templates/detail?id=${id}` })
}
function goCreate() {
  uni.switchTab({ url: '/pages/editor/index' })
}
function goWorks() {
  uni.switchTab({ url: '/pages/works/index' })
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 24rpx;
  padding-bottom: 120rpx;
  background: var(--color-background);
  min-height: 100vh;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.input-wrapper {
  position: relative;
  flex: 1;
}

.input-wrapper input {
  width: 100%;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 16rpx 80rpx 16rpx 24rpx;
  box-shadow: var(--shadow-card);
  color: var(--color-text);
  font-size: var(--font-body);
}

.input-wrapper input::placeholder {
  color: var(--color-text-muted);
}

.clear {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-reset {
  min-width: 120rpx;
}

.result-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.result-count {
  color: var(--color-text);
}

.result-hint {
  color: var(--color-primary);
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.filter-label {
  font-size: var(--font-caption);
  color: var(--color-text-muted);
}

.filter-scroll {
  width: 100%;
}

.filter-options {
  display: flex;
  flex-wrap: nowrap;
  gap: 16rpx;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 20rpx;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  font-size: var(--font-caption);
  color: var(--color-text-muted);
  transition: background 0.2s ease, color 0.2s ease;
}

.filter-chip.is-active {
  background: rgba(124, 108, 255, 0.12);
  color: var(--color-primary);
  box-shadow: none;
}

.chip-swatch {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.5);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}

.tile {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.cover-wrap {
  position: relative;
  width: 100%;
  height: 360rpx;
  background: var(--color-surface-muted);
}

.cover {
  width: 100%;
  height: 100%;
}

.badges {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.badge {
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: var(--color-on-primary);
  background: rgba(17, 24, 39, 0.6);
  backdrop-filter: blur(8rpx);
}

.badge-pro {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: #fff7e6;
}

.badge-dynamic {
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
}

.badge-favorite {
  background: linear-gradient(135deg, #ec4899, #f472b6);
}

.info {
  padding: 0 16rpx 16rpx 16rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.title {
  font-size: var(--font-body);
  color: var(--color-text);
  line-height: 1.4;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  color: var(--color-text-muted);
}

.tag {
  font-size: var(--font-caption);
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 80rpx 24rpx;
  color: var(--color-text-muted);
  text-align: center;
}

.state-title {
  font-size: var(--font-body);
  color: var(--color-text);
}

.state-desc {
  font-size: var(--font-caption);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
  width: 100%;
}

.skeleton-tile {
  height: 420rpx;
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.06));
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -480rpx 0;
  }
  100% {
    background-position: 480rpx 0;
  }
}

.cta {
  display: flex;
  gap: 16rpx;
  justify-content: center;
  margin-top: auto;
  padding-bottom: 24rpx;
}
</style>

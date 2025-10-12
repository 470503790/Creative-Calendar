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
      <button v-if="showReset" class="search-reset" plain size="mini" @click="() => resetAll('search_bar')">
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

    <view v-if="status === 'loading' || status === 'idle'" class="state-block">
      <view class="grid grid--skeleton">
        <view v-for="n in 8" :key="`tpl-skel-${n}`" class="tile tile--skeleton">
          <UiSkeleton variant="block" height="260rpx" radius="32" />
          <view class="tile-body">
            <UiSkeleton width="80%" />
            <UiSkeleton width="60%" height="20rpx" />
          </view>
        </view>
      </view>
    </view>
    <view v-else-if="status === 'error'" class="state-block">
      <UiError :type="errorType === 'offline' ? 'offline' : 'error'" @retry="retry" />
    </view>
    <view v-else>
      <view v-if="isEmpty" class="state-block">
        <UiEmpty title="没有找到匹配的模板" description="尝试修改筛选条件或重置搜索">
          <template #actions>
            <button size="mini" @click="() => resetAll('empty_state')">清空条件</button>
          </template>
        </UiEmpty>
      </view>
      <view v-else class="grid">
        <view
          v-for="item in filteredItems"
          :key="item.id"
          class="tile"
          @click="() => goDetail(item.id, 'grid')"
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
      <button size="mini" @click="() => goCreate('templates_cta_create')">去创作</button>
      <button size="mini" plain @click="() => goWorks('templates_cta_works')">看作品</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { UiEmpty, UiError, UiSkeleton } from '../../components'
import type { FilterKey } from '../../stores/template'
import { useTemplateStore } from '../../stores/template'
import { AnalyticsEvents, track } from '../../utils/analytics'

const templateStore = useTemplateStore()

const filters = templateStore.filters
const filteredItems = templateStore.filteredItems
const status = templateStore.status
const isEmpty = templateStore.isEmpty
const errorType = templateStore.errorType

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
  const query = searchTerm.value.trim()
  templateStore.setQuery(query)
  track(AnalyticsEvents.TEMPLATES_SEARCH, {
    query,
    resultCount: filteredItems.value.length,
  })
}

function clearSearch() {
  const previous = templateStore.query.value
  templateStore.clearQuery()
  track(AnalyticsEvents.TEMPLATES_CLEAR_SEARCH, {
    previous,
    hasFilters: templateStore.hasActiveFilters.value,
  })
}

function onToggle(key: FilterKey, value: string) {
  templateStore.toggleFilter(key, value)
  const isActiveNow = templateStore.activeFilters[key].includes(value)
  track(AnalyticsEvents.TEMPLATES_FILTER_TOGGLE, {
    filterKey: key,
    value,
    isActive: isActiveNow,
  })
}

function isActive(key: FilterKey, value: string) {
  return templateStore.activeFilters[key].includes(value)
}

function resetAll(source = 'templates') {
  templateStore.reset()
  track(AnalyticsEvents.TEMPLATES_RESET_FILTERS, {
    source,
    previousFilters: Object.entries(templateStore.activeFilters).reduce(
      (acc, [key, values]) => ({
        ...acc,
        [key]: values.length,
      }),
      {} as Record<string, number>
    ),
  })
}

function retry() {
  track(AnalyticsEvents.TEMPLATES_RETRY, { status: status.value })
  templateStore.loadTemplates(true)
}

onMounted(() => {
  templateStore.loadTemplates()
})

function goDetail(id: string, source = 'templates_grid') {
  if (!id) return
  track(AnalyticsEvents.TEMPLATES_VIEW_DETAIL, { templateId: id, source })
  uni.navigateTo({ url: `/pages/templates/detail?id=${id}` })
}
function goCreate(source = 'templates_cta') {
  track(AnalyticsEvents.TEMPLATES_GO_CREATE, { source })
  uni.switchTab({ url: '/pages/editor/index' })
}
function goWorks(source = 'templates_cta') {
  track(AnalyticsEvents.TEMPLATES_GO_WORKS, { source })
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

.grid--skeleton {
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

.tile--skeleton {
  padding: 24rpx;
  gap: 20rpx;
}

.tile--skeleton .tile-body {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
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

.state-block {
  padding: 64rpx 24rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.cta {
  display: flex;
  gap: 16rpx;
  justify-content: center;
  margin-top: auto;
  padding-bottom: 24rpx;
}
</style>

<template>
  <view class="page">
    <view class="top-bar">
      <view class="branding">
        <view class="title">创意日历</view>
        <view class="sub">把“日历”做成你的海报 ✨</view>
      </view>
      <view class="actions">
        <view class="icon" @click="openNotifications">🔔</view>
        <view class="icon" @click="openSearch">🔍</view>
        <view class="icon theme" @click="toggleTheme">{{ themeIcon }}</view>
      </view>
    </view>

    <view v-if="homeLoading" class="greeting-card skeleton-card">
      <view class="skeleton-line lg" />
      <view class="skeleton-line" />
      <view class="skeleton-line sm" />
    </view>
    <view v-else-if="greeting" class="greeting-card">
      <view class="greeting-text">
        <view class="greeting-title">{{ greeting.title }}</view>
        <view class="greeting-sub">{{ greeting.subtitle }}</view>
      </view>
      <view class="greeting-footer">
        <view class="greeting-tag">{{ greeting.tagline }}</view>
        <button size="mini" class="primary" @click="goCreate">新建作品</button>
      </view>
    </view>
    <view v-else class="greeting-card empty-card">
      <view class="empty-title">首页暂时不可用</view>
      <view class="empty-sub">稍后再试或刷新重试</view>
      <button size="mini" @click="loadHome">刷新</button>
    </view>

    <view v-if="homeLoading" class="today-card skeleton-card">
      <view class="skeleton-line lg" />
      <view class="skeleton-line" />
      <view class="skeleton-line sm" />
    </view>
    <view v-else-if="today" class="today-card">
      <view class="today-date">
        <view class="date">{{ today.dateLabel }}</view>
        <view class="week">{{ today.week }}</view>
        <view class="lunar">{{ today.lunar }}</view>
      </view>
      <view class="today-info">
        <view class="focus">{{ today.focus }}</view>
        <view class="reminder">{{ today.reminder }}</view>
      </view>
    </view>

    <view class="section">
      <view class="section-head">
        <view class="section-title">精选模板</view>
        <button size="mini" plain @click="goTemplates">全部模板</button>
      </view>
      <scroll-view scroll-x show-scrollbar="false" class="carousel" enable-flex>
        <template v-if="homeLoading">
          <view v-for="i in 4" :key="`tpl-skeleton-${i}`" class="template-card skeleton-card">
            <view class="cover skeleton-block" />
            <view class="skeleton-line" />
            <view class="skeleton-line sm" />
          </view>
        </template>
        <template v-else-if="templates.length">
          <view
            v-for="tpl in templates"
            :key="tpl.id"
            class="template-card"
            @click="goDetail(tpl.id)"
          >
            <image
              class="cover"
              :src="tpl.coverUrl"
              mode="aspectFill"
              lazy-load
              :fade-show="false"
            />
            <view class="card-body">
              <view class="card-title">{{ tpl.title }}</view>
              <view class="card-meta">{{ tpl.tags.slice(0, 2).join(' · ') }}</view>
            </view>
          </view>
        </template>
        <view v-else class="carousel-empty">暂无模板，稍后再试</view>
      </scroll-view>
    </view>

    <view class="section">
      <view class="section-head">
        <view class="section-title">最近编辑</view>
        <button size="mini" plain @click="goWorks">作品列表</button>
      </view>
      <view v-if="recentLoading" class="recent-loading">
        <view v-for="i in 3" :key="`recent-skeleton-${i}`" class="recent-card skeleton-card">
          <view class="thumb skeleton-block" />
          <view class="recent-main">
            <view class="skeleton-line" />
            <view class="skeleton-line sm" />
          </view>
          <view class="recent-action skeleton-pill" />
        </view>
      </view>
      <view v-else-if="recentEdits.length" class="recent-list">
        <view v-for="item in recentEdits" :key="item.id" class="recent-card">
          <image
            v-if="item.coverUrl"
            class="thumb"
            :src="item.coverUrl"
            mode="aspectFill"
            lazy-load
          />
          <view v-else class="thumb placeholder">AI</view>
          <view class="recent-main">
            <view class="recent-name">{{ item.name }}</view>
            <view class="recent-meta">{{ item.updatedAt }}</view>
          </view>
          <button size="mini" class="continue" @click="continueEdit(item)">继续编辑</button>
        </view>
      </view>
      <view v-else class="recent-empty">
        <view class="empty-title">暂无最近编辑</view>
        <view class="empty-sub">创作作品会自动出现在这里</view>
        <button size="mini" type="default" @click="goCreate">去创作</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useTheme } from '../../composables/useTheme'
import type { HomeResponse } from '../../utils/mock-api'
import { getHome } from '../../utils/mock-api'

const RECENT_STORAGE_KEY = 'creative-calendar:recent-edits'

interface RecentEdit {
  id: string
  name: string
  updatedAt: string
  coverUrl?: string
  size?: string
}

const homeData = ref<HomeResponse | null>(null)
const homeLoading = ref(true)

const recentEdits = ref<RecentEdit[]>([])
const recentLoading = ref(true)

const { isDark, toggleTheme } = useTheme()
const themeIcon = computed(() => (isDark.value ? '🌙' : '☀️'))

const greeting = computed(() => homeData.value?.greeting)
const today = computed(() => homeData.value?.today)
const templates = computed(() => homeData.value?.templates ?? [])

async function loadHome() {
  homeLoading.value = true
  try {
    const data = await getHome()
    homeData.value = data
  } catch (error) {
    console.warn('getHome error', error)
    homeData.value = null
    uni.showToast({ title: '加载失败，请稍后再试', icon: 'none' })
  } finally {
    homeLoading.value = false
  }
}

function parseRecentEdits(raw: unknown): RecentEdit[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as RecentEdit[]
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed as RecentEdit[]
      }
    } catch (error) {
      console.warn('recent edits parse error', error)
    }
  }
  return []
}

function loadRecentEdits() {
  recentLoading.value = true
  try {
    const stored = uni.getStorageSync(RECENT_STORAGE_KEY)
    recentEdits.value = parseRecentEdits(stored)
  } catch (error) {
    console.warn('loadRecentEdits error', error)
    recentEdits.value = []
  } finally {
    recentLoading.value = false
  }
}

function goDetail(id: string) {
  if (!id) return
  uni.navigateTo({ url: `/pages/templates/detail?id=${id}` })
}

function goTemplates() {
  uni.switchTab({ url: '/pages/templates/index' })
}

function goWorks() {
  uni.switchTab({ url: '/pages/works/index' })
}

function goCreate() {
  uni.navigateTo({ url: '/pages/editor/index' })
}

function continueEdit(item: RecentEdit) {
  if (!item?.id) return
  uni.navigateTo({ url: `/pages/editor/index?pid=${item.id}` })
}

function openNotifications() {
  uni.showToast({ title: '通知中心开发中', icon: 'none' })
}

function openSearch() {
  uni.switchTab({ url: '/pages/templates/index' })
}

onMounted(() => {
  loadHome()
  loadRecentEdits()
})

onShow(() => {
  loadRecentEdits()
})
</script>

<style>
.page {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.top-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.branding .title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text);
}

.branding .sub {
  font-size: var(--font-body);
  color: var(--color-text-muted);
  margin-top: 8rpx;
}

.actions {
  display: flex;
  gap: 16rpx;
}

.icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: var(--radius-pill);
  background: var(--color-surface-muted);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  box-shadow: var(--shadow-card);
}

.icon.theme {
  font-size: 30rpx;
}

.greeting-card {
  background: linear-gradient(135deg, rgba(124, 108, 255, 0.16), rgba(14, 165, 233, 0.14));
  color: var(--color-text);
  border-radius: var(--radius-xl);
  padding: 40rpx 32rpx;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.greeting-card .primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
  border: none;
}

.greeting-text .greeting-title {
  font-size: 48rpx;
  font-weight: 700;
}

.greeting-text .greeting-sub {
  font-size: var(--font-body);
  color: var(--color-text);
  opacity: 0.85;
  margin-top: 12rpx;
}

.greeting-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.greeting-tag {
  font-size: var(--font-caption);
  color: var(--color-text-muted);
}

.empty-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 40rpx 32rpx;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  color: var(--color-text);
}

.empty-title {
  font-size: var(--font-body);
  font-weight: 600;
}

.empty-sub {
  font-size: var(--font-caption);
  color: var(--color-text-muted);
}

.today-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 32rpx;
  box-shadow: var(--shadow-card);
  display: flex;
  justify-content: space-between;
  gap: 32rpx;
}

.today-date .date {
  font-size: 44rpx;
  font-weight: 700;
  color: var(--color-text);
}

.today-date .week {
  margin-top: 12rpx;
  color: var(--color-text);
  font-size: var(--font-body);
}

.today-date .lunar {
  margin-top: 8rpx;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.today-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12rpx;
  color: var(--color-text);
}

.today-info .focus {
  font-size: var(--font-body);
  font-weight: 600;
}

.today-info .reminder {
  font-size: var(--font-caption);
  color: var(--color-text-muted);
  line-height: 1.5;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: var(--font-subtitle);
  color: var(--color-text);
  font-weight: 600;
}

.carousel {
  white-space: nowrap;
  display: flex;
  gap: 24rpx;
}

.template-card {
  width: 280rpx;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.template-card .cover {
  width: 280rpx;
  height: 360rpx;
  background: var(--color-surface-muted);
}

.template-card .card-body {
  padding: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.template-card .card-title {
  font-size: var(--font-caption);
  color: var(--color-text);
  font-weight: 600;
}

.template-card .card-meta {
  font-size: 22rpx;
  color: var(--color-text-muted);
}

.carousel-empty {
  width: 100%;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  display: flex;
  align-items: center;
}

.recent-list,
.recent-loading {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.recent-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 24rpx;
  box-shadow: var(--shadow-card);
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.recent-card .thumb {
  width: 140rpx;
  height: 140rpx;
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: var(--font-body);
}

.recent-card .thumb.placeholder {
  font-weight: 600;
}

.recent-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.recent-name {
  font-size: var(--font-body);
  color: var(--color-text);
  font-weight: 600;
}

.recent-meta {
  font-size: var(--font-caption);
  color: var(--color-text-muted);
}

.recent-card .continue {
  background: var(--color-surface-muted);
  color: var(--color-text);
  border: none;
}

.recent-empty {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 48rpx 32rpx;
  text-align: center;
  color: var(--color-text);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.skeleton-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 24rpx;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  animation: skeletonPulse 1.6s ease-in-out infinite;
}

.skeleton-line {
  height: 24rpx;
  border-radius: var(--radius-pill);
  background: var(--color-surface-muted);
}

.skeleton-line.lg {
  height: 36rpx;
  width: 80%;
}

.skeleton-line.sm {
  height: 20rpx;
  width: 60%;
}

.skeleton-block {
  width: 100%;
  height: 360rpx;
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
}

.recent-card.skeleton-card {
  flex-direction: row;
  align-items: center;
}

.recent-card.skeleton-card .skeleton-block {
  width: 140rpx;
  height: 140rpx;
}

.skeleton-pill {
  width: 140rpx;
  height: 56rpx;
  border-radius: var(--radius-pill);
  background: var(--color-surface-muted);
}

@keyframes skeletonPulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}
</style>

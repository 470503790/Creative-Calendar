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

    <view class="hero-area">
      <template v-if="homeStatus === 'loading'">
        <view class="greeting-card">
          <view class="skeleton-stack">
            <UiSkeleton width="60%" height="48rpx" />
            <UiSkeleton width="86%" />
            <UiSkeleton width="48%" />
          </view>
          <view class="skeleton-footer">
            <UiSkeleton width="40%" height="28rpx" />
            <UiSkeleton width="160rpx" height="64rpx" radius="999" />
          </view>
        </view>
        <view class="today-card">
          <view class="today-block">
            <UiSkeleton width="160rpx" height="52rpx" />
            <UiSkeleton width="120rpx" />
            <UiSkeleton width="140rpx" />
          </view>
          <view class="today-info skeleton-stack">
            <UiSkeleton width="70%" height="32rpx" />
            <UiSkeleton width="90%" height="26rpx" />
          </view>
        </view>
      </template>
      <template v-else-if="homeStatus === 'ready'">
        <view v-if="greeting" class="greeting-card">
          <view class="greeting-text">
            <view class="greeting-title">{{ greeting.title }}</view>
            <view class="greeting-sub">{{ greeting.subtitle }}</view>
          </view>
          <view class="greeting-footer">
            <view class="greeting-tag">{{ greeting.tagline }}</view>
            <button size="mini" class="primary" @click="goCreate">新建作品</button>
          </view>
        </view>
        <view v-else class="state-card">
          <UiEmpty title="暂无问候" description="稍后为你准备新的灵感提示" />
        </view>

        <view v-if="today" class="today-card">
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
        <view v-else class="state-card">
          <UiEmpty title="今日信息暂不可用" description="刷新试试，或稍后再来" />
        </view>
      </template>
      <view v-else-if="homeStatus === 'empty'" class="state-card">
        <UiEmpty title="首页暂无内容" description="稍后再来看最新灵感">
          <template #actions>
            <button size="mini" type="default" @click="loadHome">刷新</button>
          </template>
        </UiEmpty>
      </view>
      <view v-else class="state-card">
        <UiError :type="homeStatus === 'offline' ? 'offline' : 'error'" @retry="loadHome" />
      </view>
    </view>

    <view class="section">
      <view class="section-head">
        <view class="section-title">精选模板</view>
        <button size="mini" plain @click="goTemplates">全部模板</button>
      </view>
      <scroll-view scroll-x show-scrollbar="false" class="carousel" enable-flex>
        <template v-if="templatesStatus === 'loading'">
          <view v-for="i in 4" :key="`tpl-skeleton-${i}`" class="template-card state-card">
            <UiSkeleton variant="block" height="220rpx" radius="28" />
            <view class="card-body">
              <UiSkeleton width="80%" />
              <UiSkeleton width="60%" height="20rpx" />
            </view>
          </view>
        </template>
        <template v-else-if="templatesStatus === 'ready'">
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
        <view v-else class="carousel-state">
          <template v-if="templatesStatus === 'empty'">
            <UiEmpty title="暂无模板" description="稍后再来查看新的灵感" />
          </template>
          <template v-else>
            <UiError :type="templatesStatus === 'offline' ? 'offline' : 'error'" @retry="loadHome" />
          </template>
        </view>
      </scroll-view>
    </view>

    <view class="section">
      <view class="section-head">
        <view class="section-title">最近编辑</view>
        <button size="mini" plain @click="goWorks">作品列表</button>
      </view>
      <template v-if="recentStatus === 'loading'">
        <view class="recent-loading">
          <view v-for="i in 3" :key="`recent-skeleton-${i}`" class="recent-card state-card">
            <UiSkeleton variant="block" width="96rpx" height="96rpx" radius="24" />
            <view class="recent-main skeleton-stack">
              <UiSkeleton width="60%" />
              <UiSkeleton width="48%" height="20rpx" />
            </view>
            <UiSkeleton width="140rpx" height="52rpx" radius="999" />
          </view>
        </view>
      </template>
      <view v-else-if="recentStatus === 'ready'" class="recent-list">
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
      <view v-else-if="recentStatus === 'empty'" class="state-card">
        <UiEmpty title="暂无最近编辑" description="创作作品会自动出现在这里">
          <template #actions>
            <button size="mini" type="default" @click="goCreate">去创作</button>
          </template>
        </UiEmpty>
      </view>
      <view v-else class="state-card">
        <UiError :type="recentStatus === 'offline' ? 'offline' : 'error'" @retry="loadRecentEdits" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { UiEmpty, UiError, UiSkeleton } from '../../components'
import { useTheme } from '../../composables/useTheme'
import type { HomeResponse } from '../../utils/mock-api'
import { getHome } from '../../utils/mock-api'
import { isOfflineError, resolveMockRequest } from '../../utils/mock-controls'

const RECENT_STORAGE_KEY = 'creative-calendar:recent-edits'

type PageState = 'loading' | 'ready' | 'empty' | 'error' | 'offline'

interface RecentEdit {
  id: string
  name: string
  updatedAt: string
  coverUrl?: string
  size?: string
}

const homeData = ref<HomeResponse | null>(null)
const homeStatus = ref<PageState>('loading')

const recentEdits = ref<RecentEdit[]>([])
const recentStatus = ref<PageState>('loading')

const { isDark, toggleTheme } = useTheme()
const themeIcon = computed(() => (isDark.value ? '🌙' : '☀️'))

const greeting = computed(() => homeData.value?.greeting ?? null)
const today = computed(() => homeData.value?.today ?? null)
const templates = computed(() => homeData.value?.templates ?? [])

const templatesStatus = computed<PageState>(() => {
  if (homeStatus.value === 'loading') return 'loading'
  if (homeStatus.value === 'error' || homeStatus.value === 'offline') return homeStatus.value
  if (!templates.value.length) return 'empty'
  return 'ready'
})

async function loadHome() {
  homeStatus.value = 'loading'
  try {
    const data = await getHome()
    homeData.value = data
    const hasContent = Boolean(data?.greeting || data?.today || (data?.templates?.length ?? 0) > 0)
    homeStatus.value = hasContent ? 'ready' : 'empty'
  } catch (error) {
    console.warn('getHome error', error)
    homeData.value = null
    const offline = isOfflineError(error)
    homeStatus.value = offline ? 'offline' : 'error'
    uni.showToast({
      title: offline ? '网络异常，请检查后重试' : '加载失败，请稍后再试',
      icon: 'none',
    })
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

async function loadRecentEdits() {
  recentStatus.value = 'loading'
  try {
    const list = await resolveMockRequest<RecentEdit[]>('recent-edits', {
      normal: () => {
        const stored = uni.getStorageSync(RECENT_STORAGE_KEY)
        return parseRecentEdits(stored)
      },
      empty: () => [],
      delay: 260,
    })
    recentEdits.value = list
    recentStatus.value = list.length ? 'ready' : 'empty'
  } catch (error) {
    console.warn('loadRecentEdits error', error)
    recentEdits.value = []
    recentStatus.value = isOfflineError(error) ? 'offline' : 'error'
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

.hero-area {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.state-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  padding: 40rpx 32rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  align-items: stretch;
}

.skeleton-stack {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24rpx;
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

.today-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 32rpx;
  box-shadow: var(--shadow-card);
  display: flex;
  justify-content: space-between;
  gap: 32rpx;
}

.today-card .today-block {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.today-date .date {
  font-size: 44rpx;
  font-weight: 700;
  color: var(--color-text);
}

.today-date .week {
  color: var(--color-text);
  font-size: var(--font-body);
}

.today-date .lunar {
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
  gap: 16rpx;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: var(--font-subtitle);
  font-weight: 700;
  color: var(--color-text);
}

.carousel {
  display: flex;
  gap: 16rpx;
  padding-bottom: 8rpx;
}

.template-card {
  width: 280rpx;
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.template-card.state-card {
  width: 280rpx;
  padding: 24rpx;
}

.template-card .cover {
  width: 100%;
  height: 220rpx;
  border-radius: var(--radius-lg);
}

.template-card .card-body {
  padding: 0 20rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.card-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text);
}

.card-meta {
  font-size: var(--font-caption);
  color: var(--color-text-muted);
}

.carousel-state {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32rpx 0;
}

.recent-loading {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.recent-card {
  background: var(--color-surface);
  padding: 24rpx;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.recent-card.state-card {
  padding: 24rpx;
}

.thumb {
  width: 96rpx;
  height: 96rpx;
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-weight: 700;
}

.thumb.placeholder {
  background: linear-gradient(135deg, rgba(124, 108, 255, 0.28), rgba(14, 165, 233, 0.2));
}

.recent-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.recent-name {
  font-size: var(--font-body);
  font-weight: 600;
  color: var(--color-text);
}

.recent-meta {
  font-size: var(--font-caption);
  color: var(--color-text-muted);
}

.continue {
  background: var(--color-primary);
  color: var(--color-on-primary);
  border: none;
}
</style>

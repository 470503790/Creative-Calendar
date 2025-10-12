<template>
  <view class="wrap">
    <view class="header">
      <view class="title">我的作品</view>
      <button size="mini" @click="goCreate">新建作品</button>
    </view>

    <template v-if="status === 'loading'">
      <view class="list">
        <view v-for="i in 3" :key="`work-skeleton-${i}`" class="card card--skeleton">
          <view class="info skeleton-stack">
            <UiSkeleton width="70%" />
            <UiSkeleton width="40%" height="20rpx" />
          </view>
          <UiSkeleton width="200rpx" height="60rpx" radius="999" />
        </view>
      </view>
    </template>
    <view v-else-if="status === 'ready' && projects.length" class="list">
      <view v-for="p in projects" :key="p.id" class="card">
        <view class="info">
          <view class="name">{{ p.name }}</view>
          <view class="meta">更新于 {{ p.updated }}</view>
        </view>
        <view class="ops">
          <button size="mini" @click="openProject(p.id)">继续编辑</button>
          <button size="mini" @click="preview(p)">预览</button>
        </view>
      </view>
    </view>
    <view v-else-if="status === 'empty'" class="state-card">
      <UiEmpty title="还没有作品" description="去创作第一张创意日历吧～">
        <template #actions>
          <button type="default" size="mini" @click="() => goCreate('works_empty')">去创作</button>
        </template>
      </UiEmpty>
    </view>
    <view v-else class="state-card">
      <UiError :type="status === 'offline' ? 'offline' : 'error'" @retry="retryLoadWorks" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { UiEmpty, UiError, UiSkeleton } from '../../components'
import { isOfflineError, resolveMockRequest } from '../../utils/mock-controls'
import { AnalyticsEvents, track } from '../../utils/analytics'

type PageState = 'loading' | 'ready' | 'empty' | 'error' | 'offline'

type WorkItem = {
  id: string
  name: string
  updated: string
}

const projects = ref<WorkItem[]>([])
const status = ref<PageState>('loading')

const mockWorks: WorkItem[] = [
  { id: 'p_001', name: '夏日海报', updated: '2025-03-12 20:45' },
  { id: 'p_002', name: '品牌月历', updated: '2025-03-10 09:12' },
  { id: 'p_003', name: '倒数日海报', updated: '2025-03-06 14:30' },
]

async function loadWorks() {
  status.value = 'loading'
  try {
    const list = await resolveMockRequest<WorkItem[]>('works', {
      normal: () => mockWorks,
      empty: () => [],
      delay: 220,
    })
    projects.value = list
    status.value = list.length ? 'ready' : 'empty'
  } catch (error) {
    console.warn('loadWorks error', error)
    projects.value = []
    status.value = isOfflineError(error) ? 'offline' : 'error'
  }
}

function goCreate(source = 'works_header') {
  track(AnalyticsEvents.WORKS_CREATE, { source })
  uni.switchTab({ url: '/pages/editor/index' })
}

function openProject(id: string, source = 'works_list') {
  if (!id) return
  track(AnalyticsEvents.WORKS_CONTINUE_EDIT, { projectId: id, source })
  uni.navigateTo({ url: `/pages/editor/index?pid=${id}` })
}

function preview(p: WorkItem, source = 'works_list') {
  track(AnalyticsEvents.WORKS_PREVIEW, { projectId: p.id, source })
  uni.showToast({ title: `${p.name}（预览中）`, icon: 'none' })
}

function retryLoadWorks() {
  track(AnalyticsEvents.WORKS_RELOAD, { status: status.value })
  loadWorks()
}

onMounted(() => {
  loadWorks()
})
</script>

<style scoped>
.wrap {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: var(--font-subtitle);
  font-weight: 700;
  color: var(--color-text);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.card {
  background: var(--color-surface);
  padding: 24rpx;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}

.card--skeleton {
  align-items: center;
}

.state-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 48rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  align-items: center;
  text-align: center;
}

.skeleton-stack {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.info .name {
  font-size: var(--font-body);
  margin-bottom: 8rpx;
  color: var(--color-text);
}

.info .meta {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}

.ops {
  display: flex;
  gap: 12rpx;
}
</style>

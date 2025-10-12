<template>
  <view class="wrap">
    <view class="header">
      <view class="title">我的作品</view>
      <button size="mini" @click="goCreate">新建作品</button>
    </view>
    <view v-if="projects.length" class="list">
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
    <view v-else class="empty">
      <view class="hint">还没有作品，去创作一张吧～</view>
      <button type="default" size="mini" @click="goCreate">去创作</button>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref } from 'vue'

type WorkItem = {
  id: string
  name: string
  updated: string
}

const projects = ref<WorkItem[]>([
  { id: 'p_001', name: '夏日海报', updated: '2025-03-12 20:45' },
  { id: 'p_002', name: '品牌月历', updated: '2025-03-10 09:12' },
  { id: 'p_003', name: '倒数日海报', updated: '2025-03-06 14:30' },
])

function goCreate() {
  uni.switchTab({ url: '/pages/editor/index' })
}

function openProject(id: string) {
  if (!id) return
  uni.navigateTo({ url: `/pages/editor/index?pid=${id}` })
}

function preview(p: WorkItem) {
  uni.showToast({ title: `${p.name}（预览中）`, icon: 'none' })
}
</script>
<style>
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
.empty {
  background: var(--color-surface);
  padding: 48rpx 24rpx;
  border-radius: var(--radius-lg);
  text-align: center;
  color: var(--color-text-muted);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.hint {
  font-size: var(--font-body);
}
</style>

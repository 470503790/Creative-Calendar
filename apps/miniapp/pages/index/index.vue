<template>
  <view class="wrap">
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
    <view class="section">
      <view class="section-title">热门模板</view>
      <scroll-view scroll-x class="row">
        <view v-for="t in hot" :key="t.id" class="card" @click="goDetail(t.id)">
          <image class="cover" :src="t.coverUrl" mode="aspectFill" />
          <view class="card-title">{{ t.title }}</view>
        </view>
      </scroll-view>
    </view>
    <view class="quick-links">
      <button size="mini" @click="goTemplates">浏览模板</button>
      <button size="mini" @click="goWorks">我的作品</button>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTheme } from '../../composables/useTheme'
import type { TemplateItem } from '../../utils/mock-api'
import { getTemplates } from '../../utils/mock-api'

const hot = ref<TemplateItem[]>([])
const { isDark, toggleTheme } = useTheme()
const themeIcon = computed(() => (isDark.value ? '🌙' : '☀️'))

onMounted(async () => {
  const templates = await getTemplates()
  hot.value = (templates || []).slice(0, 5)
})

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
function openNotifications() {
  uni.showToast({ title: '通知中心开发中', icon: 'none' })
}
function openSearch() {
  uni.switchTab({ url: '/pages/templates/index' })
}
</script>
<style>
.wrap {
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
.section-title {
  font-size: var(--font-subtitle);
  color: var(--color-text);
}
.row {
  white-space: nowrap;
}
.card {
  display: inline-block;
  width: 280rpx;
  margin-right: 16rpx;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.cover {
  width: 280rpx;
  height: 360rpx;
  background: var(--color-surface-muted);
}
.card-title {
  padding: 12rpx;
  font-size: var(--font-caption);
  color: var(--color-text);
}
.quick-links {
  display: flex;
  gap: 16rpx;
  margin-top: 8rpx;
}
</style>

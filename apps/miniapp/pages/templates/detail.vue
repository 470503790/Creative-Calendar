<template>
  <view class="wrap" v-if="tpl">
    <image class="cover" :src="tpl.coverUrl" mode="aspectFill" />
    <view class="title">{{ tpl.title }}</view>
    <view class="meta">
      <text v-for="tag in tpl.tags" :key="tag" class="tag">#{{ tag }}</text>
    </view>
    <view class="actions">
      <button class="use" @click="useThis">使用此模板</button>
      <button class="fav" @click="fav">收藏</button>
    </view>
    <view class="section">
      <view class="h">适配尺寸</view>
      <view class="chips">
        <text v-for="s in tpl.sizeHints" :key="s" class="chip">{{ s }}</text>
      </view>
    </view>
    <view class="section">
      <view class="h">作者</view>
      <view>{{ detail?.author?.name || '未知' }}</view>
    </view>
  </view>
  <view v-else class="empty">
    <view class="hint">未找到对应模板，返回模板库看看其他灵感吧。</view>
    <button size="mini" @click="goTemplates">返回模板库</button>
  </view>
</template>
<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import type { TemplateDetail } from '../../utils/mock-api'
import { createProjectFromTemplate, getTemplateDetail } from '../../utils/mock-api'

const id = ref('')
const detail = ref<TemplateDetail | null>(null)
const tpl = computed(() => detail.value)

onLoad(async (q) => {
  id.value = (q?.id as string) || ''
  if (!id.value) return
  const fetched = await getTemplateDetail(id.value)
  detail.value = fetched || null
})

async function useThis() {
  if (!id.value) return
  const { projectId } = await createProjectFromTemplate(id.value)
  uni.navigateTo({ url: `/pages/editor/index?pid=${projectId}` })
}

function fav() {
  uni.showToast({ title: '已收藏（mock）', icon: 'none' })
}

function goTemplates() {
  uni.switchTab({ url: '/pages/templates/index' })
}
</script>
<style>
.wrap {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.cover {
  width: 100%;
  height: 520rpx;
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
}
.title {
  font-size: var(--font-subtitle);
  font-weight: 700;
  color: var(--color-text);
}
.meta {
  color: var(--color-text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}
.tag {
  font-size: var(--font-caption);
}
.actions {
  display: flex;
  gap: 16rpx;
  margin: 8rpx 0 16rpx;
}
.actions .use {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.actions .fav {
  background: var(--color-surface);
  color: var(--color-primary);
  border: 2rpx solid var(--color-primary);
}
.section {
  background: var(--color-surface);
  padding: 16rpx;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  color: var(--color-on-surface);
}
.h {
  font-size: var(--font-body);
  margin-bottom: 8rpx;
  font-weight: 600;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.chip {
  display: inline-block;
  padding: 6rpx 12rpx;
  background: var(--color-surface-muted);
  border-radius: var(--radius-md);
  color: var(--color-text);
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

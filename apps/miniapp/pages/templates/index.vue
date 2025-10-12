<template>
  <view class="wrap">
    <view class="search">
      <input placeholder="搜索模板关键字…" v-model="q" @confirm="doSearch" />
    </view>
    <view class="grid">
      <view v-for="t in list" :key="t.id" class="tile" @click="goDetail(t.id)">
        <image class="cover" :src="t.coverUrl" mode="aspectFill" />
        <view class="title">{{ t.title }}</view>
        <view class="tags">
          <text v-for="tag in t.tags" :key="tag" class="tag">#{{ tag }}</text>
        </view>
      </view>
    </view>
    <view class="cta">
      <button size="mini" @click="goCreate">去创作</button>
      <button size="mini" @click="goWorks">看作品</button>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { TemplateItem } from '../../utils/mock-api'
import { getTemplates } from '../../utils/mock-api'

const q = ref('')
const raw = ref<TemplateItem[]>([])

const list = computed(() => {
  if (!q.value) return raw.value
  const keyword = q.value.trim()
  return raw.value.filter((t) =>
    t.title.includes(keyword) || t.tags.some((x) => x.includes(keyword))
  )
})

onMounted(async () => {
  const templates = await getTemplates()
  raw.value = templates || []
})

function doSearch() {}

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
<style>
.wrap {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.search input {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 16rpx;
  box-shadow: var(--shadow-card);
  color: var(--color-text);
}
.search input::placeholder {
  color: var(--color-text-muted);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}
.tile {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}
.cover {
  width: 100%;
  height: 360rpx;
  background: var(--color-surface-muted);
}
.title {
  font-size: var(--font-body);
  padding: 12rpx 12rpx 0 12rpx;
  color: var(--color-text);
}
.tags {
  padding: 0 12rpx 12rpx 12rpx;
  color: var(--color-text-muted);
}
.tag {
  margin-right: 8rpx;
  font-size: var(--font-caption);
}
.cta {
  display: flex;
  gap: 16rpx;
  margin-top: 8rpx;
}
</style>

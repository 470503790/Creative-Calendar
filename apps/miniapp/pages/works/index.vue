<template>
  <view class="wrap">
    <view class="header">
      <view class="title">我的作品</view>
      <button size="mini" @click="goCreate">新建作品</button>
    </view>
    <view v-if="projects.length" class="list">
      <view v-for="p in projects" :key="p.id" class="card">
        <view class="info">
          <view class="name">{{p.name}}</view>
          <view class="meta">更新于 {{p.updated}}</view>
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
  { id: 'p_003', name: '倒数日海报', updated: '2025-03-06 14:30' }
])

function goCreate(){ uni.switchTab({ url: '/pages/editor/index' }) }

function openProject(id: string){
  if (!id) return
  uni.navigateTo({ url: `/pages/editor/index?pid=${id}` })
}

function preview(p: WorkItem){ uni.showToast({ title: `${p.name}（预览中）`, icon: 'none' }) }
</script>
<style>
.wrap{ padding:24rpx }
.header{ display:flex; align-items:center; justify-content:space-between; margin-bottom:24rpx }
.title{ font-size:36rpx; font-weight:700 }
.list{ display:flex; flex-direction:column; gap:16rpx }
.card{ background:#fff; padding:24rpx; border-radius:16rpx; box-shadow:0 6rpx 18rpx rgba(0,0,0,.06); display:flex; justify-content:space-between; align-items:center }
.info .name{ font-size:30rpx; margin-bottom:8rpx }
.info .meta{ color:#888; font-size:24rpx }
.ops{ display:flex; gap:12rpx }
.empty{ background:#fff; padding:48rpx 24rpx; border-radius:16rpx; text-align:center; color:#888; box-shadow:0 6rpx 18rpx rgba(0,0,0,.06) }
.hint{ margin-bottom:16rpx }
</style>

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
      </view>
    </view>
    <view class="section">
      <view class="section-title">热门模板</view>
      <scroll-view scroll-x class="row">
        <view v-for="t in hot" :key="t.id" class="card" @click="goDetail(t.id)">
          <image class="cover" :src="t.coverUrl" mode="aspectFill" />
          <view class="card-title">{{t.title}}</view>
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
import { ref, onMounted } from 'vue'
import type { TemplateItem } from '../../utils/mock-api'
import { getTemplates } from '../../utils/mock-api'

const hot = ref<TemplateItem[]>([])

onMounted(async () => {
  const templates = await getTemplates()
  hot.value = (templates || []).slice(0, 5)
})

function goDetail(id: string) {
  if (!id) return
  uni.navigateTo({ url: `/pages/templates/detail?id=${id}` })
}
function goTemplates(){ uni.switchTab({ url: '/pages/templates/index' }) }
function goWorks(){ uni.switchTab({ url: '/pages/works/index' }) }
function openNotifications(){ uni.showToast({ title:'通知中心开发中', icon:'none' }) }
function openSearch(){ uni.switchTab({ url: '/pages/templates/index' }) }
</script>
<style>
.wrap{ padding:24rpx }
.top-bar{ display:flex; align-items:flex-start; justify-content:space-between; padding:12rpx 0 24rpx 0 }
.branding .title{ font-size:40rpx; font-weight:700; color:#111 }
.branding .sub{ font-size:28rpx; color:#666 }
.actions{ display:flex; gap:16rpx }
.icon{ width:60rpx; height:60rpx; border-radius:30rpx; background:#f1f1f5; display:flex; align-items:center; justify-content:center; font-size:32rpx }
.section{ margin-top:24rpx }
.section-title{ font-size:32rpx; margin-bottom:16rpx }
.row{ white-space:nowrap }
.card{ display:inline-block; width:280rpx; margin-right:16rpx; border-radius:16rpx; background:#fff; box-shadow:0 6rpx 18rpx rgba(0,0,0,.06); overflow:hidden }
.cover{ width:280rpx; height:360rpx; background:#eee }
.card-title{ padding:12rpx; font-size:26rpx }
.quick-links{ margin-top:32rpx; display:flex; gap:16rpx }
</style>

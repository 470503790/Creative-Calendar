<template>
  <view class="wrap">
    <view class="hero">
      <view class="title">Creative Calendar</view>
      <view class="sub">把“日历”做成你的海报 ✨</view>
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
  </view>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getTemplates } from '../../utils/mock-api'
const hot = ref<any[]>([])
onMounted(async () => { hot.value = (await getTemplates()).slice(0, 5) })
function goDetail(id:string){ uni.navigateTo({ url: `/pages/templates/detail?id=${id}` }) }
</script>
<style>
.wrap{ padding:24rpx }
.hero{ padding:24rpx 0 }
.title{ font-size:40rpx; font-weight:700; color:#111 }
.sub{ font-size:28rpx; color:#666 }
.section{ margin-top:24rpx }
.section-title{ font-size:32rpx; margin-bottom:16rpx }
.row{ white-space:nowrap }
.card{ display:inline-block; width:280rpx; margin-right:16rpx; border-radius:16rpx; background:#fff; box-shadow:0 6rpx 18rpx rgba(0,0,0,.06); overflow:hidden }
.cover{ width:280rpx; height:360rpx; background:#eee }
.card-title{ padding:12rpx; font-size:26rpx }
</style>

<template>
  <view class="wrap">
    <view class="hero">
      <image class="avatar" src="https://dummyimage.com/200x200/7c6cff/ffffff&text=ME" mode="aspectFill" />
      <view class="info">
        <view class="name">创意星球</view>
        <view class="meta">设计师 · 深圳</view>
      </view>
    </view>
    <view class="menu">
      <button plain @click="goWorks">我的作品</button>
      <button plain @click="goTemplates">收藏的模板</button>
      <button plain @click="openSettings">账号设置</button>
    </view>
    <view class="footer">版本 0.1.0 · Mock 数据</view>
  </view>
</template>
<script setup lang="ts">
function goWorks(){ uni.switchTab({ url: '/pages/works/index' }) }
function goTemplates(){ uni.switchTab({ url: '/pages/templates/index' }) }
function openSettings(){ uni.showToast({ title:'设置功能开发中', icon:'none' }) }
</script>
<style>
.wrap{ padding:24rpx }
.hero{ display:flex; align-items:center; gap:24rpx; margin-bottom:32rpx }
.avatar{ width:160rpx; height:160rpx; border-radius:80rpx }
.info .name{ font-size:34rpx; font-weight:700 }
.info .meta{ color:#777; margin-top:8rpx }
.menu button{ margin-bottom:16rpx; border-radius:16rpx; border-color:#e5e5ec }
.footer{ margin-top:48rpx; color:#aaa; text-align:center }
</style>

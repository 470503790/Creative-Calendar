<template>
  <view class="wrap">
    <view class="canvas" id="canvas">
      <view class="ph">这里是画布占位（轻编辑 MVP 待实现）</view>
    </view>
    <view class="toolbar">
      <button @click="addText">加文字</button>
      <button @click="addSticker">加贴纸</button>
      <button @click="exportImage">导出（模拟）</button>
      <button @click="goWorks">作品列表</button>
    </view>
  </view>
</template>
<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
const pid = ref(''); onLoad((q)=>{ pid.value = q?.pid as string || '' })
function addText(){ uni.showToast({ title:'加文字（mock）', icon:'none' }) }
function addSticker(){ uni.showToast({ title:'加贴纸（mock）', icon:'none' }) }
function exportImage(){ uni.showToast({ title:'导出中…（mock）', icon:'none' }) }
function goWorks(){ uni.switchTab({ url:'/pages/works/index' }) }
</script>
<style>
.wrap{ padding:24rpx }
.canvas{ height:600rpx; background:#fff; border-radius:16rpx; display:flex; align-items:center; justify-content:center; box-shadow:0 6rpx 18rpx rgba(0,0,0,.06) }
.ph{ color:#999 }
.toolbar{ display:flex; gap:16rpx; margin-top:16rpx }
</style>

<template>
  <view class="wrap" v-if="tpl">
    <image class="cover" :src="tpl.coverUrl" mode="aspectFill" />
    <view class="title">{{tpl.title}}</view>
    <view class="meta">
      <text v-for="tag in tpl.tags" :key="tag" class="tag">#{{tag}}</text>
    </view>
    <view class="actions">
      <button class="use" @click="useThis">使用此模板</button>
      <button class="fav" @click="fav">收藏</button>
    </view>
    <view class="section">
      <view class="h">适配尺寸</view>
      <view class="chips">
        <text v-for="s in tpl.sizeHints" :key="s" class="chip">{{s}}</text>
      </view>
    </view>
    <view class="section">
      <view class="h">作者</view>
      <view>{{detail?.author?.name || '未知'}}</view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { getTemplateDetail, createProjectFromTemplate } from '../../utils/mock-api'
const id = ref(''); const tpl = ref<any>(null); const detail = ref<any>(null)
onLoad(async (q)=>{ id.value = q?.id as string || ''; detail.value = await getTemplateDetail(id.value); tpl.value = detail.value })
async function useThis(){ const { projectId } = await createProjectFromTemplate(id.value); uni.navigateTo({ url:`/pages/editor/index?pid=${projectId}` }) }
function fav(){ uni.showToast({ title:'已收藏（mock）', icon:'none' }) }
</script>
<style>
.wrap{ padding:24rpx }
.cover{ width:100%; height:520rpx; border-radius:16rpx; background:#eee }
.title{ font-size:36rpx; font-weight:700; margin-top:16rpx }
.meta{ color:#666; margin-top:8rpx }
.tag{ margin-right:8rpx }
.actions{ display:flex; gap:16rpx; margin:16rpx 0 }
.use{ background:#7C6CFF; color:#fff }
.fav{ border:2rpx solid #7C6CFF; color:#7C6CFF; background:#fff }
.section{ margin-top:16rpx; background:#fff; padding:16rpx; border-radius:16rpx; box-shadow:0 6rpx 18rpx rgba(0,0,0,.06) }
.h{ font-size:28rpx; margin-bottom:8rpx }
.chips .chip{ display:inline-block; padding:6rpx 12rpx; background:#F7F7F9; border-radius:12rpx; margin-right:8rpx }
</style>

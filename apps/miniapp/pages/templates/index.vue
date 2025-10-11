<template>
  <view class="wrap">
    <view class="search">
      <input placeholder="搜索模板关键字…" v-model="q" @confirm="doSearch" />
    </view>
    <view class="grid">
      <view v-for="t in list" :key="t.id" class="tile" @click="goDetail(t.id)">
        <image class="cover" :src="t.coverUrl" mode="aspectFill" />
        <view class="title">{{t.title}}</view>
        <view class="tags">
          <text v-for="tag in t.tags" :key="tag" class="tag">#{{tag}}</text>
        </view>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getTemplates } from '../../utils/mock-api'
const q = ref(''); const raw = ref<any[]>([])
const list = computed(()=> !q.value ? raw.value : raw.value.filter(t => t.title.includes(q.value) || t.tags.some((x:string)=>x.includes(q.value))))
onMounted(async ()=>{ raw.value = await getTemplates() })
function doSearch(){}
function goDetail(id:string){ uni.navigateTo({ url: `/pages/templates/detail?id=${id}` }) }
</script>
<style>
.wrap{ padding:24rpx }
.search input{ background:#fff; border-radius:16rpx; padding:16rpx; box-shadow:0 6rpx 18rpx rgba(0,0,0,.06) }
.grid{ display:grid; grid-template-columns:1fr 1fr; gap:16rpx; margin-top:16rpx }
.tile{ background:#fff; border-radius:16rpx; overflow:hidden; box-shadow:0 6rpx 18rpx rgba(0,0,0,.06) }
.cover{ width:100%; height:360rpx; background:#eee }
.title{ font-size:28rpx; padding:12rpx 12rpx 0 12rpx }
.tags{ padding:0 12rpx 12rpx 12rpx; color:#666 }
.tag{ margin-right:8rpx; font-size:22rpx }
</style>

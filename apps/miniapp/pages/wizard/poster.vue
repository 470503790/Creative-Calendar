<template>
  <view class="wizard-page">
    <view class="badge">快速新建</view>
    <view class="title">创意海报</view>
    <view class="description">
      海报生成向导将提供更多素材与版式，目前可以先使用模板或空白画布完成设计。
    </view>
    <view class="actions">
      <button class="primary" @click="goTemplates">查看海报模板</button>
      <button class="secondary" plain @click="goBack">返回首页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
function goTemplates() {
  uni.switchTab({ url: '/pages/templates/index' })
}

function goBack() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style scoped>
@import './placeholder.css';
</style>

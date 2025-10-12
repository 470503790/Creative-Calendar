<template>
  <view class="wizard-page">
    <view class="badge">快速新建</view>
    <view class="title">空白画布</view>
    <view class="description">
      立即打开空白画布，开始自由创作。你也可以先逛逛模板获取灵感。
    </view>
    <view class="actions">
      <button class="primary" @click="openEditor">打开空白画布</button>
      <button class="secondary" plain @click="goTemplates">看看模板</button>
    </view>
  </view>
</template>

<script setup lang="ts">
function openEditor() {
  uni.navigateTo({ url: '/pages/editor/index?source=blank_canvas' })
}

function goTemplates() {
  uni.switchTab({ url: '/pages/templates/index' })
}
</script>

<style scoped>
@import './placeholder.css';
</style>

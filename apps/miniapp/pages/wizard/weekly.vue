<template>
  <view class="wizard-page">
    <view class="badge">快速新建</view>
    <view class="title">周历计划</view>
    <view class="description">
      周历向导即将上线，暂时可先在编辑器中挑选周历模板或使用空白画布规划内容。
    </view>
    <view class="actions">
      <button class="primary" @click="openEditor">打开编辑器</button>
      <button class="secondary" plain @click="goBack">返回首页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
function openEditor() {
  uni.navigateTo({ url: '/pages/editor/index?source=weekly_wizard' })
}

function goBack() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style scoped>
@import './placeholder.css';
</style>

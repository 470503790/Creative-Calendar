<template>
  <view class="wizard-page">
    <view class="badge">快速新建</view>
    <view class="title">月历策划</view>
    <view class="description">
      月历向导正在打磨中，你可以先从模板库选择喜欢的样式并进行编辑。
    </view>
    <view class="actions">
      <button class="primary" @click="goTemplates">前往模板中心</button>
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

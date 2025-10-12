<template>
  <view class="app" :style="themeStyles">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from './composables/useTheme'

const { cssVars } = useTheme()
const themeStyles = computed(() => cssVars.value)
</script>

<style>
page {
  background: var(--color-background);
  color: var(--color-text);
  font-size: var(--font-body);
}

.app {
  background: var(--color-background);
  min-height: 100vh;
  color: var(--color-text);
}

button {
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--font-button);
  padding: 0 24rpx;
  line-height: 64rpx;
  box-shadow: var(--shadow-button);
}

button[plain] {
  background: transparent;
  color: var(--color-primary);
  border: 2rpx solid var(--color-primary);
  box-shadow: none;
}

button::after {
  border: none;
}
</style>

<template>
  <scroll-view scroll-y class="ui-demo">
    <view class="ui-demo__content">
      <ui-section title="UiButton" description="不同语义、尺寸与禁用状态的按钮样式。">
        <view class="ui-demo__row">
          <ui-button>Primary</ui-button>
          <ui-button variant="secondary">Secondary</ui-button>
          <ui-button variant="ghost">Ghost</ui-button>
        </view>
        <view class="ui-demo__row">
          <ui-button size="sm">Small</ui-button>
          <ui-button size="sm" variant="secondary">Small Secondary</ui-button>
          <ui-button size="sm" variant="ghost">Small Ghost</ui-button>
        </view>
        <view class="ui-demo__row">
          <ui-button disabled>禁用</ui-button>
          <ui-button variant="secondary" disabled>禁用</ui-button>
          <ui-button variant="ghost" disabled>禁用</ui-button>
        </view>
        <ui-button block>Block 按钮</ui-button>
      </ui-section>

      <ui-section title="UiInput" description="统一边框与焦点态的输入框，支持清除按钮。">
        <view class="ui-demo__column">
          <ui-input v-model="keyword" placeholder="输入关键字" clearable />
          <ui-input v-model="email" type="text" placeholder="邮箱地址" />
          <ui-input v-model="disabledInput" placeholder="禁用输入框" :disabled="true" />
        </view>
      </ui-section>

      <ui-section title="UiTag" description="标签支持多种语义，带关闭按钮时可交互。">
        <view class="ui-demo__row">
          <ui-tag>默认</ui-tag>
          <ui-tag variant="primary">主色</ui-tag>
          <ui-tag variant="accent">强调</ui-tag>
          <ui-tag variant="outline">描边</ui-tag>
        </view>
        <view class="ui-demo__row">
          <ui-tag size="sm">迷你</ui-tag>
          <ui-tag size="sm" variant="primary">迷你主色</ui-tag>
        </view>
        <view class="ui-demo__row">
          <ui-tag v-if="showClosable" variant="primary" closable @close="showClosable = false">
            可关闭标签
          </ui-tag>
          <ui-button v-else size="sm" @click="showClosable = true">重新展示</ui-button>
        </view>
      </ui-section>

      <ui-section title="UiCard" description="卡片容器可配置阴影、描边与点击态。">
        <view class="ui-demo__column">
          <ui-card>
            <view class="ui-demo__card-title">默认阴影卡片</view>
            <view class="ui-demo__card-body">用于展示内容或承载组件。</view>
          </ui-card>
          <ui-card outlined>
            <view class="ui-demo__card-title">描边卡片</view>
            <view class="ui-demo__card-body">更轻量的视觉承载形式。</view>
          </ui-card>
          <ui-card clickable @click="handleCardClick">
            <view class="ui-demo__card-title">可点击卡片</view>
            <view class="ui-demo__card-body">点击后触发 toast。</view>
          </ui-card>
        </view>
      </ui-section>

      <ui-section title="UiSection" description="区块容器用于划分页面内容，可带操作按钮。">
        <ui-section title="内嵌区块" description="支持嵌套使用与操作插槽。" divider>
          <template #action>
            <ui-button size="sm" variant="ghost">更多</ui-button>
          </template>
          <view class="ui-demo__body-text">这里是区块内容，可以放置图文、表单等任意组件。</view>
        </ui-section>
      </ui-section>

      <ui-section title="UiEmpty" description="空状态组件提供默认文案，也支持自定义操作。">
        <ui-card padding="lg" outlined>
          <ui-empty title="暂时没有作品" description="创建第一张创意日历，与朋友分享灵感。">
            <template #actions>
              <ui-button size="sm" @click="createWork">去创作</ui-button>
              <ui-button size="sm" variant="ghost" @click="loadTemplates">看看模板</ui-button>
            </template>
          </ui-empty>
        </ui-card>
      </ui-section>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UiButton, UiCard, UiEmpty, UiInput, UiSection, UiTag } from '../../../components'

const keyword = ref('创意灵感')
const email = ref('hello@example.com')
const disabledInput = ref('不可编辑')
const showClosable = ref(true)

function handleCardClick() {
  uni.showToast({ title: '点击卡片', icon: 'none' })
}

function createWork() {
  uni.showToast({ title: '前往创作流程', icon: 'none' })
}

function loadTemplates() {
  uni.switchTab({ url: '/pages/templates/index' })
}
</script>

<style scoped>
.ui-demo {
  height: 100vh;
  background: var(--color-background);
}

.ui-demo__content {
  padding: 32rpx 24rpx 80rpx;
  display: flex;
  flex-direction: column;
  gap: 48rpx;
}

.ui-demo__row {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  align-items: center;
}

.ui-demo__column {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.ui-demo__card-title {
  font-size: var(--font-subtitle);
  color: var(--color-text);
  margin-bottom: 8rpx;
}

.ui-demo__card-body {
  font-size: var(--font-body);
  color: var(--color-text-muted);
  line-height: 1.5;
}

.ui-demo__body-text {
  font-size: var(--font-body);
  color: var(--color-text);
  line-height: 1.5;
}
</style>

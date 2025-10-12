<template>
  <view class="page">
    <view class="page-header">
      <view class="title-area">
        <view class="title">作品集</view>
        <view class="subtitle">共 {{ totalCount }} 个作品，可长按进入多选模式</view>
      </view>
      <button size="mini" type="primary" @click="goCreate">新建作品</button>
    </view>

    <view class="filters">
      <view class="search-box">
        <input
          class="search-input"
          type="text"
          :value="searchQuery"
          placeholder="搜索作品名称、标签"
          confirm-type="search"
          @input="onSearchInput"
          @confirm="onSearchConfirm"
        />
        <view v-if="searchQuery" class="search-clear" @click="clearSearch">清除</view>
      </view>
      <picker mode="selector" :range="sortLabels" :value="sortIndex" @change="onSortChange">
        <view class="sort-trigger">
          <text class="sort-label">{{ currentSortLabel }}</text>
          <text class="sort-icon">⌄</text>
        </view>
      </picker>
    </view>

    <view v-if="isSelectionMode" class="bulk-bar">
      <view class="bulk-info">已选 {{ selectedCount }} / {{ totalCount }}</view>
      <view class="bulk-actions">
        <button size="mini" type="default" @click="selectAllVisible" :disabled="!filteredProjects.length || isAllSelected">
          当前全选
        </button>
        <button size="mini" type="default" @click="clearSelection" :disabled="!selectedCount">清空</button>
        <button size="mini" type="primary" @click="handleBulkExport" :disabled="!selectedCount">批量导出</button>
        <button size="mini" type="warn" @click="handleBulkDelete" :disabled="!selectedCount">批量删除</button>
        <button size="mini" type="default" @click="exitSelectionMode">退出</button>
      </view>
    </view>

    <view v-if="filteredProjects.length" class="grid">
      <view
        v-for="project in filteredProjects"
        :key="project.id"
        :class="['card', { selecting: isSelectionMode, selected: isSelected(project.id) }]"
        @click="handleCardClick(project)"
        @longpress="handleCardLongPress(project)"
      >
        <view class="cover" :style="createCoverStyle(project)">
          <text class="cover-initial">{{ project.name.slice(0, 1) }}</text>
        </view>
        <view class="card-body">
          <view class="card-title">{{ project.name }}</view>
          <view class="card-meta">
            <text class="meta-item">{{ project.category }}</text>
            <text class="meta-dot">·</text>
            <text class="meta-item">{{ project.size }}</text>
          </view>
          <view class="card-meta muted">更新于 {{ formatTime(project.updatedAt) }}</view>
        </view>
        <view v-if="project.exportCount" class="badge">
          <text class="badge-text">导出 {{ project.exportCount }} 次</text>
        </view>
        <view class="more" @click.stop="openProjectActions(project)">
          <text class="more-icon">⋯</text>
        </view>
        <view v-if="isSelectionMode" class="select-indicator">
          <view class="checkbox" :class="{ active: isSelected(project.id) }">
            <text v-if="isSelected(project.id)" class="checkmark">✓</text>
          </view>
        </view>
      </view>
    </view>
    <view v-else class="empty">
      <view class="empty-title">还没有作品</view>
      <view class="empty-desc">从模板中心挑选一个，或直接开始创作吧～</view>
      <button size="mini" type="default" @click="goCreate">去创作</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProjectsStore, type ProjectItem } from '../../stores/projects'

const projectsStore = useProjectsStore()

type InputLikeEvent = { detail?: { value?: string } }
type PickerChangeEvent = { detail?: { value?: number | string } }
type ActionSheetSuccess = { tapIndex: number }
type ModalSuccess = { confirm: boolean }

const filteredProjects = projectsStore.filteredProjects
const searchQuery = computed({
  get: () => projectsStore.searchQuery.value,
  set: (value: string) => projectsStore.setSearch(value ?? ''),
})
const totalCount = projectsStore.totalCount
const selectedCount = projectsStore.selectedCount
const isSelectionMode = projectsStore.isSelectionMode
const isAllSelected = projectsStore.isAllSelected

const sortOptions = projectsStore.sortOptions
const sortLabels = computed(() => sortOptions.map((item) => item.label))
const sortIndex = computed(() => Math.max(sortOptions.findIndex((item) => item.key === projectsStore.sortPreset.value), 0))
const currentSortLabel = computed(() => sortOptions[sortIndex.value]?.label ?? sortOptions[0]?.label ?? '')

function onSearchInput(event: InputLikeEvent) {
  searchQuery.value = (event?.detail?.value ?? '').trimStart()
}

function onSearchConfirm(event: InputLikeEvent) {
  searchQuery.value = (event?.detail?.value ?? '').trim()
}

function clearSearch() {
  projectsStore.clearSearch()
}

function onSortChange(event: PickerChangeEvent) {
  const index = Number(event?.detail?.value ?? 0)
  const option = sortOptions[index]
  if (option) {
    projectsStore.setSortPreset(option.key)
  }
}

function goCreate() {
  uni.switchTab({ url: '/pages/editor/index' })
}

function openProject(id: string) {
  if (!id) return
  projectsStore.touchProject(id)
  uni.navigateTo({ url: `/pages/editor/index?pid=${id}` })
}

function handleCardClick(project: ProjectItem) {
  if (projectsStore.isSelectionMode.value) {
    projectsStore.toggleSelection(project.id)
    return
  }
  openProject(project.id)
}

function handleCardLongPress(project: ProjectItem) {
  projectsStore.enterSelectionMode(project.id)
}

function openProjectActions(project: ProjectItem) {
  const itemList = ['再编辑', '导出', '重命名（占位）', '移动（占位）']
  uni.showActionSheet({
    itemList,
    success: ({ tapIndex }: ActionSheetSuccess) => {
      if (tapIndex === 0) {
        openProject(project.id)
      } else if (tapIndex === 1) {
        projectsStore.recordExport([project.id], { preset: '单个导出' })
        uni.showToast({ title: '已加入导出记录', icon: 'none' })
      } else if (tapIndex === 2) {
        uni.showToast({ title: '重命名功能筹备中', icon: 'none' })
      } else if (tapIndex === 3) {
        uni.showToast({ title: '移动功能筹备中', icon: 'none' })
      }
    },
  })
}

function selectAllVisible() {
  projectsStore.selectAllVisible()
}

function clearSelection() {
  projectsStore.clearSelection()
}

function exitSelectionMode() {
  projectsStore.exitSelectionMode()
}

function handleBulkDelete() {
  if (!projectsStore.selectedIds.value.length) return
  uni.showModal({
    title: '批量删除作品',
    content: `确定删除选中的 ${projectsStore.selectedIds.value.length} 个作品吗？该操作不可撤销。`,
    confirmText: '删除',
    confirmColor: '#FF4D4F',
    success: (res: ModalSuccess) => {
      if (res.confirm) {
        const removed = projectsStore.removeSelected()
        if (removed) {
          uni.showToast({ title: `已删除 ${removed} 个作品`, icon: 'none' })
        }
      }
    },
  })
}

function handleBulkExport() {
  const count = projectsStore.recordExportForSelected({ preset: '批量导出' })
  if (count) {
    uni.showToast({ title: `已添加 ${count} 个导出任务`, icon: 'none' })
  }
}

function isSelected(id: string) {
  return projectsStore.isSelected(id)
}

function createCoverStyle(project: ProjectItem) {
  return `background-image: linear-gradient(135deg, ${project.coverColor}, ${project.accentColor});`
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  const hh = `${date.getHours()}`.padStart(2, '0')
  const mm = `${date.getMinutes()}`.padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}
</script>

<style scoped>
.page {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  background-color: #f7f7f9;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}

.title-area {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--color-text, #20263f);
}

.subtitle {
  font-size: 24rpx;
  color: var(--color-text-muted, #6f7383);
}

.filters {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.search-box {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 18rpx 24rpx;
  border-radius: 999rpx;
  background: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(21, 21, 43, 0.05);
  font-size: 26rpx;
  color: var(--color-text, #20263f);
}

.search-clear {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24rpx;
  color: var(--color-primary, #7c6cff);
}

.sort-trigger {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 18rpx 24rpx;
  border-radius: 999rpx;
  background: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(21, 21, 43, 0.05);
  font-size: 26rpx;
  color: var(--color-text, #20263f);
}

.sort-icon {
  font-size: 28rpx;
  transform: translateY(-2rpx);
}

.bulk-bar {
  background: #ffffff;
  border-radius: var(--radius-lg, 24rpx);
  padding: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(21, 21, 43, 0.06);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.bulk-info {
  font-size: 26rpx;
  color: var(--color-text, #20263f);
}

.bulk-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320rpx, 1fr));
  gap: 24rpx;
}

.card {
  position: relative;
  background: #ffffff;
  border-radius: var(--radius-lg, 24rpx);
  overflow: hidden;
  box-shadow: 0 12rpx 32rpx rgba(21, 21, 43, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-bottom: 24rpx;
  transition: transform 0.2s ease;
}

.card.selecting {
  padding-right: 48rpx;
}

.card.selected {
  transform: translateY(-6rpx);
  box-shadow: 0 16rpx 36rpx rgba(124, 108, 255, 0.25);
}

.cover {
  height: 240rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.cover-initial {
  font-size: 64rpx;
  font-weight: 700;
}

.card-body {
  padding: 0 24rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--color-text, #20263f);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: var(--color-text-muted, #6f7383);
}

.card-meta.muted {
  font-size: 22rpx;
}

.meta-dot {
  opacity: 0.4;
}

.badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  background: rgba(32, 38, 63, 0.65);
  color: #ffffff;
  border-radius: 999rpx;
  padding: 10rpx 20rpx;
  font-size: 22rpx;
}

.more {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  width: 48rpx;
  height: 48rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: var(--color-text, #20263f);
}

.more-icon {
  transform: rotate(90deg);
}

.select-indicator {
  position: absolute;
  right: 16rpx;
  bottom: 16rpx;
}

.checkbox {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(124, 108, 255, 0.4);
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #ffffff;
}

.checkbox.active {
  background: var(--color-primary, #7c6cff);
  border-color: transparent;
}

.checkmark {
  font-size: 28rpx;
}

.empty {
  margin-top: 48rpx;
  background: #ffffff;
  border-radius: var(--radius-lg, 24rpx);
  padding: 80rpx 24rpx;
  text-align: center;
  box-shadow: 0 16rpx 36rpx rgba(21, 21, 43, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  color: var(--color-text-muted, #6f7383);
}

.empty-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--color-text, #20263f);
}

.empty-desc {
  font-size: 26rpx;
}
</style>

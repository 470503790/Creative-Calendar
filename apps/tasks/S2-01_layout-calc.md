# S2-01 · 真机布局修复：画布高度计算 + 预留底部工具区

## 背景
真机上画布占满全屏，底部工具区被“顶”出视野；同时真实设备的安全区与 rpx/px 换算与 100vh 表现不一致。

## 目标
- 画布区域按照**可视高度 - 顶部工具栏 - 底部工具区 - 安全区**计算
- 横竖屏与多机型适配一致；H5 与小程序表现一致

## 改动路径
- `apps/miniapp/pages/editor/index.vue`
- `apps/miniapp/pages/editor/theme.css`
- `apps/miniapp/pages/editor/composables/useSafeArea.ts`（新增）

## 实施
1. 新增 `useSafeArea()`：
   - `const { windowHeight, safeAreaInsets } = uni.getSystemInfoSync()`
   - 提供 `calcCanvasHeight(toolsPx:number, topPx:number)` → 返回像素高度
2. 定义工具区高度常量：`TOOLS_H_RPX = 320`；提供 `rpx2px()`（`px = rpx * windowWidth / 750`）
3. `index.vue`：
   - 计算 `canvasStyle.height = calcCanvasHeight(rpx2px(TOOLS_H_RPX), topBarPx) + 'px'`
   - 工具区固定高度 `TOOLS_H_RPX`
   - 监听 `onResize`，实时更新
4. CSS 使用 `env(safe-area-inset-bottom)` 兜底 H5

## 验收
- 真机与开发者工具均能看到底部工具区；切 Tab 不抖动
- 不同机型高度正确；无超出或白边
- 代码：含注释与常量集中定义

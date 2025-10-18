# S2-02 · Canvas 原生层级与事件穿透修复（mp-weixin）

## 背景
小程序 2D Canvas 属于**原生组件层**，在某些情况下会遮挡/截获事件，导致“元素无法添加”。

## 目标
- 底部工具区与弹层**可靠可点**；画布不遮挡
- 画布区仅在需要时接受手势（拖拽/多选），其它场景**释放事件**

## 改动路径
- `pages/editor/index.vue`
- `pages/editor/components/CanvasHost.vue`（新增，将 canvas 独立为宿主组件）

## 实施
1. **分层容器**：
   - `<canvas id="editorCanvas" type="2d" class="canvas" disable-scroll="true" />`
   - 底部工具区不与 canvas 重叠；如需悬浮按钮/菜单，使用 `cover-view`
2. **事件管理**：
   - 仅在 `drag/select` 模式为 `active` 时绑定 `touchstart/move/end`
   - 其它模式 `catchtouchmove="false"` 并避免阻塞滚动
3. **z-index 约定**：`canvas`=0，工具区=10，浮层=100
4. **透传兜底**：若个别机型仍拦截，工具区容器改 `cover-view`

## 验收
- 真机点击工具区按钮**100% 生效**
- 画布拖拽时不触发页面滚动；退出拖拽后页面可滚动

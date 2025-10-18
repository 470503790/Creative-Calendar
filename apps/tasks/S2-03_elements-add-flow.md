# S2-03 · “元素”添加链路修复（真实设备）

## 目标
- 点击“添加”能在画布中看到新图层，并自动选中
- 失败时提供 toast 与日志

## 改动路径
- `pages/editor/tabs/Elements.vue`
- `stores/editor.ts`
- `core/renderer.ts`

## 实施
1. Elements.vue：按钮 → `store.addLayer(type, preset)` → `renderer.requestRender()`
2. Store：新增 `lastError`，失败写入并 `uni.showToast({icon:'none', title:'添加失败，请重试'})`
3. Renderer：渲染前校验 scene/page 与 layer bbox 合法；越界调整

## 验收
- 连续添加 10 次无异常；每次可见新图层
- 出错有 toast，控制台日志包含上下文

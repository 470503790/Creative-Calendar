# S2-04 · 渲染循环治理（rAF/polyfill + 请求合并）

## 改动路径
- `core/renderer.ts`

## 实施
- 引入 rAF polyfill；新增 `requestRender()` 合并多次重绘
- 属性输入采用 `debounce(120ms)`
- 所有调用改为 `renderer.requestRender()`

## 验收
- DevTools 卡顿缓解；每帧渲染次数 ≤1

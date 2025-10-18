# S2-06 · 文本测量缓存 & 字体去抖

## 实施
- `TextMetricsCache(max=512)`；key: `${font}|${size}|${text}`
- 文本输入框 `debounce(120)`；变更结束后再渲染

## 验收
- 快速输入时帧率稳定；渲染结果正确

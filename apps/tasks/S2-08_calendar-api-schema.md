# S2-08 · 日历参数 Schema（JSON Schema）

## 实施
- 定义 `CalendarProps`（周起始、农历/节气/节假、周数、样式等）
- `mergeWithDefaults(props)` 与 `validate(props)`

## 验收
- 无效参数回退默认并 warning；切换参数即时刷新

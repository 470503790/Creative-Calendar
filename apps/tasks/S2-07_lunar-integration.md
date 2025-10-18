# S2-07 · 集成 6tail/lunar-javascript（农历/节气/节假）

## 改动路径
- `libs/lunar/**`（vendor 源码）
- `services/lunarService.ts`
- `types/lunar.d.ts`

## 实施
- 拷贝 ESM 源码到 `libs/lunar`，剔除未用模块
- `lunarService` 暴露：`getLunar(date)`, `getFestivals(date)`, `monthData(year,month,weekStart)`
- 内存缓存（key:`yyyy-mm-dd`）

## 验收
- 打印当前月 42 单元的农历/节气（控制台）
- 小程序构建通过，无依赖冲突

# 任务卡

## 背景
完成首期可观测性建设，衡量核心漏斗（浏览 → 使用模板 → 编辑 → 导出 → 分享）。

## 输入
- 前端：PV/事件埋点（apps/*）
- 后端：请求与队列、导出成功率与 P95

## 目标
- [ ] 前端埋点：app_open、template_view/use、editor_add/export、share
- [ ] 后端指标：导出成功率、P95、错误率
- [ ] 仪表盘与告警（阈值）

## 输出
- 埋点 SDK 包装（packages/utils 或单独包）
- 后端日志格式化与聚合（Serilog + Sink）
- 文档：事件字典与上报规范

## 实施步骤
1. 统一事件枚举与公共字段（userId, platform, version）
2. 前端封装 `track()` 并落位关键路径
3. 后端 Prometheus/Log 收集与面板

## 验收标准
- [ ] 漏斗可视化；关键指标可查询

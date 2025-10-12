# DOC1 — 页面-路由对照表与命名规范（活文档）

> **阶段**：前端优先（uni-app, Vue3 + TS, mp-weixin） · **数据**：Mock  
> **规范**：参考《创意日历 App 全套界面与产品规范 V1》（最新）

## 目标（Goal）
- 产出一份 **页面/路由对照表** 与命名规范（目录/文件/组件/Store/事件名），便于后续扩展。

## 修改范围（Scope）
- 文档：`docs/routes-map.md`、`docs/naming.md`

## 输入与依赖（Inputs & Dependencies）
- 输入：现有页面清单与规范 V1
- 依赖：R1 完成后的结果

## 输出（Deliverables）
- 路由对照表（含责任人/状态/截图占位）
- 命名规范（例：`pages/<domain>/<name>`、组件 `PascalCase`、事件名 `snake_case`）

## 实施步骤（How to）
1. 根据审计结果生成初版 `routes-map.md`，表格包含：路径/中文名/责任人/完成度/备注/截图链接。
2. 撰写 `naming.md`：文件/组件/Store/commit/事件命名约定。

## 验收标准（Definition of Done）
- [ ] 两份文档合入仓库并在 README 链接
- [ ] 下阶段可作为 Codex 的输入

## 测试方案（Testing）
- 文档链接检查（相对路径有效）

## 风险与回滚（Risks & Rollback）
- 文档易过期 → 约定每个相关 PR 更新

## 估时与负责人（Estimate & Owner）
- 估时：0.5d
- 负责人：@待指派

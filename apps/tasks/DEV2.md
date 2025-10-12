# DEV2 — PR/DoD/CI 联动

> **阶段**：前端优先（uni-app, Vue3 + TS, mp-weixin） · **数据**：Mock  
> **规范**：见《创意日历 App 全套界面与产品规范 V1》

## 目标（Goal）
- PR/DoD/CI 联动，确保每个 PR 自检并过 CI。

## 修改范围（Scope）
- PR 模板/DoD 链接/CI 脚本

## 输入与依赖（Inputs & Dependencies）
- 输入：现有 CI 与模板
- 依赖：A1

## 输出（Deliverables）
- 文档联动与一次空提交绿灯

## 实施步骤（How to）
1. README 链接 `docs/DoD.md`。
2. Actions 工作流跑 lint/typecheck。
3. 提交空改动验证 CI。

## 验收标准（Definition of Done）
- [ ] 两个工作流绿灯
- [ ] PR 模板勾选项齐全

## 测试方案（Testing）
- 空改动触发一次 CI

## 风险与回滚（Risks & Rollback）
- 依赖问题 → 仅跑可行命令

## 估时与负责人（Estimate & Owner）
- 估时：0.5d
- 负责人：@待指派

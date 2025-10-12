# CI1 — CI 集成：路由审计 + Lint/Typecheck 绿灯

> **阶段**：前端优先（uni-app, Vue3 + TS, mp-weixin） · **数据**：Mock  
> **规范**：参考《创意日历 App 全套界面与产品规范 V1》（最新）

## 目标（Goal）
- 在 CI 中 **自动运行 `audit:routes`**，并将报告作为构件；保证 Lint/Typecheck 绿灯。

## 修改范围（Scope）
- `.github/workflows/fe-ci.yml`
- 复用 `tools/route-audit.mjs`

## 输入与依赖（Inputs & Dependencies）
- 输入：仓库现有 CI
- 依赖：R1/A1

## 输出（Deliverables）
- 新增 CI 工作流，产出审计报告

## 实施步骤（How to）
1. 新建 workflow：安装 Node（如 18.x），运行 `pnpm i`、`pnpm lint`、`pnpm typecheck`、`pnpm audit:routes`。
2. 使用 `actions/upload-artifact` 上传 `reports/route-audit.json`。

## 验收标准（Definition of Done）
- [ ] PR 能看到工作流结果与审计构件
- [ ] 失败条件：存在注册缺失或路径丢失

## 测试方案（Testing）
- 人为制造未注册页面，CI 应失败

## 风险与回滚（Risks & Rollback）
- pnpm cache 导致不稳定 → 加入 `--frozen-lockfile`

## 估时与负责人（Estimate & Owner）
- 估时：0.5d
- 负责人：@待指派

# Contributing / 与 Codex 协作指引

- 所有任务以 `/TASKS/*.md` 为准；每张卡需可独立构建与验收。
- PR 必须使用 `/.github/pull_request_template.md`，并遵循 `docs/DoD.md`。
- 前端统一用 pnpm 任务：`pnpm -r lint && pnpm -r test && pnpm -r build`；
  后端使用 .NET 8，提供 `/healthz` 与 Swagger。
- 任何密钥一律通过环境变量/CI Secret 注入，禁止入库。

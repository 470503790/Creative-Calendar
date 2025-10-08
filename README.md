# Creative Calendar - Monorepo Skeleton

本仓库包含：
- 前端 `uni-app` 三端（微信小程序 / H5 / App）最小可运行骨架
- 后端 `.NET 8` Web API 与 Background Worker 骨架
- `packages/*` 可复用库（tokens/ui/core/api-sdk/canvas-lite/...）
- CI 工作流与本地 `docker-compose` 基础设施

> 这是最小骨架，便于你直接开工；真实依赖与脚手架请按需升级。

## 运行指引（本地）
```bash
# 1) 前端（需要 Node 20+ 与 pnpm 9+）
pnpm -v || npm i -g pnpm
pnpm i
pnpm -r build

# 2) 后端（需要 .NET 8）
cd server/src/CreativeCalendar.WebApi
dotnet run
# 浏览器打开 http://localhost:5199/swagger  或  /healthz
```

## 目录说明
- `apps/miniapp`：微信小程序目标（mp-weixin）
- `apps/h5`：H5 站点（预览/分享页）
- `apps/app`：App 平台目标
- `packages/*`：复用包（按需填充）
- `server/*`：.NET 8 后端
- `infra/docker-compose.yml`：本地 SQL Server / Redis / RabbitMQ / MinIO

> 与 Codex 任务卡（A1–D2）配套使用最佳。

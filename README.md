# Creative Calendar - 前端优先（uni-app + 假数据）

本仓库提供基于 **uni-app（mp-weixin）** 的前端原型，使用 **Vue 3 + TypeScript** 并以内置假数据驱动模板列表、模板详情到轻量编辑器的完整链路。遵循《创意日历 App 全套界面与产品规范 V1》，目标是让新人在 10 分钟内完成环境搭建与运行。

> 📘 想了解提交验收标准，请查看 [Definition of Done](docs/DoD.md)。

## 快速上手（约 10 分钟）

1. **安装前置工具**
   - Node.js ≥ 18（推荐开启 `corepack enable` 以便使用 pnpm）。
   - pnpm ≥ 8（`corepack enable && corepack prepare pnpm@latest --activate`）。
   - HBuilderX 最新版。
   - 微信开发者工具（建议 64 位稳定版）。
2. **安装依赖**
   ```bash
   cd apps/miniapp
   pnpm install
   ```
3. **质量检查（可选但推荐）**
   ```bash
   pnpm run lint
   pnpm run typecheck
   ```
4. **通过 HBuilderX 运行到微信开发者工具**
   - 用 HBuilderX 打开 `apps/miniapp` 目录。
   - 打开 `manifest.json`，勾选「微信小程序」，AppID 可先留空。
   - 执行「运行」→「运行到小程序模拟器」→「微信开发者工具」。
   - 若需离线导入，可执行「发行」→「小程序-微信」，在微信开发者工具导入 `unpackage/dist/dev/mp-weixin`。

## 项目结构

```
Creative-Calendar
├─ apps/miniapp        # uni-app 前端源码（Vue3 + TS）
├─ scripts             # 辅助脚本（如缓存清理）
└─ tasks               # 需求规划/任务拆解
```

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm run lint` | 使用 `@antfu/eslint-config` 检查 `.ts` / `.vue` 代码。 |
| `pnpm run typecheck` | 基于 `vue-tsc` 的类型检查。 |
| `scripts/clean.sh` | macOS/Linux 清理缓存、`node_modules` 与构建产物。 |
| `scripts/clean.ps1` | Windows PowerShell 版本的清理脚本。 |

> Windows 用户在 PowerShell 中执行 `./scripts/clean.ps1`。macOS/Linux 用户执行 `./scripts/clean.sh`。

## 缓存清理流程

当遇到 HBuilderX 或 pnpm 运行异常时，可执行以下步骤恢复初始状态：

1. 在仓库根目录运行清理脚本（根据操作系统选择 `.sh` 或 `.ps1`）。
2. 重新执行 `pnpm install` 安装依赖。
3. 用 HBuilderX 重新编译并运行到微信开发者工具。

脚本会移除 `apps/miniapp/node_modules`、`apps/miniapp/unpackage` 以及常见包管理器的锁文件，并尝试执行 `pnpm store prune`。

## 常见问题 FAQ

- **Q: 运行 `pnpm` 提示命令不存在？**  
  A: 在终端执行 `corepack enable`，或手动安装 pnpm (`npm install -g pnpm`) 后重新打开终端。
- **Q: HBuilderX 无法运行到微信开发者工具？**  
  A: 确保已安装微信开发者工具，并在 HBuilderX 中正确配置「运行到小程序模拟器」。如仍报错，可尝试重新登录微信开发者工具并重启 HBuilderX。
- **Q: 微信开发者工具导入项目后空白？**  
  A: 使用「发行」→「小程序-微信」重新生成构建产物，再导入 `unpackage/dist/dev/mp-weixin`。如有缓存残留，请先执行清理脚本。
- **Q: lint/typecheck 报大量路径相关错误？**  
  A: 请确认命令在 `apps/miniapp` 目录下执行，并检查是否存在额外的软链接或网络盘路径。

## 验收与测试建议

新成员可按照「快速上手」章节逐步操作，确认能在微信开发者工具中看到模板列表页面，并通过 lint/typecheck 确认本地环境无报错。如需重置环境，可使用缓存清理流程快速回到初始状态。

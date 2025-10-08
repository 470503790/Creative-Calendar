# 任务卡

## 背景
建立跨多端（mp-weixin / h5 / app）与后端（.NET）的统一工作区，便于共享 packages（tokens/ui/core/api-sdk）。

## 输入
- 规范：《创意日历 App 全套界面与产品规范 V1》与选型方案 C
- 目标目录：`creative-calendar/`
- 需要的工作区：`apps/*`、`packages/*`、`server/*`
- Node 版本：≥ 20；包管理：pnpm

## 目标
- [ ] 建立 pnpm workspace 与 Turborepo（或 Nx）任务编排
- [ ] apps：`miniapp`、`h5`、`app` 三个子应用空壳可运行
- [ ] packages：`ui/tokens/i18n/utils/core/api-sdk/canvas-lite/upload-adapter` 空包与 tsconfig
- [ ] 统一 ESLint/Prettier/EditorConfig/Vitest 基线
- [ ] GitHub Actions 基础工作流（lint/test/build）

## 输出
- 目录树与关键配置文件
- `pnpm -r build` 可通过；CI 绿
- README（根 + 子包）

## 实施步骤
1. 初始化 `pnpm-workspace.yaml`、`turbo.json`、根 `package.json` 脚本
2. 创建 apps 与 packages 空目录 + 基础 tsconfig（路径别名）
3. 配置 ESLint/Vitest；设置 `typecheck` 脚本（vue-tsc）
4. GitHub Actions：Node setup + pnpm cache + `pnpm -r lint/test/build`
5. 验证三目标最小页面可运行（小程序/H5/App）

## 验收标准
- [ ] 本地 `pnpm -r build` 通过
- [ ] 三目标能启动 Hello 页面
- [ ] CI 全绿；README 齐全

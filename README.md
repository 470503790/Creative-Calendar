# Creative Calendar - 前端优先（uni-app + 假数据）

本目录包含 **uni-app（微信小程序目标）** 的最小可运行示例，
使用 **内置假数据** 完成：模板列表 → 模板详情 → 进入编辑器（轻编辑占位）。

> 运行建议：使用 **HBuilderX** 打开 `apps/miniapp` 并运行到「微信开发者工具」。
> 不依赖后端/数据库，所有数据来自 `utils/mock-api.ts`。

## 使用 HBuilderX 编译并导入微信开发者工具
1. 用 HBuilderX 打开 `apps/miniapp` 目录。
2. 在 HBuilderX 中选择 `manifest.json` → 勾选「微信小程序」，可暂时留空 AppID。
3. 执行「运行」→「运行到小程序模拟器」→「微信开发者工具」。
4. 如果需要先编译，可执行「发行」→「小程序-微信」，然后在微信开发者工具中导入 `unpackage/dist/dev/mp-weixin`。

## 命令
项目使用 pnpm 管理工具配置开发脚本，需在 `apps/miniapp` 目录下执行：

```bash
cd apps/miniapp
pnpm install
pnpm run lint
pnpm run typecheck
```

- `pnpm run dev:wx` / `pnpm run build:wx`：提示通过 HBuilderX 运行或构建小程序。
- `pnpm run lint`：使用 ESLint (`@antfu/eslint-config`) 检查 `.ts` / `.vue` 代码。
- `pnpm run typecheck`：基于 `vue-tsc` 执行 TypeScript 类型检查。

## 路由
- 首页：`/pages/index/index`
- 模板库：`/pages/templates/index`
- 模板详情：`/pages/templates/detail`
- 编辑器（占位）：`/pages/editor/index`

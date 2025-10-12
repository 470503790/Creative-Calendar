# Creative Calendar - uni-app（标准小程序目录）

这是一个 **标准 uni-app（微信小程序）源码结构** 示例：
- 根目录存在 `App.vue`、`main.ts`、`pages.json`、`manifest.json`
- 页面位于 `pages/*`，`pages.json` 中使用 **不带 src/** 的路径
- 可直接用 **HBuilderX** 运行到「微信开发者工具」，或先编译后再在微信开发者工具中导入 `unpackage/dist/dev/mp-weixin`

## 推荐流程
1. 用 HBuilderX 打开本目录。
2. 在 `manifest.json` 中启用「微信小程序」，填入 AppID（可暂留空）。
3. 运行 → 运行到小程序模拟器 → 选择「微信开发者工具」。
4. 若需先编译，可执行 发行 → 小程序-微信，并在微信开发者工具导入 `unpackage/dist/dev/mp-weixin`。

## 代码质量
- ESLint：`pnpm run lint`
- 类型检查：`pnpm run typecheck`
- Prettier 与 `.editorconfig` 统一了代码风格，可配合 lint-staged 在提交前格式化。

## 设计 Tokens 与主题
- 主题 tokens 定义于 `utils/tokens.ts`，包含颜色、字体字号、圆角与阴影。
- 在组件中通过 `useTheme()` 获取当前主题，使用返回的 `cssVars` 绑定到根节点即可输出 CSS 变量。
- 支持明暗主题切换，选择会持久化至本地存储（`creative-calendar-theme`）。
- 推荐使用 `var(--color-*)`、`var(--radius-*)`、`var(--font-*)` 等变量来编写样式，以确保主题一致性。

## 功能完成后的下一步
1. 在 `apps/miniapp` 中执行 `pnpm install` → `pnpm run lint` → `pnpm run typecheck`，确保规范与类型检查全部通过。
2. 使用 HBuilderX 运行到微信开发者工具，确认首页和关键页面在模拟器中工作正常。
3. 截取模拟器截图并附在 PR 中，便于验收。
4. 提交代码并推送后，可参考根目录 `README.md` 的指引准备后续功能开发。

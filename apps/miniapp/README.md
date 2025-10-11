# Creative Calendar - uni-app（标准小程序目录）

这是一个 **标准 uni-app（微信小程序）源码结构** 示例：
- 根目录存在 `App.vue`、`main.ts`、`pages.json`、`manifest.json`
- 页面位于 `pages/*`，`pages.json` 中使用 **不带 src/** 的路径
- 可直接用 **HBuilderX** 运行到「微信开发者工具」，或先编译后再在微信开发者工具中导入 `unpackage/dist/dev/mp-weixin`

## 运行
1. 用 HBuilderX 打开本目录
2. `manifest.json` → 选择“微信小程序”，填 AppID（可先留空）
3. 运行 → 运行到小程序模拟器 → 选择“微信开发者工具”

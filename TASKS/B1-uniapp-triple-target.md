# 任务卡

## 背景
落地前端三端统一工程，完成路由/状态/环境切换。

## 输入
- Vue3 + Vite + uni-app
- 状态管理：Pinia；国际化：vue-i18n
- tokens/ui 包可用

## 目标
- [ ] 初始化 `apps/miniapp`（目标 mp-weixin）、`apps/h5`、`apps/app`
- [ ] 路由：首页/模板库/编辑器/作品/我的（占位）
- [ ] 登录态与环境切换（dev/stg/prod）
- [ ] 统一主题（tokens）与基础组件（ui）
- [ ] 构建与启动脚本（含微信开发者工具 CLI 上传）

## 输出
- 三端可运行 demo
- 统一 Header/TabBar 与主题
- 脚本：`dev:h5`/`dev:wx`/`build:*`

## 实施步骤
1. 创建三个应用工程；接入 Pinia 与 i18n
2. 复用 `packages/ui` 与 `packages/tokens`
3. 实现环境切换（.env.*）与配置读取
4. 配置小程序上传脚本（体验版）
5. 编写最小页面与路由

## 验收标准
- [ ] 三端可运行并展示统一主题
- [ ] 小程序编译通过并能上传体验版

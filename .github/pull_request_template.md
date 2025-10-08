# PR 标题（简明扼要）

## 变更类型
- [ ] Feature
- [ ] Bugfix
- [ ] Refactor
- [ ] CI/CD
- [ ] Docs

## 相关 Issue/任务卡
- Closes #<issue>
- 任务卡：`/TASKS/<id-xxx>.md`

## 变更内容
- 主要改动点：
  - …
- 非兼容变更：
  - …（如有必须标注迁移说明）

## 截图/录屏（如 UI 影响）
> 放置关键界面的前后对比或动图。

## 自检清单（DoD 子集）
- [ ] 通过 `pnpm -r lint && pnpm -r test && pnpm -r build`
- [ ] 单测新增/覆盖率未下降
- [ ] 文档/README/CHANGELOG 已更新
- [ ] 无明文密钥/不提交 .env/证书
- [ ] 性能与包体预算符合阈值
- [ ] 小程序/H5/App 本地冒烟测试通过

## 风险与影响
- 风险点：…
- 回滚方案：`git revert` or 灰度回滚步骤

## 发布说明（可选）
- 用户可见变化：…

# 任务卡

## 背景
统一多端上传入口，支持小程序直传/签名，产物可被导出/预览页复用。

## 输入
- MinIO（开发）或云对象存储
- API：`POST /assets/upload`（签名）、`GET /assets/{id}`

## 目标
- [ ] 直传签名（小程序/H5/App）
- [ ] 元数据存储与回查（类型/尺寸/EXIF）
- [ ] URL 有时效签名；CDN 访问

## 输出
- SDK 适配（packages/upload-adapter）
- 服务端策略（白名单类型/大小限制/病毒扫描预留）
- 文档与示例

## 实施步骤
1. 生成上传 Policy/STS；服务端验证回调
2. 适配微信 `wx.uploadFile` 与 H5 fetch
3. 统一返回结构（id/url/hash/meta）

## 验收标准
- [ ] 三端上传通过；URL 可访问
- [ ] 大小/类型校验生效

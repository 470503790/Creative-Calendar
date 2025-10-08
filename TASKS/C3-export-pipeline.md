# 任务卡

## 背景
将编辑器场景 JSON 发送到后台队列，由 Worker 合成 PNG/JPG/PDF（A4/300dpi）。

## 输入
- API：`POST /exports`、`GET /exports/{jobId}`
- 队列：RabbitMQ/Redis Stream
- 渲染：SkiaSharp/ImageSharp

## 目标
- [ ] /exports 创建任务与入队
- [ ] Worker 消费并渲染（分块/离屏/文本曲线化可选）
- [ ] 结果上传对象存储并回写 URL；失败重试 3 次

## 输出
- 渲染器模块（合成管线、图层/滤镜/蒙版）
- 监控指标：成功率、P95 时长
- 文档：参数规范与示例

## 实施步骤
1. 设计任务 JSON 与状态机（Pending/Running/Fail/Done）
2. 实现合成流程与内存控制（切片 + 拼接）
3. 上传产物并回写；错误恢复与重试

## 验收标准
- [ ] 单页 A4/300dpi P95 ≤ 30s；成功率 ≥ 98%
- [ ] 失败有明确错误；可重试

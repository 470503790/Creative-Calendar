# 任务卡

## 背景
提供统一 API、持久化、对象存储与消息队列；为导出渲染 Worker 打基础。

## 输入
- .NET 8；SQL Server/Redis/MinIO/RabbitMQ（本地 docker-compose）
- 目录：`server/src/CreativeCalendar.*`
- 必要接口：/healthz、Swagger

## 目标
- [ ] WebApi：Minimal API、Swagger、JWT 验证、健康检查
- [ ] Domain/Application/Infrastructure 分层
- [ ] EF Core 初始化与迁移脚手架
- [ ] Background Worker（消息消费器骨架）
- [ ] 配置系统与环境变量模板

## 输出
- 可运行的 WebApi 与 Background 项目
- Swagger 文档
- EF 初始迁移
- README（启动方式 + 环境变量说明）

## 实施步骤
1. 新建解决方案与项目：WebApi/Domain/Application/Infrastructure/Background/Contracts
2. 接入 Swashbuckle、HealthChecks、Serilog
3. EF Core 配置（DbContext + Migrations）
4. RabbitMQ/Redis Stream 抽象与 Worker 消费循环
5. docker-compose（sqlserver/redis/minio/rabbitmq）

## 验收标准
- [ ] `/healthz` 200；Swagger 可访问
- [ ] `dotnet ef database update` 成功
- [ ] Background 启动并订阅队列

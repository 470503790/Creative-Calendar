# 任务卡

## 背景
建立首期五张核心表，支撑模板、作品、资产与导出任务。

## 输入
- 表：Users/Templates/Projects/Assets/ExportJobs
- .NET EF Core

## 目标
- [ ] 建模实体/DTO/映射
- [ ] 初始迁移与种子数据（示例模板）
- [ ] 单元测试覆盖仓储层 CRUD

## 输出
- Migration 脚本与回滚脚本
- 种子数据（10–20 个模板）
- xUnit 单测 20+

## 实施步骤
1. 实体与关系定义；约束（唯一键/索引）
2. `dotnet ef migrations add init` 并验证
3. 仓储接口与实现；单测覆盖 CRUD
4. 本地 docker-compose 跑通 `update`

## 验收标准
- [ ] 迁移可升级/可回滚
- [ ] 单测通过；覆盖率门限达标

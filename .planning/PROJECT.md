# LeClaw

**基于 OpenClaw 的 Agent 监控 + 多层协同编排框架**

## What This Is

LeClaw 是一个独立进程，通过连接外部 OpenClaw 实例来实现：
1. **Agent 分层管理** — Company/Department 组织架构，CEO/Manager/Staff 三级 Agent
2. **Hybrid 协同编排** — 高对低是分配+验收，低对低是平行协作，零人工介入
3. **全链路监控** — 日志聚合、调用链路、性能指标、安全审计
4. **策略进化** — 基于运行反馈调整 Agent 行为策略

## Core Value

**ONE thing that must work:** 分层 Agent 协同编排 + 实时状态监控

## Target Users

个人用户管理多个 AI-native 公司，处理不同业务线。无 Auth 设计。

## Architecture

### 系统边界
- **LeClaw**: 独立进程，通过 API/SDK 连接外部 OpenClaw 实例
- **OpenClaw**: 被管理的运行时，LeClaw 不嵌入、不修改
- **Paperclip**: 参考 embedded PostgreSQL 设计，不直接集成

### 数据存储
- Embedded PostgreSQL（借鉴 paperclip 设计）
- 多 Company 数据隔离（通过 PostgreSQL schema）

### 分层组织架构
```
Company (公司)
  └── CEO Agent (从 OpenClaw agents 中指定)
       └── Department (部门)
            ├── Manager Agent
            └── Staff Agents (多个)
```

固定两层：Company → Department，不支持嵌套子部门。

### 协作模式 (Hybrid)
| 层级关系 | 协作方式 |
|---------|---------|
| CEO → Manager | 分配任务 + 验收结果 |
| Manager → Staff | 分配任务 + 验收结果 |
| 同级 (Manager↔Manager, Staff↔Staff) | 平行协作 |

### 实时状态
- Web UI 实时推送：SSE (参考 openclaw-control-center)
- 后台监控：轮询 + heartbeat 机制
- Timeline 日志：每次监控事件记录

## Features

### v1 Requirements

#### 1. CLI 端
- [ ] `leclaw init` — 初始化配置目录
- [ ] `leclaw config openclaw --dir <path>` — 配置 OpenClaw 目录
- [ ] `leclaw config gateway --url <url> --key <key>` — 配置 Gateway 地址和密钥
- [ ] `leclaw start` — 启动 LeClaw 服务
- [ ] `leclaw status` — 查看连接状态

#### 2. Web 调度中心
- [ ] Dashboard — 总览所有 Companies 和 Agents 状态
- [ ] OpenClaw Agent 列表 — 自动扫描展示所有可用 agents 及实时状态
- [ ] Company 管理 — 创建、编辑、删除 Company
- [ ] Department 管理 — 在 Company 下创建 Department
- [ ] Agent 绑定 — 从 OpenClaw agents 中指定 CEO/Manager/Staff
- [ ] Issue 面板 — 创建、查看 Issues（支持 Web UI 人工创建 + REST API 创建）

#### 3. OpenClaw 连接层
- [ ] 定期扫描 OpenClaw agents 列表
- [ ] 轮询 agent 状态（参考 control-center monitor）
- [ ] Gateway 连接与认证
- [ ] Agent 心跳检测

#### 4. 数据层
- [ ] Embedded PostgreSQL 初始化
- [ ] Company/Department 数据模型
- [ ] Agent 绑定关系存储
- [ ] Issue 数据模型

### v2 Requirements (Deferred)
- [ ] Issue 自动分配给 Agent（基于策略）
- [ ] Agent 协同任务执行
- [ ] 全链路日志聚合
- [ ] 调用链路追踪
- [ ] 性能指标监控
- [ ] 安全审计
- [ ] 策略进化引擎

### Out of Scope
- [ ] Auth/多租户 SaaS — LeClaw 单用户设计
- [ ] Agent 代码修改 — 只读加载 OpenClaw agents
- [ ] OpenClaw 嵌入 — 独立进程连接外部实例
- [ ] 嵌套子部门 — 固定 Company→Department 两层

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 独立进程连接 OpenClaw | 不修改 OpenClaw，保持灵活性 | LeClaw 作为管理层 |
| React Web UI | 用户指定技术栈 | — |
| SSE 实时推送 | 参考 openclaw-control-center | — |
| Embedded PostgreSQL | 参考 paperclip 设计 | — |
| 固定两层组织 | 简化复杂度，MVP 优先 | — |
| Hybrid 协作模式 | 支持分配+验收 + 平行协作 | — |
| 零 Auth 设计 | 单用户管理多公司 | — |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-05 after initialization*

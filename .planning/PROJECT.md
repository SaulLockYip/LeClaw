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

## Current State

**v1.0 MVP shipped** — All 8 phases complete. CLI, REST API, Web UI, and E2E test infrastructure operational.

### Validated Requirements (v1.0)

| Requirement | Description | Milestone |
|-------------|-------------|-----------|
| CLI-01 to CLI-05 | All CLI commands implemented | v1.0 |
| DATA-01 to DATA-05 | All entity schemas + embedded PostgreSQL | v1.0 |
| OPENCLAW-01 to OPENCLAW-04 | Agent discovery, polling, heartbeat, SSE events | v1.0 |
| API-01 to API-05 | REST API for all entities | v1.0 |
| RT-01 to RT-03 | SSE real-time updates with auto-reconnect | v1.0 |
| UI-01 to UI-09 | Web UI dashboard and entity pages | v1.0 |
| ISSUE-01 to ISSUE-04 | Issue CRUD and API creation | v1.0 |

### Active Requirements (v2)

- [ ] V2-01: Issues automatically assigned to appropriate Department agents based on routing rules
- [ ] V2-02: CEO agent can decompose a goal and distribute subtasks to Manager agents
- [ ] V2-03: Manager agents coordinate Staff agents for parallel task execution
- [ ] V2-04: Agent completion triggers automatic Issue status update and notification
- [ ] V2-05: Full audit log viewer UI
- [ ] V2-06: Performance metrics dashboard for agent execution times
- [ ] V2-07: Strategy evolution engine adjusts agent behavior based on success/failure patterns

### Out of Scope (Still Valid)

- [x] ~~Auth/多租户 SaaS~~ — LeClaw 单用户设计
- [x] ~~Agent 代码修改~~ — 只读加载 OpenClaw agents
- [x] ~~OpenClaw 嵌入~~ — 独立进程连接外部实例
- [x] ~~嵌套子部门~~ — 固定 Company→Department 两层

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 独立进程连接 OpenClaw | 不修改 OpenClaw，保持灵活性 | ✅ LeClaw 作为管理层 |
| React Web UI | 用户指定技术栈 | ✅ Implemented in Phase 5-6 |
| SSE 实时推送 | 参考 openclaw-control-center | ✅ Implemented with 30s heartbeat |
| Embedded PostgreSQL | 参考 paperclip 设计 | ✅ Working with skipLibCheck workaround |
| 固定两层组织 | 简化复杂度，MVP 优先 | ✅ Company→Department only |
| Hybrid 协作模式 | 支持分配+验收 + 平行协作 | ✅ Designed, not yet active |
| 零 Auth 设计 | 单用户管理多公司 | ✅ No auth implemented |
| Express over Hono | 现有代码库使用 Express | ✅ Phase 4 switched from Hono |

## Context

**v1.0 shipped:** 2026-04-07
**Tech stack:** TypeScript (ES2023), Node.js 22+, Express 5.2.1, React Router v7, Drizzle ORM, embedded-postgres, Playwright
**Lines of code:** ~10,800 source files
**Timeline:** 2 days (2026-04-05 → 2026-04-07)
**Commits:** 38

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
*Last updated: 2026-04-07 after v1.0 milestone*

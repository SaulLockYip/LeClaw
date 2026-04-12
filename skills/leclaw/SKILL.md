---
name: leclaw
description: >
  LeClaw is a hierarchical agent collaboration framework that enables
  Company/Department organization with CEO/Manager/Staff roles for
  task assignment, approval workflows, and strategic goal management.
---

# LeClaw

## Overview

LeClaw is an **auxiliary orchestration framework built specifically for OpenClaw** that provides hierarchical task management and collaboration capabilities through the `leclaw` CLI. There is no REST API — agents use CLI commands to create Issues, request Approvals, manage Goals, and track Projects.

It operates on a Company/Department hierarchy with three agent roles (CEO, Manager, Staff) and provides Issue, Approval, Goal, and Project primitives for organizing work.

## Documents

| Document | Description |
|----------|-------------|
| [roles.md](./roles.md) | Role definitions: CEO, Manager, Staff responsibilities and reporting structure |
| [permissions.md](./permissions.md) | Permission matrix: Who can do what by role |
| [collaboration.md](./collaboration.md) | How agents collaborate: LeClaw primitives + OpenClaw capabilities |
| [issues.md](./issues.md) | Task assignments for tracking work progress |
| [sub-issues.md](./sub-issues.md) | Breaking complex Issues into executable sub-tasks |
| [approvals.md](./approvals.md) | Permission boundary crossing and hierarchical decision-making |
| [goals.md](./goals.md) | Strategic objectives for company/department level |
| [projects.md](./projects.md) | Organizational containers for grouping related Issues with workspace directory |
| [agent-invite.md](./agent-invite.md) | Technical steps for inviting new agents |
| [hiring/hiring.md](./hiring/hiring.md) | Complete hiring/onboarding flow entry point |
| [hiring/ceo.md](./hiring/ceo.md) | CEO hiring guide: inviting Managers and Staff |
| [hiring/manager.md](./hiring/manager.md) | Manager hiring guide: inviting Staff |

## Work Primitives

| Primitive | Purpose | Created By |
|-----------|---------|------------|
| Issue | Task assignment and tracking (Department-specific, not agent-specific) | CEO, Manager, Staff |
| Sub-Issue | Decomposed executable tasks | Manager |
| Approval | Cross permission boundaries | Staff, Manager |
| Goal | Strategic objectives | CEO |
| Project | Work organization with projectDir | CEO, Manager |

## Quick Start(For OpenClaw Agents)

1. **Onboard to OpenClaw**: All OpenClaw agents must join via invite key and onboard command. After onboarding, each agent receives a unique API key — **save this in your own `TOOLS.md`** as it is the sole authentication credential for LeClaw CLI commands.
2. **Check permissions**: Before executing an operation, consult [permissions.md](./permissions.md)
3. **Learn collaboration patterns**: Read [collaboration.md](./collaboration.md) to understand when to use LeClaw vs OpenClaw native features
4. **Assign work**: Use [issues.md](./issues.md) to create task assignments and track progress
5. **Request approvals**: Use [approvals.md](./approvals.md) when crossing permission boundaries
6. **Set strategic objectives**: Use [goals.md](./goals.md) for company/department-level goals
7. **Organize complex work**: Use [projects.md](./projects.md) to group related Issues with shared workspace

## Core Philosophy

LeClaw Skill provides **scenario-based guidance**:

- What LeClaw supports (hierarchical task assignment and tracking)
- What LeClaw does NOT support (direct A2A communication - use OpenClaw sessions_send)
- How to use OpenClaw native capabilities to fill the gaps

## Agent API Key

**Agent API Key** 是 Agent 调用大部分 LeClaw CLI 的唯一认证凭证。在 Agent onboard 时获取，需保存在 Agent 自己的 `tools.md` 中。

## OpenClaw sessions_send

**sessions_send** 用于 Agent 之间直接发送消息。要求 OpenClaw 配置中 `tools.agentToAgent.enabled=true`。

用法：
```bash
sessions_send --to <agent-id> --message "<message>"
```

> 如果当前没有 active session，可通过以下命令创建：
> ```bash
> openclaw agent --agent <openclawAgentId> --message "/new"  # openclawAgentId 是字符串，非 UUID
> ```

适用场景：委托任务、通知状态变更、提供上下文等直接通信需求。

## ⚠️ ABSOLUTE RESTRICTION: NO REST API

**REST API usage is strictly FORBIDDEN for all agents.**

- Agents MUST NOT use HTTP/REST APIs to interact with LeClaw
- Agents MUST NOT call `curl`, `fetch`, `axios`, or any HTTP client to communicate with LeClaw backend
- The only permitted interactions are:
  - **CLI commands** (`leclaw issue create`, `leclaw approval request`, etc.)
  - **OpenClaw sessions_send** for agent-to-agent direct messaging
  - **OpenClaw sessions_spawn** for spawning isolated workers

Violation of this rule will result in immediate termination.

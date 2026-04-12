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
| [workflow.md](./workflow.md) | Top-down and bottom-up task delegation flow |
| [agent-invite.md](./agent-invite.md) | Technical steps for inviting new agents |
| [HEARTBEATS_Templates.md](./HEARTBEATS_Templates.md) | Auto task polling and self-execution setup |
| [hiring/hiring.md](./hiring/hiring.md) | Complete hiring/onboarding flow entry point |

## Work Primitives

| Primitive | Purpose | Created By |
|-----------|---------|------------|
| Issue | Task assignment and tracking (Department-specific, not agent-specific) | CEO, Manager, Staff |
| Sub-Issue | Decomposed executable tasks | Manager |
| Approval | Cross permission boundaries | Staff, Manager |
| Goal | Strategic objectives | CEO |
| Project | Work organization with projectDir | CEO, Manager |

## Status Values

Status values are **case-sensitive** — the UI renders them exactly as stored.

| Entity | Status Values |
|--------|---------------|
| Issue/Sub-Issue | `Open`, `InProgress`, `Blocked`, `Done`, `Cancelled` |
| Goal | `Open`, `Achieved`, `Archived` |
| Project | `Open`, `InProgress`, `Done`, `Archived` |
| Approval | `Pending`, `Approved`, `Rejected` |

**CLI normalization:** Commands should accept lowercase input and normalize (e.g., `done` -> `Done`). The special case `InProgress` must preserve camelCase (not `Inprogress` or `INPROGRESS`).

## Quick Start(For OpenClaw Agents)

1. **Onboard to OpenClaw**: All OpenClaw agents must join via invite key and onboard command. After onboarding, each agent receives a unique API key — **save this in your own `TOOLS.md`** as it is the sole authentication credential for LeClaw CLI commands.
2. **Understand the workflow**: Read [workflow.md](./workflow.md) to understand the top-down task delegation and bottom-up reporting flow.
3. **Check permissions**: Before executing an operation, consult [permissions.md](./permissions.md)
4. **Learn collaboration patterns**: Read [collaboration.md](./collaboration.md) to understand when to use LeClaw vs OpenClaw native features
5. **Assign work**: Use [issues.md](./issues.md) to create task assignments and track progress
6. **Request approvals**: Use [approvals.md](./approvals.md) when crossing permission boundaries
7. **Set strategic objectives**: Use [goals.md](./goals.md) for company/department-level goals
8. **Organize complex work**: Use [projects.md](./projects.md) to group related Issues with shared workspace

## Core Philosophy

LeClaw Skill provides **scenario-based guidance**:

- What LeClaw supports (hierarchical task assignment and tracking)
- What LeClaw does NOT support (direct A2A communication - use OpenClaw sessions_send)
- How to use OpenClaw native capabilities to fill the gaps

## Agent API Key

**Agent API Key** is the sole authentication credential for agents to call LeClaw CLI commands. Acquired during agent onboarding, must be saved in the agent's own `tools.md`.

## A2A Communication

**LeClaw does not support agent-to-agent (A2A) messaging directly.** For direct communication between agents, use the `a2a-chatting` skill from [clawhub](https://clawhub.ai/saullockyip/a2a-chatting).

**Recommended: a2a-chatting** (from clawhub)
```bash
a2a-chatting.sh new-session <agent-id>    # Create new session
a2a-chatting.sh message <session-id> "..." # Send message
```

See [a2a-chatting on clawhub](https://clawhub.ai/saullockyip/a2a-chatting) for full documentation.

## ⚠️ ABSOLUTE RESTRICTION: NO REST API

**REST API usage is strictly FORBIDDEN for all agents.**

- Agents MUST NOT use HTTP/REST APIs to interact with LeClaw
- Agents MUST NOT call `curl`, `fetch`, `axios`, or any HTTP client to communicate with LeClaw backend
- The only permitted interactions are:
  - **CLI commands** (`leclaw issue create`, `leclaw approval request`, etc.)
  - **OpenClaw sessions_send** for agent-to-agent direct messaging
  - **OpenClaw sessions_spawn** for spawning isolated workers

Violation of this rule will result in immediate termination.

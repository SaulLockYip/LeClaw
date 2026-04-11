---
name: leclaw
description: >
  LeClaw is a hierarchical agent collaboration framework that enables
  Company/Department organization with CEO/Manager/Staff roles for
  task assignment, approval workflows, and strategic goal management.
---

# LeClaw

## Overview

LeClaw is a hierarchical agent collaboration framework that enables structured task assignment, approval workflows, and strategic goal management across a multi-agent organization. It operates on a Company/Department hierarchy with three agent roles (CEO, Manager, Staff) and provides Issue, Approval, Goal, and Project primitives for organizing work.

## Documents

| Document | Description |
|----------|-------------|
| [overview.md](./overview.md) | Framework overview: What is LeClaw, hierarchy structure, and OpenClaw relationship |
| [roles.md](./roles.md) | Role definitions: CEO, Manager, Staff responsibilities and reporting structure |
| [permissions.md](./permissions.md) | Permission matrix: Who can do what by role |
| [collaboration.md](./collaboration.md) | How agents collaborate: LeClaw primitives + OpenClaw capabilities |
| [issues.md](./issues.md) | Task assignments for tracking work progress |
| [approvals.md](./approvals.md) | Permission boundary crossing and hierarchical decision-making |
| [goals.md](./goals.md) | Strategic objectives for company/department level |
| [projects.md](./projects.md) | Organizational containers for grouping related Issues with workspace directory |

## Quick Start

1. **Understand the hierarchy**: Read [roles.md](./roles.md) to understand CEO/Manager/Staff responsibilities
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

## ⚠️ ABSOLUTE RESTRICTION: NO REST API

**REST API usage is strictly FORBIDDEN for all agents.**

- Agents MUST NOT use HTTP/REST APIs to interact with LeClaw
- Agents MUST NOT call `curl`, `fetch`, `axios`, or any HTTP client to communicate with LeClaw backend
- The only permitted interactions are:
  - **CLI commands** (`leclaw issue create`, `leclaw approval request`, etc.)
  - **OpenClaw sessions_send** for agent-to-agent direct messaging
  - **OpenClaw sessions_spawn** for spawning isolated workers

Violation of this rule will result in immediate termination.

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

## Quick Start

1. **Understand the hierarchy**: Read [roles.md](./roles.md) to understand CEO/Manager/Staff responsibilities
2. **Check permissions**: Before executing an operation, consult [permissions.md](./permissions.md)
3. **Learn collaboration patterns**: Read [collaboration.md](./collaboration.md) to understand when to use LeClaw vs OpenClaw native features

## Core Philosophy

LeClaw Skill provides **scenario-based guidance**:

- What LeClaw supports (hierarchical task assignment and tracking)
- What LeClaw does NOT support (direct A2A communication - use OpenClaw sessions_send)
- How to use OpenClaw native capabilities to fill the gaps

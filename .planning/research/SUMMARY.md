# LeClaw Research Summary

**Project:** LeClaw - Agent Management Platform
**Synthesized:** 2026-04-05
**Source Files:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Executive Summary

LeClaw is an agent management platform with React UI, Node.js backend, embedded database, and SSE real-time updates that connects to external OpenClaw instances. The platform manages a hierarchical agent workforce (CEO, Manager, Staff roles organized into Companies and Departments), enabling multi-agent collaboration and task orchestration. Based on ecosystem analysis of CrewAI, AutoGen, LangChain, Dify, and n8n, the recommended approach is to prioritize table stakes (CLI management, dashboard visibility, basic orchestration) while differentiating through hierarchical collaboration and zero-human task routing.

The technology stack favors minimal magic and maximum control: React 18.x + TypeScript 5.x + Vite 5.x on the frontend, Express 4.x or Fastify 3.x on the backend, Commander.js for CLI tooling, and native SSE for real-time communication. The architecture follows a clear separation between the CLI tool (project initialization and server lifecycle), the server (REST API, SSE, OpenClaw bridge), and the React UI (dashboard, collaboration hall, real-time displays). Embedded PostgreSQL (via pg-mem for development) provides data persistence, with the understanding that "true embedded PostgreSQL" does not exist - alternatives like Docker or Supabase may be needed for production.

Key risks include: (1) OpenClaw external runtime trust assumptions without verification, (2) beta status of embedded-postgres creating instability, (3) SSE connection drops being silent without proper heartbeat, and (4) circular dependencies in the monorepo structure. These must be addressed in Phase 1-3 to ensure a solid foundation.

---

## Key Findings

### From STACK.md

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x or 19.x | UI framework |
| TypeScript | 5.x | Type safety for complex agent state |
| Vite | 5.x | Build tool with fast HMR |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | latest | UI primitives |
| TanStack Query | 5.x | Server state + SSE integration |
| Zustand | 4.x or 5.x | Client UI state |
| Commander.js | 14.x | CLI framework |
| Express/Fastify | 4.x/3.x | HTTP server |
| pg + @databases/pg | latest | PostgreSQL client |
| pg-mem | latest | In-memory DB for dev |
| React Flow | 11.x | Orchestration visualization |

**Critical notes:**
- "Embedded PostgreSQL" is non-standard; pg-mem for dev, Docker/Supabase for prod
- Native SSE with browser EventSource (no complex libraries)
- React Flow adds complexity; may be overkill for basic MVP

### From FEATURES.md

**Table Stakes (MVP Required):**
- CLI: init, config gateway, start/stop/status, env secrets
- Dashboard: agent list with status, task creation/assignment, task status tracking, logging
- Orchestration: sequential/parallel task execution, agent-to-agent messaging
- API: REST endpoints, webhook callbacks

**Differentiators (v2+):**
- Hierarchical collaboration (CEO→Manager→Staff delegation with context preservation)
- Zero-human autonomous routing and auto-completion
- Full observability (distributed tracing, performance metrics, audit logs)
- Strategy evolution (feedback loops, prompt adaptation)
- Integration ecosystem (Jira, Linear, GitHub, Slack)

**Anti-Features to Avoid:**
- Visual drag-drop workflow builder
- Multi-cloud deployment in v1
- Full RBAC permission system
- Native LLM fine-tuning
- Mobile app
- Plugin marketplace

**MVP Priority Order:**
1. CLI + Config (init, gateway, start/stop/status)
2. Agent Registration + Status Monitoring
3. Basic Task Execution
4. Dashboard with Company/Dept/Agent views
5. Hierarchical Collaboration
6. REST API for task creation
7. Zero-human auto-completion
8. Observability Stack

### From ARCHITECTURE.md

**System Components:**
- React Web UI (User-facing dashboard, real-time displays)
- SSE Handler (Push updates to connected clients)
- REST API Controller (CRUD for companies, departments, agents, tasks)
- Agent Bridge (OpenClaw Gateway communication via HTTP)
- Service Layer (Business logic for hierarchy, roles, tasks)
- Embedded PostgreSQL (Data persistence)
- CLI Tool (init, config, start)

**Key Architectural Patterns:**
1. **External Process Communication** - LeClaw connects to OpenClaw via Gateway HTTP protocol (not embedded)
2. **SSE Real-time Updates** - Server-Sent Events for push updates to UI
3. **Fixed 2-Level Hierarchy** - Company → Department (intentionally constrained)
4. **Embedded PostgreSQL** - In-process database for single-user deployments

**Build Order Implications:**
- CLI must be buildable before server (CLI launches server)
- Server DB schema must exist before API controllers
- Bridge must exist before SSE (SSE emits bridge events)
- Server + Bridge must exist before UI (UI connects to server)

**Project Structure:**
```
leclaw/
├── cli/           # CLI tool (init/config/start)
├── server/        # Express API + SSE + Bridge
├── ui/            # React frontend
├── shared/        # Shared types
└── package.json   # Workspace root
```

### From PITFALLS.md

**Critical Pitfalls:**

| Pitfall | Phase | Mitigation |
|---------|-------|------------|
| Trusting external OpenClaw runtime without verification | 2 | Two-phase liveness check (registry + heartbeat) |
| No idempotency in agent binding | 2 | Database unique constraints, upsert semantics |
| Circular dependencies in monorepo | 1 | MADGE in CI, layer enforcement |
| PostgreSQL crash corruption | 2 | Graceful shutdown, health checks |
| SSE connection drops silently | 3 | Heartbeat every 15-30s via comment lines |
| Missed events on reconnect | 3 | Last-Event-ID tracking, 30s buffer |
| CLI destructive commands without confirmation | 1 | --force flag + prompt pattern |
| Single point of failure at CEO | 2 | Replaceable CEO, checkpointing |
| Circular task dependencies | 2 | Cycle detection, max assignment depth |

**Moderate Pitfalls:**
- Polling frequency (too aggressive or too passive)
- Shared types drift between packages (use @leclaw/types package)
- Build order dependencies in monorepo
- Port conflicts in development
- Different ESLint/TypeScript configs per package
- SSE events sent after client disconnect
- Flat hierarchy abuse (no Managers)
- Peer collaboration deadlock

---

## Implications for Roadmap

### Recommended Phase Structure

**Phase 1: Foundation + CLI**
- Project scaffolding with monorepo structure
- CLI tool implementation (init, config, start/stop/status)
- Shared types package (@leclaw/types)
- Build system setup (Turborepo/pnpm)
- ESLint/TypeScript config standardization

**Rationale:** CLI is the entry point and must work independently. Foundation must be solid before backend work begins.

**Phase 2: Data Layer + OpenClaw Bridge**
- PostgreSQL schema + migrations (pg-mem for dev)
- REST API controllers (CRUD for all entities)
- OpenClaw Gateway client implementation
- Agent status polling with exponential backoff
- Two-phase agent liveness verification
- Task dispatch with idempotency
- Cycle detection in task dependencies

**Rationale:** Core business logic depends on data layer. OpenClaw bridge is the critical integration point.

**Phase 3: Real-Time Infrastructure (SSE)**
- Event emitter infrastructure
- SSE endpoint with proper headers
- Heartbeat every 15-30 seconds
- Last-Event-ID tracking for reconnection
- Client disconnect cleanup
- Shared SSE event schema

**Rationale:** SSE layer connects server state to UI. Must be robust before UI work begins.

**Phase 4: Web UI**
- Page routing (Overview, Staff, Collab, Tasks)
- REST API integration
- SSE hook implementation (useSSE)
- Real-time UI updates
- Company/Department/Agent views
- Task creation and assignment UI

**Rationale:** UI depends on server, bridge, and SSE being functional.

**Phase 5: Collaboration Features**
- Hall/collaboration domain
- Hierarchical task delegation (CEO→Manager→Staff)
- Task orchestration with context preservation
- Deadline and escalation logic
- Priority-based task processing

**Rationale:** Collaboration is the differentiator. Must have core features working first.

---

### Research Flags

| Phase | Needs Research | Notes |
|-------|----------------|-------|
| Phase 1 | No | Standard patterns; MADGE, Commander.js well-documented |
| Phase 2 | YES | OpenClaw API behavior under load, rate limits, failure modes |
| Phase 2 | YES | embedded-postgres beta limitations (18.1.0-beta.16 specific bugs) |
| Phase 3 | No | SSE pitfalls well-documented |
| Phase 4 | No | React + TanStack Query patterns standard |
| Phase 5 | YES | Agent collaboration protocols in OpenClaw ecosystem |

**Deep research needed before Phase 2 planning:**
- OpenClaw Gateway protocol specifics (authentication, rate limits, webhook support)
- embedded-postgres stability for production use
- Real-world concurrent SSE connection limits

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Well-established technologies; specific versions need verification |
| Features | MEDIUM | Ecosystem patterns solid; LeClaw-specific may reveal gaps |
| Architecture | MEDIUM-HIGH | Based on reference implementations (OpenClaw Control Center, Paperclip) |
| Pitfalls | MEDIUM | General pitfalls well-known; OpenClaw-specific behavior uncertain |

### Gaps Needing Attention

1. **OpenClaw Gateway protocol** - Authentication method, rate limits, failure modes unknown
2. **embedded-postgres beta status** - 18.1.0-beta.16 specific bugs/missing features
3. **Real-world scaling** - Concurrent SSE limits, polling overhead at scale
4. **Agent collaboration protocols** - Existing standards in OpenClaw ecosystem
5. **CLI-Server state sync** - How CLI and Web UI share state (single source of truth needed)

---

## Sources

**Stack Research:**
- Commander.js GitHub (CLI standard)
- TanStack Query Docs (SSE/streaming support)
- React Flow (Node graph visualization)
- pg-mem GitHub (In-memory PostgreSQL)
- Tailwind CSS, shadcn/ui documentation

**Features Research:**
- CrewAI documentation (agent roles, tasks, crew orchestration)
- Microsoft AutoGen (multi-agent conversations)
- LangChain Agents (tool use, chains)
- Dify (open source LLM app platform)
- n8n (workflow automation)
- OpenAI Agents SDK (handoffs, tracing)

**Architecture Research:**
- OpenClaw Control Center architecture analysis
- OpenClaw Gateway protocol documentation
- Paperclip multi-agent orchestration patterns
- SSE standard (MDN Web Docs)

**Pitfalls Research:**
- Agent management platform patterns (distributed systems knowledge)
- Monorepo patterns (Turborepo, Nx, Lerna)
- SSE real-time communication best practices
- CLI design patterns (Commander.js)

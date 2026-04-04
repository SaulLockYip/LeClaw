# Architecture Research

**Domain:** Agent Management + Multi-Agent Collaboration Framework
**Researched:** 2026-04-05
**Confidence:** MEDIUM-HIGH (based on analysis of OpenClaw, OpenClaw Control Center, and Paperclip reference implementations)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Web UI Layer (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │Overview  │  │Staff/    │  │Collab    │  │Tasks/    │          │
│  │Dashboard │  │Roster    │  │Hall      │  │Tickets   │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
├───────┴─────────────┴─────────────┴─────────────┴─────────────────┤
│                    SSE Real-time Event Stream                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    LeClaw Server (Node.js)                    │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │  │
│  │  │ REST API   │  │ SSE Handler│  │Agent Bridge│             │  │
│  │  │ Controller │  │            │  │ (OpenClaw) │             │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘             │  │
│  │        └───────────────┴───────────────┘                    │  │
│  │                        │                                      │  │
│  │  ┌─────────────────────┴─────────────────────┐              │  │
│  │  │           Service Layer                     │              │  │
│  │  │  Company | Department | Agent | Task       │              │  │
│  │  └─────────────────────┬─────────────────────┘              │  │
│  └────────────────────────┼────────────────────────────────────┘  │
├────────────────────────────┼───────────────────────────────────────┤
│                    Data Layer (Embedded PostgreSQL)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │Companies │  │Departments│  │ Agents   │  │ Tasks    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTP/gRPC (External Process)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    External OpenClaw Instance(s)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                         │
│  │ Agent 1  │  │ Agent 2  │  │ Agent N  │  (CEO/Manager/Staff)     │
│  └──────────┘  └──────────┘  └──────────┘                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         CLI Tool (Separate Process)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                         │
│  │   init   │  │  config  │  │  start   │                         │
│  └──────────┘  └──────────┘  └──────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **React Web UI** | User-facing dashboard, real-time display, collaboration hall | React 18+ with SSE subscription |
| **SSE Handler** | Push real-time updates to connected UI clients | Server-Sent Events via `/events` endpoint |
| **REST API Controller** | Handle CRUD operations for companies, departments, agents, tasks | Express/Fastify routes |
| **Agent Bridge** | Communicate with external OpenClaw instances via Gateway protocol | HTTP client with retry/backoff |
| **Service Layer** | Business logic for hierarchy, role mapping, task orchestration | TypeScript services |
| **Embedded PostgreSQL** | Persist all data (companies, departments, agents, tasks, audit logs) | `better-sqlite3` or `postgres` with `better-sqlite3` |
| **CLI Tool** | Initialize project, configure connections, start server | Commander.js orocl |

## Recommended Project Structure

```
leclaw/
├── cli/                      # CLI tool for init/config/start
│   ├── src/
│   │   ├── commands/        # init, config, start commands
│   │   ├── config/          # Configuration loader/validator
│   │   └── index.ts         # CLI entry point
│   └── package.json
├── server/                   # Main server application
│   ├── src/
│   │   ├── api/             # REST API controllers/routes
│   │   │   ├── companies.ts
│   │   │   ├── departments.ts
│   │   │   ├── agents.ts
│   │   │   └── tasks.ts
│   │   ├── sse/             # SSE event handlers
│   │   │   └── handler.ts
│   │   ├── bridge/          # OpenClaw Gateway communication
│   │   │   ├── client.ts
│   │   │   └── protocol.ts
│   │   ├── services/        # Business logic layer
│   │   │   ├── company.service.ts
│   │   │   ├── department.service.ts
│   │   │   ├── agent.service.ts
│   │   │   └── task.service.ts
│   │   ├── db/              # Database layer
│   │   │   ├── schema.ts    # Database schema
│   │   │   ├── migrations/
│   │   │   └── repositories/
│   │   ├── types/           # Shared TypeScript types
│   │   └── index.ts         # Server entry point
│   └── package.json
├── ui/                       # React Web UI (调度中心)
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route pages (Overview, Staff, Collab, Tasks)
│   │   ├── hooks/           # Custom React hooks (useSSE, useAgent)
│   │   ├── stores/          # Client-side state (Zustand/Jotai)
│   │   └── App.tsx
│   └── package.json
├── shared/                   # Shared types between CLI, server, UI
│   └── types/
│       └── index.ts
├── package.json              # Workspace root
└── pnpm-workspace.yaml
```

### Structure Rationale

- **cli/, server/, ui/:** Separate packages in monorepo for independent scaling and clear ownership
- **shared/:** Prevents type drift between CLI config, server logic, and UI state
- **server/src/bridge/:** Isolates OpenClaw protocol handling from business logic
- **server/src/db/repositories/:** Data access abstraction enabling future DB migration
- **ui/src/stores/:** Client-side state management decoupled from server

## Architectural Patterns

### Pattern 1: External Process Communication (Agent Bridge)

**What:** LeClaw runs as an independent process that connects to external OpenClaw instances via HTTP/gRPC Gateway protocol
**When to use:** When LeClaw monitors/coordinates existing OpenClaw deployments rather than embedding them
**Trade-offs:**
- Pros: Loose coupling, independent lifecycle, easier debugging
- Cons: Network latency, potential connection failures, requires protocol compatibility

**Example:**
```typescript
// server/src/bridge/client.ts
export class OpenClawBridge {
  constructor(private gatewayUrl: string) {}

  async getAgentStatus(agentId: string): Promise<AgentStatus> {
    const response = await fetch(`${this.gatewayUrl}/api/agents/${agentId}/status`);
    return response.json();
  }

  async dispatchTask(agentId: string, task: Task): Promise<void> {
    await fetch(`${this.gatewayUrl}/api/agents/${agentId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }
}
```

### Pattern 2: SSE Real-time Updates

**What:** Server-Sent Events push state changes to UI without polling
**When to use:** When UI needs live updates (agent status, task progress, collaboration messages)
**Trade-offs:**
- Pros: Simple HTTP, automatic reconnection, works through proxies
- Cons: One-way only (server-to-client), no binary data

**Example:**
```typescript
// server/src/sse/handler.ts
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  const sendUpdate = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Subscribe to event emitter
  eventEmitter.on('update', sendUpdate);

  req.on('close', () => {
    eventEmitter.off('update', sendUpdate);
  });
});
```

### Pattern 3: Fixed 2-Level Hierarchy (Company → Department)

**What:** Strict organizational structure enforced at the data model level
**When to use:** When org structure is intentionally simple (like LeClaw's CEO/Manager/Staff roles)
**Trade-offs:**
- Pros: Simpler queries, clear ownership, easier UI navigation
- Cons: Inflexible if needs change, may require restructuring later

**Example:**
```typescript
// company can have many departments
// department can have many agents
// agent has single role: CEO | Manager | Staff
interface Company {
  id: string;
  name: string;
  departments: Department[];
}

interface Department {
  id: string;
  companyId: string;
  name: string;
  managerId?: string;  // references Agent
  agents: Agent[];
}

interface Agent {
  id: string;
  departmentId: string;
  openClawAgentId: string;  // external OpenClaw instance ID
  role: 'CEO' | 'Manager' | 'Staff';
}
```

### Pattern 4: Embedded PostgreSQL

**What:** Database runs in-process with the application (no separate DB server)
**When to use:** Single-user local deployments (like LeClaw's "no auth, single user" constraint)
**Trade-offs:**
- Pros: Zero setup, portable, no connection management
- Cons: Not suitable for multi-instance deployments, limited concurrency

**Example:**
```typescript
// Using better-sqlite3 for embedded experience
// or postgres with node:postgres embedded mode
import Database from 'better-sqlite3';

const db = new Database('./leclaw.db');

// Schema auto-migration on startup
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
```

## Data Flow

### Request Flow (Synchronous Operations)

```
[User Action: Create Task]
    │
    ▼
[React Component] ──POST /api/tasks──▶ [REST Controller]
    │                                          │
    │                                          ▼
    │                                   [Service Layer]
    │                                          │
    │                                          ▼
    │                                   [Repository]
    │                                          │
    │                                          ▼
    │◀───────────JSON Response───────────[PostgreSQL]
    │
    ▼
[Update Local State]
```

### SSE Flow (Real-time Updates)

```
[OpenClaw Agent Status Change]
    │
    ▼
[Agent Bridge] ──polls/pushes──▶ [Event Emitter]
    │                                     │
    │                                     ▼
    │                            [SSE Handler]
    │                                     │
    │                                     ▼
    │──────────────────────────────▶ [Browser via SSE]
                                         │
                                         ▼
                                  [React Hooks update UI]
```

### Collaboration Flow (Multi-Agent Coordination)

```
[User Posts Task in Hall]
    │
    ▼
[Server validates & persists]
    │
    ▼
[Notify relevant Agent via OpenClaw Bridge]
    │
    ▼
[OpenClaw processes task, streams output]
    │
    ▼
[Bridge captures output, emits SSE]
    │
    ▼
[UI displays real-time progress]
```

## Key Data Flows

1. **Agent Registration:** OpenClaw instance → Bridge discovers agents → Service creates Agent records → SSE notifies UI → UI displays roster

2. **Task Dispatch:** User creates task → Service validates → DB persists → Bridge sends to OpenClaw → SSE streams execution → DB updates status → UI reflects state

3. **Hierarchy Updates:** User modifies company/department → Service validates 2-level constraint → DB updates → SSE broadcasts change → All clients refresh

4. **Heartbeat Monitoring:** Bridge periodically polls OpenClaw health → Status updates emitted via SSE → UI shows agent availability

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-10 agents | Monolith server + embedded DB is fine |
| 10-100 agents | Add connection pooling, consider SSE fanout optimization |
| 100+ agents | Scale to multiple LeClaw instances with shared PostgreSQL |

### Scaling Priorities

1. **First bottleneck:** SSE connections (browser limits ~6 per domain)
   - Mitigation: Multiplex events, reduce update frequency, use WebSocket if bidirectional needed

2. **Second bottleneck:** OpenClaw Bridge polling overhead
   - Mitigation: Batch status requests, cache agent states, use OpenClaw webhooks if available

3. **Third bottleneck:** Embedded DB write throughput
   - Mitigation: Move to external PostgreSQL, add read replicas

## Anti-Patterns

### Anti-Pattern 1: Embedding OpenClaw Directly

**What people do:** Try to run OpenClaw inside LeClaw's process space
**Why it's wrong:** Violates "independent process" constraint, creates lifecycle coupling, debugging complexity explodes
**Do this instead:** Communicate via Gateway HTTP protocol, treat OpenClaw as external service

### Anti-Pattern 2: Polling Without Backoff

**What people do:** Aggressive polling of OpenClaw status endpoints
**Why it's wrong:** Wastes resources, may get rate-limited, creates thundering herd on OpenClaw
**Do this instead:** Exponential backoff with jitter, prefer push/webhook when available

### Anti-Pattern 3: Deep Hierarchy Beyond 2 Levels

**What people do:** Adding sub-departments, team leads, etc.
**Why it's wrong:** LeClaw's model explicitly constrains to Company → Department
**Do this instead:** Use Task assignments to create functional subdivisions within a department

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **OpenClaw Gateway** | HTTP REST client | Primary integration, poll for status, dispatch tasks |
| **OpenClaw Agents** | Via Gateway protocol | Don't call agents directly, go through Gateway |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **CLI → Server** | IPC (stdin/stdout) or local HTTP | CLI spawns server process or communicates via local API |
| **UI → Server** | HTTP REST + SSE | REST for commands, SSE for subscriptions |
| **Server → OpenClaw** | HTTP/gRPC Gateway | Read agent status, dispatch tasks, stream logs |

## Build Order Implications

```
Phase 1: CLI Tool Foundation
├── Implement init command (creates project structure, generates config)
├── Implement config command (sets OpenClaw gateway URL, etc.)
└── Implement start command (launches server)

Phase 2: Server Core
├── Database schema + migrations
├── REST API controllers (CRUD for all entities)
└── Server startup/shutdown

Phase 3: OpenClaw Bridge
├── Gateway client implementation
├── Agent status polling
└── Task dispatch integration

Phase 4: SSE Layer
├── Event emitter infrastructure
├── SSE endpoint
└── Connect UI subscriptions

Phase 5: React UI
├── Page routing
├── REST API integration
├── SSE hook implementation
└── Real-time UI updates

Phase 6: Collaboration Features
├── Hall/collaboration domain
├── Task orchestration
└── Multi-agent coordination
```

**Key dependencies:**
- CLI must be buildable before server (CLI launches server)
- Server DB schema must exist before API controllers
- Bridge must exist before SSE (SSE emits bridge events)
- Server + Bridge must exist before UI (UI connects to server)

## Sources

- OpenClaw Control Center architecture analysis (`/referenceRepo/openclaw-control-center/`)
- OpenClaw Gateway protocol documentation (`/referenceRepo/openclaw/src/gateway/`)
- Paperclip multi-agent orchestration patterns (`/referenceRepo/paperclip/`)
- Industry standard: SSE for real-time web updates (MDN Web Docs)

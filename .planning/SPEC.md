# LeClaw — OpenClaw Orchestration Center

> 2026-04-06 — Architecture Clarifications

---

## What is LeClaw?

**LeClaw is an OpenClaw Orchestration Center** — a coordination hub where OpenClaw agents collaborate with each other, while human operators monitor their activity and manage the system via Web UI.

---

## Core Model

```
┌─────────────────────────────────────────────────────┐
│                     LeClaw                          │
│                                                     │
│  OpenClaw Agent A  ←───  (collaborate)  ───→  OpenClaw Agent B  │
│           ↑                                                │
│           │                                                │
│    (CLI / API)                                     │
│           │                                                │
│           ↓                                                │
│      Human (Web UI: monitor + manage LeClaw entities)       │
└─────────────────────────────────────────────────────┘
```

- **OpenClaw agents are NOT "managed" by LeClaw** — they are peers that use LeClaw as a coordination hub
- **LeClaw's job** = provide shared state + coordination surface that OpenClaw agents interact with

---

## Two Interfaces

### Web UI — Human operators
- **Monitor** OpenClaw agents (status, activity)
- **Manage** LeClaw entities (Company, Department, AgentBinding)
- **Dashboard** shows real-time agent states and recent activity

### CLI — OpenClaw agents (primary) + humans (secondary)
- **Agents** call CLI commands for operations: `leclaw issue create`, `leclaw company list`, etc.
- **Humans** use CLI for: `leclaw init`, `leclaw start`, `leclaw status`
- CLI = agent's primary API surface (in addition to REST API with API key)
- **Agent authentication** = API key (see Harness Model)

---

## Organization Model

### Multi-Tenancy Isolation

**Company is the data isolation boundary.**

Implementation (based on established patterns):

| Layer | Mechanism |
|-------|-----------|
| **Database schema** | `companyId` column on every tenant-scoped table |
| **Indexes** | Compound indexes with `companyId` as first column |
| **Query isolation** | Every query includes `companyId` filter |
| **Route enforcement** | `assertCompanyAccess(req, companyId)` validates access |
| **Auth context** | Middleware attaches `companyId` (agent) or `companyIds[]` (user) |

---

### Multi-Company Architecture

LeClaw supports multiple Companies. **Company is the data isolation boundary.**

```
LeClaw
├── Company A (fully isolated)
│   ├── CEO Agent ← one per Company, first to configure
│   ├── Department X
│   │   ├── Manager Agent ← one per Department
│   │   └── Staff Agents ← multiple per Department allowed
│   └── Department Y
│       ├── Manager Agent
│       └── Staff Agents
│
└── Company B (fully isolated)
    └── ...
```

### Agent Roles

| Role | Layer | Multiplicity | Description |
|------|-------|--------------|-------------|
| CEO | Company Layer | 1 per Company | Represents the entire Company |
| Manager | Department Layer | 1 per Department | Manages a Department |
| Staff | Department Layer | N per Department | Executes tasks within a Department |

### Company Model

```
Company {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}
```

### Department Model

```
Department {
  id: string
  name: string
  companyId: string
  description?: string
  createdAt: Date
  updatedAt: Date
}
```

### Agent Model

**Agent** (stored in LeClaw):

```
Agent {
  id: string
  name: string
  role: "CEO" | "Manager" | "Staff"
  openClawAgentId: string        // From openclaw.json
  openClawAgentWorkspace: string // Agent workspace path
  openClawAgentDir: string       // Agent config directory
  companyId: string
  departmentId?: string          // Optional; CEO has no department
  createdAt: Date
  updatedAt: Date
}
```

**Note:** Agent status (online/offline) is NOT stored — LeClaw queries OpenClaw Gateway on demand.

### OpenClaw Agent Onboarding

**Flow:**
1. `leclaw init` — configures server URL (stored locally)
2. Human creates AgentBinding in LeClaw UI
3. LeClaw generates onboarding prompt with params
4. Human sends prompt to OpenClaw Agent
5. Agent executes CLI:
```
# CEO
leclaw agent onboard --company-id <id> --agent-id <openclaw-id> --role CEO

# Manager
leclaw agent onboard --company-id <id> --agent-id <openclaw-id> --role Manager --department-id <id>

# Staff
leclaw agent onboard --company-id <id> --agent-id <openclaw-id> --role Staff --department-id <id>
```
6. LeClaw returns API key — Agent saves it locally
7. Agent uses API key for subsequent CLI calls

---

## Data Ownership

### LeClaw Owns (Source of Truth)

| Entity | Description |
|--------|-------------|
| **Company** | Data isolation boundary, one per organization |
| **Department** | Belongs to a Company, contains Manager + Staff agents |
| **AgentBinding** | Maps role (CEO/Manager/Staff) to an OpenClaw agent ID |

### OpenClaw Owns

| Entity | Description |
|--------|-------------|
| **Agent** | Agent code, process, internal state |
| **Gateway** | Agent registry, status polling, heartbeat |

### LeClaw Monitors OpenClaw (No Persistence)

- LeClaw **monitors** OpenClaw agent status in real-time — it does NOT store agent state
- Agent status is queried from OpenClaw Gateway on demand (SSE updates, Web UI refresh)
- LeClaw does not cache or persist agent status — no restoration needed on restart
- If OpenClaw is unreachable, agent status shows as unknown

### Graceful Degradation

LeClaw is **independent** from OpenClaw. If OpenClaw is down:

- **LeClaw Server** continues running
- **LeClaw's own data** (Company, Department, Issue, AgentBinding, Audit Log) remains fully functional
- **OpenClaw-related queries** (agent status) return "unknown"
- **SSE updates** degrade gracefully — agent status marked as stale

Core principle: LeClaw's own data layer is fully independent.

### Coordination Mechanisms

#### Issue Model

**Issue** is the core work unit in LeClaw.

```
Issue {
  id: string
  title: string
  description: string
  status: "Open" | "InProgress" | "Blocked" | "Done" | "Cancelled"
  assignee: AgentBindingId
  departmentId: string
  subIssues: string[]           // Issue IDs
  comments: Comment[]           // Human read-only, agent can write
  report: string                // Markdown, agent-defined format
  projectId?: string            // Optional
  goalId?: string               // Optional
  createdAt: Date
  updatedAt: Date
}

Comment {
  author: AgentBindingId
  timestamp: Date
  message: string               // Plain text only
}
```

**Issue Scope:** Department-level — an Issue belongs to a Department, which already carries Company context via departmentId.

**Issue Assignment Flow:**
1. Issue is assigned to a Department (via `departmentId`)
2. Department **Manager Agent** is the initial `assignee`
3. Manager Agent is responsible for:
   - Planning the work
   - Creating sub-issues
   - Assigning sub-issues to Staff Agents
   - Managing Issue status

#### Goal Model

**Goal** is a Company-level objective defining desired outcomes.

```
Goal {
  id: string
  title: string
  description: string
  status: "Open" | "Achieved" | "Archived"   // Archived = soft delete
  verification: string           // How to verify goal is achieved
  deadline?: Date
  departmentIds: string[]       // Departments involved
  issueIds: string[]           // Related Issues
  createdAt: Date
  updatedAt: Date
}
```

**Goal vs Issue:**
- Issue = execution layer, defines tasks to do
- Goal = result layer, defines what success looks like
- Goal Detail Page shows related Issues and their completion status

#### Project Model

**Project** is a Company-level work container.

```
Project {
  id: string
  companyId: string           // Company-level
  title: string
  description: string
  status: "Open" | "InProgress" | "Done" | "Archived"
  projectDir: string           // Project root directory (outputs, regulations, etc.)
  issueIds: string[]
  createdAt: Date
  updatedAt: Date
}
```

**Project vs Goal:**
- Goal = outcome-oriented, defines success criteria
- Project = organization-oriented, groups work items
- Project can exist independently (pure work grouping)

#### Approval Model

**Approval** is the interaction mechanism between agents and humans for sensitive operations.

```
Approval {
  id: string
  title: string
  description: string
  requester: AgentBindingId       // Who initiated
  status: "Pending" | "Approved" | "Rejected"
  rejectMessage?: string           // Filled when rejected
  createdAt: Date
  updatedAt: Date
}
```

**Flow:**
1. Agent initiates approval (sensitive operation)
2. Human sees pending approval in Web UI
3. Human approves or rejects
4. Agent reads result on next run

**Note:** Approval is independent — no integration with other modules. Agent reads approval status on next execution.

---

## Harness Model

### What is Harness?

**Harness** is the operational methodology for how OpenClaw agents collaborate through LeClaw. It defines the **process** agents follow, not the infrastructure.

Harness Engineering teaches us:
- **编排** (Orchestration) — Agents follow structured collaboration patterns (not ad-hoc)
- **验证** (Verification) — Outputs are validated against expected criteria
- **审计** (Audit) — Collaboration process is recorded for traceability
- **优化** (Optimization) — Feedback loops drive continuous improvement

However, LeClaw does **not** hardcode a specific harness workflow. Instead:

- **LeClaw provides Harness Infrastructure** — the底层数据设施
- **Users or agents configure their own harness workflow** — flexible, adaptable

### Harness Infrastructure (Confirmed)

Harness Infra is what LeClaw provides as the **底层** for harness operations:

| Component | Description |
|-----------|-------------|
| **Audit Log** | Records every CLI/API operation: agentId, command, args, result, timestamp |

**Agent Authentication:**
- Agents authenticate via **API key** (details deferred)
- CLI commands must include API key for agent identification

**Audit Log Entry:**
```
- agentId: string          // Derived from API key
- command: string          // CLI command invoked
- args: Record<string, unknown>  // Command arguments
- result: "success" | "failure"
- output: string           // Command output or error
- timestamp: Date
```

### Harness Workflow (Deferred — User/Agent Configured)

The actual harness workflow (e.g., CEO→Manager→Staff collaboration pattern) is **not hardcoded in LeClaw**. Users or agents configure:
- How agents are orchestrated
- What verification steps to use
- How optimization happens

---

## Principles (Confirmed)

### P1. LeClaw 是协调者，不是控制者
- LeClaw 提供共享状态和协调 surface
- OpenClaw agents 保持自主性，自己决定怎么执行
- LeClaw 不运行 agent 代码

### P3. Human 视角和 Agent 视角分离
- Web UI 面向 human，优化易用性
- CLI 面向 agent，优化可编程性
- 两者操作同一份数据，但不混淆概念

### P5. Real-time for humans, polling for agents
- **SSE** = Web UI (human) 实时更新的唯一通道
- **Agents** 通过 CLI/API 轮询，不依赖 SSE
- Agent 侧的实时通知由 OpenClaw 自己处理，不在 LeClaw 范围内

---

## Configuration

### Config File Location
`~/.leclaw/config.json`

### Config Structure
```json
{
  "openclaw": {
    "dir": "/path/to/openclaw",
    "gatewayUrl": "http://...",
    "gatewayToken": "xxxxxx",
    "gatewayPassword": "xxxxxx (optional)"
  },
  "server": {
    "port": 8080
  }
}
```

### CLI Commands

| Command | Description |
|---------|-------------|
| `leclaw init` | Interactive initialization for humans — creates `~/.leclaw/` |
| `leclaw config` | Default: show current config |
| `leclaw config set <key> <value>` | Set a config value |

---

## REST API

### API Style
REST API — sufficient for all operations.

### Path Structure
```
/api/companies
/api/companies/:id
/api/companies/:companyId/departments
/api/companies/:companyId/departments/:id
...
```

### API Consumers
- **CLI** — via REST API with API key auth
- **Web UI** — same REST API
- **SSE** — for real-time updates to Web UI only

---

## Process Architecture

- **Single LeClaw process** = CLI tool + Server (HTTP + SSE)
- **`leclaw start`** = starts server + embedded PostgreSQL
- **`leclaw init`** = interactive setup for humans (creates `~/.leclaw/`)
- **Embedded PostgreSQL** = LeClaw's own data store
- **OpenClaw Gateway** = external, network-reachable, NOT embedded

---

## Deferred Topics

The following require further discussion before design:

- [ ] API key authentication mechanism
- [ ] Idempotency guarantees for CLI/API operations
- [ ] SSE architecture — SSE only for Web UI (confirmed)
- [ ] Graceful degradation — LeClaw independent from OpenClaw (confirmed)
- [ ] Configuration scope and defaults strategy
- [x] Issue / Goal / Project / Approval coordination models (confirmed)
- [ ] Collaboration flow details (CEO→Manager→Staff)
- [ ] Harness workflow configuration interface


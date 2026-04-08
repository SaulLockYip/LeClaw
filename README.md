# LeClaw

LeClaw is an **OpenClaw orchestration center** for managing hierarchical AI agents. It provides CLI tools, REST API, and a web UI for managing a multi-agent organization with Company/Department/Agent hierarchies, work tracking, and real-time collaboration.

**Core Value:** Hierarchical Agent Orchestration + Real-time Status Monitoring

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [CLI Commands](#cli-commands)
- [REST API](#rest-api)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)

---

## Quick Start

### 1. Initialize LeClaw

```bash
# Interactive setup - configures OpenClaw path, gateway, and database
leclaw init
```

The init command will prompt for:
- **OpenClaw directory** - Path to your OpenClaw installation
- **Gateway WebSocket URL** - Default: `ws://localhost:4396`
- **Gateway API token** - Your OpenClaw gateway authentication token
- **Server port** - Default: `4396`

Configuration is saved to `~/.leclaw/config.json` and an embedded PostgreSQL database is initialized at `~/.leclaw/db/`.

### 2. Start the Server

```bash
leclaw start
# Server runs on http://localhost:4396
```

### 3. Use the Web UI

Open `http://localhost:4396` in your browser to access the dashboard. From there you can:

- View company, department, and agent hierarchies
- Create and manage issues, goals, and projects
- Approve/reject pending operations
- Monitor agent status in real-time

---

## Installation

### Prerequisites

- **Node.js** 22.14.0 or higher
- **pnpm** 10.32.1 or higher
- **OpenClaw** installation (for agent management)

### Build from Source

```bash
# Clone and install dependencies
pnpm install

# Build all packages
pnpm build
```

### Run CLI Without Build

```bash
# Use tsx to run directly
pnpm exec tsx packages/cli/bin/leclaw.js init
```

---

## CLI Commands

### `leclaw init`

Initialize LeClaw configuration interactively.

```bash
leclaw init
```

Creates `~/.leclaw/config.json` with your OpenClaw settings and initializes the embedded PostgreSQL database.

### `leclaw status`

Check connection status to OpenClaw and Gateway.

```bash
leclaw status
```

Output:
```json
{
  "success": true,
  "config": { ... },
  "openclaw": { "configured": true, "dir": "/path/to/openclaw", "exists": true, "accessible": true },
  "gateway": { "configured": true, "url": "ws://localhost:4396", "reachable": true },
  "database": { "configured": true, "connectionString": "postgres://..." },
  "overall": "ok"
}
```

### `leclaw doctor`

Run diagnostic checks for the LeClaw environment.

```bash
leclaw doctor
```

Checks: config file existence, JSON validity, OpenClaw directory, gateway connectivity, database directory, and port availability.

### `leclaw start`

Start the LeClaw server.

```bash
leclaw start --port 4396 --host 0.0.0.0
```

### `leclaw config`

Manage configuration.

```bash
leclaw config                    # Show current config
leclaw config openclaw <key> <value>   # Update OpenClaw setting
leclaw config gateway <key> <value>    # Update gateway setting
leclaw config server <key> <value>     # Update server setting
```

### `leclaw agents list`

List all OpenClaw agents and their binding status.

```bash
leclaw agents list
```

Output:
```json
{
  "agents": [
    {
      "id": "agent-001",
      "name": "CEO Agent",
      "workspace": "/openclaw/agents/ceo",
      "status": "online",
      "bound": true,
      "boundTo": { "companyId": "uuid", "role": "CEO" }
    }
  ],
  "errors": []
}
```

### `leclaw agent onboard`

Onboard an OpenClaw agent to LeClaw with role assignment.

```bash
leclaw agent onboard \
  --company-id <uuid> \
  --agent-id <openclaw-agent-id> \
  --name "Agent Name" \
  --role CEO|Manager|Staff \
  --department-id <uuid>  # Required for Manager/Staff
```

**Validation Rules:**
- CEO role: Company must not already have a CEO
- Manager/Staff role: Must specify a department that belongs to the company
- Each OpenClaw agent can only be bound to one company globally

**Output:**
```json
{
  "success": true,
  "agentId": "agent-001",
  "apiKey": "lcak_...",
  "message": "Agent onboarded successfully. Store the API key securely."
}
```

### `leclaw issue comment add`

Add a comment to an issue.

```bash
leclaw issue comment add \
  --issue-id <uuid> \
  --message "Working on the authentication module" \
  --api-key <agent-api-key>
```

### `leclaw issue report update`

Append to an issue report (append-only, no overwrite).

```bash
leclaw issue report update \
  --issue-id <uuid> \
  --report "Completed the database schema design" \
  --api-key <agent-api-key>
```

---

## REST API

The server exposes a REST API on port 4396 (default). All endpoints return JSON.

### Base URL

```
http://localhost:4396/api
```

### Authentication

Most endpoints require a `companyId` header to scope requests to a specific company:

```
companyId: <uuid>
```

Or as a query parameter: `?companyId=<uuid>`

### Companies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies` | List all companies |
| POST | `/api/companies` | Create company |
| GET | `/api/companies/:id` | Get company |
| PUT | `/api/companies/:id` | Update company |
| DELETE | `/api/companies/:id` | Delete company |

**Create Company:**
```bash
curl -X POST http://localhost:4396/api/companies \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "description": "Our awesome company"}'
```

### Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies/:companyId/departments` | List departments |
| POST | `/api/companies/:companyId/departments` | Create department |
| GET | `/api/companies/:companyId/departments/:id` | Get department |
| PUT | `/api/companies/:companyId/departments/:id` | Update department |
| DELETE | `/api/companies/:companyId/departments/:id` | Delete department |

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies/:companyId/agents` | List agents |
| POST | `/api/companies/:companyId/agents` | Create agent |
| GET | `/api/companies/:companyId/agents/:id` | Get agent |
| PUT | `/api/companies/:companyId/agents/:id` | Update agent |

### Issues

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies/:companyId/issues` | List issues |
| GET | `/api/companies/:companyId/issues?departmentId=:id` | Filter by department |
| POST | `/api/companies/:companyId/issues` | Create issue |
| GET | `/api/companies/:companyId/issues/:id` | Get issue |
| PUT | `/api/companies/:companyId/issues/:id` | Update issue |
| DELETE | `/api/companies/:companyId/issues/:id` | Delete issue |

**Issue Status Values:** `Open`, `InProgress`, `Blocked`, `Done`, `Cancelled`

### Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies/:companyId/goals` | List goals |
| POST | `/api/companies/:companyId/goals` | Create goal |
| GET | `/api/companies/:companyId/goals/:id` | Get goal |
| PUT | `/api/companies/:companyId/goals/:id` | Update goal |

**Goal Body:**
```json
{
  "title": "Q1 Sales Target",
  "description": "Achieve 1M in sales",
  "status": "Open",
  "verification": "Revenue report",
  "deadline": "2026-03-31T00:00:00Z",
  "departmentIds": ["uuid1", "uuid2"],
  "issueIds": ["uuid3"]
}
```

**Goal Status Values:** `Open`, `Achieved`, `Archived`

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies/:companyId/projects` | List projects |
| POST | `/api/companies/:companyId/projects` | Create project |
| GET | `/api/companies/:companyId/projects/:id` | Get project |
| PUT | `/api/companies/:companyId/projects/:id` | Update project |

**Project Status Values:** `Open`, `InProgress`, `Done`, `Archived`

### Approvals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies/:companyId/approvals` | List approvals |
| POST | `/api/companies/:companyId/approvals` | Create approval |
| GET | `/api/companies/:companyId/approvals/:id` | Get approval |
| PUT | `/api/companies/:companyId/approvals/:id` | Approve/reject |

**Approval Status Values:** `Pending`, `Approved`, `Rejected`

**Update Approval:**
```bash
# Approve
curl -X PUT http://localhost:4396/api/companies/:id/approvals/:id \
  -H "Content-Type: application/json" \
  -d '{"status": "Approved"}'

# Reject
curl -X PUT http://localhost:4396/api/companies/:id/approvals/:id \
  -H "Content-Type: application/json" \
  -d '{"status": "Rejected", "rejectMessage": "Budget exceeded"}'
```

### Server-Sent Events (SSE)

Subscribe to real-time updates at:

```
GET /api/events
```

Returns an SSE stream with heartbeat every 30 seconds. Events are broadcast when entities are created, updated, or deleted.

**Event Types:**
- `company_created`, `company_updated`, `company_deleted`
- `department_created`, `department_updated`, `department_deleted`
- `agent_created`, `agent_updated`
- `issue_created`, `issue_updated`
- `goal_created`, `goal_updated`
- `project_created`, `project_updated`
- `approval_created`, `approval_updated`

**JavaScript Client Example:**
```javascript
const eventSource = new EventSource('http://localhost:4396/api/events');

eventSource.addEventListener('connected', (event) => {
  console.log('Connected:', JSON.parse(event.data));
});

eventSource.addEventListener('issue_created', (event) => {
  const issue = JSON.parse(event.data);
  console.log('New issue:', issue);
});
```

### Health Check

```
GET /health
```

Returns server status.

---

## Architecture

### Overview

LeClaw is a monorepo with 5 packages:

```
leclaw/
├── packages/
│   ├── cli/       # CLI commands (Commander.js)
│   ├── db/        # Database layer (Drizzle ORM + embedded Postgres)
│   ├── server/    # REST API server (Express + Hono)
│   ├── shared/    # Shared utilities and types
│   └── ui/        # React web interface
└── README.md
```

### Data Model

LeClaw uses a hierarchical organization structure:

```
Company (data isolation boundary)
├── Department (contains Manager + Staff)
│   └── Agent (CEO | Manager | Staff)
├── Agent (CEO has no department)
├── Issue (belongs to Department, assigned to Agent)
├── Goal (company-level objective)
├── Project (work container)
└── Approval (human-agent interaction)
```

### Agent Hierarchy

| Role | Description |
|------|-------------|
| **CEO** | Top-level agent, no department, one per company |
| **Manager** | Leads a department, has Staff agents |
| **Staff** | Works within a department, executes tasks |

### Configuration

Configuration file: `~/.leclaw/config.json`

```json
{
  "version": "1.0.0",
  "openclaw": {
    "dir": "/path/to/openclaw",
    "gatewayUrl": "ws://localhost:4396",
    "gatewayToken": "your-token"
  },
  "server": {
    "port": 4396
  },
  "database": {
    "connectionString": "postgres://..."
  }
}
```

---

## Development

### Project Structure

```
packages/
├── cli/src/
│   ├── bin/leclaw.js          # CLI entry point
│   ├── commands/              # Command implementations
│   │   ├── init-command.ts
│   │   ├── start-command.ts
│   │   ├── status-command.ts
│   │   ├── doctor-command.ts
│   │   ├── config-command.ts
│   │   ├── agents/
│   │   └── issue/
│   ├── helpers/              # CLI helpers
│   └── program/              # CLI program setup
├── server/src/
│   ├── index.ts              # Server entry point
│   ├── app.ts                # Express app setup
│   ├── routes/               # API route handlers
│   ├── services/             # Business logic
│   └── sse/                  # SSE event bus
├── db/src/
│   ├── schema/               # Drizzle ORM schemas
│   ├── client.ts             # Database client
│   ├── migrate.ts            # Migration runner
│   └── embedded-postgres.ts  # Embedded Postgres manager
├── shared/src/
│   ├── config/               # Config loading/writing
│   ├── api-key.ts            # API key generation
│   ├── openclaw-scanner.ts   # OpenClaw agent discovery
│   └── gateway-client.ts     # Gateway status queries
└── ui/src/
    ├── App.tsx               # React Router setup
    ├── pages/                # Page components
    ├── components/           # Shared components
    └── hooks/                # React hooks
```

### Running Locally

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run CLI directly without build
pnpm exec tsx packages/cli/bin/leclaw.js status

# Start server
pnpm exec tsx packages/server/src/index.ts
```

### Database

LeClaw uses **embedded PostgreSQL** (via `embedded-postgres` package) for local development. The database is stored at `~/.leclaw/db/`.

For production, set the `DATABASE_URL` environment variable to connect to an external PostgreSQL instance.

---

## Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests once
pnpm test:run
```

### Code Quality

```bash
# Type check
pnpm tsc

# Lint
pnpm oxlint

# Format code
pnpm oxfmt

# Full check (types + lint)
pnpm check
```

---

## Entity Schemas

### Company
- `id` (UUID, primary key)
- `name` (text, required)
- `description` (text)
- `createdAt`, `updatedAt` (timestamps)

### Department
- `id` (UUID, primary key)
- `companyId` (UUID, foreign key)
- `name` (text, required)
- `description` (text)
- `createdAt`, `updatedAt` (timestamps)

### Agent
- `id` (UUID, primary key)
- `companyId` (UUID, foreign key)
- `departmentId` (UUID, foreign key, null for CEO)
- `name` (text, required)
- `role` (text: `CEO`, `Manager`, `Staff`)
- `openClawAgentId` (text)
- `openClawAgentWorkspace` (text)
- `openClawAgentDir` (text)
- `createdAt`, `updatedAt` (timestamps)

### Issue
- `id` (UUID, primary key)
- `companyId` (UUID, foreign key)
- `title` (text, required)
- `description` (text)
- `status` (text: `Open`, `InProgress`, `Blocked`, `Done`, `Cancelled`)
- `assigneeAgentId` (UUID, foreign key)
- `departmentId` (UUID, foreign key)
- `subIssues` (JSONB array of Issue UUIDs)
- `report` (text, markdown)
- `projectId`, `goalId` (UUID, foreign keys)
- `createdAt`, `updatedAt` (timestamps)

### IssueComment
- `id` (UUID, primary key)
- `issueId` (UUID, foreign key)
- `authorAgentId` (UUID, foreign key)
- `message` (text, required)
- `timestamp` (timestamp)

### Goal
- `id` (UUID, primary key)
- `companyId` (UUID, foreign key)
- `title` (text, required)
- `description` (text)
- `status` (text: `Open`, `Achieved`, `Archived`)
- `verification` (text)
- `deadline` (timestamp)
- `departmentIds` (JSONB array of Department UUIDs)
- `issueIds` (JSONB array of Issue UUIDs)
- `createdAt`, `updatedAt` (timestamps)

### Project
- `id` (UUID, primary key)
- `companyId` (UUID, foreign key)
- `title` (text, required)
- `description` (text)
- `status` (text: `Open`, `InProgress`, `Done`, `Archived`)
- `projectDir` (text)
- `issueIds` (JSONB array of Issue UUIDs)
- `createdAt`, `updatedAt` (timestamps)

### Approval
- `id` (UUID, primary key)
- `companyId` (UUID, foreign key)
- `title` (text, required)
- `description` (text)
- `requester` (UUID, foreign key to Agent)
- `status` (text: `Pending`, `Approved`, `Rejected`)
- `rejectMessage` (text)
- `createdAt`, `updatedAt` (timestamps)

### AgentApiKey
- `agentId` (text, primary key)
- `keyHash` (text)
- `createdAt` (timestamp)

### AuditLog
- `id` (UUID, primary key)
- `companyId` (UUID)
- `agentId` (text)
- `command` (text)
- `args` (JSONB)
- `result` (text: `success`, `failure`)
- `output` (text)
- `timestamp` (timestamp)

---

## License

MIT

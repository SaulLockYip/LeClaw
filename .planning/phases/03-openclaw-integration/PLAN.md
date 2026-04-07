# Phase 3: OpenClaw Integration - Implementation Plan

**Phase:** 03-openclaw-integration
**Created:** 2026-04-07
**Depends on:** Phase 2 (Data Layer)

---

## Success Criteria

1. LeClaw reads `#{openclaw.dir}/openclaw.json` to discover agents
2. `leclaw agents list` command shows available agents
3. `leclaw agent onboard --company-id <id> --agent-id <id> --role <role> [--department-id <id>]` works
4. API key is generated and returned to agent after successful onboard
5. Agent binding stored in database
6. Agent status queried from OpenClaw Gateway on demand (for SSE/Web UI)

---

## Tasks

### 3.1 openclaw.json Scanning

**File:** `packages/shared/src/openclaw-scanner.ts`

- [ ] Read `openclaw.json` from configured `openclaw.dir`
- [ ] Parse `agents[]` array (id, name, workspace)
- [ ] Return typed `OpenClawAgent[]` array
- [ ] Handle file-not-found gracefully (empty array, log warning)
- [ ] Validate required fields (id required, name optional)

**Schema:**
```typescript
interface OpenClawAgent {
  id: string;
  name?: string;
  workspace: string;
}
```

---

### 3.2 leclaw agents list Command

**File:** `packages/cli/src/commands/agents/agents-list.ts`

- [ ] Read openclaw config to get `openclaw.dir`
- [ ] Call scanner (3.1) to get agents
- [ ] Query DB for bound agents (agents table)
- [ ] Merge: add `bound`, `boundTo` fields
- [ ] Query Gateway for status (3.7) for each agent
- [ ] Output JSON:
```json
{
  "agents": [
    {
      "id": "agent-abc123",
      "name": "Alice",
      "workspace": "/path/to/workspace",
      "status": "online" | "busy" | "offline",
      "bound": true | false,
      "boundTo": { "companyId": "...", "role": "CEO" } | null
    }
  ]
}
```

---

### 3.3 API Key Generation

**File:** `packages/shared/src/api-key.ts`

- [ ] Generate random 12-char alphanumeric secret
- [ ] Format: `{agentId}:{secret}`
- [ ] bcrypt hash the full key for storage
- [ ] Store hash in `agent_api_keys` table
- [ ] Return plaintext key to caller (for agent to save)

---

### 3.4 agent_api_keys Table

**File:** `packages/db/src/schema/agent-api-keys.ts`

- [ ] Fields: `agentId`, `keyHash`, `createdAt`
- [ ] Index on `agentId`
- [ ] Unique constraint on `agentId` (one key per agent)
- [ ] Add to drizzle schema index

---

### 3.5 Onboard Validation

**File:** `packages/cli/src/commands/agent/agent-onboard.ts`

Validate ALL checks before onboard succeeds:

1. [ ] Company with `companyId` must exist
2. [ ] If `role = Manager` or `role = Staff`: `departmentId` must exist AND belong to `companyId`
3. [ ] If `role = CEO`: Company must NOT already have a CEO (unique per company)
4. [ ] `openClawAgentId` must NOT be bound to any other company (globally unique)
5. [ ] `role` must be one of: `CEO` | `Manager` | `Staff`

---

### 3.6 leclaw agent onboard Command

**File:** `packages/cli/src/commands/agent/agent-onboard.ts`

- [ ] Parse args: `--company-id`, `--agent-id`, `--role`, `--department-id` (optional)
- [ ] Run validation (3.5)
- [ ] Generate API key (3.3)
- [ ] Insert into `agents` table
- [ ] Insert into `agent_api_keys` table
- [ ] Write key to `~/.leclaw/agent-keys/{agentId}` (agent local storage)
- [ ] Return key to stdout/response

**DB Insert fields:** id, name, role, openClawAgentId, openClawAgentWorkspace, openClawAgentDir, companyId, departmentId, createdAt, updatedAt

---

### 3.7 Gateway Client for Status Queries

**File:** `packages/shared/src/gateway-client.ts`

- [ ] Connect to OpenClaw Gateway WebSocket (`ws://127.0.0.1:18789` default)
- [ ] Authenticate with gateway token from config
- [ ] Query agent status: `GET /api/agents/{agentId}/status`
- [ ] Parse response: `{ status: "online" | "busy" | "offline" }`
- [ ] Return status string
- [ ] Graceful degradation: if unreachable, return "offline"

**Reference:** `referenceRepo/openclaw/src/gateway/client.ts` for WebSocket protocol

---

### 3.8 Agent Status On-Demand Query

**File:** `packages/shared/src/agent-status.ts`

- [ ] `getAgentStatus(agentId: string): Promise<AgentStatus>`
- [ ] Uses Gateway client (3.7)
- [ ] Returns: `"online"` | `"busy"` | `"offline"` | `"unknown"`
- [ ] No caching — fresh query every time
- [ ] Gateway unreachable → "offline" (not "unknown")

---

### 3.9 SSE Status Refresh

**File:** `packages/server/src/routes/sse.ts` (Phase 4)

- [ ] When SSE connection established, query status for all bound agents
- [ ] Send status event: `{ type: "agent_status", agents: [...] }`
- [ ] Heartbeat comments to prevent timeout

---

## File Structure

```
packages/
├── shared/src/
│   ├── openclaw-scanner.ts      # 3.1
│   ├── api-key.ts               # 3.3
│   ├── agent-status.ts          # 3.8
│   └── gateway-client.ts        # 3.7
├── cli/src/commands/
│   ├── agents/
│   │   └── agents-list.ts       # 3.2
│   └── agent/
│       └── agent-onboard.ts     # 3.5, 3.6
└── db/src/schema/
    └── agent-api-keys.ts         # 3.4
```

---

## Dependencies

- Phase 2 schema (agents, companies, departments tables)
- Phase 1 config (`openclaw.dir` from `~/.leclaw/config.json`)
- OpenClaw Gateway reachable at configured URL

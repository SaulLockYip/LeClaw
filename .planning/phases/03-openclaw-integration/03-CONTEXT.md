# Phase 3: OpenClaw Integration - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

LeClaw discovers OpenClaw agents and supports agent onboarding.

**Scope:**
- Read `#{openclaw.dir}/openclaw.json` to discover agents
- `leclaw agents list` command shows available agents
- `leclaw agent onboard --company-id <id> --agent-id <id> --role <role> [--department-id <id>]` works
- API key generated and returned to agent after successful onboard
- Agent binding stored in database
- Agent status queried from OpenClaw Gateway on demand (for SSE/Web UI)

**Out of scope for this phase:**
- SSE real-time updates (Phase 4)
- Web UI (Phase 5+)
- Agent actual execution (Phase 8)

</domain>

<decisions>
## Implementation Decisions

### Agent Discovery
- **D-01:** Primary discovery = **scan `openclaw.json`** in `#{openclaw.dir}/`
- **D-02:** When Gateway is online, **sync status** from Gateway API
- **D-03:** Graceful degradation: if Gateway unreachable, show status as "offline"
- **Rationale:** LeClaw can work independently without Gateway connectivity

### openclaw.json Schema (Expected)
```typescript
interface OpenClawConfig {
  agents: Array<{
    id: string
    name: string
    workspace: string
    // other fields ignored
  }>
}
```

### Onboarding Command
- **D-04:** `leclaw agent onboard --company-id <id> --agent-id <id> --role CEO` (no department)
- **D-05:** `leclaw agent onboard --company-id <id> --agent-id <id> --role Manager --department-id <id>`
- **D-06:** `leclaw agent onboard --company-id <id> --agent-id <id> --role Staff --department-id <id>`
- **D-07:** Validation rules: see **D-12**

### API Key Format
- **D-08:** API Key format = **fixed string**: `{agentId}:{randomSecret}`
  - Example: `agent-abc123:leclaw_xK9mP2vN5qR8`
- **D-09:** Random secret = 12 char alphanumeric (no special chars for shell safety)
- **Rationale:** Simple, contains agentId for routing, no JWT complexity

### API Key Storage
- **D-10:** **Separate storage**:
  - LeClaw DB: `agent_api_keys` table stores `agentId` + `keyHash` (bcrypt)
  - Agent local: stores full `agentId:secret` in `~/.leclaw/agent-keys/{agentId}`
- **D-11:** Key verification flow:
  1. CLI parses `key` → extracts `agentId` and `secret` via string split
  2. Query DB for `storedKeyHash` by `agentId`
  3. `bcrypt.compare(secret, storedKeyHash)`
  4. Match → continue; No match → error
- **Rationale:** Split gives agentId for audit logging; bcrypt hash comparison is secure

### Onboarding Validation (REVISED)
- **D-12:** All validation checks run before onboard succeeds:
  1. Company with `companyId` must exist
  2. If `role = Manager` or `role = Staff`: `departmentId` must exist AND belong to `companyId`
  3. If `role = CEO`: this Company must not already have a CEO (unique per company)
  4. `openClawAgentId` must not be bound to any other company (globally unique)
  5. `role` must be one of: `CEO` | `Manager` | `Staff`
- **Rationale:** Prevent invalid state; maintain data integrity

### Agent Status
- **D-12:** Agent status = **on-demand query** from Gateway (not cached)
- **D-13:** Status values: "online", "busy", "offline", "unknown"
- **D-14:** SSE connection triggers status query for all bound agents
- **D-15:** Gateway unreachable → status = "offline" (not "unknown" to avoid confusion)
- **Rationale:** SPEC says "no caching/persistence of agent status"

### Agents List Output
- **D-16:** `leclaw agents list` output (JSON):
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

### Agent Binding (DB)
- **D-17:** `agents` table fields: id, name, role, openClawAgentId, openClawAgentWorkspace, openClawAgentDir, companyId, departmentId, createdAt, updatedAt
- **D-18:** `agent_api_keys` table fields: agentId, keyHash, createdAt
- **D-19:** Unique constraints enforced by onboard validation (D-12)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/SPEC.md` — OpenClaw agent onboarding flow, Agent model
- `.planning/ROADMAP.md` — Phase 3 success criteria
- `.planning/REQUIREMENTS.md` — OPENCLAW-01 to OPENCLAW-04
- `.planning/phases/01-foundation-cli-init/01-CONTEXT.md` — Phase 1 decisions (config structure, CLI patterns)
- `.planning/phases/02-data-layer-entity-models-db/02-CONTEXT.md` — Phase 2 decisions (schema, indexes)
- `referenceRepo/openclaw/src/gateway/` — Gateway API patterns
- `referenceRepo/openclaw/src/shared/gateway-bind-url.ts` — Gateway URL resolution

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- openclaw Gateway API patterns from referenceRepo
- Config reading from `~/.leclaw/config.json` (Phase 1)
- Drizzle schema patterns (Phase 2)

### Integration Points
- `packages/cli/` — `leclaw agents list`, `leclaw agent onboard` commands
- `packages/server/` — Gateway API calls, agent status queries
- `packages/shared/` — shared types for Agent binding

</codebase_context>

<specifics>
## Specific Ideas

**openclaw.json location:** `#{openclaw.dir}/openclaw.json`

**Agent local key storage:**
```
~/.leclaw/agent-keys/{agentId}
```
Content: `{agentId}:{secret}`

**Onboarding validation rules:**
- CEO: exactly one per company, no departmentId
- Manager: one per department, requires departmentId
- Staff: N per department, requires departmentId
- Agent can only be bound once (uniqueness on openClawAgentId)

**Gateway API for status (expected endpoint):**
- `GET /api/agents/{agentId}/status` → { status: "online"|"busy"|"offline" }

</specifics>

<deferred>
## Deferred Ideas

- Gateway API endpoint details — need to verify actual Gateway API contract (Phase 3 research)
- JWT-based auth — considered but deferred to simpler fixed-format key for v1

</deferred>

---

*Phase: 03-openclaw-integration*
*Context gathered: 2026-04-07*

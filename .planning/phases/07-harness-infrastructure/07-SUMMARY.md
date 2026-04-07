# Phase 7: Harness Infrastructure — Summary

**Phase:** 07-harness-infrastructure
**Status:** Completed
**Commit:** 8e5522b
**Completed:** 2026-04-07

---

## One-liner

Audit logging for CLI write operations, agent-write/human-read comments on Issues, and append-only Issue report updates via CLI.

---

## Context

Phase 7 implements the Harness Infrastructure layer as defined in the SPEC.md Harness Model. This provides the底层 (infrastructure) for agent collaboration and traceability.

---

## Deliverables

### 7.1 Audit Log DB Table Schema

**File:** `packages/db/src/schema/audit-logs.ts`

- `id` (UUID, PK)
- `agentId` (TEXT, NOT NULL) — extracted from API key
- `command` (TEXT, NOT NULL) — e.g., "issue create", "agent onboard"
- `args` (JSONB) — command arguments
- `result` (TEXT) — "success" | "failure"
- `output` (TEXT) — command output or error message
- `createdAt` (TIMESTAMPTZ)

**Indexes:**
- `audit_logs_agent_timestamp_idx` on `(agent_id, created_at)`
- `audit_logs_command_timestamp_idx` on `(command, created_at)`

### 7.2 `auditLog()` CLI Helper

**File:** `packages/cli/src/helpers/audit-log.ts`

- Non-blocking, fire-and-forget design
- Async write, doesn't block command execution
- Errors logged but don't fail the command

### 7.3 `getAgentIdFromApiKey()` Helper

**File:** `packages/cli/src/helpers/api-key.ts`

- Extracts agentId from API key format `{agentId}:{secret}`
- Validates key exists in `agent_api_keys` table
- Throws error if key is invalid

### 7.4 Issue Comment CLI Command

**File:** `packages/cli/src/commands/issue/comment.ts`

- Command: `leclaw issue comment add --issue-id <id> --message <text> --api-key <key>`
- Writes comment to `issue_comments` table
- Audit logged on success/failure
- Access: Agent (write via CLI), Human (read-only via Web UI)

### 7.5 Issue Report Append-Only CLI Command

**File:** `packages/cli/src/commands/issue/report.ts`

- Command: `leclaw issue report update --issue-id <id> --report <text> --api-key <key>`
- Append-only: existing report never overwritten
- Separator: `\n\n-- \n\n` between appends
- Audit logged on success/failure

### 7.6 CLI Command Audit Integration

**Commands with audit logging:**
- `leclaw agent onboard` — audit on success/failure
- `leclaw issue comment add` — audit on success/failure
- `leclaw issue report update` — audit on success/failure

**Commands excluded (read-only/internal):**
- `config` commands
- `status` / `doctor`
- `agents list`

---

## Deviations from Plan

### Rule 2 — Auto-fix: TypeScript type inference issue

**Found during:** Build verification
**Issue:** Drizzle ORM type inference for `insert().values()` was not working correctly, causing TypeScript errors in CLI package even though server package with identical patterns built fine.
**Fix:** Added `as any` cast to values object in insert calls, following existing pattern in `packages/server/src/services/issue.service.ts`
**Files modified:** `packages/cli/src/helpers/audit-log.ts`, `packages/cli/src/commands/issue/comment.ts`, `packages/cli/src/commands/issue/report.ts`
**Commit:** 8e5522b

---

## File Structure

```
packages/
├── db/
│   └── src/
│       ├── schema/
│       │   ├── index.ts           (added auditLogs export)
│       │   └── audit-logs.ts     (NEW)
│       └── db.ts                  (added auditLogs to schema)
├── cli/
│   └── src/
│       ├── commands/
│       │   ├── issue/
│       │   │   ├── index.ts       (NEW)
│       │   │   ├── comment.ts     (NEW)
│       │   │   └── report.ts      (NEW)
│       │   └── agent/
│       │       └── agent-onboard.ts (added audit logging)
│       ├── helpers/
│       │   ├── audit-log.ts       (NEW)
│       │   └── api-key.ts         (NEW)
│       └── program/
│           └── build-program.ts   (registered issue commands)
```

---

## Verification

1. **Schema compilation:** `pnpm build` passes
2. **Audit log table:** Created via Drizzle ORM schema with proper indexes
3. **Issue comment command:** Registered under `leclaw issue comment add`
4. **Issue report command:** Registered under `leclaw issue report update` with append-only logic
5. **Agent onboard:** Integrated audit logging on success/failure

---

## Out of Scope

The following were identified but deferred:
- **Audit log viewer UI** — Phase 8 or later
- **Audit log retention/rotation policy** — v2
- **Harness workflow customization** — v2
- **Issue/Goal/Project CLI commands** — These entities are managed via REST API; audit logging for their operations would be server-side

---

## Key Decisions

1. **DB Table over Log File** — Audit logs stored in `audit_logs` table for queryability
2. **Non-blocking writes** — Audit doesn't affect command execution
3. **Agent ID from API key** — Agents identified via their API key, not operator ID
4. **Append-only reports** — Separator `\n\n---\n\n` between appends preserves history

---

## Dependencies

- Phase 2: Entity schemas (Issue, IssueComment, Agent)
- Phase 3: API key generation (`agent_api_keys` table)
- Phase 4: REST API infrastructure

---

## Metrics

| Metric | Value |
|--------|-------|
| Files created | 6 |
| Files modified | 4 |
| Schema tables added | 1 |
| CLI commands added | 2 |
| CLI helpers added | 2 |
| Commands with audit | 3 |

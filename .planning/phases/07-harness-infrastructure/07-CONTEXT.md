# Phase 7: Harness Infrastructure - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit logging, issue comments, and report management.

**Scope:**
- Audit Log: records every write operation via CLI
- Comments on Issues: human read-only, agent can write via CLI
- Issue report field: Markdown, **append-only** (incremental update only, no overwrite)

**Out of scope for this phase:**
- Harness workflow customization (deferred to v2)

</domain>

<decisions>
## Implementation Decisions

### Audit Log Storage
- **D-01:** Storage = **DB Table** (`audit_logs`)
- **D-02:** Schema:
```typescript
audit_logs {
  id: uuid (PK)
  agentId: string (extracted from API key)
  command: string
  args: jsonb
  result: "success" | "failure"
  output: text
  timestamp: timestamp
}
```
- **D-03:** Indexes: `(agentId, timestamp)`, `(command, timestamp)`

### Audit Log Scope
- **D-04:** Records **all write operations** via CLI:
  - Issue create/update/delete
  - Goal create/update
  - Project create/update
  - Approval approve/reject
  - Agent onboard
- **D-05:** Excluded (read-only or internal):
  - `config` commands
  - `status` / `doctor`
  - `agents list`

### Issue Comments
- **D-06:** Comments stored in `issue_comments` table (from Phase 2)
- **D-07:** Access:
  - **Agent**: write via CLI (`leclaw issue comment add`)
  - **Human**: read via Web UI only
- **D-08:** CLI command:
```
leclaw issue comment add --issue-id <id> --message "comment text"
```

### Issue Report (Append-Only)
- **D-09:** Report field = **append-only** (no overwrite)
- **D-10:** Stored as text (Markdown)
- **D-11:** CLI command (append mode only):
```
leclaw issue report update --issue-id <id> --report "new report content"
```
- **D-12:** Implementation: fetch existing report, concatenate new content, save
- **D-13:** No overwrite flag — API enforces append-only
- **Rationale:** Agent updates are incremental; history preserved

### Web UI
- **D-14:** Report displayed as rendered Markdown (read-only)
- **D-15:** Comments displayed as thread (read-only for humans)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/SPEC.md` — Harness model, Audit log entry format, Issue report
- `.planning/ROADMAP.md` — Phase 7 success criteria
- `.planning/phases/02-data-layer-entity-models-db/02-CONTEXT.md` — Issue schema, issue_comments table

</canonical_refs>

<codebase_context>
## Existing Code Insights

### CLI Audit Integration
- Each CLI write command calls `auditLog()` helper
- Agent ID extracted from `--api-key` flag
- Async write, doesn't block command execution

### REST API Notes
- Phase 4: REST API has no auth (local tool)
- Agent CLI commands include `--api-key` for identity
- Audit happens at CLI layer, not HTTP layer

</codebase_context>

<specifics>
## Specific Ideas

**Report Append Implementation:**
```typescript
async function appendReport(issueId: string, newContent: string): Promise<void> {
  const issue = await db.query.issues.findFirst({ where: eq(issues.id, issueId) });
  const updatedReport = issue.report
    ? `${issue.report}\n\n---\n\n${newContent}`
    : newContent;
  await db.update(issues)
    .set({ report: updatedReport, updatedAt: new Date() })
    .where(eq(issues.id, issueId));
}
```

**Audit Log Table DDL:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  command TEXT NOT NULL,
  args JSONB NOT NULL DEFAULT '{}',
  result TEXT NOT NULL CHECK (result IN ('success', 'failure')),
  output TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_agent_timestamp_idx ON audit_logs (agent_id, created_at);
CREATE INDEX audit_logs_command_timestamp_idx ON audit_logs (command, created_at);
```

</specifics>

<deferred>
## Deferred Ideas

- Harness workflow customization (CEO→Manager→Staff orchestration) — v2
- Audit log retention/rotation policy — v2
- Audit log viewer UI — v2

</deferred>

---

*Phase: 07-harness-infrastructure*
*Context gathered: 2026-04-07*

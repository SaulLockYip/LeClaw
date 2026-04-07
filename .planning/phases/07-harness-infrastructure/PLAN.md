# Phase 7: Harness Infrastructure — Implementation Plan

**Phase:** 07-harness-infrastructure
**Status:** Planned
**Created:** 2026-04-07
**Depends on:** Phase 6 (Web UI - Entity Pages)

---

## Overview

Phase 7 implements the Harness Infrastructure layer: audit logging for all CLI write operations, issue comments (agent-write, human-read-only), and issue report append-only updates.

---

## Success Criteria

1. Audit Log records every CLI write operation (agentId, command, args, result, timestamp)
2. Comments on Issues: agent can write via `leclaw issue comment add`, humans read-only via Web UI
3. Issue report field: Markdown, append-only update via `leclaw issue report update`

---

## Deliverables

### 7.1 Audit Log DB Table Schema

**File:** `packages/server/src/schema/audit-logs.ts`

```typescript
import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: text("agent_id").notNull(),           // Extracted from API key
    command: text("command").notNull(),            // e.g., "issue create", "goal update"
    args: jsonb("args").$type<Record<string, unknown>>().notNull().default({}),
    result: text("result").notNull(),              // "success" | "failure"
    output: text("output"),                         // Command output or error message
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    agentTimestampIdx: index("audit_logs_agent_timestamp_idx").on(table.agentId, table.createdAt),
    commandTimestampIdx: index("audit_logs_command_timestamp_idx").on(table.command, table.createdAt),
  }),
);
```

**Indexes:**
- `(agent_id, created_at)` — for agent-specific audit queries
- `(command, created_at)` — for command-specific audit queries

**Migration:** Drizzle Kit migration file in `packages/server/src/migrations/`

---

### 7.2 `auditLog()` CLI Helper Function

**File:** `packages/cli/src/helpers/audit-log.ts`

```typescript
import type { PostgresError } from "postgres";

export type AuditResult = "success" | "failure";

export interface AuditLogEntry {
  agentId: string;
  command: string;
  args: Record<string, unknown>;
  result: AuditResult;
  output: string;
}

export async function auditLog(
  db: Database,
  entry: AuditLogEntry
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      agentId: entry.agentId,
      command: entry.command,
      args: entry.args,
      result: entry.result,
      output: entry.output,
    });
  } catch (err) {
    // Non-blocking: log error but don't fail the command
    console.error("[audit] Failed to write audit log:", err);
  }
}
```

**Design Decisions:**
- **Async, non-blocking:** Does not await completion; errors are caught and logged
- **Fire-and-forget:** Command execution proceeds regardless of audit write success
- **Agent ID extraction:** Passed from CLI context (derived from `--api-key` flag)

---

### 7.3 Issue Comment Write via CLI

#### 7.3.1 CLI Command

**File:** `packages/cli/src/commands/issue/comment.ts`

```typescript
import { Command } from "@commander-js/commander";
import { getDb } from "@leclaw/db";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentIdFromApiKey } from "../../helpers/api-key.js";

export const commentCommand = new Command("comment")
  .description("Manage issue comments")
  .action(() => commentCommand.help());

commentCommand
  .command("add")
  .description("Add a comment to an issue")
  .requiredOption("--issue-id <id>", "Issue ID")
  .requiredOption("--message <text>", "Comment message")
  .option("--api-key <key>", "Agent API key (required for agent auth)")
  .action(async (opts) => {
    const db = await getDb();
    const agentId = await getAgentIdFromApiKey(db, opts.apiKey);

    const [comment] = await db
      .insert(issueComments)
      .values({
        issueId: opts.issueId,
        authorAgentId: agentId,
        body: opts.message,
      })
      .returning();

    await auditLog(db, {
      agentId,
      command: "issue comment add",
      args: { issueId: opts.issueId, commentId: comment.id },
      result: "success",
      output: `Comment ${comment.id} added to issue ${opts.issueId}`,
    });

    console.log(`Comment added: ${comment.id}`);
  });
```

#### 7.3.2 Schema

**File:** `packages/server/src/schema/issue-comments.ts`

Based on Phase 2 `issue_comments` table:

```typescript
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

export const issueComments = pgTable(
  "issue_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id").notNull().references(() => issues.id),
    authorAgentId: uuid("author_agent_id").notNull().references(() => agents.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    issueIdx: index("issue_comments_issue_idx").on(table.issueId),
    createdAtIdx: index("issue_comments_created_at_idx").on(table.createdAt),
  }),
);
```

#### 7.3.3 Access Control

| Actor | Permission |
|-------|------------|
| Agent (via CLI) | Write (create comments) |
| Human (via Web UI) | Read-only |

---

### 7.4 Issue Report Append-Only Implementation

#### 7.4.1 CLI Command

**File:** `packages/cli/src/commands/issue/report.ts`

```typescript
import { Command } from "@commander-js/commander";
import { getDb } from "@leclaw/db";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentIdFromApiKey } from "../../helpers/api-key.js";
import { issues } from "@leclaw/db/schema";
import { eq } from "drizzle-orm";

export const reportCommand = new Command("report")
  .description("Manage issue reports")
  .action(() => reportCommand.help());

reportCommand
  .command("update")
  .description("Append to an issue report (append-only, no overwrite)")
  .requiredOption("--issue-id <id>", "Issue ID")
  .requiredOption("--report <text>", "Report content to append")
  .option("--api-key <key>", "Agent API key (required for agent auth)")
  .action(async (opts) => {
    const db = await getDb();
    const agentId = await getAgentIdFromApiKey(db, opts.apiKey);

    // Fetch existing report (append-only)
    const [issue] = await db
      .select({ report: issues.report })
      .from(issues)
      .where(eq(issues.id, opts.issueId));

    if (!issue) {
      throw new Error(`Issue not found: ${opts.issueId}`);
    }

    // Append with separator
    const separator = issue.report ? "\n\n---\n\n" : "";
    const updatedReport = `${issue.report ?? ""}${separator}${opts.report}`;

    await db
      .update(issues)
      .set({ report: updatedReport, updatedAt: new Date() })
      .where(eq(issues.id, opts.issueId));

    await auditLog(db, {
      agentId,
      command: "issue report update",
      args: { issueId: opts.issueId, appendedLength: opts.report.length },
      result: "success",
      output: `Report appended to issue ${opts.issueId}`,
    });

    console.log(`Report updated for issue ${opts.issueId}`);
  });
```

#### 7.4.2 Design Decisions

- **Append-only:** Existing report content is never overwritten
- **Separator:** `---` markdown horizontal rule between appends
- **No delete command:** Reports cannot be deleted or truncated
- **Agent-only write:** Only agents (via CLI) can update reports; humans read-only via Web UI

---

### 7.5 CLI Command Audit Integration

#### 7.5.1 Write Operations to Audit

| Command | Audit Command Name |
|---------|-------------------|
| `leclaw issue create` | `issue create` |
| `leclaw issue update` | `issue update` |
| `leclaw issue delete` | `issue delete` |
| `leclaw goal create` | `goal create` |
| `leclaw goal update` | `goal update` |
| `leclaw project create` | `project create` |
| `leclaw project update` | `project update` |
| `leclaw approval approve` | `approval approve` |
| `leclaw approval reject` | `approval reject` |
| `leclaw agent onboard` | `agent onboard` |
| `leclaw issue comment add` | `issue comment add` |
| `leclaw issue report update` | `issue report update` |

#### 7.5.2 Excluded (Read-Only / Internal)

- `config` commands
- `status` / `doctor`
- `agents list`
- `issue comment list` (read operation)
- `issue get` (read operation)

#### 7.5.3 Integration Pattern

Each write command wraps the core operation with `auditLog()`:

```typescript
// Pattern for each write command
async function handleWriteCommand(opts: Options) {
  const agentId = await getAgentIdFromApiKey(db, opts.apiKey);
  let result: "success" | "failure" = "success";
  let output = "";
  let error: Error | undefined;

  try {
    // Execute the operation
    const data = await db.insert(table).values(...).returning();
    output = JSON.stringify(data);
  } catch (err) {
    result = "failure";
    error = err instanceof Error ? err : new Error(String(err));
    output = error.message;
    throw error;
  } finally {
    // Non-blocking audit log
    auditLog(db, {
      agentId,
      command: "issue create",
      args: sanitizeArgs(opts),
      result,
      output,
    });
  }
}
```

#### 7.5.4 API Key Extraction

**File:** `packages/cli/src/helpers/api-key.ts`

```typescript
import { db } from "@leclaw/db";
import { agentApiKeys } from "@leclaw/db/schema";
import { eq } from "drizzle-orm";

export async function getAgentIdFromApiKey(
  db: Database,
  apiKey: string
): Promise<string> {
  const [keyRecord] = await db
    .select({ agentId: agentApiKeys.agentId })
    .from(agentApiKeys)
    .where(eq(agentApiKeys.key, apiKey));

  if (!keyRecord) {
    throw new Error("Invalid API key");
  }

  return keyRecord.agentId;
}
```

---

## File Structure

```
packages/
├── server/
│   └── src/
│       ├── schema/
│       │   ├── index.ts
│       │   ├── audit-logs.ts        # NEW
│       │   └── issue-comments.ts    # NEW (if not in Phase 2)
│       └── migrations/
│           └── 000_audit_logs.ts     # NEW
├── cli/
│   └── src/
│       ├── commands/
│       │   ├── issue/
│       │   │   ├── comment.ts       # NEW
│       │   │   └── report.ts        # NEW
│       │   └── index.ts
│       └── helpers/
│           ├── audit-log.ts         # NEW
│           └── api-key.ts           # NEW
```

---

## Dependencies

- Phase 2: Entity schemas (Issue, Goal, Project, Approval, Agent, Company, Department)
- Phase 3: API key generation and storage (`agent_api_keys` table)
- Drizzle ORM (from Phase 2)
- Embedded PostgreSQL (from Phase 1)

---

## Testing

### Unit Tests

| Test | File |
|------|------|
| `auditLog()` helper - success case | `packages/cli/test/helpers/audit-log.test.ts` |
| `auditLog()` helper - failure handling | `packages/cli/test/helpers/audit-log.test.ts` |
| Append report - new report | `packages/cli/test/commands/issue/report.test.ts` |
| Append report - existing report | `packages/cli/test/commands/issue/report.test.ts` |
| `getAgentIdFromApiKey()` - valid key | `packages/cli/test/helpers/api-key.test.ts` |
| `getAgentIdFromApiKey()` - invalid key | `packages/cli/test/helpers/api-key.test.ts` |

### Integration Tests

| Test | Description |
|------|-------------|
| Audit log written after `issue create` | Verify entry in `audit_logs` table |
| Audit log written after `goal update` | Verify entry in `audit_logs` table |
| Audit log excluded for `issue get` | Verify no entry for read-only operations |
| Comment persisted via CLI | Verify in `issue_comments` table |
| Report appends without overwrite | Verify existing content preserved |

---

## Verification

1. **Schema verification:** Run `pnpm db:generate` and confirm `audit_logs` and `issue_comments` tables created
2. **CLI audit:** Run `leclaw issue create --title "Test" --api-key <key>` and query `audit_logs` table
3. **Append-only verification:** Create issue with report, update report twice, verify original + both appends present
4. **Comment verification:** Add comment via CLI, verify in `issue_comments` table with correct `authorAgentId`

---

## Deferred to v2

- Audit log retention/rotation policy
- Audit log viewer UI
- Harness workflow customization (CEO→Manager→Staff orchestration)

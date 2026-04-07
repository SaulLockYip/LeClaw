// Audit Log Helper - Non-blocking audit logging for CLI write operations
// Design: Async, fire-and-forget. Command execution proceeds regardless of audit write success.

import { auditLogs } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";

export type AuditResult = "success" | "failure";

export interface AuditLogEntry {
  agentId: string;
  command: string;
  args: Record<string, unknown>;
  result: AuditResult;
  output: string;
}

/**
 * Write an audit log entry to the database
 * Non-blocking: catches errors and logs them without failing the command
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(auditLogs).values({
      agentId: entry.agentId,
      command: entry.command,
      args: entry.args,
      result: entry.result,
      output: entry.output,
    } as any);
  } catch (err) {
    // Non-blocking: log error but don't fail the command
    console.error("[audit] Failed to write audit log:", err);
  }
}

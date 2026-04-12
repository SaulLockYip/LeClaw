// Issue Update Command - Update an issue

import { Command } from "commander";
import { issues, agents } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq } from "drizzle-orm";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";

function normalizeIssueStatus(status: string): string {
  const lower = status.toLowerCase();
  if (lower === "inprogress") return "InProgress";
  if (lower === "cancelled") return "Cancelled";
  if (lower === "blocked") return "Blocked";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function registerUpdateCommand(program: Command): void {
  const updateCommand = new Command("update")
    .description("Update an issue");

  updateCommand
    .requiredOption("--issue-id <id>", "Issue ID")
    .option("--title <title>", "Issue title")
    .option("--description <desc>", "Issue description")
    .option("--status <status>", "Issue status: Open | InProgress | Blocked | Done | Cancelled")
    .option("--department-id <id>", "Department ID")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      const { issueId, title, description, status, departmentId, apiKey } = options;

      let agentId: string;
      let result: "success" | "failure" = "success";
      let output = "";

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        agentId = agentInfo.agentId;
        const db = await getDb();

        // Check if issue exists
        const [existing] = await db
          .select({ id: issues.id, departmentId: issues.departmentId })
          .from(issues)
          .where(eq(issues.id, issueId))
          .limit(1);

        if (!existing) {
          console.error(JSON.stringify({
            success: false,
            error: `Issue not found: ${issueId}`,
          }, null, 2));
          process.exit(1);
        }

        // Role guard: Staff/Manager can only update issues in their department
        if (agentInfo.role !== "CEO") {
          const [agent] = await db
            .select({ departmentId: agents.departmentId })
            .from(agents)
            .where(eq(agents.id, agentInfo.agentId))
            .limit(1);

          if (agent?.departmentId !== existing.departmentId) {
            console.error(JSON.stringify({
              success: false,
              error: "Access denied: You can only update issues in your department",
            }, null, 2));
            process.exit(1);
          }
        }

        // Build update object
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) {
          updateData.status = normalizeIssueStatus(status);
        }
        if (departmentId !== undefined) updateData.departmentId = departmentId;

        // Update the issue
        await db.update(issues)
          .set(updateData as any)
          .where(eq(issues.id, issueId));

        output = `Issue ${issueId} updated`;

        await auditLog({
          agentId,
          command: "issue update",
          args: { issueId, updateData },
          result: "success",
          output,
        });

        console.log(JSON.stringify({
          success: true,
          issueId,
          message: output,
        }, null, 2));
      } catch (err) {
        result = "failure";
        const error = err instanceof Error ? err : new Error(String(err));
        output = error.message;

        if (agentId) {
          await auditLog({
            agentId,
            command: "issue update",
            args: { issueId },
            result: "failure",
            output,
          });
        }

        console.error(JSON.stringify({
          success: false,
          error: output,
        }, null, 2));
        process.exit(1);
      }
    });

  program.addCommand(updateCommand);
}

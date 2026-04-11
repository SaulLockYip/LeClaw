// Sub-Issue Command - Create, show, and update sub-issues
// Sub-issues belong to a parent issue and have an assignee

import { Command } from "commander";
import { issues, subIssues, agents } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq } from "drizzle-orm";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";

export function registerSubIssueCommand(program: Command): void {
  const subIssueCommand = new Command("sub-issue")
    .description("Manage sub-issues");

  // sub-issue create
  subIssueCommand
    .command("create")
    .description("Create a sub-issue")
    .requiredOption("--parent-issue-id <id>", "Parent Issue ID")
    .requiredOption("--title <title>", "Sub-issue title")
    .requiredOption("--assignee-agent-id <id>", "Assignee Agent ID")
    .option("--description <desc>", "Sub-issue description")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      const { parentIssueId, title, assigneeAgentId, description, apiKey } = options;

      let agentId: string;
      let result: "success" | "failure" = "success";
      let output = "";

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        agentId = agentInfo.agentId;
        const db = await getDb();

        // Verify parent issue exists
        const [parentIssue] = await db
          .select({ id: issues.id, departmentId: issues.departmentId, subIssues: issues.subIssues })
          .from(issues)
          .where(eq(issues.id, parentIssueId))
          .limit(1);

        if (!parentIssue) {
          console.error(JSON.stringify({
            success: false,
            error: `Parent issue not found: ${parentIssueId}`,
          }, null, 2));
          process.exit(1);
        }

        // Verify assignee exists
        const [assignee] = await db
          .select({ id: agents.id })
          .from(agents)
          .where(eq(agents.id, assigneeAgentId))
          .limit(1);

        if (!assignee) {
          console.error(JSON.stringify({
            success: false,
            error: `Assignee agent not found: ${assigneeAgentId}`,
          }, null, 2));
          process.exit(1);
        }

        // Insert the sub-issue
        const [subIssue] = await db.insert(subIssues).values({
          parentIssueId,
          title,
          description: description ?? null,
          assigneeAgentId,
        } as any).returning();

        // Update parent's subIssues array
        const updatedSubIssues = [...(parentIssue.subIssues ?? []), subIssue.id];
        await db.update(issues)
          .set({ subIssues: updatedSubIssues, updatedAt: new Date() } as any)
          .where(eq(issues.id, parentIssueId));

        output = `Sub-issue ${subIssue.id} created for issue ${parentIssueId}`;

        await auditLog({
          agentId,
          command: "issue sub-issue create",
          args: { parentIssueId, subIssueId: subIssue.id },
          result: "success",
          output,
        });

        console.log(JSON.stringify({
          success: true,
          subIssueId: subIssue.id,
          message: output,
        }, null, 2));
      } catch (err) {
        result = "failure";
        const error = err instanceof Error ? err : new Error(String(err));
        output = error.message;

        if (agentId) {
          await auditLog({
            agentId,
            command: "issue sub-issue create",
            args: { parentIssueId },
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

  // sub-issue show
  subIssueCommand
    .command("show")
    .description("Show a sub-issue")
    .requiredOption("--sub-issue-id <id>", "Sub-issue ID")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      const { subIssueId, apiKey } = options;

      try {
        await getAgentInfoFromApiKey(apiKey); // Validate API key
        const db = await getDb();

        const [subIssue] = await db
          .select({
            id: subIssues.id,
            parentIssueId: subIssues.parentIssueId,
            title: subIssues.title,
            description: subIssues.description,
            status: subIssues.status,
            assigneeAgentId: subIssues.assigneeAgentId,
            createdAt: subIssues.createdAt,
          })
          .from(subIssues)
          .where(eq(subIssues.id, subIssueId))
          .limit(1);

        if (!subIssue) {
          console.error(JSON.stringify({
            success: false,
            error: `Sub-issue not found: ${subIssueId}`,
          }, null, 2));
          process.exit(1);
        }

        console.log(JSON.stringify({
          success: true,
          subIssue,
        }, null, 2));
      } catch (err) {
        console.error(JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }, null, 2));
        process.exit(1);
      }
    });

  // sub-issue update
  subIssueCommand
    .command("update")
    .description("Update a sub-issue")
    .requiredOption("--sub-issue-id <id>", "Sub-issue ID")
    .option("--title <title>", "Sub-issue title")
    .option("--description <desc>", "Sub-issue description")
    .option("--status <status>", "Status: Open | InProgress | Blocked | Done | Cancelled")
    .option("--assignee-agent-id <id>", "Assignee Agent ID")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      const { subIssueId, title, description, status, assigneeAgentId, apiKey } = options;

      let agentId: string;
      let result: "success" | "failure" = "success";
      let output = "";

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        agentId = agentInfo.agentId;
        const db = await getDb();

        // Check if sub-issue exists
        const [existing] = await db
          .select({ id: subIssues.id })
          .from(subIssues)
          .where(eq(subIssues.id, subIssueId))
          .limit(1);

        if (!existing) {
          console.error(JSON.stringify({
            success: false,
            error: `Sub-issue not found: ${subIssueId}`,
          }, null, 2));
          process.exit(1);
        }

        // If updating assignee, verify they exist
        if (assigneeAgentId) {
          const [assignee] = await db
            .select({ id: agents.id })
            .from(agents)
            .where(eq(agents.id, assigneeAgentId))
            .limit(1);

          if (!assignee) {
            console.error(JSON.stringify({
              success: false,
              error: `Assignee agent not found: ${assigneeAgentId}`,
            }, null, 2));
            process.exit(1);
          }
        }

        // Build update object
        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (assigneeAgentId !== undefined) updateData.assigneeAgentId = assigneeAgentId;

        // Update the sub-issue
        await db.update(subIssues)
          .set(updateData as any)
          .where(eq(subIssues.id, subIssueId));

        output = `Sub-issue ${subIssueId} updated`;

        await auditLog({
          agentId,
          command: "issue sub-issue update",
          args: { subIssueId, updateData },
          result: "success",
          output,
        });

        console.log(JSON.stringify({
          success: true,
          subIssueId,
          message: output,
        }, null, 2));
      } catch (err) {
        result = "failure";
        const error = err instanceof Error ? err : new Error(String(err));
        output = error.message;

        if (agentId) {
          await auditLog({
            agentId,
            command: "issue sub-issue update",
            args: { subIssueId },
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

  program.addCommand(subIssueCommand);
}

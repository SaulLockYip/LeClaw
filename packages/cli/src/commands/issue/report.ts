// Issue Report Command - Show and append to issue reports
// Access: Agent (write) via CLI, Human read-only via Web UI

import { Command } from "commander";
import { issues } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq } from "drizzle-orm";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentIdFromApiKey } from "../../helpers/api-key.js";

export function registerReportCommand(program: Command): void {
  const reportCommand = new Command("report")
    .description("Manage issue reports");

  // report show
  reportCommand
    .command("show")
    .description("Show an issue report")
    .requiredOption("--issue-id <id>", "Issue ID")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      const { issueId, apiKey } = options;

      try {
        await getAgentIdFromApiKey(apiKey); // Validate API key
        const db = await getDb();

        const [issue] = await db
          .select({ id: issues.id, report: issues.report })
          .from(issues)
          .where(eq(issues.id, issueId))
          .limit(1);

        if (!issue) {
          console.error(JSON.stringify({
            success: false,
            error: `Issue not found: ${issueId}`,
          }, null, 2));
          process.exit(1);
        }

        console.log(JSON.stringify({
          success: true,
          issueId: issue.id,
          report: issue.report ?? "",
        }, null, 2));
      } catch (err) {
        console.error(JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }, null, 2));
        process.exit(1);
      }
    });

  // report update
  reportCommand
    .command("update")
    .description("Append to an issue report (append-only, no overwrite)")
    .requiredOption("--issue-id <id>", "Issue ID")
    .requiredOption("--report <text>", "Report content to append")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      const { issueId, report, apiKey } = options;

      let agentId: string;
      let result: "success" | "failure" = "success";
      let output = "";

      try {
        // Extract agentId from API key
        agentId = await getAgentIdFromApiKey(apiKey);
        const db = await getDb();

        // Fetch existing report (append-only)
        const [issue] = await db
          .select({ report: issues.report })
          .from(issues)
          .where(eq(issues.id, issueId))
          .limit(1);

        if (!issue) {
          throw new Error(`Issue not found: ${issueId}`);
        }

        // Append with separator if existing report
        const separator = issue.report ? "\n\n---\n\n" : "";
        const updatedReport = `${issue.report ?? ""}${separator}${report}`;

        // Update the issue with appended report
        await db.update(issues)
          .set({ report: updatedReport, updatedAt: new Date() } as any)
          .where(eq(issues.id, issueId));

        output = `Report appended to issue ${issueId}`;

        await auditLog({
          agentId,
          command: "issue report update",
          args: { issueId, appendedLength: report.length },
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

        // Try to audit even on failure
        if (agentId) {
          await auditLog({
            agentId,
            command: "issue report update",
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

  program.addCommand(reportCommand);
}

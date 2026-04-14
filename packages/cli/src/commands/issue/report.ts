// Issue Report Command - Show and append to issue reports
// Access: Agent (write) via CLI, Human read-only via Web UI

import { Command } from "commander";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

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
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
        const result = await apiClient.getIssueReport(issueId);

        console.log(JSON.stringify({
          success: true,
          issueId,
          report: result.report,
        }, null, 2));
        process.exit(0);
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

      if (!report || report.trim() === "") {
        console.error(JSON.stringify({
          success: false,
          error: "Report content cannot be empty",
          code: "INVALID_INPUT",
        }, null, 2));
        process.exit(1);
      }

      let agentId: string;
      let output = "";

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        agentId = agentInfo.agentId;

        const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
        await apiClient.updateIssueReport(issueId, report);

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
        process.exit(0);
      } catch (err) {
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

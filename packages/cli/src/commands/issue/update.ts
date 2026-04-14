// Issue Update Command - Update an issue

import { Command } from "commander";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

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
      let output = "";

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        agentId = agentInfo.agentId;

        // HTTP path: API handles validation (issue exists, role permissions)
        const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
        await apiClient.updateIssue(issueId, {
          title: title ?? undefined,
          description: description ?? undefined,
          status: status ? normalizeIssueStatus(status) : undefined,
          departmentId: departmentId ?? undefined,
        });

        output = `Issue ${issueId} updated`;

        await auditLog({
          agentId,
          command: "issue update",
          args: { issueId, updateData: { title, description, status, departmentId } },
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

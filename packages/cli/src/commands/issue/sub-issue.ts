// Sub-Issue Command - Create, show, and update sub-issues
// Sub-issues belong to a parent issue and have an assignee

import { Command } from "commander";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

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
      let output = "";

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        agentId = agentInfo.agentId;

        // HTTP path: API handles validation (parent issue and assignee exist)
        const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
        const subIssue = await apiClient.createSubIssue({
          parentIssueId,
          title,
          description: description ?? undefined,
          assigneeAgentId,
        });

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
        process.exit(0);
      } catch (err) {
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
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
        const subIssue = await apiClient.getSubIssue(subIssueId);

        console.log(JSON.stringify({
          success: true,
          subIssue,
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
      let output = "";

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        agentId = agentInfo.agentId;

        // HTTP path: API handles validation
        const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
        await apiClient.updateSubIssue(subIssueId, {
          title: title ?? undefined,
          description: description ?? undefined,
          status: status ?? undefined,
          assigneeAgentId: assigneeAgentId ?? undefined,
        });

        output = `Sub-issue ${subIssueId} updated`;

        await auditLog({
          agentId,
          command: "issue sub-issue update",
          args: { subIssueId, updateData: { title, description, status, assigneeAgentId } },
          result: "success",
          output,
        });

        console.log(JSON.stringify({
          success: true,
          subIssueId,
          message: output,
        }, null, 2));
        process.exit(0);
      } catch (err) {
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

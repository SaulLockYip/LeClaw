// Issue Create Command - Create a new issue
// Access: Agent (write) via CLI, Human read-only via Web UI

import { Command } from "commander";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

export function registerCreateCommand(program: Command): void {
  const createCommand = new Command("create")
    .description("Create a new issue");

  createCommand
    .requiredOption("--department-id <id>", "Department ID")
    .requiredOption("--title <title>", "Issue title")
    .option("--description <desc>", "Issue description")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      const { departmentId, title, description, apiKey } = options;

      let agentId: string;
      let output = "";

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        agentId = agentInfo.agentId;

        // HTTP path: API handles validation (department exists, role permissions)
        const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
        const issue = await apiClient.createIssue({
          title,
          description: description ?? undefined,
          departmentId,
        });

        output = `Issue ${issue.id} created`;

        await auditLog({
          agentId,
          command: "issue create",
          args: { issueId: issue.id, departmentId, title },
          result: "success",
          output,
        });

        console.log(JSON.stringify({
          success: true,
          issueId: issue.id,
          message: output,
        }, null, 2));
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        output = error.message;

        if (agentId) {
          await auditLog({
            agentId,
            command: "issue create",
            args: { departmentId, title },
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

  program.addCommand(createCommand);
}

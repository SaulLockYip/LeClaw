// Issue List Command - List issues for the authenticated agent's scope
// Staff/Manager: returns own department's issues
// CEO: returns all company departments' issues

import { Command } from "commander";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

export function registerListCommand(program: Command): void {
  const listCommand = new Command("list")
    .description("List issues");

  listCommand
    .option("--status <status>", "Filter by status: Open | InProgress | Blocked | Done | Cancelled")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      const { status, apiKey } = options;

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
        const issues = await apiClient.getIssues({ status });

        console.log(JSON.stringify({
          success: true,
          issues,
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

  program.addCommand(listCommand);
}

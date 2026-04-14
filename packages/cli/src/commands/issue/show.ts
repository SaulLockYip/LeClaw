// Issue Show Command - Show issue details with sub-issues
// Does not include the report field (use report show for that)

import { Command } from "commander";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

export function registerShowCommand(program: Command): void {
  const showCommand = new Command("show")
    .description("Show issue details");

  showCommand
    .requiredOption("--issue-id <id>", "Issue ID")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      const { issueId, apiKey } = options;

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
        // Server returns issue with full sub-issue objects
        const issueWithSubIssues = await apiClient.getIssue(issueId);

        console.log(JSON.stringify({
          success: true,
          issue: issueWithSubIssues,
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

  program.addCommand(showCommand);
}

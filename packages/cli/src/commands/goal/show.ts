// Goal Show Command - Show a single goal

import { Command } from "commander";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

export function registerGoalShowCommand(program: Command): void {
  program
    .command("show")
    .description("Show a goal by ID")
    .requiredOption("--goal-id <id>", "Goal ID")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { goalId, apiKey } = options;

      try {
        // Authenticate via API key
        const agentInfo = await getAgentInfoFromApiKey(apiKey);

        const client = createApiClient({ apiKey, companyId: agentInfo.companyId });

        const goal = await client.get<any>(`/api/companies/${agentInfo.companyId}/goals/${goalId}`);

        console.log(JSON.stringify({
          success: true,
          goal,
        }, null, 2));
        process.exit(0);
      } catch (err) {
        console.error(JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : String(err),
          code: "REQUEST_FAILED",
        }, null, 2));
        process.exit(1);
      }
    });
}

// Goal List Command - List goals for a company

import { Command } from "commander";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

export function registerGoalListCommand(program: Command): void {
  program
    .command("list")
    .description("List goals for a company")
    .option("--status <status>", "Filter by status: Open | Achieved | Archived")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { status, apiKey } = options;

      try {
        // Authenticate via API key
        const agentInfo = await getAgentInfoFromApiKey(apiKey);

        const client = createApiClient({ apiKey, companyId: agentInfo.companyId });

        // CEO gets all goals, Manager/Staff get department-related goals
        // Build query params
        const params = new URLSearchParams();
        if (status) {
          params.set("status", status);
        } else {
          // Default: filter out Archived
          params.set("excludeStatus", "Archived");
        }
        // For Manager/Staff, we need to pass department filter to backend
        // The backend will filter based on agent's departments for non-CEO

        const query = params.toString();
        const goals = await client.get<any[]>(`/api/companies/${agentInfo.companyId}/goals${query ? `?${query}` : ""}`);

        console.log(JSON.stringify({
          success: true,
          goals,
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

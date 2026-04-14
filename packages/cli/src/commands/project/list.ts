// Project List Command - List projects for a company

import { Command } from "commander";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

export function registerProjectListCommand(program: Command): void {
  program
    .command("list")
    .description("List projects for a company")
    .option("--status <status>", "Filter by status: Open | InProgress | Done | Archived")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { status, apiKey } = options;

      try {
        // Authenticate via API key
        const agentInfo = await getAgentInfoFromApiKey(apiKey);

        const client = createApiClient({ apiKey, companyId: agentInfo.companyId });

        // Build query params
        const params = new URLSearchParams();
        if (status) {
          params.set("status", status);
        } else {
          // Default: filter out Archived
          params.set("excludeStatus", "Archived");
        }

        const query = params.toString();
        const projects = await client.get<any[]>(`/api/companies/${agentInfo.companyId}/projects${query ? `?${query}` : ""}`);

        console.log(JSON.stringify({
          success: true,
          projects,
        }, null, 2));
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

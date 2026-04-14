// Project Show Command - Show a single project

import { Command } from "commander";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

export function registerProjectShowCommand(program: Command): void {
  program
    .command("show")
    .description("Show a project by ID")
    .requiredOption("--project-id <id>", "Project ID")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { projectId, apiKey } = options;

      try {
        // Authenticate via API key
        const agentInfo = await getAgentInfoFromApiKey(apiKey);

        const client = createApiClient({ apiKey, companyId: agentInfo.companyId });

        const project = await client.get<any>(`/api/companies/${agentInfo.companyId}/projects/${projectId}`);

        console.log(JSON.stringify({
          success: true,
          project,
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

// Goal Create Command - Create a goal for a company (CEO only)

import { Command } from "commander";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

export function registerGoalCreateCommand(program: Command): void {
  program
    .command("create")
    .description("Create a goal for a company (CEO only)")
    .requiredOption("--title <title>", "Goal title")
    .option("--description <desc>", "Goal description")
    .option("--verification <text>", "How to verify goal is achieved")
    .option("--deadline <datetime>", "Goal deadline (ISO datetime)")
    .option("--department-ids <uuid1,uuid2>", "Comma-separated department UUIDs")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { title, description, verification, deadline, departmentIds, apiKey } = options;

      try {
        // Authenticate via API key
        const agentInfo = await getAgentInfoFromApiKey(apiKey);

        // Role guard: only CEO can create goals
        if (agentInfo.role !== "CEO") {
          console.error(JSON.stringify({
            success: false,
            error: "Only CEO can create goals",
            code: "FORBIDDEN",
          }, null, 2));
          process.exit(1);
        }

        const client = createApiClient({ apiKey, companyId: agentInfo.companyId });

        const body: Record<string, unknown> = { title };
        if (description) body.description = description;
        if (verification) body.verification = verification;
        if (deadline) body.deadline = deadline;
        if (departmentIds) body.departmentIds = departmentIds.split(",").map(s => s.trim());

        const goal = await client.post<any>(`/api/companies/${agentInfo.companyId}/goals`, body);

        console.log(JSON.stringify({
          success: true,
          goal,
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

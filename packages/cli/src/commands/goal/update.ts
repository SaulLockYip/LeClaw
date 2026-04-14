// Goal Update Command - Update a goal (CEO only)

import { Command } from "commander";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

function normalizeGoalStatus(status: string): string {
  const lower = status.toLowerCase();
  if (lower === "achieved") return "Achieved";
  if (lower === "archived") return "Archived";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function registerGoalUpdateCommand(program: Command): void {
  program
    .command("update")
    .description("Update a goal (CEO only)")
    .requiredOption("--goal-id <id>", "Goal ID")
    .option("--title <title>", "Goal title")
    .option("--description <desc>", "Goal description")
    .option("--status <status>", "Goal status: Open | Achieved | Archived")
    .option("--verification <text>", "How to verify goal is achieved")
    .option("--deadline <datetime>", "Goal deadline (ISO datetime)")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { goalId, title, description, status, verification, deadline, apiKey } = options;

      try {
        // Authenticate via API key
        const agentInfo = await getAgentInfoFromApiKey(apiKey);

        // Role guard: only CEO can update goals
        if (agentInfo.role !== "CEO") {
          console.error(JSON.stringify({
            success: false,
            error: "Only CEO can update goals",
            code: "FORBIDDEN",
          }, null, 2));
          process.exit(1);
        }

        const client = createApiClient({ apiKey, companyId: agentInfo.companyId });

        const body: Record<string, unknown> = {};
        if (title !== undefined) body.title = title;
        if (description !== undefined) body.description = description;
        if (status !== undefined) body.status = normalizeGoalStatus(status);
        if (verification !== undefined) body.verification = verification;
        if (deadline !== undefined) body.deadline = deadline;

        const goal = await client.put<any>(`/api/companies/${agentInfo.companyId}/goals/${goalId}`, body);

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

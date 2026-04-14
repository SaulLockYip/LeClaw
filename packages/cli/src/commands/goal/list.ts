// Goal List Command - List goals for a company
// CEO: sees all goals, Manager/Staff: sees goals for their department or with no department restriction

import { Command } from "commander";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

export function registerGoalListCommand(program: Command): void {
  program
    .command("list")
    .description("List goals for a company (CEO sees all, Manager/Staff see department goals)")
    .option("--status <status>", "Filter by status: Open | Achieved | Archived")
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
        const goals = await client.get<any[]>(`/api/companies/${agentInfo.companyId}/goals${query ? `?${query}` : ""}`);

        // CEO sees all goals, Manager/Staff see only their department's goals or goals with no department restriction
        const isCeo = agentInfo.role === "CEO";
        const filteredGoals = isCeo
          ? goals
          : goals.filter((goal: any) => {
              // Include goals with empty departmentIds (company-wide goals)
              if (!goal.departmentIds || goal.departmentIds.length === 0) {
                return true;
              }
              // Include goals that include the agent's department
              return goal.departmentIds.includes(agentInfo.departmentId);
            });

        console.log(JSON.stringify({
          success: true,
          goals: filteredGoals,
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
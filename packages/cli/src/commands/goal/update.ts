// Goal Update Command - Update a goal (CEO only)

import { Command } from "commander";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { loadConfig } from "@leclaw/shared";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

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

        let gatewayUrl = "http://localhost:4396";
        if (fs.existsSync(CONFIG_FILE)) {
          const config = loadConfig({ configPath: CONFIG_FILE });
          if (config.openclaw?.gatewayUrl) {
            gatewayUrl = config.openclaw.gatewayUrl.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://");
          }
        }

        const body: Record<string, unknown> = {};
        if (title !== undefined) body.title = title;
        if (description !== undefined) body.description = description;
        if (status !== undefined) body.status = status;
        if (verification !== undefined) body.verification = verification;
        if (deadline !== undefined) body.deadline = deadline;

        const url = `${gatewayUrl}/api/companies/${agentInfo.companyId}/goals/${goalId}`;

        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });

        const data = await response.json() as { error?: { message?: string; code?: string }; data?: unknown };

        if (!response.ok) {
          console.error(JSON.stringify({
            success: false,
            error: data.error?.message || `HTTP ${response.status}`,
            code: data.error?.code || "UPDATE_FAILED",
          }, null, 2));
          process.exit(1);
        }

        console.log(JSON.stringify({
          success: true,
          goal: data.data,
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

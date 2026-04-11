// Goal Create Command - Create a goal for a company (CEO only)

import { Command } from "commander";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { loadConfig } from "@leclaw/shared";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

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

        let gatewayUrl = "http://localhost:4396";
        if (fs.existsSync(CONFIG_FILE)) {
          const config = loadConfig({ configPath: CONFIG_FILE });
          if (config.openclaw?.gatewayUrl) {
            gatewayUrl = config.openclaw.gatewayUrl.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://");
          }
        }

        const body: Record<string, unknown> = { title };
        if (description) body.description = description;
        if (verification) body.verification = verification;
        if (deadline) body.deadline = deadline;
        if (departmentIds) body.departmentIds = departmentIds.split(",").map(s => s.trim());

        const response = await fetch(`${gatewayUrl}/api/companies/${agentInfo.companyId}/goals`, {
          method: "POST",
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
            code: data.error?.code || "CREATE_FAILED",
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

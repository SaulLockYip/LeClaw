// Goal Show Command - Show a single goal

import { Command } from "commander";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { loadConfig } from "@leclaw/shared";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

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

        let gatewayUrl = "http://localhost:4396";
        if (fs.existsSync(CONFIG_FILE)) {
          const config = loadConfig({ configPath: CONFIG_FILE });
          if (config.openclaw?.gatewayUrl) {
            gatewayUrl = config.openclaw.gatewayUrl.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://");
          }
        }

        const url = `${gatewayUrl}/api/companies/${agentInfo.companyId}/goals/${goalId}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        });

        const data = await response.json() as { error?: { message?: string; code?: string }; data?: unknown };

        if (!response.ok) {
          console.error(JSON.stringify({
            success: false,
            error: data.error?.message || `HTTP ${response.status}`,
            code: data.error?.code || "SHOW_FAILED",
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

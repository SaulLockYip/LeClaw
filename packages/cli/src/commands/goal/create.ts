// Goal Create Command - Create a goal for a company

import { Command } from "commander";
import { loadConfig } from "@leclaw/shared";
import path from "path";
import os from "os";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");
const DEFAULT_SERVER_URL = "http://localhost:4396";

export function registerGoalCreateCommand(program: Command): void {
  program
    .command("create")
    .description("Create a goal for a company")
    .requiredOption("--company-id <id>", "Company ID")
    .requiredOption("--title <title>", "Goal title")
    .option("--description <desc>", "Goal description")
    .action(async (options) => {
      const { companyId, title, description } = options;

      try {
        const config = loadConfig({ configPath: CONFIG_FILE });
        const serverUrl = config.openclaw?.gatewayUrl
          ? config.openclaw.gatewayUrl.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://")
          : DEFAULT_SERVER_URL;

        const url = `${serverUrl}/api/companies/${encodeURIComponent(companyId)}/goals`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, ...(description ? { description } : {}) }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json() as { success: boolean; data: unknown };

        console.log(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error(JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }, null, 2));
        process.exit(1);
      }
    });
}

// Issue Create Command - Create a new issue
// Access: Agent (write) via CLI, Human read-only via Web UI

import { Command } from "commander";
import path from "path";
import os from "os";
import { loadConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

async function getServerUrl(): Promise<string> {
  const config = loadConfig({ configPath: CONFIG_FILE });
  const port = config.server?.port ?? 4396;
  return `http://localhost:${port}`;
}

export function registerCreateCommand(program: Command): void {
  const createCommand = new Command("create")
    .description("Create a new issue");

  createCommand
    .requiredOption("--company-id <id>", "Company ID")
    .requiredOption("--department-id <id>", "Department ID")
    .requiredOption("--title <title>", "Issue title")
    .requiredOption("--description <desc>", "Issue description")
    .option("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { companyId, departmentId, title, description, apiKey } = options;

      try {
        const serverUrl = await getServerUrl();
        const response = await fetch(`${serverUrl}/api/companies/${companyId}/issues`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({
            title,
            description,
            departmentId,
          }),
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
          issue: data.data,
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

  program.addCommand(createCommand);
}

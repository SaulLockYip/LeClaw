// Project Update Command - Update a project (CEO or Manager)

import { Command } from "commander";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { loadConfig } from "@leclaw/shared";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

function normalizeProjectStatus(status: string): string {
  const lower = status.toLowerCase();
  if (lower === "inprogress") return "InProgress";
  if (lower === "archived") return "Archived";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function registerProjectUpdateCommand(program: Command): void {
  program
    .command("update")
    .description("Update a project (CEO or Manager)")
    .requiredOption("--project-id <id>", "Project ID")
    .option("--title <title>", "Project title")
    .option("--description <desc>", "Project description")
    .option("--status <status>", "Project status: Open | InProgress | Done | Archived")
    .option("--project-dir <path>", "Project root directory")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { projectId, title, description, status, projectDir, apiKey } = options;

      try {
        // Authenticate via API key
        const agentInfo = await getAgentInfoFromApiKey(apiKey);

        // Role guard: only CEO or Manager can update projects
        if (agentInfo.role !== "CEO" && agentInfo.role !== "Manager") {
          console.error(JSON.stringify({
            success: false,
            error: "Only CEO or Manager can update projects",
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
        if (status !== undefined) body.status = normalizeProjectStatus(status);
        if (projectDir !== undefined) body.projectDir = projectDir;

        const url = `${gatewayUrl}/api/companies/${agentInfo.companyId}/projects/${projectId}`;

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
          project: data.data,
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

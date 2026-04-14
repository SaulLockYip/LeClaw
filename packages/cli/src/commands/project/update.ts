// Project Update Command - Update a project (CEO or Manager)

import { Command } from "commander";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

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
    .option("--department-ids <uuid1,uuid2>", "Comma-separated department UUIDs")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { projectId, title, description, status, projectDir, departmentIds, apiKey } = options;

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

        const client = createApiClient({ apiKey, companyId: agentInfo.companyId });

        const body: Record<string, unknown> = {};
        if (title !== undefined) body.title = title;
        if (description !== undefined) body.description = description;
        if (status !== undefined) body.status = normalizeProjectStatus(status);
        if (projectDir !== undefined) body.projectDir = projectDir;
        if (departmentIds !== undefined) body.departmentIds = departmentIds.split(",").map(s => s.trim());

        const project = await client.put<any>(`/api/companies/${agentInfo.companyId}/projects/${projectId}`, body);

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

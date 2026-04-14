// Project Create Command - Create a project for a company (CEO or Manager)

import { Command } from "commander";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

export function registerProjectCreateCommand(program: Command): void {
  program
    .command("create")
    .description("Create a project for a company (CEO or Manager)")
    .requiredOption("--title <title>", "Project title")
    .option("--description <desc>", "Project description (outputs, specs, etc.)")
    .option("--project-dir <path>", "Project root directory")
    .option("--issue-ids <uuid1,uuid2>", "Comma-separated issue UUIDs")
    .option("--department-ids <uuid1,uuid2>", "Comma-separated department UUIDs")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { title, description, projectDir, issueIds, departmentIds, apiKey } = options;

      // Validate required fields
      if (!title || title.trim() === "") {
        console.error(JSON.stringify({
          success: false,
          error: "Title cannot be empty",
          code: "INVALID_INPUT",
        }, null, 2));
        process.exit(1);
      }

      try {
        // Authenticate via API key
        const agentInfo = await getAgentInfoFromApiKey(apiKey);

        // Role guard: only CEO or Manager can create projects
        if (agentInfo.role !== "CEO" && agentInfo.role !== "Manager") {
          console.error(JSON.stringify({
            success: false,
            error: "Only CEO or Manager can create projects",
            code: "FORBIDDEN",
          }, null, 2));
          process.exit(1);
        }

        const client = createApiClient({ apiKey, companyId: agentInfo.companyId });

        const body: Record<string, unknown> = { title };
        if (description) body.description = description;
        if (projectDir) body.projectDir = projectDir;
        if (issueIds) body.issueIds = issueIds.split(",").map(s => s.trim());
        if (departmentIds) body.departmentIds = departmentIds.split(",").map(s => s.trim());

        const project = await client.post<any>(`/api/companies/${agentInfo.companyId}/projects`, body);

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

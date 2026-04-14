// Project List Command - List projects for a company
// CEO: sees all projects, Manager/Staff: sees projects assigned to their department

import { Command } from "commander";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

export function registerProjectListCommand(program: Command): void {
  program
    .command("list")
    .description("List projects for a company (CEO sees all, Manager/Staff see their department's projects)")
    .option("--status <status>", "Filter by status: Open | InProgress | Done | Archived")
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
        const projects = await client.get<any[]>(`/api/companies/${agentInfo.companyId}/projects${query ? `?${query}` : ""}`);

        // CEO sees all projects, Manager/Staff see only their department's projects
        const isCeo = agentInfo.role === "CEO";

        if (isCeo) {
          console.log(JSON.stringify({
            success: true,
            projects,
          }, null, 2));
          process.exit(0);
        }

        // For Manager/Staff, we need to find projects that have issues in their department
        // Fetch issues for the department to get associated projectIds
        const issues = await client.get<any[]>(`/api/companies/${agentInfo.companyId}/issues?departmentId=${agentInfo.departmentId}`);

        // Collect projectIds from the department's issues
        const departmentProjectIds = new Set<string>();
        for (const issue of issues) {
          if (issue.projectId) {
            departmentProjectIds.add(issue.projectId);
          }
        }

        // Filter projects to only include those assigned to the department
        const filteredProjects = projects.filter((project: any) =>
          departmentProjectIds.has(project.id)
        );

        console.log(JSON.stringify({
          success: true,
          projects: filteredProjects,
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
// leclaw department list command - List departments with managers and staffs
// Access: All roles (CEO, Manager, Staff)

import { Command } from "commander";
import { getCurrentAgent } from "../../helpers/api-client.js";
import { createApiClient } from "../../helpers/api-client.js";

interface DepartmentWithAgents {
  id: string;
  name: string;
  companyId: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  manager: {
    id: string;
    name: string;
    title: string | null;
  } | null;
  staffs: Array<{
    id: string;
    name: string;
    title: string | null;
  }>;
}

async function listDepartmentsViaHttp(
  apiKey: string,
  agentInfo: Awaited<ReturnType<typeof getCurrentAgent>>
): Promise<DepartmentWithAgents[]> {
  const apiClient = createApiClient({
    apiKey,
    companyId: agentInfo.companyId,
  });

  // Server returns enriched departments with manager and staffs
  const depts = await apiClient.getDepartments();

  return depts.map((dept: any) => ({
    id: dept.id,
    name: dept.name,
    companyId: dept.companyId,
    description: dept.description,
    createdAt: dept.createdAt,
    updatedAt: dept.updatedAt,
    manager: dept.manager ? {
      id: dept.manager.id,
      name: dept.manager.name,
      title: dept.manager.title,
    } : null,
    staffs: (dept.staffs || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      title: s.title,
    })),
  }));
}

export function registerDepartmentListCommand(program: Command): void {
  program
    .command("list")
    .description("List departments for a company with managers and staffs")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      try {
        const agentInfo = await getCurrentAgent(options.apiKey);
        const departmentsWithAgents = await listDepartmentsViaHttp(options.apiKey, agentInfo);

        if (departmentsWithAgents.length === 0) {
          console.log(JSON.stringify({ success: true, data: [], message: "No departments found" }, null, 2));
        } else {
          console.log(JSON.stringify({ success: true, data: departmentsWithAgents }, null, 2));
        }
        process.exit(0);
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        console.error(JSON.stringify({ success: false, error }, null, 2));
        process.exit(1);
      }
    });
}

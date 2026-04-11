// leclaw department list command - List departments with managers and staffs
// Access: All roles (CEO, Manager, Staff)

import { Command } from "commander";
import { departments, agents } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq, and } from "drizzle-orm";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";

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

export function registerDepartmentListCommand(program: Command): void {
  program
    .command("list")
    .description("List departments for a company with managers and staffs")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      try {
        const agentInfo = await getAgentInfoFromApiKey(options.apiKey);
        const db = await getDb();

        // Get all departments for the company
        const allDepartments = await db
          .select({
            id: departments.id,
            name: departments.name,
            companyId: departments.companyId,
            description: departments.description,
            createdAt: departments.createdAt,
            updatedAt: departments.updatedAt,
          })
          .from(departments)
          .where(eq(departments.companyId, agentInfo.companyId));

        // Get managers and staffs for each department
        const departmentsWithAgents: DepartmentWithAgents[] = await Promise.all(
          allDepartments.map(async (dept) => {
            // Get manager for this department
            const [manager] = await db
              .select({
                id: agents.id,
                name: agents.name,
                title: agents.title,
              })
              .from(agents)
              .where(and(eq(agents.departmentId, dept.id), eq(agents.role, "Manager")))
              .limit(1);

            // Get staffs for this department
            const staffs = await db
              .select({
                id: agents.id,
                name: agents.name,
                title: agents.title,
              })
              .from(agents)
              .where(and(eq(agents.departmentId, dept.id), eq(agents.role, "Staff")));

            return {
              id: dept.id,
              name: dept.name,
              companyId: dept.companyId,
              description: dept.description,
              createdAt: dept.createdAt,
              updatedAt: dept.updatedAt,
              manager: manager ? {
                id: manager.id,
                name: manager.name,
                title: manager.title,
              } : null,
              staffs: staffs.map((s) => ({
                id: s.id,
                name: s.name,
                title: s.title,
              })),
            };
          })
        );

        if (departmentsWithAgents.length === 0) {
          console.log(JSON.stringify({ success: true, data: [], message: "No departments found" }, null, 2));
        } else {
          console.log(JSON.stringify({ success: true, data: departmentsWithAgents }, null, 2));
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        console.error(JSON.stringify({ success: false, error }, null, 2));
        process.exit(1);
      }
    });
}

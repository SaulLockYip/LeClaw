// leclaw department create command - Create a new department
// Access: CEO only

import { Command } from "commander";
import { departments, agents } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq } from "drizzle-orm";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";

export function registerDepartmentCreateCommand(program: Command): void {
  const createCommand = new Command("create")
    .description("Create a new department (CEO only)");

  createCommand
    .requiredOption("--name <name>", "Department name")
    .option("--description <description>", "Department description")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      let agentId: string;
      let result: "success" | "failure" = "success";
      let output = "";

      try {
        const agentInfo = await getAgentInfoFromApiKey(options.apiKey);
        agentId = agentInfo.agentId;

        // Role guard: Only CEO can create departments
        if (agentInfo.role !== "CEO") {
          console.error(JSON.stringify({
            success: false,
            error: "Access denied: Only CEO can create departments",
          }, null, 2));
          process.exit(1);
        }

        const db = await getDb();

        // Create the department
        const [department] = await db.insert(departments).values({
          companyId: agentInfo.companyId,
          name: options.name,
          description: options.description ?? null,
        } as any).returning();

        output = `Department ${department.id} created`;

        await auditLog({
          agentId,
          command: "department create",
          args: { departmentId: department.id, name: options.name },
          result: "success",
          output,
        });

        console.log(JSON.stringify({
          success: true,
          departmentId: department.id,
          message: output,
        }, null, 2));
      } catch (err) {
        result = "failure";
        const error = err instanceof Error ? err : new Error(String(err));
        output = error.message;

        if (agentId) {
          await auditLog({
            agentId,
            command: "department create",
            args: { name: options.name },
            result: "failure",
            output,
          });
        }

        console.error(JSON.stringify({
          success: false,
          error: output,
        }, null, 2));
        process.exit(1);
      }
    });

  program.addCommand(createCommand);
}

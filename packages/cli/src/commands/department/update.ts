// leclaw department update command - Update a department
// Access: CEO or same department Manager

import { Command } from "commander";
import { departments, agents } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq } from "drizzle-orm";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";

export function registerDepartmentUpdateCommand(program: Command): void {
  const updateCommand = new Command("update")
    .description("Update a department (CEO or same department Manager only)");

  updateCommand
    .requiredOption("--department-id <id>", "Department ID")
    .option("--name <name>", "Department name")
    .option("--description <description>", "Department description")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      let agentId: string;
      let result: "success" | "failure" = "success";
      let output = "";

      try {
        const agentInfo = await getAgentInfoFromApiKey(options.apiKey);
        agentId = agentInfo.agentId;
        const db = await getDb();

        // Verify department exists
        const [department] = await db
          .select({ id: departments.id, companyId: departments.companyId })
          .from(departments)
          .where(eq(departments.id, options.departmentId))
          .limit(1);

        if (!department) {
          console.error(JSON.stringify({
            success: false,
            error: `Department not found: ${options.departmentId}`,
          }, null, 2));
          process.exit(1);
        }

        // Role guard: CEO can update any department, Manager can only update their own
        if (agentInfo.role !== "CEO") {
          const [agent] = await db
            .select({ departmentId: agents.departmentId })
            .from(agents)
            .where(eq(agents.id, agentId))
            .limit(1);

          if (agent?.departmentId !== options.departmentId) {
            console.error(JSON.stringify({
              success: false,
              error: "Access denied: You can only update your own department",
            }, null, 2));
            process.exit(1);
          }
        }

        // Build update values
        const updateValues: Record<string, unknown> = {};
        if (options.name !== undefined) {
          updateValues.name = options.name;
        }
        if (options.description !== undefined) {
          updateValues.description = options.description;
        }
        updateValues.updatedAt = new Date();

        if (Object.keys(updateValues).length === 1) {
          console.error(JSON.stringify({
            success: false,
            error: "No fields to update",
          }, null, 2));
          process.exit(1);
        }

        // Update the department
        const [updated] = await db
          .update(departments)
          .set(updateValues as any)
          .where(eq(departments.id, options.departmentId))
          .returning();

        output = `Department ${options.departmentId} updated`;

        await auditLog({
          agentId,
          command: "department update",
          args: { departmentId: options.departmentId, updates: updateValues },
          result: "success",
          output,
        });

        console.log(JSON.stringify({
          success: true,
          departmentId: updated.id,
          message: output,
        }, null, 2));
      } catch (err) {
        result = "failure";
        const error = err instanceof Error ? err : new Error(String(err));
        output = error.message;

        if (agentId) {
          await auditLog({
            agentId,
            command: "department update",
            args: { departmentId: options.departmentId },
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

  program.addCommand(updateCommand);
}

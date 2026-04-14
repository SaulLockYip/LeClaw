// leclaw department update command - Update a department
// Access: CEO or same department Manager

import { Command } from "commander";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

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
      let output = "";

      try {
        const agentInfo = await getAgentInfoFromApiKey(options.apiKey);
        agentId = agentInfo.agentId;

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

        // HTTP path: API handles validation (department exists, role permissions)
        const apiClient = createApiClient({ apiKey: options.apiKey, companyId: agentInfo.companyId });
        const updated = await apiClient.updateDepartment(options.departmentId, {
          name: options.name,
          description: options.description,
        });

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

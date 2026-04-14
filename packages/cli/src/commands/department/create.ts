// leclaw department create command - Create a new department
// Access: CEO only

import { Command } from "commander";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

export function registerDepartmentCreateCommand(program: Command): void {
  const createCommand = new Command("create")
    .description("Create a new department (CEO only)");

  createCommand
    .requiredOption("--name <name>", "Department name")
    .option("--description <description>", "Department description")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      let agentId: string;
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

        const apiClient = createApiClient({ apiKey: options.apiKey, companyId: agentInfo.companyId });
        const department = await apiClient.createDepartment({
          name: options.name,
          description: options.description ?? undefined,
        });

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

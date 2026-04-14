// leclaw department create command - Create a new department
// Access: CEO only
// Tier 2 migration candidate

import { Command } from "commander";
import path from "path";
import os from "os";
import { departments, agents } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq } from "drizzle-orm";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";
import { loadConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

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
        const config = loadConfig({ configPath: CONFIG_FILE });
        const useHttp = config.features?.httpMigration ?? false;
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

        let department;
        if (useHttp) {
          const apiClient = createApiClient({ apiKey: options.apiKey, companyId: agentInfo.companyId });
          department = await apiClient.createDepartment({
            name: options.name,
            description: options.description ?? undefined,
          });
        } else {
          const db = await getDb();
          [department] = await db.insert(departments).values({
            companyId: agentInfo.companyId,
            name: options.name,
            description: options.description ?? null,
          } as any).returning();
        }

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

// Issue Create Command - Create a new issue
// Access: Agent (write) via CLI, Human read-only via Web UI
// Tier 3 migration candidate

import { Command } from "commander";
import path from "path";
import os from "os";
import { issues, agents, departments } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq } from "drizzle-orm";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";
import { loadConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

export function registerCreateCommand(program: Command): void {
  const createCommand = new Command("create")
    .description("Create a new issue");

  createCommand
    .requiredOption("--department-id <id>", "Department ID")
    .requiredOption("--title <title>", "Issue title")
    .option("--description <desc>", "Issue description")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      const { departmentId, title, description, apiKey } = options;

      let agentId: string;
      let result: "success" | "failure" = "success";
      let output = "";

      try {
        const config = loadConfig({ configPath: CONFIG_FILE });
        const useHttp = config.features?.httpMigration ?? false;
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        agentId = agentInfo.agentId;

        let issue;
        if (useHttp) {
          // HTTP path: API handles validation (department exists, role permissions)
          const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
          issue = await apiClient.createIssue({
            title,
            description: description ?? undefined,
            departmentId,
          });
        } else {
          // DB path: client-side validation
          const db = await getDb();

          // Verify department exists and belongs to the company
          const [department] = await db
            .select({ id: departments.id, companyId: departments.companyId })
            .from(departments)
            .where(eq(departments.id, departmentId))
            .limit(1);

          if (!department) {
            console.error(JSON.stringify({
              success: false,
              error: `Department not found: ${departmentId}`,
            }, null, 2));
            process.exit(1);
          }

          // Role guard: Staff/Manager can only create issues in their department
          if (agentInfo.role !== "CEO") {
            const [agent] = await db
              .select({ departmentId: agents.departmentId })
              .from(agents)
              .where(eq(agents.id, agentId))
              .limit(1);

            if (agent?.departmentId !== departmentId) {
              console.error(JSON.stringify({
                success: false,
                error: "Access denied: You can only create issues in your department",
              }, null, 2));
              process.exit(1);
            }
          }

          [issue] = await db.insert(issues).values({
            companyId: department.companyId,
            departmentId,
            title,
            description: description ?? null,
          } as any).returning();
        }

        output = `Issue ${issue.id} created`;

        await auditLog({
          agentId,
          command: "issue create",
          args: { issueId: issue.id, departmentId, title },
          result: "success",
          output,
        });

        console.log(JSON.stringify({
          success: true,
          issueId: issue.id,
          message: output,
        }, null, 2));
      } catch (err) {
        result = "failure";
        const error = err instanceof Error ? err : new Error(String(err));
        output = error.message;

        if (agentId) {
          await auditLog({
            agentId,
            command: "issue create",
            args: { departmentId, title },
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

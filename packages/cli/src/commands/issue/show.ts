// Issue Show Command - Show issue details with sub-issues
// Does not include the report field (use report show for that)
// Tier 3 migration candidate

import { Command } from "commander";
import path from "path";
import os from "os";
import { issues, subIssues, agents } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq } from "drizzle-orm";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";
import { loadConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

export function registerShowCommand(program: Command): void {
  const showCommand = new Command("show")
    .description("Show issue details");

  showCommand
    .requiredOption("--issue-id <id>", "Issue ID")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      const { issueId, apiKey } = options;

      try {
        const config = loadConfig({ configPath: CONFIG_FILE });
        const useHttp = config.features?.httpMigration ?? false;
        const agentInfo = await getAgentInfoFromApiKey(apiKey);

        let issueWithSubIssues;

        if (useHttp) {
          const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
          // Server returns issue with full sub-issue objects
          issueWithSubIssues = await apiClient.getIssue(issueId);
        } else {
          const db = await getDb();

          // Fetch the issue
          const [issue] = await db
            .select({
              id: issues.id,
              companyId: issues.companyId,
              title: issues.title,
              description: issues.description,
              status: issues.status,
              departmentId: issues.departmentId,
              subIssues: issues.subIssues,
              projectId: issues.projectId,
              goalId: issues.goalId,
              createdAt: issues.createdAt,
              updatedAt: issues.updatedAt,
            })
            .from(issues)
            .where(eq(issues.id, issueId))
            .limit(1);

          if (!issue) {
            console.error(JSON.stringify({
              success: false,
              error: `Issue not found: ${issueId}`,
            }, null, 2));
            process.exit(1);
          }

          // Role guard: Staff/Manager can only view issues in their department
          if (agentInfo.role !== "CEO") {
            const [agent] = await db
              .select({ departmentId: agents.departmentId })
              .from(agents)
              .where(eq(agents.id, agentInfo.agentId))
              .limit(1);

            if (agent?.departmentId !== issue.departmentId) {
              console.error(JSON.stringify({
                success: false,
                error: "Access denied: You can only view issues in your department",
              }, null, 2));
              process.exit(1);
            }
          }

          // Fetch sub-issues
          const subIssueList = await db
            .select({
              id: subIssues.id,
              parentIssueId: subIssues.parentIssueId,
              title: subIssues.title,
              description: subIssues.description,
              status: subIssues.status,
              assigneeAgentId: subIssues.assigneeAgentId,
              createdAt: subIssues.createdAt,
            })
            .from(subIssues)
            .where(eq(subIssues.parentIssueId, issueId));

          issueWithSubIssues = {
            ...issue,
            subIssues: subIssueList,
          };
        }

        console.log(JSON.stringify({
          success: true,
          issue: issueWithSubIssues,
        }, null, 2));
      } catch (err) {
        console.error(JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }, null, 2));
        process.exit(1);
      }
    });

  program.addCommand(showCommand);
}

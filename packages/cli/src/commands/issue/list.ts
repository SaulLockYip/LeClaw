// Issue List Command - List issues for the authenticated agent's scope
// Staff/Manager: returns own department's issues
// CEO: returns all company departments' issues

import { Command } from "commander";
import { issues, subIssues } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq, inArray, ne, and, or, sql } from "drizzle-orm";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";

function normalizeIssueStatus(status: string): string {
  const lower = status.toLowerCase();
  if (lower === "inprogress") return "InProgress";
  if (lower === "cancelled") return "Cancelled";
  if (lower === "blocked") return "Blocked";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function registerListCommand(program: Command): void {
  const listCommand = new Command("list")
    .description("List issues");

  listCommand
    .option("--status <status>", "Filter by status: Open | InProgress | Blocked | Done | Cancelled")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      const { status, apiKey } = options;

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        const db = await getDb();

        // Default: filter out Done and Cancelled unless status is specified
        const excludedStatuses = status ? [] : ["Done", "Cancelled"];

        // Build where conditions
        const conditions = [];

        // Role-based filtering
        if (agentInfo.role !== "CEO") {
          // Staff/Manager can only see their own department's issues
          // We need to get the agent's departmentId first
          const { agents } = await import("@leclaw/db/schema");
          const [agent] = await db
            .select({ departmentId: agents.departmentId })
            .from(agents)
            .where(eq(agents.id, agentInfo.agentId))
            .limit(1);

          if (agent?.departmentId) {
            conditions.push(eq(issues.departmentId, agent.departmentId));
          } else {
            // No department assigned - return empty
            console.log(JSON.stringify({ success: true, issues: [] }, null, 2));
            return;
          }
        } else {
          // CEO sees all company issues
          conditions.push(eq(issues.companyId, agentInfo.companyId));
        }

        // Status filter
        if (status) {
          conditions.push(eq(issues.status, normalizeIssueStatus(status)));
        } else if (excludedStatuses.length > 0) {
          conditions.push(and(
            ...excludedStatuses.map(s => ne(issues.status, s))
          ));
        }

        // Query issues with sub-issue count
        const issueList = await db
          .select({
            id: issues.id,
            title: issues.title,
            status: issues.status,
            departmentId: issues.departmentId,
            createdAt: issues.createdAt,
          })
          .from(issues)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        // Get sub-issue counts for each issue
        const issueIds = issueList.map(i => i.id);
        const subIssueCounts = new Map<string, number>();

        if (issueIds.length > 0) {
          const counts = await db
            .select({
              parentIssueId: subIssues.parentIssueId,
              count: sql<number>`count(*)`.as("count"),
            })
            .from(subIssues)
            .where(inArray(subIssues.parentIssueId, issueIds))
            .groupBy(subIssues.parentIssueId);

          for (const c of counts) {
            subIssueCounts.set(c.parentIssueId, Number(c.count));
          }
        }

        const issuesWithCount = issueList.map(issue => ({
          ...issue,
          subIssuesCount: subIssueCounts.get(issue.id) ?? 0,
        }));

        console.log(JSON.stringify({
          success: true,
          issues: issuesWithCount,
        }, null, 2));
      } catch (err) {
        console.error(JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }, null, 2));
        process.exit(1);
      }
    });

  program.addCommand(listCommand);
}

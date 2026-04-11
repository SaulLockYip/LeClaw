// leclaw todo command
// Show sub-issues and pending approvals based on agent role

import { Command } from "commander";
import { db, subIssues, approvals, agents } from "@leclaw/db";
import { eq, and, inArray } from "drizzle-orm";
import { getAgentInfoFromApiKey } from "../helpers/api-key.js";
import type { AgentRole } from "@leclaw/shared";

export interface SubIssueEntry {
  id: string;
  parentIssueId: string;
  title: string;
  description: string | null;
  status: string;
  assigneeAgentId: string;
  createdAt: Date;
}

export interface ApprovalEntry {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  requester: string | null;
  createdAt: Date;
}

export interface TodoOutput {
  subIssues: SubIssueEntry[];
  pendingApprovals?: ApprovalEntry[];
}

async function getSubIssuesForAgent(agentId: string): Promise<SubIssueEntry[]> {
  const database = await db;
  const rows = await database
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
    .where(
      and(
        eq(subIssues.assigneeAgentId, agentId),
        inArray(subIssues.status, ["Open", "InProgress", "Blocked"])
      )
    );

  return rows;
}

async function getPendingApprovalsForApprover(approverId: string): Promise<ApprovalEntry[]> {
  const database = await db;
  const rows = await database
    .select({
      id: approvals.id,
      title: approvals.title,
      description: approvals.description,
      type: approvals.type,
      status: approvals.status,
      requester: approvals.requester,
      createdAt: approvals.createdAt,
    })
    .from(approvals)
    .where(
      and(
        eq(approvals.approverId, approverId),
        eq(approvals.status, "Pending"),
        eq(approvals.type, "agent_approve")
      )
    );

  return rows;
}

export function registerTodoCommand(program: Command): void {
  program
    .command("todo")
    .description("Show sub-issues assigned to you and pending approvals")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      const { apiKey } = options;

      try {
        // Get agent info from API key
        const agentInfo = await getAgentInfoFromApiKey(apiKey);

        // Get sub-issues assigned to this agent (Open/InProgress/Blocked only)
        const subIssuesList = await getSubIssuesForAgent(agentInfo.agentId);

        const output: TodoOutput = {
          subIssues: subIssuesList,
        };

        // Manager and CEO also see pending approvals assigned to them
        if (agentInfo.role === "Manager" || agentInfo.role === "CEO") {
          const pendingApprovals = await getPendingApprovalsForApprover(agentInfo.agentId);
          output.pendingApprovals = pendingApprovals;
        }

        console.log(JSON.stringify({
          success: true,
          role: agentInfo.role,
          ...output,
        }, null, 2));
      } catch (err) {
        console.error(JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }, null, 2));
        process.exit(1);
      }
    });
}

// leclaw todo command
// Show sub-issues and pending approvals based on agent role

import { Command } from "commander";
import { getAgentInfoFromApiKey } from "../helpers/api-key.js";
import { createApiClient, getCurrentAgent } from "../helpers/api-client.js";
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

async function getSubIssuesForAgent(
  apiClient: ReturnType<typeof createApiClient>,
  agentId: string
): Promise<SubIssueEntry[]> {
  const issues = await apiClient.getIssues();
  const allSubIssues: any[] = [];

  for (const issue of issues) {
    if (issue.subIssues && Array.isArray(issue.subIssues)) {
      allSubIssues.push(...issue.subIssues);
    }
  }

  return allSubIssues.filter(
    (si: any) =>
      si.assigneeAgentId === agentId &&
      ["Open", "InProgress", "Blocked"].includes(si.status)
  ) as SubIssueEntry[];
}

async function getPendingApprovalsForApprover(
  apiClient: ReturnType<typeof createApiClient>,
  approverId: string
): Promise<ApprovalEntry[]> {
  const approvals = await apiClient.getApprovals({ status: "Pending", mine: true });
  return approvals.filter(
    (a: any) => a.approverId === approverId && a.type === "agent_approve"
  ) as ApprovalEntry[];
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
        const agentData = await getCurrentAgent(apiKey);
        const companyId = agentData.companyId;

        const apiClient = createApiClient({ apiKey, companyId });

        // Get sub-issues assigned to this agent (Open/InProgress/Blocked only)
        const subIssuesList = await getSubIssuesForAgent(apiClient, agentInfo.agentId);

        const output: TodoOutput = {
          subIssues: subIssuesList,
        };

        // Manager and CEO also see pending approvals assigned to them
        if (agentInfo.role === "Manager" || agentInfo.role === "CEO") {
          const pendingApprovals = await getPendingApprovalsForApprover(apiClient, agentInfo.agentId);
          output.pendingApprovals = pendingApprovals;
        }

        console.log(JSON.stringify({
          success: true,
          role: agentInfo.role,
          ...output,
        }, null, 2));
        process.exit(0);
      } catch (err) {
        console.error(JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }, null, 2));
        process.exit(1);
      }
    });
}

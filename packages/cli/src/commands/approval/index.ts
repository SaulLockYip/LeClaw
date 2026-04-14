// Approval Commands - List, request, approve, and reject approvals

import { Command } from "commander";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

export function registerApprovalCommand(program: Command): void {
  const approvalCommand = new Command("approval")
    .description("Manage approvals");

  // approval request - Submit an approval request
  approvalCommand
    .command("request")
    .description("Submit an approval request")
    .requiredOption("--title <title>", "Approval request title")
    .requiredOption("--description <desc>", "Approval request description")
    .requiredOption("--type <type>", "Approval type", /^(human_approve|agent_approve)$/)
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { title, description, type, apiKey } = options;

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);

        // Determine approverId based on type and requester role
        // Note: Server handles finding approver internally for agent_approve
        let approverId: string | undefined;

        if (type === "agent_approve") {
          // CEO doesn't need an approver for agent_approve
          if (agentInfo.role === "CEO") {
            console.error(JSON.stringify({
              success: false,
              error: "CEO does not need approval for agent_approve",
            }, null, 2));
            process.exit(1);
          }
        }

        if (type === "human_approve") {
          // CEO doesn't need human_approve
          if (agentInfo.role === "CEO") {
            console.error(JSON.stringify({
              success: false,
              error: "CEO does not need human_approve",
            }, null, 2));
            process.exit(1);
          }
        }

        const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });

        // Note: For both agent_approve and human_approve, the server handles
        // finding the approver internally via findApproverForAgent
        const approval = await apiClient.createApproval({ title, description, type, approverId });

        console.log(JSON.stringify({
          success: true,
          approval: {
            id: approval.id,
            companyId: approval.companyId,
            title: approval.title,
            description: approval.description,
            requester: approval.requester,
            type: approval.type,
            approverId: approval.approverId,
            status: approval.status,
            createdAt: approval.createdAt,
            updatedAt: approval.updatedAt,
          },
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

  // approval list - List approvals pending my approval (default) or submitted by me (--mine)
  approvalCommand
    .command("list")
    .description("List approvals pending my approval (default) or my submissions (--mine)")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .option("--status <status>", "Filter by status", /^(Pending|Approved|Rejected)$/)
    .option("--mine", "Show approvals I submitted instead of approvals pending my approval")
    .action(async (options) => {
      const { apiKey, status, mine } = options;

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
        // Default to showing pending approvals (where user is approver) when --mine is not specified
        const approvalList = await apiClient.getApprovals({ status, mine: mine ?? true });

        console.log(JSON.stringify({
          success: true,
          approvals: approvalList,
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

  // approval show - Show a specific approval
  approvalCommand
    .command("show")
    .description("Show a specific approval")
    .requiredOption("--approval-id <id>", "Approval ID")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { approvalId, apiKey } = options;

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
        const approval = await apiClient.getApproval(approvalId);

        if (!approval) {
          console.error(JSON.stringify({
            success: false,
            error: `Approval not found: ${approvalId}`,
          }, null, 2));
          process.exit(1);
        }

        // Verify the approval belongs to the same company
        if (approval.companyId !== agentInfo.companyId) {
          console.error(JSON.stringify({
            success: false,
            error: "Access denied: Approval not found",
          }, null, 2));
          process.exit(1);
        }

        console.log(JSON.stringify({
          success: true,
          approval,
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

  // approval approve - Approve an approval (Manager/CEO only)
  approvalCommand
    .command("approve")
    .description("Approve an approval (Manager/CEO only)")
    .requiredOption("--approval-id <id>", "Approval ID")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .option("--message <text>", "Approval message")
    .action(async (options) => {
      const { approvalId, apiKey, message } = options;

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);

        // Role guard: only Manager or CEO
        if (agentInfo.role !== "Manager" && agentInfo.role !== "CEO") {
          console.error(JSON.stringify({
            success: false,
            error: "Only Manager or CEO can approve approvals",
          }, null, 2));
          process.exit(1);
        }

        const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
        const updatedApproval = await apiClient.approveApproval(approvalId, message);

        console.log(JSON.stringify({
          success: true,
          approval: {
            id: updatedApproval.id,
            companyId: updatedApproval.companyId,
            title: updatedApproval.title,
            description: updatedApproval.description,
            requester: updatedApproval.requester,
            type: updatedApproval.type,
            approverId: updatedApproval.approverId,
            status: updatedApproval.status,
            message: updatedApproval.message,
            createdAt: updatedApproval.createdAt,
            updatedAt: updatedApproval.updatedAt,
          },
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

  // approval reject - Reject an approval (Manager/CEO only)
  approvalCommand
    .command("reject")
    .description("Reject an approval (Manager/CEO only)")
    .requiredOption("--approval-id <id>", "Approval ID")
    .option("--message <text>", "Rejection message")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { approvalId, message, apiKey } = options;

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);

        // Role guard: only Manager or CEO
        if (agentInfo.role !== "Manager" && agentInfo.role !== "CEO") {
          console.error(JSON.stringify({
            success: false,
            error: "Only Manager or CEO can reject approvals",
          }, null, 2));
          process.exit(1);
        }

        const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
        const updatedApproval = await apiClient.rejectApproval(approvalId, message || "");

        console.log(JSON.stringify({
          success: true,
          approval: {
            id: updatedApproval.id,
            companyId: updatedApproval.companyId,
            title: updatedApproval.title,
            description: updatedApproval.description,
            requester: updatedApproval.requester,
            type: updatedApproval.type,
            approverId: updatedApproval.approverId,
            status: updatedApproval.status,
            message: updatedApproval.message,
            createdAt: updatedApproval.createdAt,
            updatedAt: updatedApproval.updatedAt,
          },
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

  // approval forward - Forward an approval to CEO (Manager only)
  approvalCommand
    .command("forward")
    .description("Forward an approval to CEO (Manager only)")
    .requiredOption("--approval-id <id>", "Approval ID")
    .option("--message <text>", "Reason for forwarding")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { approvalId, message, apiKey } = options;

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);

        // Role guard: only Manager can forward
        if (agentInfo.role !== "Manager") {
          console.error(JSON.stringify({
            success: false,
            error: "Only Manager can forward approvals to CEO",
          }, null, 2));
          process.exit(1);
        }

        const apiClient = createApiClient({ apiKey, companyId: agentInfo.companyId });
        const updatedApproval = await apiClient.forwardApproval(approvalId, message);

        console.log(JSON.stringify({
          success: true,
          approval: {
            id: updatedApproval.id,
            companyId: updatedApproval.companyId,
            title: updatedApproval.title,
            description: updatedApproval.description,
            requester: updatedApproval.requester,
            type: updatedApproval.type,
            approverId: updatedApproval.approverId,
            status: updatedApproval.status,
            message: updatedApproval.message,
            createdAt: updatedApproval.createdAt,
            updatedAt: updatedApproval.updatedAt,
          },
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

  program.addCommand(approvalCommand);
}
// Approval Commands - List, request, approve, and reject approvals

import { Command } from "commander";
import { approvals, agents } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq, and } from "drizzle-orm";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import type { ApprovalStatus, ApprovalType, AgentRole } from "@leclaw/shared";

/**
 * Find the approver for an agent based on their role and approval type
 * Routing logic:
 * - Staff + agent_approve -> Manager
 * - Manager + agent_approve -> CEO
 * - CEO + agent_approve -> no approver needed (error)
 */
async function findApproverForAgent(agentId: string, companyId: string, role: AgentRole): Promise<string | null> {
  const db = await getDb();

  if (role === "CEO") {
    return null;
  }

  if (role === "Staff") {
    // Find the Manager in the same department
    const [agent] = await db
      .select({ departmentId: agents.departmentId })
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (agent?.departmentId) {
      const [manager] = await db
        .select({ id: agents.id })
        .from(agents)
        .where(and(
          eq(agents.companyId, companyId),
          eq(agents.departmentId, agent.departmentId),
          eq(agents.role, "Manager" as AgentRole)
        ))
        .limit(1);
      return manager?.id ?? null;
    }
    // If no department, find any Manager in the company
    const [manager] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(
        eq(agents.companyId, companyId),
        eq(agents.role, "Manager" as AgentRole)
      ))
      .limit(1);
    return manager?.id ?? null;
  }

  if (role === "Manager") {
    // Find the CEO in the company
    const [ceo] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(
        eq(agents.companyId, companyId),
        eq(agents.role, "CEO" as AgentRole)
      ))
      .limit(1);
    return ceo?.id ?? null;
  }

  return null;
}

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
        const db = await getDb();

        // Determine approverId based on type and requester role
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
          const foundApprover = await findApproverForAgent(agentInfo.agentId, agentInfo.companyId, agentInfo.role);
          if (!foundApprover) {
            console.error(JSON.stringify({
              success: false,
              error: "Could not find an approver for this request",
            }, null, 2));
            process.exit(1);
          }
          approverId = foundApprover;
        }

        // Create the approval
        const [approval] = await db.insert(approvals).values({
          companyId: agentInfo.companyId,
          title,
          description,
          requester: agentInfo.agentId,
          type: type as ApprovalType,
          approverId,
          status: "Pending" as ApprovalStatus,
        } as any).returning();

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
      } catch (err) {
        console.error(JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }, null, 2));
        process.exit(1);
      }
    });

  // approval list - List approvals submitted by me
  approvalCommand
    .command("list")
    .description("List approvals submitted by me")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .option("--status <status>", "Filter by status", /^(Pending|Approved|Rejected)$/)
    .action(async (options) => {
      const { apiKey, status } = options;

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        const db = await getDb();

        // Build conditions: requester = me, companyId = my company
        const conditions = [
          eq(approvals.requester, agentInfo.agentId),
          eq(approvals.companyId, agentInfo.companyId),
        ];

        if (status) {
          conditions.push(eq(approvals.status, status as ApprovalStatus) as any);
        }

        const approvalList = await db
          .select({
            id: approvals.id,
            companyId: approvals.companyId,
            title: approvals.title,
            description: approvals.description,
            requester: approvals.requester,
            type: approvals.type,
            approverId: approvals.approverId,
            status: approvals.status,
            createdAt: approvals.createdAt,
            updatedAt: approvals.updatedAt,
          })
          .from(approvals)
          .where(and(...conditions));

        console.log(JSON.stringify({
          success: true,
          approvals: approvalList,
        }, null, 2));
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
        const db = await getDb();

        const [approval] = await db
          .select({
            id: approvals.id,
            companyId: approvals.companyId,
            title: approvals.title,
            description: approvals.description,
            requester: approvals.requester,
            type: approvals.type,
            approverId: approvals.approverId,
            status: approvals.status,
            rejectMessage: approvals.rejectMessage,
            createdAt: approvals.createdAt,
            updatedAt: approvals.updatedAt,
          })
          .from(approvals)
          .where(eq(approvals.id, approvalId))
          .limit(1);

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
    .action(async (options) => {
      const { approvalId, apiKey } = options;

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        const db = await getDb();

        // Role guard: only Manager or CEO
        if (agentInfo.role !== "Manager" && agentInfo.role !== "CEO") {
          console.error(JSON.stringify({
            success: false,
            error: "Only Manager or CEO can approve approvals",
          }, null, 2));
          process.exit(1);
        }

        // Get the approval first
        const [existingApproval] = await db
          .select()
          .from(approvals)
          .where(eq(approvals.id, approvalId))
          .limit(1);

        if (!existingApproval) {
          console.error(JSON.stringify({
            success: false,
            error: `Approval not found: ${approvalId}`,
          }, null, 2));
          process.exit(1);
        }

        // Verify the approval belongs to the same company
        if (existingApproval.companyId !== agentInfo.companyId) {
          console.error(JSON.stringify({
            success: false,
            error: "Access denied: Approval not found",
          }, null, 2));
          process.exit(1);
        }

        // Check if approval is pending
        if (existingApproval.status !== "Pending") {
          console.error(JSON.stringify({
            success: false,
            error: "Approval is not pending",
          }, null, 2));
          process.exit(1);
        }

        // Verify the approver is the authenticated agent
        if (existingApproval.approverId !== agentInfo.agentId) {
          console.error(JSON.stringify({
            success: false,
            error: "You are not the assigned approver for this approval",
          }, null, 2));
          process.exit(1);
        }

        // Update the approval
        const [updatedApproval] = await db
          .update(approvals)
          .set({ status: "Approved" as ApprovalStatus, updatedAt: new Date() } as any)
          .where(eq(approvals.id, approvalId))
          .returning();

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
            createdAt: updatedApproval.createdAt,
            updatedAt: updatedApproval.updatedAt,
          },
        }, null, 2));
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
    .requiredOption("--message <text>", "Rejection message")
    .requiredOption("--api-key <key>", "Agent API key (for authentication)")
    .action(async (options) => {
      const { approvalId, message, apiKey } = options;

      try {
        const agentInfo = await getAgentInfoFromApiKey(apiKey);
        const db = await getDb();

        // Role guard: only Manager or CEO
        if (agentInfo.role !== "Manager" && agentInfo.role !== "CEO") {
          console.error(JSON.stringify({
            success: false,
            error: "Only Manager or CEO can reject approvals",
          }, null, 2));
          process.exit(1);
        }

        // Get the approval first
        const [existingApproval] = await db
          .select()
          .from(approvals)
          .where(eq(approvals.id, approvalId))
          .limit(1);

        if (!existingApproval) {
          console.error(JSON.stringify({
            success: false,
            error: `Approval not found: ${approvalId}`,
          }, null, 2));
          process.exit(1);
        }

        // Verify the approval belongs to the same company
        if (existingApproval.companyId !== agentInfo.companyId) {
          console.error(JSON.stringify({
            success: false,
            error: "Access denied: Approval not found",
          }, null, 2));
          process.exit(1);
        }

        // Check if approval is pending
        if (existingApproval.status !== "Pending") {
          console.error(JSON.stringify({
            success: false,
            error: "Approval is not pending",
          }, null, 2));
          process.exit(1);
        }

        // Verify the approver is the authenticated agent
        if (existingApproval.approverId !== agentInfo.agentId) {
          console.error(JSON.stringify({
            success: false,
            error: "You are not the assigned approver for this approval",
          }, null, 2));
          process.exit(1);
        }

        // Update the approval
        const [updatedApproval] = await db
          .update(approvals)
          .set({ status: "Rejected" as ApprovalStatus, rejectMessage: message, updatedAt: new Date() } as any)
          .where(eq(approvals.id, approvalId))
          .returning();

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
            rejectMessage: updatedApproval.rejectMessage,
            createdAt: updatedApproval.createdAt,
            updatedAt: updatedApproval.updatedAt,
          },
        }, null, 2));
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

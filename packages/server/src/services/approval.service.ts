import { eq, and } from "drizzle-orm";
import { approvals, agents } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import type { Approval, ApprovalStatus, ApprovalType, AgentRole } from "@leclaw/shared";

export interface CreateApprovalInput {
  title: string;
  description?: string;
  requesterAgentId?: string;
  type?: ApprovalType;
  approverId?: string;
  companyId: string;
}

export interface UpdateApprovalInput {
  status?: ApprovalStatus;
  message?: string;
  approverId?: string;
}

export async function listApprovalsByCompany(companyId: string): Promise<Approval[]> {
  const db = await getDb();
  const rows = await db.select().from(approvals).where(eq(approvals.companyId, companyId));
  return rows.map(row => ({
    ...row,
    status: row.status as ApprovalStatus,
    type: row.type as ApprovalType,
  }));
}

export async function listApprovalsByRequester(requesterAgentId: string, companyId: string, status?: ApprovalStatus): Promise<Approval[]> {
  const db = await getDb();
  const conditions = [eq(approvals.requester, requesterAgentId), eq(approvals.companyId, companyId)];
  if (status) {
    conditions.push(eq(approvals.status, status) as any);
  }
  const rows = await db.select().from(approvals).where(and(...conditions));
  return rows.map(row => ({
    ...row,
    status: row.status as ApprovalStatus,
    type: row.type as ApprovalType,
  }));
}

/**
 * Find the approver for an agent based on their role and approval type
 * Routing logic:
 * - Staff + agent_approve -> Manager
 * - Manager + agent_approve -> CEO
 * - CEO + agent_approve -> no approver needed (error)
 * - human_approve -> no approverId set (UI handles it)
 */
export async function findApproverForAgent(agentId: string, companyId: string): Promise<string | null> {
  const db = await getDb();

  // Get the agent's role
  const [agent] = await db
    .select({ id: agents.id, role: agents.role, departmentId: agents.departmentId })
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!agent) {
    throw new Error("Agent not found");
  }

  // If CEO, no approver needed for agent_approve
  if (agent.role === "CEO") {
    return null;
  }

  // Find the approver based on role
  if (agent.role === "Staff") {
    // Find the Manager in the same department
    if (agent.departmentId) {
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

  if (agent.role === "Manager") {
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

export async function getApproval(id: string): Promise<Approval | null> {
  const db = await getDb();
  const result = await db.select().from(approvals).where(eq(approvals.id, id));
  if (!result[0]) return null;
  return {
    ...result[0],
    status: result[0].status as ApprovalStatus,
    type: result[0].type as ApprovalType,
  };
}

export async function createApproval(input: CreateApprovalInput): Promise<Approval> {
  const db = await getDb();

  const [approval] = await db.insert(approvals).values({
    companyId: input.companyId,
    title: input.title,
    description: input.description ?? null,
    requester: input.requesterAgentId ?? null,
    type: input.type ?? "human_approve",
    approverId: input.approverId ?? null,
    status: "Pending",
  } as any).returning();

  return {
    ...approval,
    status: approval.status as ApprovalStatus,
    type: approval.type as ApprovalType,
  };
}

export async function updateApproval(id: string, input: UpdateApprovalInput): Promise<Approval | null> {
  const db = await getDb();
  const [approval] = await db.update(approvals)
    .set({ status: input.status, message: input.message ?? undefined, approverId: input.approverId ?? undefined, updatedAt: new Date() } as any)
    .where(eq(approvals.id, id))
    .returning();

  if (!approval) return null;
  return {
    ...approval,
    status: approval.status as ApprovalStatus,
    type: approval.type as ApprovalType,
  };
}

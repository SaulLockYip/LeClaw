import { eq, and, or } from "drizzle-orm";
import { agents, agentInvites, approvals } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { generateApiKey } from "@leclaw/shared/api-key";
import type { Agent, AgentRole, AgentSyncStatus } from "@leclaw/shared";

export interface VerifyApiKeyResult {
  agentId: string;
  companyId: string;
  role: AgentRole;
}

export interface CreateAgentInput {
  name: string;
  title?: string;
  role: "CEO" | "Manager" | "Staff";
  departmentId?: string;
  openClawAgentId?: string;
  openClawAgentWorkspace?: string;
  openClawAgentDir?: string;
}

export interface UpdateAgentInput {
  name?: string;
  title?: string;
}

export interface CreateAgentResult {
  agent: Agent;
  apiKey: string; // The plaintext API key (only returned once)
}

export async function createAgent(
  companyId: string,
  input: CreateAgentInput
): Promise<CreateAgentResult> {
  const db = await getDb();

  const [agent] = await db.insert(agents).values({
    companyId,
    name: input.name,
    title: input.title,
    role: input.role,
    departmentId: input.departmentId || null,
    openClawAgentId: input.openClawAgentId,
    openClawAgentWorkspace: input.openClawAgentWorkspace,
    openClawAgentDir: input.openClawAgentDir,
  } as any).returning();

  // Generate API key using the agent's UUID id
  const apiKey = generateApiKey(agent.id);

  // Store API key directly on the agent record
  await db.update(agents).set({ agentApiKey: apiKey.fullKey } as any).where(eq(agents.id, agent.id));

  return {
    agent: { ...agent, role: agent.role as AgentRole, status: (agent.status as AgentSyncStatus) ?? "unknown" },
    apiKey: apiKey.fullKey,
  };
}

export async function listAgentsByCompany(companyId: string): Promise<Agent[]> {
  const db = await getDb();
  const rows = await db.select().from(agents).where(eq(agents.companyId, companyId));
  return rows.map(row => ({ ...row, role: row.role as AgentRole, status: (row.status as AgentSyncStatus) ?? "unknown" }));
}

export async function getAgent(id: string, companyId: string): Promise<Agent | null> {
  const db = await getDb();
  const result = await db.select().from(agents)
    .where(and(eq(agents.id, id), eq(agents.companyId, companyId)));
  if (!result[0]) return null;
  return { ...result[0], role: result[0].role as AgentRole, status: (result[0].status as AgentSyncStatus) ?? "unknown" };
}

export async function updateAgent(
  id: string,
  companyId: string,
  input: UpdateAgentInput
): Promise<Agent | null> {
  const db = await getDb();
  const [agent] = await db.update(agents)
    .set({ name: input.name, title: input.title, updatedAt: new Date() } as any)
    .where(and(eq(agents.id, id), eq(agents.companyId, companyId)))
    .returning();

  if (!agent) return null;
  return { ...agent, role: agent.role as AgentRole, status: (agent.status as AgentSyncStatus) ?? "unknown" };
}

export async function findAgentByOpenClawAgentId(openClawAgentId: string): Promise<Agent | null> {
  const db = await getDb();
  const [agent] = await db.select().from(agents)
    .where(eq(agents.openClawAgentId, openClawAgentId))
    .limit(1);
  if (!agent) return null;
  return { ...agent, role: agent.role as AgentRole, status: (agent.status as AgentSyncStatus) ?? "unknown" };
}

export async function deleteAgent(
  id: string,
  companyId: string
): Promise<boolean> {
  const db = await getDb();

  // First, get the agent to find its openClawAgentId
  const [agent] = await db.select({ openClawAgentId: agents.openClawAgentId })
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.companyId, companyId)))
    .limit(1);

  if (!agent) {
    return false;
  }

  // If agent has an openClawAgentId, clear it in the corresponding invite
  // This frees up the OpenClaw agent slot so it can be re-invited
  if (agent.openClawAgentId) {
    await db.update(agentInvites)
      .set({ openClawAgentId: null } as any)
      .where(eq(agentInvites.openClawAgentId, agent.openClawAgentId));
  }

  // Delete related approvals (where agent is requester or approver)
  await db.delete(approvals)
    .where(or(
      eq(approvals.requester, id),
      eq(approvals.approverId, id)
    ));

  // Now delete the agent
  const [deleted] = await db.delete(agents)
    .where(and(eq(agents.id, id), eq(agents.companyId, companyId)))
    .returning();

  return !!deleted;
}

/**
 * Verify an API key and return agent info (id, companyId, role)
 * @param apiKey - The full API key (sk-xxx format)
 * @returns Agent info if valid, throws if invalid
 */
export async function verifyApiKey(apiKey: string): Promise<VerifyApiKeyResult> {
  const db = await getDb();

  // Look up agent directly by agentApiKey
  const [agentRecord] = await db
    .select({ id: agents.id, companyId: agents.companyId, role: agents.role })
    .from(agents)
    .where(eq(agents.agentApiKey, apiKey))
    .limit(1);

  if (!agentRecord) {
    throw new Error("Invalid API key");
  }

  return {
    agentId: agentRecord.id,
    companyId: agentRecord.companyId,
    role: agentRecord.role as AgentRole,
  };
}

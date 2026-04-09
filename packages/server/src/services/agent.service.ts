import { eq, and } from "drizzle-orm";
import { agents, agentApiKeys } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { generateApiKey } from "@leclaw/shared/api-key";
import type { Agent, AgentRole } from "@leclaw/shared";

export interface CreateAgentInput {
  name: string;
  role: "CEO" | "Manager" | "Staff";
  departmentId?: string;
  openClawAgentId?: string;
  openClawAgentWorkspace?: string;
  openClawAgentDir?: string;
}

export interface UpdateAgentInput {
  name?: string;
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
    role: input.role,
    departmentId: input.departmentId || null,
    openClawAgentId: input.openClawAgentId,
    openClawAgentWorkspace: input.openClawAgentWorkspace,
    openClawAgentDir: input.openClawAgentDir,
  } as any).returning();

  // Generate API key using the agent's UUID id
  const apiKey = generateApiKey(agent.id);

  // Create the API key record
  await db.insert(agentApiKeys).values({
    agentId: agent.id,
    companyId,
    name: input.name,
    key: apiKey.fullKey,
    keyHash: apiKey.keyHash,
    createdAt: new Date(),
  } as any);

  return {
    agent: { ...agent, role: agent.role as AgentRole },
    apiKey: apiKey.fullKey,
  };
}

export async function listAgentsByCompany(companyId: string): Promise<Agent[]> {
  const db = await getDb();
  const rows = await db.select().from(agents).where(eq(agents.companyId, companyId));
  return rows.map(row => ({ ...row, role: row.role as AgentRole }));
}

export async function getAgent(id: string, companyId: string): Promise<Agent | null> {
  const db = await getDb();
  const result = await db.select().from(agents)
    .where(and(eq(agents.id, id), eq(agents.companyId, companyId)));
  if (!result[0]) return null;
  return { ...result[0], role: result[0].role as AgentRole };
}

export async function updateAgent(
  id: string,
  companyId: string,
  input: UpdateAgentInput
): Promise<Agent | null> {
  const db = await getDb();
  const [agent] = await db.update(agents)
    .set({ name: input.name, updatedAt: new Date() } as any)
    .where(and(eq(agents.id, id), eq(agents.companyId, companyId)))
    .returning();

  if (!agent) return null;
  return { ...agent, role: agent.role as AgentRole };
}

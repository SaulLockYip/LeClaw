import { eq, and } from "drizzle-orm";
import { agents } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import type { Agent } from "@leclaw/shared";

export interface UpdateAgentInput {
  name?: string;
}

export async function listAgentsByCompany(companyId: string): Promise<Agent[]> {
  const db = await getDb();
  return await db.select().from(agents).where(eq(agents.companyId, companyId));
}

export async function getAgent(id: string, companyId: string): Promise<Agent | null> {
  const db = await getDb();
  const result = await db.select().from(agents)
    .where(and(eq(agents.id, id), eq(agents.companyId, companyId)));
  return result[0] ?? null;
}

export async function updateAgent(
  id: string,
  companyId: string,
  input: UpdateAgentInput
): Promise<Agent | null> {
  const db = await getDb();
  const [agent] = await db.update(agents)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(agents.id, id), eq(agents.companyId, companyId)))
    .returning();

  return agent ?? null;
}
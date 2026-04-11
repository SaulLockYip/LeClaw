// API Key Helper - Extract agentId from API key
// Format: sk-{32-hex-chars}
// Looks up the key by its hash in the database

import { agentApiKeys, agents } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq } from "drizzle-orm";
import { hashApiKey, parseApiKey } from "@leclaw/shared/api-key";
import type { AgentRole } from "@leclaw/shared";

export interface AgentInfo {
  agentId: string;
  companyId: string;
  role: AgentRole;
  departmentId: string;
}

/**
 * Get agentId from an API key
 * Throws error if the key is invalid or not found
 */
export async function getAgentIdFromApiKey(apiKey: string): Promise<string> {
  const info = await getAgentInfoFromApiKey(apiKey);
  return info.agentId;
}

/**
 * Get full agent info from an API key (id, companyId, role)
 * Throws error if the key is invalid or not found
 */
export async function getAgentInfoFromApiKey(apiKey: string): Promise<AgentInfo> {
  const parsed = parseApiKey(apiKey);

  if (!parsed) {
    throw new Error("Invalid API key format");
  }

  // Hash the provided key to look it up
  const keyHash = hashApiKey(apiKey);

  const db = await getDb();

  // Look up by keyHash to find the agentId and companyId
  const [keyRecord] = await db
    .select({ agentId: agentApiKeys.agentId, companyId: agentApiKeys.companyId })
    .from(agentApiKeys)
    .where(eq(agentApiKeys.keyHash, keyHash))
    .limit(1);

  if (!keyRecord) {
    throw new Error("Invalid API key");
  }

  // Get agent role and department
  const [agentRecord] = await db
    .select({ id: agents.id, companyId: agents.companyId, role: agents.role, departmentId: agents.departmentId })
    .from(agents)
    .where(eq(agents.id, keyRecord.agentId))
    .limit(1);

  if (!agentRecord) {
    throw new Error("Agent not found");
  }

  // Update lastUsedAt timestamp
  await db
    .update(agentApiKeys)
    .set({ lastUsedAt: new Date() } as any)
    .where(eq(agentApiKeys.agentId, keyRecord.agentId));

  return {
    agentId: agentRecord.id,
    companyId: agentRecord.companyId,
    role: agentRecord.role as AgentRole,
    departmentId: agentRecord.departmentId,
  };
}

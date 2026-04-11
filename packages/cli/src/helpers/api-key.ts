// API Key Helper - Extract agentId from API key
// Format: sk-{32-hex-chars}
// Looks up the key directly from agents.agentApiKey

import { agents } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq } from "drizzle-orm";
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
  const db = await getDb();

  // Look up by agentApiKey directly
  const [agentRecord] = await db
    .select({ id: agents.id, companyId: agents.companyId, role: agents.role, departmentId: agents.departmentId })
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
    departmentId: agentRecord.departmentId,
  };
}

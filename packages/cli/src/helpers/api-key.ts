// API Key Helper - Extract agentId from API key
// Format: sk-{32-hex-chars}
// Looks up the key by its hash in the database

import { agentApiKeys } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq } from "drizzle-orm";
import { hashApiKey, parseApiKey } from "@leclaw/shared/api-key";

/**
 * Get agentId from an API key
 * Throws error if the key is invalid or not found
 */
export async function getAgentIdFromApiKey(apiKey: string): Promise<string> {
  const parsed = parseApiKey(apiKey);

  if (!parsed) {
    throw new Error("Invalid API key format");
  }

  // Hash the provided key to look it up
  const keyHash = hashApiKey(apiKey);

  const db = await getDb();

  // Look up by keyHash to find the agentId
  const [keyRecord] = await db
    .select({ agentId: agentApiKeys.agentId })
    .from(agentApiKeys)
    .where(eq(agentApiKeys.keyHash, keyHash))
    .limit(1);

  if (!keyRecord) {
    throw new Error("Invalid API key");
  }

  // Update lastUsedAt timestamp
  await db
    .update(agentApiKeys)
    .set({ lastUsedAt: new Date() } as any)
    .where(eq(agentApiKeys.agentId, keyRecord.agentId));

  return keyRecord.agentId;
}

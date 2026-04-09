// API Key Generation and Management
// Format: sk-{32-hex-chars}
// The full key is returned once on creation and cannot be recovered.
// Only a hash is stored for verification.

import { createHash, randomBytes } from "node:crypto";

const KEY_PREFIX = "sk-";
const KEY_LENGTH = 32; // 16 bytes = 32 hex chars

export interface ApiKey {
  fullKey: string; // Plaintext key (sk-xxx), returned once on creation
  keyHash: string; // SHA256 hash of the full key (stored in DB)
  agentId: string;
}

/**
 * Generate a new API key for an agent
 * Format: sk-{32-hex-chars}
 */
export function generateApiKey(agentId: string): ApiKey {
  const hexChars = randomBytes(16).toString("hex");
  const fullKey = `${KEY_PREFIX}${hexChars}`;
  const keyHash = hashApiKey(fullKey);

  return {
    fullKey,
    keyHash,
    agentId,
  };
}

/**
 * Hash an API key using SHA256
 * Returns first 16 chars of the hex-encoded hash
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex").slice(0, 16);
}

/**
 * Extract the key part from a full API key (sk-xxx -> xxx)
 */
export function parseApiKey(fullKey: string): { key: string; prefix: string } | null {
  if (!fullKey.startsWith(KEY_PREFIX)) {
    return null;
  }
  const key = fullKey.slice(KEY_PREFIX.length);
  if (key.length !== KEY_LENGTH) {
    return null;
  }
  return { key, prefix: KEY_PREFIX };
}

/**
 * Verify a plain key against a stored hash
 */
export function verifyApiKey(fullKey: string, keyHash: string): boolean {
  const computedHash = hashApiKey(fullKey);
  return computedHash === keyHash;
}

// Agent Status Reader
// Reads agent status from OpenClaw local files (NOT HTTP polling to Gateway)

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { loadConfig } from "./config/io.js";

export type AgentStatus = "online" | "busy" | "offline" | "unknown";

interface SessionFile {
  id?: string;
  agentId?: string;
  status?: string;
  lastActivity?: string;
  startedAt?: string;
  [key: string]: unknown;
}

interface SessionsJson {
  sessions?: SessionFile[];
  [key: string]: unknown;
}

function getDefaultConfigPath(): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
  return join(home, ".leclaw", "config.json");
}

function resolveOpenClawHomePath(): string {
  const config = loadConfig({ configPath: getDefaultConfigPath() });
  return config.openclaw?.dir?.trim() || join(homedir(), ".openclaw");
}

function resolveOpenClawConfigPath(): string {
  const explicit = process.env.OPENCLAW_CONFIG_PATH?.trim();
  if (explicit) return explicit;
  return join(resolveOpenClawHomePath(), "openclaw.json");
}

function resolveAgentSessionPath(agentId: string): string {
  return join(resolveOpenClawHomePath(), "agents", agentId, "sessions", "sessions.json");
}

function isFsNotFound(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string" &&
      (error as { code: string }).code === "ENOENT",
  );
}

function asObject(input: unknown): Record<string, unknown> | undefined {
  return input !== null && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : undefined;
}

function asArray(input: unknown): unknown[] {
  return Array.isArray(input) ? input : [];
}

function asString(input: unknown): string | undefined {
  return typeof input === "string" ? input : undefined;
}

/**
 * Determine agent status from session data
 * - "online" if active session exists (status is "active" or "busy")
 * - "busy" if session exists but has been idle > 5 minutes
 * - "offline" if no session found
 * - "unknown" if session file exists but couldn't be parsed
 */
function determineStatus(sessionData: SessionsJson | null, lastActivity: Date | null): AgentStatus {
  if (!sessionData || !Array.isArray(sessionData.sessions) || sessionData.sessions.length === 0) {
    return "offline";
  }

  // Find the most recent active session
  const activeSession = sessionData.sessions.find(s => {
    const status = asString(s.status)?.toLowerCase();
    return status === "active" || status === "busy";
  });

  if (!activeSession) {
    return "offline";
  }

  // Check if session has recent activity (within 5 minutes)
  if (lastActivity) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (lastActivity > fiveMinutesAgo) {
      const status = asString(activeSession.status)?.toLowerCase();
      return status === "busy" ? "busy" : "online";
    }
    return "busy";
  }

  return "online";
}

/**
 * Get last activity timestamp from session file
 */
function getLastActivity(sessionData: SessionsJson | null): Date | null {
  if (!sessionData || !Array.isArray(sessionData.sessions) || sessionData.sessions.length === 0) {
    return null;
  }

  // Find the most recent active session
  const activeSession = sessionData.sessions.find(s => {
    const status = asString(s.status)?.toLowerCase();
    return status === "active" || status === "busy";
  });

  if (!activeSession) {
    return null;
  }

  const lastActivityStr = asString(activeSession.lastActivity);
  if (lastActivityStr) {
    const parsed = new Date(lastActivityStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const startedAtStr = asString(activeSession.startedAt);
  if (startedAtStr) {
    const parsed = new Date(startedAtStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

export interface AgentStatusResult {
  status: AgentStatus;
  lastHeartbeatAt: Date | null;
}

/**
 * Get agent status from local OpenClaw files
 * Returns "offline" if OpenClaw dir not found (graceful degradation)
 * Returns "unknown" if session file exists but couldn't be parsed
 */
export async function getAgentStatusFromFiles(agentId: string): Promise<AgentStatusResult> {
  const sessionPath = resolveAgentSessionPath(agentId);

  try {
    if (!existsSync(sessionPath)) {
      return { status: "offline", lastHeartbeatAt: null };
    }

    const raw = readFileSync(sessionPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const sessionData = asObject(parsed) as SessionsJson | undefined;
    const lastActivity = getLastActivity(sessionData ?? null);
    const status = determineStatus(sessionData ?? null, lastActivity);

    return { status, lastHeartbeatAt: lastActivity };
  } catch (error) {
    if (isFsNotFound(error)) {
      return { status: "offline", lastHeartbeatAt: null };
    }
    // Session file exists but couldn't be parsed
    return { status: "unknown", lastHeartbeatAt: null };
  }
}

/**
 * Scan all agent session files and return status for each
 * Used by sync service to bulk update all agents at once
 */
export async function scanAllAgentStatuses(
  agentIds: string[]
): Promise<Map<string, AgentStatusResult>> {
  const results = new Map<string, AgentStatusResult>();

  await Promise.all(
    agentIds.map(async (agentId) => {
      const result = await getAgentStatusFromFiles(agentId);
      results.set(agentId, result);
    })
  );

  return results;
}

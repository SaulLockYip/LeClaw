// Agent Status Reader
// Reads agent status from OpenClaw local files (NOT HTTP polling to Gateway)

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { loadConfig } from "./config/io.js";

export type AgentStatus = "online" | "busy" | "offline" | "unknown";

interface SessionEntry {
  sessionId?: string;
  status?: string;
  updatedAt?: number | string;
  startedAt?: string;
  lastActivity?: string;
  [key: string]: unknown;
}

// OpenClaw sessions.json structure is a keyed object, not an array
// { "agent:echi-ceo:main": { sessionId, status, updatedAt, ... }, ... }
type SessionsJson = Record<string, SessionEntry>;

// Active session states from OpenClaw Control Center
const ACTIVE_SESSION_STATES = new Set([
  "running",
  "active",
  "busy",
  "blocked",
  "waiting_approval",
  "working",
  "in_progress",
  "processing",
  "thinking",
  "executing",
  "streaming",
]);

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

function asString(input: unknown): string | undefined {
  return typeof input === "string" ? input : undefined;
}

/**
 * Normalize session records from various JSON structures.
 * Handles: direct array, keyed object, nested .sessions/.items/.records
 */
function normalizeSessionRecords(parsed: unknown): SessionEntry[] {
  // Handle direct array
  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => asObject(item) as SessionEntry | undefined)
      .filter((item): item is SessionEntry => Boolean(item));
  }

  const root = asObject(parsed);
  if (!root) return [];

  // Handle keyed object { "agent:key": { ... }, ... }
  const values = Object.values(root) as unknown[];
  const records = values
    .map((item) => asObject(item) as SessionEntry | undefined)
    .filter((item): item is SessionEntry => Boolean(item));
  if (records.length > 0) return records;

  // Handle nested collections
  const nestedCollections = [
    root.sessions,
    root.items,
    root.records,
  ];

  for (const collection of nestedCollections) {
    if (Array.isArray(collection)) {
      const nested = (collection as unknown[])
        .map((item) => asObject(item) as SessionEntry | undefined)
        .filter((item): item is SessionEntry => Boolean(item));
      if (nested.length > 0) return nested;
    } else if (collection && typeof collection === "object") {
      const nested = Object.values(collection as Record<string, unknown>) as unknown[];
      const keyed = nested
        .map((item) => asObject(item) as SessionEntry | undefined)
        .filter((item): item is SessionEntry => Boolean(item));
      if (keyed.length > 0) return keyed;
    }
  }

  // Handle nested .data object
  const data = asObject(root.data);
  if (data) {
    const dataCollections = [data.sessions, data.items, data.records];
    for (const collection of dataCollections) {
      if (Array.isArray(collection)) {
        const nested = (collection as unknown[])
          .map((item) => asObject(item) as SessionEntry | undefined)
          .filter((item): item is SessionEntry => Boolean(item));
        if (nested.length > 0) return nested;
      } else if (collection && typeof collection === "object") {
        const nested = Object.values(collection as Record<string, unknown>) as unknown[];
        const keyed = nested
          .map((item) => asObject(item) as SessionEntry | undefined)
          .filter((item): item is SessionEntry => Boolean(item));
        if (keyed.length > 0) return keyed;
      }
    }
  }

  return [];
}

/**
 * Read updatedAt from session entry as epoch milliseconds.
 * Handles both number (epoch ms) and string formats.
 */
function readUpdatedAtMs(item: SessionEntry): number {
  const updatedAt = item.updatedAt;

  if (typeof updatedAt === "number" && Number.isFinite(updatedAt)) {
    return normalizeEpochMs(updatedAt);
  }

  if (typeof updatedAt === "string" && updatedAt.trim() !== "") {
    const trimmed = updatedAt.trim();
    // Check if it's a numeric string
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const parsedNumeric = Number(trimmed);
      if (Number.isFinite(parsedNumeric)) return normalizeEpochMs(parsedNumeric);
    }
    // Try parsing as date string
    const parsedDate = Date.parse(trimmed);
    if (!Number.isNaN(parsedDate)) return parsedDate;
  }

  // Fallback to lastActivity if it's a string date
  const lastActivity = item.lastActivity;
  if (typeof lastActivity === "string" && lastActivity.trim() !== "") {
    const parsedDate = Date.parse(lastActivity.trim());
    if (!Number.isNaN(parsedDate)) return parsedDate;
  }

  // Fallback to startedAt if it's a string date
  const startedAt = item.startedAt;
  if (typeof startedAt === "string" && startedAt.trim() !== "") {
    const parsedDate = Date.parse(startedAt.trim());
    if (!Number.isNaN(parsedDate)) return parsedDate;
  }

  return Number.NaN;
}

/**
 * Normalize epoch milliseconds, handling different precisions.
 */
function normalizeEpochMs(value: number): number {
  const abs = Math.abs(value);
  // If value is in seconds (1e13 or higher means seconds), convert to ms
  if (abs >= 1e14) return value / 1000;
  // If value is in a small range, assume seconds and convert to ms
  if (abs > 0 && abs < 1e12) return value * 1000;
  return value;
}

/**
 * Determine agent status from session data
 * - "online" if active session exists (status is in ACTIVE_SESSION_STATES)
 * - "busy" if session exists but has been idle > 5 minutes
 * - "offline" if no session found
 * - "unknown" if session file exists but couldn't be parsed
 */
function determineStatus(sessionData: SessionsJson | null, lastActivity: Date | null): AgentStatus {
  if (!sessionData) {
    return "offline";
  }

  // Get sessions as array (handle keyed object structure)
  const sessions = normalizeSessionRecords(sessionData);

  if (sessions.length === 0) {
    return "offline";
  }

  // Find the most recent active session
  const activeSession = sessions.find((s) => {
    const status = asString(s.status)?.toLowerCase();
    return status !== undefined && ACTIVE_SESSION_STATES.has(status);
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
 * Get last activity timestamp from session file.
 * Returns the most recent updatedAt from active sessions.
 */
function getLastActivity(sessionData: SessionsJson | null): Date | null {
  if (!sessionData) {
    return null;
  }

  // Get sessions as array (handle keyed object structure)
  const sessions = normalizeSessionRecords(sessionData);

  if (sessions.length === 0) {
    return null;
  }

  // Find the most recent active session
  const activeSession = sessions.find((s) => {
    const status = asString(s.status)?.toLowerCase();
    return status !== undefined && ACTIVE_SESSION_STATES.has(status);
  });

  if (!activeSession) {
    return null;
  }

  // Try updatedAt (number epoch ms or string)
  const updatedAtMs = readUpdatedAtMs(activeSession);
  if (Number.isFinite(updatedAtMs)) {
    return new Date(updatedAtMs);
  }

  // Fallback to lastActivity string parsing
  const lastActivityStr = asString(activeSession.lastActivity);
  if (lastActivityStr) {
    const parsed = new Date(lastActivityStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Fallback to startedAt string parsing
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

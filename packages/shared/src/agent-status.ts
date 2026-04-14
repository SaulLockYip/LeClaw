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
  lastActivityAt?: number | string;
  createdAt?: number | string;
  active?: boolean;
  isActive?: boolean;
  state?: string;
  runState?: string;
  lifecycleState?: string;
  acp?: {
    state?: string;
    active?: boolean;
    isActive?: boolean;
    lastActivityAt?: number | string;
    updatedAt?: number | string;
    createdAt?: number | string;
  };
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

const INACTIVE_SESSION_STATES = new Set([
  "idle",
  "inactive",
  "error",
  "failed",
  "stopped",
  "stopping",
  "closed",
  "done",
  "completed",
  "complete",
  "paused",
  "aborted",
  "terminated",
  "cancelled",
  "canceled",
]);

function getDefaultConfigPath(): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
  return join(home, ".leclaw", "config.json");
}

function resolveOpenClawHomePath(): string {
  const config = loadConfig({ configPath: getDefaultConfigPath() });
  return config.openclaw?.dir?.trim() || join(homedir(), ".openclaw");
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

function asBoolean(input: unknown): boolean | undefined {
  return typeof input === "boolean" ? input : undefined;
}

/**
 * Normalize session records from various JSON structures.
 * Handles: direct array, keyed object, nested .sessions/.items/.records
 */
function normalizeRecordCollection(input: unknown): SessionEntry[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => asObject(item) as SessionEntry | undefined)
      .filter((item): item is SessionEntry => Boolean(item));
  }

  const object = asObject(input);
  if (!object) return [];
  return Object.values(object)
    .map((item) => asObject(item) as SessionEntry | undefined)
    .filter((item): item is SessionEntry => Boolean(item));
}

function extractSessionRecords(parsed: unknown): SessionEntry[] {
  const direct = normalizeRecordCollection(parsed).filter(looksLikeSessionRecord);
  if (direct.length > 0) return direct;

  const root = asObject(parsed);
  if (!root) return [];

  const topLevelCollections = [
    normalizeRecordCollection(root.sessions),
    normalizeRecordCollection(root.items),
    normalizeRecordCollection(root.records),
  ];
  for (const collection of topLevelCollections) {
    const records = collection.filter(looksLikeSessionRecord);
    if (records.length > 0) return records;
  }

  const data = asObject(root.data);
  if (data) {
    const nestedCollections = [
      normalizeRecordCollection(data.sessions),
      normalizeRecordCollection(data.items),
      normalizeRecordCollection(data.records),
    ];
    for (const collection of nestedCollections) {
      const records = collection.filter(looksLikeSessionRecord);
      if (records.length > 0) return records;
    }
  }

  return [];
}

function looksLikeSessionRecord(item: Record<string, unknown>): boolean {
  if (
    asString(item.sessionId) ||
    asString(item.sessionKey) ||
    asString(item.key) ||
    asString(item.sessionFile)
  ) {
    return true;
  }
  if (asObject(item.acp) || asObject(item.origin) || asObject(item.deliveryContext)) return true;
  if (readSessionState(item)) return true;
  return false;
}

function readSessionState(item: Record<string, unknown>): string | undefined {
  const direct =
    asString(item.state) ??
    asString(item.status) ??
    asString(item.runState) ??
    asString(item.lifecycleState);
  if (direct) return direct.trim().toLowerCase();

  const acp = asObject(item.acp);
  const acpState = asString(acp?.state);
  return acpState ? acpState.trim().toLowerCase() : undefined;
}

function readExplicitActiveFlag(item: Record<string, unknown>): boolean | undefined {
  const direct = asBoolean(item.active) ?? asBoolean(item.isActive);
  if (typeof direct === "boolean") return direct;

  const acp = asObject(item.acp);
  const acpActive = asBoolean(acp?.active) ?? asBoolean(acp?.isActive);
  return typeof acpActive === "boolean" ? acpActive : undefined;
}

/**
 * Read updatedAt from session entry as epoch milliseconds.
 * Handles both number (epoch ms) and string formats.
 * Also checks nested acp fields and alternative timestamp fields.
 */
function readUpdatedAtMs(item: SessionEntry): number {
  const candidates = [
    item.updatedAt,
    item.lastActivityAt,
    item.createdAt,
    asObject(item.acp)?.lastActivityAt,
    asObject(item.acp)?.updatedAt,
    asObject(item.acp)?.createdAt,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return normalizeEpochMs(candidate);
    }
    if (typeof candidate === "string" && candidate.trim() !== "") {
      const trimmed = candidate.trim();
      // Check if it's a numeric string
      if (/^\d+(\.\d+)?$/.test(trimmed)) {
        const parsedNumeric = Number(trimmed);
        if (Number.isFinite(parsedNumeric)) return normalizeEpochMs(parsedNumeric);
      }
      // Try parsing as date string
      const parsedDate = Date.parse(trimmed);
      if (!Number.isNaN(parsedDate)) return parsedDate;
    }
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
 * Check if a session entry represents an active session.
 * Uses explicit active flag first, then state matching, then recency.
 */
function isSessionActive(item: SessionEntry, recencyWindowMs: number, nowMs: number): boolean {
  const explicitActive = readExplicitActiveFlag(item);
  if (typeof explicitActive === "boolean") return explicitActive;

  const explicitState = readSessionState(item);
  if (explicitState) {
    if (ACTIVE_SESSION_STATES.has(explicitState)) return true;
    if (INACTIVE_SESSION_STATES.has(explicitState)) return false;
  }

  const updatedAtMs = readUpdatedAtMs(item);
  if (!Number.isFinite(updatedAtMs)) return false;
  return nowMs - updatedAtMs <= recencyWindowMs;
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
  const sessions = extractSessionRecords(sessionData);

  if (sessions.length === 0) {
    return "offline";
  }

  const nowMs = Date.now();
  const recencyWindowMs = 5 * 60 * 1000; // 5 minutes

  // Find the most recent active session
  const activeSession = sessions.find((s) => isSessionActive(s, recencyWindowMs, nowMs));

  if (!activeSession) {
    return "offline";
  }

  // Check if session has recent activity (within 5 minutes)
  if (lastActivity) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (lastActivity > fiveMinutesAgo) {
      const status = readSessionState(activeSession);
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
  const sessions = extractSessionRecords(sessionData);

  if (sessions.length === 0) {
    return null;
  }

  const nowMs = Date.now();
  const recencyWindowMs = 5 * 60 * 1000; // 5 minutes

  // Find the most recent active session
  const activeSession = sessions.find((s) => isSessionActive(s, recencyWindowMs, nowMs));

  if (!activeSession) {
    return null;
  }

  // Try updatedAt (number epoch ms or string)
  const updatedAtMs = readUpdatedAtMs(activeSession);
  if (Number.isFinite(updatedAtMs)) {
    return new Date(updatedAtMs);
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

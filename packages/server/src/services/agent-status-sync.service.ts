// Agent Status Sync Service
// Periodically syncs agent status from OpenClaw local files (NOT HTTP polling)

import { eq } from "drizzle-orm";
import { agents } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import {
  scanAllAgentStatuses,
  type AgentStatus,
} from "@leclaw/shared/agent-status";
import { broadcastEvent } from "../sse/event-bus.js";

const SYNC_INTERVAL_MS = 30_000; // 30 seconds

// Guard flags to prevent overlapping executions
let isRunning = false;
let pendingRefresh = false;
let syncInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Get the OpenClaw agent IDs for all bound agents in the database
 */
async function getBoundAgentIds(): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ openClawAgentId: agents.openClawAgentId })
    .from(agents)
    .where(eq(agents.heartbeatEnabled, true));

  return rows
    .map((row) => row.openClawAgentId)
    .filter((id): id is string => Boolean(id));
}

/**
 * Sync agent status for a single agent
 * Returns the new status if it changed, null otherwise
 */
async function syncAgentStatus(
  agentId: string,
  openClawAgentId: string
): Promise<{ agentId: string; oldStatus: AgentStatus | null; newStatus: AgentStatus; newHeartbeatAt: Date | null } | null> {
  const db = await getDb();

  // Get current status from DB
  const [agentRecord] = await db
    .select({
      id: agents.id,
      status: agents.status,
      lastHeartbeatAt: agents.lastHeartbeatAt,
    })
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!agentRecord) {
    return null;
  }

  const oldStatus = (agentRecord.status as AgentStatus) || null;

  // Get new status from local files
  const { status: newStatus, lastHeartbeatAt } = await scanAllAgentStatuses([
    openClawAgentId,
  ]).then((results) => results.get(openClawAgentId) ?? { status: "unknown" as AgentStatus, lastHeartbeatAt: null });

  const newHeartbeatAt = lastHeartbeatAt ?? agentRecord.lastHeartbeatAt ?? null;

  // Update DB if status changed
  if (oldStatus !== newStatus) {
    await db
      .update(agents)
      .set({
        status: newStatus,
        statusLastUpdated: new Date(),
        lastHeartbeatAt: newHeartbeatAt,
      } as any)
      .where(eq(agents.id, agentId));

    return {
      agentId,
      oldStatus,
      newStatus,
      newHeartbeatAt,
    };
  }

  // Even if status didn't change, update heartbeat timestamp if we have new data
  if (lastHeartbeatAt && newHeartbeatAt !== agentRecord.lastHeartbeatAt) {
    await db
      .update(agents)
      .set({
        lastHeartbeatAt: newHeartbeatAt,
        statusLastUpdated: new Date(),
      } as any)
      .where(eq(agents.id, agentId));
  }

  return null;
}

/**
 * Perform a full sync of all agent statuses
 */
export async function syncAllAgentStatuses(): Promise<void> {
  // Guard: prevent overlapping executions
  if (isRunning) {
    pendingRefresh = true;
    return;
  }

  isRunning = true;

  try {
    const db = await getDb();
    const openClawAgentIds = await getBoundAgentIds();

    if (openClawAgentIds.length === 0) {
      return;
    }

    // Get all agents with their openClawAgentId
    const agentRows = await db
      .select({
        id: agents.id,
        openClawAgentId: agents.openClawAgentId,
      })
      .from(agents)
      .where(eq(agents.heartbeatEnabled, true));

    // Sync each agent and collect changes
    const changes: Array<{
      agentId: string;
      oldStatus: AgentStatus | null;
      newStatus: AgentStatus;
      newHeartbeatAt: Date | null;
    }> = [];

    for (const agent of agentRows) {
      if (!agent.openClawAgentId) continue;

      const result = await syncAgentStatus(agent.id, agent.openClawAgentId);
      if (result) {
        changes.push(result);
      }
    }

    // Broadcast SSE events only for actual status changes
    for (const change of changes) {
      broadcastEvent({
        type: "agent_status_changed",
        payload: {
          agentId: change.agentId,
          oldStatus: change.oldStatus,
          newStatus: change.newStatus,
          lastHeartbeatAt: change.newHeartbeatAt?.toISOString() ?? null,
        },
      });
    }
  } finally {
    isRunning = false;

    // Handle any pending refresh that came in while we were running
    if (pendingRefresh) {
      pendingRefresh = false;
      // Use setImmediate to avoid tight looping
      setImmediate(() => {
        syncAllAgentStatuses().catch((err) => {
          console.error("Error processing pending refresh:", err);
        });
      });
    }
  }
}

/**
 * Start the periodic sync service
 */
export function startAgentStatusSync(): void {
  if (syncInterval) {
    return; // Already running
  }

  // Initial sync
  syncAllAgentStatuses().catch((err) => {
    console.error("Error during initial agent status sync:", err);
  });

  // Schedule periodic sync
  syncInterval = setInterval(() => {
    syncAllAgentStatuses().catch((err) => {
      console.error("Error during periodic agent status sync:", err);
    });
  }, SYNC_INTERVAL_MS);

  console.log(`Agent status sync service started (interval: ${SYNC_INTERVAL_MS}ms)`);
}

/**
 * Stop the periodic sync service
 */
export function stopAgentStatusSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("Agent status sync service stopped");
  }
}

/**
 * Force an immediate sync (also resets the interval timer)
 */
export function forceSyncNow(): Promise<void> {
  return syncAllAgentStatuses();
}

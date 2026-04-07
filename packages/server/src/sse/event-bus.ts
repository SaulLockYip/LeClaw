// SSE event types (matching Phase 5 UI expectations)
export type SseEventType =
  | "company_created" | "company_updated" | "company_deleted"
  | "department_created" | "department_updated" | "department_deleted"
  | "agent_status_changed" | "agent_updated"
  | "issue_created" | "issue_updated"
  | "goal_updated" | "project_updated" | "approval_updated"
  | "heartbeat";

// Connected SSE clients
const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();

// Event types that trigger broadcasts
const TRACKED_EVENTS: SseEventType[] = [
  "company_created", "company_updated", "company_deleted",
  "department_created", "department_updated", "department_deleted",
  "agent_status_changed", "agent_updated",
  "issue_created", "issue_updated",
  "goal_updated", "project_updated", "approval_updated",
];

export interface EventPayload {
  type: SseEventType;
  payload: Record<string, unknown>;
}

export function addClient(controller: ReadableStreamDefaultController<Uint8Array>): void {
  clients.add(controller);
}

export function removeClient(controller: ReadableStreamDefaultController<Uint8Array>): void {
  clients.delete(controller);
}

export function broadcastEvent(payload: EventPayload): void {
  const timestamp = new Date().toISOString();
  const message = `event: ${payload.type}\ndata: ${JSON.stringify({ ...payload.payload, timestamp })}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(message);

  for (const client of clients) {
    try {
      client.enqueue(encoded);
    } catch {
      // Client disconnected, remove it
      clients.delete(client);
    }
  }
}

export function isTrackedEvent(event: SseEventType): boolean {
  return TRACKED_EVENTS.includes(event);
}
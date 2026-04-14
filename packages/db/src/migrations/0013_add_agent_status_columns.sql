-- Add agent status tracking columns for periodic sync from OpenClaw local files
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'unknown' NOT NULL;
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "status_last_updated" timestamp with time zone;
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "last_heartbeat_at" timestamp with time zone;
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "heartbeat_enabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_status_idx" ON "agents" USING btree ("status");
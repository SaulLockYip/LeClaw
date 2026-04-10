-- Create audit_logs table
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" text NOT NULL,
	"command" text NOT NULL,
	"args" jsonb NOT NULL DEFAULT '{}',
	"result" text NOT NULL,
	"output" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "audit_logs_agent_timestamp_idx" ON "audit_logs" USING btree ("agent_id","created_at");
CREATE INDEX "audit_logs_command_timestamp_idx" ON "audit_logs" USING btree ("command","created_at");
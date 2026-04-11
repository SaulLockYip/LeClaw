CREATE TABLE IF NOT EXISTS "agent_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invite_key" text NOT NULL,
	"company_id" uuid NOT NULL,
	"department_id" uuid,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"openclaw_agent_id" text,
	"openclaw_agent_workspace" text,
	"openclaw_agent_dir" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" text NOT NULL,
	"command" text NOT NULL,
	"args" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result" text NOT NULL,
	"output" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sub_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_issue_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'Open' NOT NULL,
	"assignee_agent_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "issues" DROP CONSTRAINT "issues_assignee_agent_id_agents_id_fk";
--> statement-breakpoint
DROP INDEX "issues_company_assignee_status_idx";--> statement-breakpoint
ALTER TABLE "issues" ALTER COLUMN "department_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_api_keys" ADD COLUMN "company_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_api_keys" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_api_keys" ADD COLUMN "key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_api_keys" ADD COLUMN "last_used_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "agent_api_key" text;--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "type" text DEFAULT 'human_approve' NOT NULL;--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "approver_id" uuid;--> statement-breakpoint
ALTER TABLE "agent_invites" ADD CONSTRAINT "agent_invites_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_invites" ADD CONSTRAINT "agent_invites_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_issues" ADD CONSTRAINT "sub_issues_parent_issue_id_issues_id_fk" FOREIGN KEY ("parent_issue_id") REFERENCES "public"."issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_issues" ADD CONSTRAINT "sub_issues_assignee_agent_id_agents_id_fk" FOREIGN KEY ("assignee_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agent_invites_invite_key_idx" ON "agent_invites" USING btree ("invite_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_invites_company_idx" ON "agent_invites" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_invites_status_expires_idx" ON "agent_invites" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_agent_timestamp_idx" ON "audit_logs" USING btree ("agent_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_command_timestamp_idx" ON "audit_logs" USING btree ("command","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_issues_parent_idx" ON "sub_issues" USING btree ("parent_issue_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_issues_assignee_idx" ON "sub_issues" USING btree ("assignee_agent_id");--> statement-breakpoint
ALTER TABLE "agent_api_keys" ADD CONSTRAINT "agent_api_keys_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approver_id_agents_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agents_agent_api_key_idx" ON "agents" USING btree ("agent_api_key") WHERE "agents"."agent_api_key" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "issues" DROP COLUMN "assignee_agent_id";
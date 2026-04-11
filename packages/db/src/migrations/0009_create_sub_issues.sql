-- Create sub_issues table
CREATE TABLE "sub_issues" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "parent_issue_id" uuid NOT NULL REFERENCES "issues"("id"),
  "title" text NOT NULL,
  "description" text,
  "status" text NOT NULL DEFAULT 'Open',
  "assignee_agent_id" uuid NOT NULL REFERENCES "agents"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "sub_issues_parent_idx" ON "sub_issues" ("parent_issue_id");
CREATE INDEX "sub_issues_assignee_idx" ON "sub_issues" ("assignee_agent_id");
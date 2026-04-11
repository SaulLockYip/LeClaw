-- Modify approvals table: add type and approverId
ALTER TABLE "approvals" ADD COLUMN "type" text NOT NULL DEFAULT 'human_approve';
ALTER TABLE "approvals" ADD COLUMN "approver_id" uuid REFERENCES "agents"("id");
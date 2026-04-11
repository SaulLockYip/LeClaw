-- Modify issues table: drop assigneeAgentId, make departmentId NOT NULL
ALTER TABLE "issues" DROP COLUMN IF EXISTS "assignee_agent_id";
ALTER TABLE "issues" ALTER COLUMN "department_id" SET NOT NULL;
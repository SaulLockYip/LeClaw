ALTER TABLE projects DROP COLUMN IF EXISTS department_id;
ALTER TABLE projects ADD COLUMN department_ids JSONB NOT NULL DEFAULT '[]';

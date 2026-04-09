-- Add name column to agent_api_keys table
ALTER TABLE agent_api_keys ADD COLUMN name TEXT NOT NULL DEFAULT 'default';

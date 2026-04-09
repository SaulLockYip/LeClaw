-- Add key column to agent_api_keys table
ALTER TABLE agent_api_keys ADD COLUMN key TEXT NOT NULL DEFAULT '';
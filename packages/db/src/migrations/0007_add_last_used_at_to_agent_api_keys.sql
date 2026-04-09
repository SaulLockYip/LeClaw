-- Add last_used_at column to agent_api_keys table
ALTER TABLE agent_api_keys ADD COLUMN last_used_at timestamp with time zone;
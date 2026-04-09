-- Migration: Add OpenClaw agent fields to agent_invites
-- These fields store the selected agent info at invite creation time (when human selects in UI)
-- The agent is pre-bound at invite creation, not at claim time

ALTER TABLE agent_invites ADD COLUMN openclaw_agent_id TEXT;
ALTER TABLE agent_invites ADD COLUMN openclaw_agent_workspace TEXT;
ALTER TABLE agent_invites ADD COLUMN openclaw_agent_dir TEXT;

-- Create index for looking up by openclaw agent id (to find unbound agents)
CREATE INDEX agent_invites_openclaw_agent_id_idx ON agent_invites(openclaw_agent_id) WHERE openclaw_agent_id IS NOT NULL;

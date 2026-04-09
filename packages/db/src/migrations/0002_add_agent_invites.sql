CREATE TABLE agent_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_key TEXT NOT NULL UNIQUE,
  company_id UUID NOT NULL REFERENCES companies(id),
  department_id UUID REFERENCES departments(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX agent_invites_invite_key_idx ON agent_invites(invite_key);
CREATE INDEX agent_invites_company_idx ON agent_invites(company_id);
CREATE INDEX agent_invites_status_expires_idx ON agent_invites(status, expires_at);

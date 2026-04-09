-- Add company_id to agent_api_keys table
ALTER TABLE agent_api_keys ADD COLUMN company_id UUID REFERENCES companies(id);

# LeClaw Hiring Guide

**When to read:** When hiring a new agent (CEO or Manager).

This document provides an overview of the complete hiring and onboarding flow for adding new agents to your LeClaw organization.

## Complete Hiring Flow

```
Step 1: Create OpenClaw Agent
   └── openclaw agents add <name> --workspace <dir> --non-interactive

Step 2: Create LeClaw Invite
   └── leclaw agent invite --create --openclaw-agent-id <id> --name <name> --title <title> --role <role> --department-id <uuid>

Step 3: Onboard via OpenClaw A2A
   └── Use sessions_send to send invite key and identity info
   └── Guide new agent through onboarding

Step 4: New agent completes leclaw onboard
   └── Receives ONE-TIME API KEY
   └── MUST save to TOOLS.md

Step 5: Register skills
   └── Skills location: ~/.leclaw/skills/
   └── Register skills to agent scope

Step 6: Update TOOLS.md
   └── Add role-specific skill usage notes
   └── Save API Key permanently

Step 7: Introduce to team
```

## Role-Based Permissions

| Hiring Agent | Can Hire | To Department |
|--------------|----------|---------------|
| CEO | Manager, Staff | Any department |
| Manager | Staff only | Own department only |

**Important:** Only the CEO can hire Managers. Managers can only hire Staff to their own department.

## Step-by-Step Details

### Step 1: Create OpenClaw Agent

Create the agent in OpenClaw using the CLI:

```bash
openclaw agents add <name> --workspace <dir> --non-interactive
```

Parameters:
- `<name>`: Unique identifier for the agent
- `--workspace <dir>`: Working directory for the agent
- `--non-interactive`: Skip interactive prompts

### Step 1b: Find Department ID

```bash
leclaw department list
```

### Step 2: Create LeClaw Invite

Create the invite record in LeClaw:

```bash
leclaw agent invite --create --api-key <key> --openclaw-agent-id <id> --name <name> --title <title> --role <role> --department-id <uuid>
```

Parameters:
- `--openclaw-agent-id <id>`: ID from Step 1
- `--name <name>`: Display name for the agent
- `--title <title>`: Job title
- `--role <role>`: Either "Manager" or "Staff"
- `--department-id <uuid>`: Target department UUID

### Step 3: A2A Communication

Send an A2A message to the new agent via `sessions_send` containing:
- Welcome message with the invite key
- Identity information: role, company name, department
- Instructions to run: `leclaw onboard --invite-key <key>`
- Skills location: `~/.leclaw/skills/`

### Step 4: New Agent Onboards

The new agent runs:
```bash
leclaw onboard --invite-key <key>
```

The agent receives a **ONE-TIME API KEY** that must be saved to TOOLS.md immediately.

### Step 5: Register Skills

The new agent registers skills:
```bash
# Register LeClaw skills
leclaw skills register --scope agent --path ~/.leclaw/skills/
```

Skills location: `~/.leclaw/skills/`

### Step 6: Update TOOLS.md

The new agent updates their TOOLS.md with:
- The API Key saved permanently
- Role-specific skill usage notes
- Any role-specific commands or patterns

### Step 7: Introduce to Team

The hiring agent sends A2A messages to existing team members introducing the new agent.

## Common Milestones

A successful hiring onboarding completes when:

1. **New agent can execute LeClaw commands** - The agent can run `leclaw` CLI commands successfully
2. **New agent understands their role** - The agent knows their responsibilities based on their role (CEO/Manager/Staff)
3. **New agent knows team structure** - The agent understands the company hierarchy and their department

## See Also

- [CEO Hiring Guide](ceo.md) - Detailed guide when CEO hires Managers or Staff
- [Manager Hiring Guide](manager.md) - Detailed guide when Manager hires Staff
- [Agent Invite](../agent-invite.md) - Technical invite creation reference
- [Roles](../roles.md) - Role definitions and responsibilities

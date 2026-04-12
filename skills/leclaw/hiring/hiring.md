# LeClaw Hiring Guide

**When to read:** When hiring a new agent (For CEO or Manager agent).

This document provides an overview of the complete hiring and onboarding flow for adding new agents to your LeClaw organization.

## Complete Hiring Flow

```
Step 1: Confirm Naming Convention
   └── Confirm OpenClaw name and workspace with CEO (if needed)

Step 2: Create OpenClaw Agent
   └── openclaw agents add <name> --workspace <dir> --non-interactive

Step 3: Create LeClaw Invite
   └── leclaw agent invite create --api-key <key> --openclaw-agent-id <id> --name <name> --title <title> --role <role> --department-id <uuid>
   └── Returns inviteKey (6-char code)

Step 4: Onboard new agent
   └── Send the invite key to the new agent via a2a-chatting or direct message
   └── New agent runs: leclaw agent onboard --invite-key <code>
   └── New agent receives ONE-TIME API KEY (auto-stored to ~/.leclaw/agent-api-key)

Step 5: Introduce to team
```

## Role-Based Permissions

| Hiring Agent | Can Hire | To Department |
|--------------|----------|---------------|
| CEO | Manager, Staff | Any department |
| Manager | Staff only | Own department only |

**Important:** Only the CEO can hire Managers. Managers can only hire Staff to their own department.

## Naming Conventions

### OpenClaw Agent Naming

OpenClaw agents require consistent naming to identify Company, Department, Role, and Name:

| Field | Format | Example |
|-------|--------|---------|
| **name** | `{Company}-{Department}-{Role}-{AgentName}` | `Echi-Operation-Staff-Lucy` |
| **workspace** | `.openclaw/{Company}/{name-lowercase}/` | `.openclaw/Echi/echi-operation-staff-lucy/` |

**Example:**
```bash
openclaw agents add Echi-Operation-Staff-Lucy \
  --workspace .openclaw/Echi/echi-operation-staff-lucy/ \
  --non-interactive
```

### LeClaw Agent Naming

LeClaw agents are inherently isolated by Company and Department, so names do NOT need to include company/department info:

| Field | Example |
|-------|---------|
| **name** | `Lucy` |
| **title** | `跟单专员` |

**Example:**
```bash
leclaw agent invite create \
  --api-key <key> \
  --openclaw-agent-id <id> \
  --name "Lucy" \
  --title "跟单专员" \
  --role Staff \
  --department-id <uuid>
```

## Step-by-Step Details

### Step 1: Confirm Naming Convention

Before hiring, confirm the OpenClaw agent naming with CEO if needed.

### Step 2: Create OpenClaw Agent

Create the agent in OpenClaw using the CLI:

```bash
openclaw agents add <name> --workspace <dir> --non-interactive
```

### Step 3: Create LeClaw Invite

Create the invite record in LeClaw:

```bash
leclaw agent invite create \
  --api-key <key> \
  --openclaw-agent-id <id> \
  --name <name> \
  --title <title> \
  --role <role> \
  --department-id <uuid>
```

### Step 4: Onboard new agent

The hiring agent should send the new agent:
- The invite key
- Their role, title, and department

The new agent then runs:
```bash
leclaw agent onboard --invite-key <code>
```

The API key is auto-generated and stored to `~/.leclaw/agent-api-key`.

**Onboarding Checklist:**
```
Onboarding Checklist:
1. [ ] Run: leclaw agent onboard --invite-key <code>
2. [ ] Save API key to your TOOLS.md
3. [ ] Understand activity.log usage (see [workflow.md](../workflow.md))
     - Record decisions, operations, and blockers
4. [ ] Read [HEARTBEATS_Templates.md](../HEARTBEATS_Templates.md) for auto task polling setup
```

### Step 5: New Agent Onboards

The new agent runs:
```bash
leclaw agent onboard --invite-key <code>
```

The API key is auto-generated and stored to `~/.leclaw/agent-api-key`.

### Step 6: Introduce to Team

The hiring agent notifies existing team members about the new agent via a2a-chatting or direct message.

## Common Milestones

A successful hiring onboarding completes when:

1. **New agent can execute LeClaw commands** - The agent can run `leclaw` CLI commands successfully
2. **New agent understands their role** - The agent knows their responsibilities based on their role (CEO/Manager/Staff)
3. **New agent knows team structure** - The agent understands the company hierarchy and their department

## See Also

- [Agent Invite](../agent-invite.md) - Technical invite creation reference
- [Roles](../roles.md) - Role definitions and responsibilities

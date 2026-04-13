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

Step 4: Onboard via a2a-chatting (IMPORTANT: guide until checklist complete)
   └── Send comprehensive onboarding package via a2a-chatting
   └── Include: invite key, role, title, department, API key storage instructions
   └── Provide: TOOLS.md template, HEARTBEATS.md setup guidance
   └── Continue conversation until new agent confirms checklist completion

Step 5: New Agent Onboards
   └── New agent runs: leclaw agent onboard --invite-key <code>
   └── New agent receives ONE-TIME API KEY (auto-stored to ~/.leclaw/agent-api-key)

Step 6: Introduce to team
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
| **title** | `Order Specialist` |

**Example:**
```bash
leclaw agent invite create \
  --api-key <key> \
  --openclaw-agent-id <id> \
  --name "Lucy" \
  --title "Order Specialist" \
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

### Step 4: Onboard new agent (via a2a-chatting)

The hiring agent must use **a2a-chatting** to send a comprehensive onboarding message and continue guiding the new agent until the checklist is complete.

**Send the following onboarding package:**

```
Welcome to {Company Name}! Your role: {Role} - {Title}

1. Onboard to LeClaw:
   Run: leclaw agent onboard --invite-key {inviteKey}

2. Save your API key:
   - After onboarding, your API key is auto-saved to ~/.leclaw/agent-api-key
   - Also save it to your TOOLS.md for reference
   - Example TOOLS.md entry:
     ```
     ## LeClaw API Key
     Location: ~/.leclaw/agent-api-key
     ```

3. Create your working files:
   - Create TOOLS.md in your workspace (if not exists)
   - Create HEARTBEATS.md (see HEARTBEATS_Templates.md)
   - Create IDENTITY.md with your role and responsibilities

4. Read these documents:
   - SKILL.md - Understand task delegation flow and your responsibilities as {Role}
   - HEARTBEATS_Templates.md - Set up auto task polling

5. Confirm completion by responding to this chat with your checklist status.
```

**Onboarding Checklist (new agent must complete):**
```
Onboarding Checklist:
1. [ ] Run: leclaw agent onboard --invite-key {inviteKey}
2. [ ] Save API key to ~/.leclaw/agent-api-key
3. [ ] Add API key entry to your TOOLS.md
4. [ ] Create HEARTBEATS.md (copy from HEARTBEATS_Templates.md)
5. [ ] Read SKILL.md (task delegation flow and role responsibilities)
6. [ ] Confirm: I understand my responsibilities as {Role}
```

**Important:** Continue using a2a-chatting until the new agent confirms all checklist items are complete. Do not end the conversation until onboarding is fully finished.

### Step 5: New Agent Onboards

The new agent runs:
```bash
leclaw agent onboard --invite-key <code>
```

The API key is auto-generated and stored to `~/.leclaw/agent-api-key`.

### Step 6: Introduce to Team

The hiring agent notifies existing team members about the new agent via a2a-chatting.

## Common Milestones

A successful hiring onboarding completes when:

1. **New agent can execute LeClaw commands** - The agent can run `leclaw` CLI commands successfully
2. **New agent understands their role** - The agent knows their responsibilities based on their role (CEO/Manager/Staff)
3. **New agent knows team structure** - The agent understands the company hierarchy and their department

## See Also

- [LeClaw SKILL.md](../SKILL.md) - Complete LeClaw documentation including invite creation and role definitions

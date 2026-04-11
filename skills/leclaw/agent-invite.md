# Agent Invite

**When to use:** When needing to expand the team or hire a new Agent.

---

## Overview

The agent invite process creates a new LeClaw agent from an existing OpenClaw agent. This is a two-step process:

1. **Technical setup** - Create OpenClaw agent and LeClaw invite
2. **Onboarding** - Integrating the new agent into the team (see [hiring/](../hiring/hiring.md))

This document covers the technical steps (Step 1-2) only.

---

## Prerequisites

Before inviting an agent, ensure:

- You have the authority to invite (see Permission Rules below)
- The OpenClaw agent exists or will be created
- Department exists for the agent's placement
- Role is determined (CEO, Manager, Staff)

---

## Permission Rules

### Who Can Invite Whom

| Inviter Role | Can Invite | To Department |
|--------------|------------|---------------|
| CEO | Any role | Any department |
| Manager | Staff only | Own department only |
| Staff | Cannot invite | N/A |

### CEO Authority

CEO can invite:
- New CEO (to establish company)
- New Manager (to any department)
- New Staff (to any department)

### Manager Authority

Manager can invite:
- New Staff only
- To own department only
- Cannot invite Managers or other Managers

### Staff Authority

Staff cannot invite agents. Must submit approval request to Manager.

---

## Step 1: Create OpenClaw Agent

First, create the OpenClaw agent that will become a LeClaw agent.

```bash
openclaw agents add <name> --workspace <dir> --non-interactive
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| name | Agent name (e.g., "alice", "bob-support") |
| workspace | Agent's working directory (e.g., "/agents/alice") |
| --non-interactive | Skip interactive prompts |

### Examples

```bash
# Create agent named "alice" with workspace
openclaw agents add alice --workspace /agents/alice --non-interactive

# Create support agent
openclaw agents add bob-support --workspace /agents/bob-support --non-interactive

# Create engineering manager
openclaw agents add carol-eng --workspace /agents/carol-eng --non-interactive
```

### After Creation

Note the agent ID returned by OpenClaw. You'll need it for Step 2.

```
Agent created: agent_abc123
Agent ID: abc123def456
```

---

## Step 2: Create LeClaw Invite

Now create the LeClaw invite that links to the OpenClaw agent.

```bash
leclaw agent invite --create \
  --openclaw-agent-id <id> \
  --name <name> \
  --title <title> \
  --role <role> \
  --department-id <uuid>
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| --openclaw-agent-id | Yes | OpenClaw agent ID from Step 1 |
| --name | Yes | Agent's display name |
| --title | Yes | Agent's job title |
| --role | Yes | Agent role: ceo, manager, staff |
| --department-id | Yes | UUID of department |

### Role Values

| Role | Description |
|------|-------------|
| ceo | Chief Executive Officer - top of hierarchy |
| manager | Department Manager |
| staff | Individual Contributor |

### Examples

```bash
# Invite a Staff member to Engineering
leclaw agent invite --create \
  --openclaw-agent-id abc123def456 \
  --name alice \
  --title "Senior Engineer" \
  --role staff \
  --department-id 550e8400-e29b-41d4-a716-446655440001

# Invite a Manager
leclaw agent invite --create \
  --openclaw-agent-id def456ghi789 \
  --name bob \
  --title "Engineering Manager" \
  --role manager \
  --department-id 550e8400-e29b-41d4-a716-446655440001

# Invite CEO (typically first agent)
leclaw agent invite --create \
  --openclaw-agent-id ghi789jkl012 \
  --name charlie \
  --title "Chief Executive Officer" \
  --role ceo \
  --department-id 550e8400-e29b-41d4-a716-446655440000
```

### Invite Output

The invite creation returns an invite key:

```
Invite created: inv_abc123
Invite key: xxxxx-xxxxx-xxxxx
Use this key during agent onboarding.
```

---

## Complete CLI Command (Combined)

```bash
# Step 1: Create OpenClaw agent
openclaw agents add alice --workspace /agents/alice --non-interactive
# Output: Agent ID: abc123def456

# Step 2: Create LeClaw invite
leclaw agent invite --create \
  --openclaw-agent-id abc123def456 \
  --name alice \
  --title "Senior Engineer" \
  --role staff \
  --department-id 550e8400-e29b-41d4-a716-446655440001
```

---

## Other CLI Commands

### List Invites

```bash
# List all pending invites
leclaw agent invite list

# List invites by department
leclaw agent invite list --department-id <uuid>

# List invites by status
leclaw agent invite list --status pending
```

### Show Invite

```bash
# Show invite details
leclaw agent invite show <invite-id>
```

### Cancel Invite

```bash
# Cancel a pending invite
leclaw agent invite cancel <invite-id>
```

---

## Finding Department ID

```bash
# List departments to find ID
leclaw department list

# Show department details
leclaw department show <department-id>
```

---

## Next Steps

After completing Steps 1-2, proceed to the [hiring/](../hiring/hiring.md) folder for complete onboarding guidance:

- [hiring.md](../hiring/hiring.md) - Complete hiring/onboarding overview
- [ceo.md](../hiring/ceo.md) - When CEO performs the hire
- [manager.md](../hiring/manager.md) - When Manager performs the hire

---

## Common Issues

### Issue: Department not found

```
Error: Department not found
```

**Solution:** Verify department ID with `leclaw department list`

### Issue: Permission denied

```
Error: Only CEO can invite Manager role
```

**Solution:** If Manager needs to hire Staff, verify department match

### Issue: OpenClaw agent not found

```
Error: OpenClaw agent not found
```

**Solution:** Verify agent ID with `openclaw agents list`

---

## Related Documents

- [hiring/](../hiring/hiring.md) - Complete onboarding flow
- [Roles](roles.md) - Role definitions and responsibilities
- [Permissions](permissions.md) - Permission matrix
- [Approvals](approvals.md) - When approval is needed for invite

# CEO Hiring Guide

**When to hire:** When CEO needs to hire a Manager or Staff.

This guide covers the complete hiring flow when the CEO is expanding the team.

## Role-Based Invite Permissions

As CEO, you have full hiring authority:
- **Can hire:** Manager, Staff
- **Can hire to:** Any department

You can hire Managers to any department and Staff to any department.

## Complete Hiring Flow

### Step 1: Create OpenClaw Agent

Create the agent in OpenClaw:

```bash
openclaw agents add <name> --workspace <dir> --non-interactive
```

Example:
```bash
openclaw agents add john-doe --workspace /company/agents/john-doe --non-interactive
```

### Step 2: Create LeClaw Invite

Create the invite record in LeClaw:

```bash
leclaw agent invite --create --openclaw-agent-id <id> --name <name> --title <title> --role <role> --department-id <uuid>
```

Example for hiring a Manager:
```bash
leclaw agent invite --create \
  --openclaw-agent-id abc123 \
  --name "John Doe" \
  --title "Engineering Manager" \
  --role Manager \
  --department-id 550e8400-e29b-41d4-a716-446655440000
```

Example for hiring a Staff:
```bash
leclaw agent invite --create \
  --openclaw-agent-id def456 \
  --name "Jane Smith" \
  --title "Software Engineer" \
  --role Staff \
  --department-id 550e8400-e29b-41d4-a716-446655440000
```

### Step 3: A2A Communication

Send a welcome message to the new agent via `sessions_send`. Include:

1. **Welcome message** with the invite key
2. **Identity information:**
   - Role (Manager or Staff)
   - Company name
   - Department name and ID
3. **Onboarding instructions:**
   ```
   Please run: leclaw onboard --invite-key <key>
   ```
4. **Skills location:**
   ```
   LeClaw skills are located at: ~/.leclaw/skills/
   Register them to your agent scope after onboarding.
   ```

Example A2A message content:
```
Welcome to the team! Your invite key is: INVITE-ABC123XYZ

Your identity:
- Role: Manager
- Department: Engineering (550e8400-e29b-41d4-a716-446655440000)

Next steps:
1. Run: leclaw onboard --invite-key INVITE-ABC123XYZ
2. Save your API KEY to TOOLS.md (you will only see it once)
3. Register skills: ~/.leclaw/skills/
4. Read ~/.leclaw/skills/leclaw/roles.md to understand your responsibilities

Let me know once you've completed onboarding.
```

### Step 4: After Onboard

Once the new agent completes `leclaw onboard`, they will receive a **ONE-TIME API KEY**.

Instruct the agent to:
1. **Save the API KEY to TOOLS.md immediately** - it will not be shown again
2. The API KEY authenticates the agent to the LeClaw system

### Step 4.5: Activity Log Training

Teach the new agent about activity.log:

**Explain the purpose:**
- Tracks thinking and decision logic
- Enables session recovery after restart
- Other agents can read it for collaboration

**Explain the rules:**
1. Append-only - never delete or overwrite
2. Update before operation - record what you're about to do
3. Update after operation - record the result
4. Update when blocked - record what stopped progress
5. Read on startup - recover context from log

**Show the location:** `<workspace>/activity.log`

**Show example format:**
```
## [TIMESTAMP] OPENCLAW_OPERATION
Command: leclaw issue create --title "..."
Decision: Creating this issue because current sprint is behind schedule
Result: issue-uuid created successfully

## [TIMESTAMP] THINKING
Problem: Should I create a Sub-Issue or submit an Approval?
Analysis:
- Sub-Issue: Task is complex with parallel work streams
- Approval: Need Manager sign-off for budget increase
Decision: Create Sub-Issue first, then submit Approval for budget
```

### Step 5: Skills Registration

Instruct the new agent to register their skills:

```bash
# Register LeClaw skills to agent scope
leclaw skills register --scope agent --path ~/.leclaw/skills/
```

Skills are located at: `~/.leclaw/skills/`

The skills include:
- `overview.md` - LeClaw framework basics
- `roles.md` - Role definitions and responsibilities
- `permissions.md` - Permission quick reference
- `collaboration.md` - How agents collaborate
- `issues.md` - Issue workflow
- `sub-issues.md` - Sub-issue workflow
- `approvals.md` - Approval workflow
- `goals.md` - Goal management
- `projects.md` - Project management

### Step 6: Update TOOLS.md

Instruct the new agent to update their TOOLS.md with:

1. **API Key** - Save permanently for future use
2. **Role-specific skill usage notes** - Based on whether they are Manager or Staff
3. **Common commands** for their role

Example TOOLS.md additions for a Manager:
```markdown
## LeClaw API Configuration
API_KEY: sk-leclaw-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

## Manager Commands
leclaw issue create --department-id <uuid> --title "<title>"
leclaw issue sub-issue create --parent-issue-id <uuid> --title "<title>" --assignee-agent-id <id>
leclaw approval list --status pending
leclaw goal create --title "<title>" --department-ids <uuid>
leclaw project create --title "<title>"
```

Example TOOLS.md additions for a Staff:
```markdown
## LeClaw API Configuration
API_KEY: sk-leclaw-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

## Staff Commands
leclaw issue create --department-id <uuid> --title "<title>"
leclaw issue list --api-key <key>
leclaw approval request --type agent_approve --title "<title>" --description "<desc>"
```

### Step 7: Introduce to Team

Send A2A messages to existing Managers and Staff introducing the new team member:

Example to Managers:
```
Team update: John Doe has joined as Engineering Manager.
Please welcome them and coordinate on any overlapping work.
```

Example to Staff (when hiring a Manager):
```
Team update: John Doe is our new Engineering Manager.
Please coordinate with them on your current tasks and upcoming work.
```

### Step 8: Assign Initial Work

**When hiring a Manager:**
Create a new Issue for the Manager to own. This gives them clear initial responsibility.

```bash
leclaw issue create --department-id <uuid> --title "Initial planning for Q2 objectives"
```

**When hiring a Staff:**
Assign existing Sub-Issues to the new Staff, or create new Sub-Issues under existing Issues.

```bash
leclaw issue sub-issue create --parent-issue-id <uuid> --title "Task description" --assignee-agent-id <new-staff-id>
```

## BOOTSTRAP Guidance for New Agents

When guiding a new agent through their first steps, ensure they understand:

1. **Their role in the hierarchy** - CEO > Manager > Staff
2. **Their department** - Which department they belong to
3. **Their authorities** - What they can and cannot do
4. **How to collaborate** - Use LeClaw for tracking, OpenClaw A2A for communication
5. **Escalation path** - Staff escalates to Manager, Manager escalates to CEO

## Common Milestones for New Agent

A successfully onboarded agent can:
1. Execute `leclaw` commands without errors
2. Read and understand their role responsibilities from `roles.md`
3. Know the team structure and their place in it
4. Create and update Issues appropriate for their role
5. Submit and respond to Approvals appropriately

## See Also

- [Hiring Overview](hiring.md) - Entry point for hiring guide
- [Manager Hiring Guide](manager.md) - Guide when Manager hires Staff
- [Roles](../roles.md) - Role definitions and responsibilities
- [Permissions](../permissions.md) - Permission matrix
- [Agent Invite](../agent-invite.md) - Technical invite creation reference

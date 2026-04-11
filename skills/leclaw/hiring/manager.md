# Manager Hiring Guide

**When to hire:** When a Manager needs to hire a Staff member.

This guide covers the complete hiring flow when a Manager is expanding their team.

## Role-Based Invite Permissions

As a Manager, your hiring authority is limited:
- **Can hire:** Staff only
- **Can hire to:** Your own department only

**Important:** You cannot hire Managers. Only the CEO can hire Managers. If you need to hire a Manager, submit an approval request to your CEO.

## Complete Hiring Flow

### Step 1: Create OpenClaw Agent

Create the agent in OpenClaw:

```bash
openclaw agents add <name> --workspace <dir> --non-interactive
```

Example:
```bash
openclaw agents add jane-smith --workspace /company/agents/jane-smith --non-interactive
```

### Step 2: Create LeClaw Invite

Create the invite record in LeClaw:

```bash
leclaw agent invite --create --api-key <key> --openclaw-agent-id <id> --name <name> --title <title> --role Staff --department-id <uuid>
```

**Critical:** The `role` must be `Staff` and `department-id` must be your own department.

Example:
```bash
leclaw agent invite --create \
  --openclaw-agent-id def456 \
  --name "Jane Smith" \
  --title "Software Engineer" \
  --role Staff \
  --department-id 550e8400-e29b-41d4-a716-446655440000
```

Replace `550e8400-e29b-41d4-a716-446655440000` with your actual department ID. You can find your department ID by running:
```bash
leclaw department list
```

### Step 3: A2A Communication

Send a welcome message to the new agent via `sessions_send`. Include:

1. **Welcome message** with the invite key
2. **Identity information:**
   - Role: Staff
   - Department: Your department name and ID
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
Welcome to the Engineering team! Your invite key is: INVITE-DEF456789

Your identity:
- Role: Staff
- Department: Engineering (550e8400-e29b-41d4-a716-446655440000)
- Your Manager: [Your name]

Next steps:
1. Run: leclaw onboard --invite-key INVITE-DEF456789
2. Save your API KEY to TOOLS.md (you will only see it once)
3. Register skills: ~/.leclaw/skills/
4. Read ~/.leclaw/skills/leclaw/roles.md to understand your responsibilities

As a Staff member, you will receive Sub-Issues from me (your Manager).
Your primary work will be executing assigned tasks and reporting progress.

Let me know once you've completed onboarding so I can assign your first tasks.
```

### Step 4: After Onboard

Once the new Staff completes `leclaw onboard`, they will receive a **ONE-TIME API KEY**.

Ensure the new Staff understands to:
1. **Save the API KEY to TOOLS.md immediately** - it will not be shown again
2. The API KEY authenticates them to the LeClaw system

### Step 4.5: Activity Log Training

Teach the new Staff about activity.log:

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
Command: leclaw issue sub-issue update --sub-issue-id <uuid> --status InProgress
Decision: Starting work on database schema task
Result: Status updated to InProgress

## [TIMESTAMP] THINKING
Problem: How should I structure the migration script?
Analysis:
- Option A: Single large migration for all tables
- Option B: Separate migrations per table with dependencies
Decision: Option B - better for rollback and parallel work
```

### Step 5: Skills Registration

Guide the new Staff to register their skills:

```bash
# Register LeClaw skills to agent scope
leclaw skills register --scope agent --path ~/.leclaw/skills/
```

Skills are located at: `~/.leclaw/skills/`

Key skills for a Staff member:
- `roles.md` - Understand your responsibilities as Staff
- `issues.md` - How to flag issues and raise blockers
- `sub-issues.md` - How to work with Sub-Issues assigned to you
- `approvals.md` - How to submit approval requests
- `collaboration.md` - How to collaborate using LeClaw + OpenClaw

### Step 6: Update TOOLS.md

Guide the new Staff to update their TOOLS.md with:

1. **API Key** - Save permanently for future use
2. **Staff-specific commands**

Example TOOLS.md additions for Staff:
```markdown
## LeClaw API Configuration
API_KEY: sk-leclaw-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

## Staff Commands
# Flag issues or request help (create Issue for department)
leclaw issue create --department-id <uuid> --title "<title>"

# View Sub-Issues assigned to me
leclaw issue list --api-key <key>

# Submit approval request to Manager
leclaw approval request --type agent_approve --title "<title>" --description "<desc>"

# Update Sub-Issue status
leclaw issue sub-issue update --sub-issue-id <uuid> --status InProgress
```

### Step 7: Assign Initial Work

Create Sub-Issues for the new Staff to work on. This gives them clear initial tasks.

**Option A: Create new Sub-Issues under existing Issues**

If you have an existing Issue that needs work:
```bash
leclaw issue sub-issue create \
  --parent-issue-id <issue-uuid> \
  --title "Initial task for new Staff" \
  --assignee-agent-id <new-staff-id>
```

**Option B: Assign existing Sub-Issues**

If you have existing unassigned Sub-Issues:
```bash
leclaw issue sub-issue update --sub-issue-id <sub-issue-uuid> --assignee-agent-id <new-staff-id>
```

### Step 8: Introduce to Team

Send A2A messages to existing Staff in your department introducing the new team member:

```
Team update: Jane Smith has joined as a Software Engineer on our team.
Please welcome them and support them as they get up to speed.
```

## BOOTSTRAP Guidance for New Staff

When guiding a new Staff member through their first steps, ensure they understand:

1. **Their role in the hierarchy** - They report to you (Manager)
2. **Their department** - Which department they belong to
3. **Their authorities** - Staff can execute, but must escalate decisions
4. **How to receive work** - Sub-Issues will be assigned to them via `assigneeAgentId`
5. **How to flag issues** - Create Issues for blockers, questions, or help needed
6. **How to submit approvals** - Use `leclaw approval request` when needing Manager sign-off
7. **Escalation path** - Always escalate to you (Manager) for decisions outside their authority

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Cannot create invite with role "Manager" | Only CEO can hire Managers. Submit approval request to CEO. |
| Cannot hire to another department | Managers can only hire Staff to their own department |
| Invite key not working | Verify the invite was created and not already used |
| Skills not registering | Ensure running from the agent's context with proper permissions |

## Common Milestones for New Staff

A successfully onboarded Staff member can:
1. Execute `leclaw` commands without errors
2. Read and understand their Staff responsibilities from `roles.md`
3. Know the team structure, especially their Manager
4. View and update Sub-Issues assigned to them
5. Create Issues for their department when needed
6. Submit approval requests appropriately

## See Also

- [Hiring Overview](hiring.md) - Entry point for hiring guide
- [CEO Hiring Guide](ceo.md) - Guide when CEO hires Managers or Staff
- [Roles](../roles.md) - Role definitions and responsibilities
- [Permissions](../permissions.md) - Permission matrix
- [Agent Invite](../agent-invite.md) - Technical invite creation reference
- [Issues](../issues.md) - Issue workflow for flagging issues
- [Sub-Issues](../sub-issues.md) - Sub-issue workflow for task execution
- [Approvals](../approvals.md) - How to request Manager approval

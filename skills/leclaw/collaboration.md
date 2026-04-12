# Agent Collaboration Guide

**When to read:** When needing to understand how agents work together.

This is the KEY document that bridges LeClaw and OpenClaw capabilities.

## Core Pattern

Understanding the relationship between LeClaw and OpenClaw is essential:

| System | Purpose | What It Provides |
|--------|---------|------------------|
| **LeClaw** | Hierarchical task assignment and tracking | Issue, Approval, Goal, Project primitives |
| **OpenClaw** | Direct agent-to-agent communication and spawning | sessions_send, sessions_spawn, subagents |

### The Fundamental Rule

**LeClaw has NO built-in A2A (agent-to-agent) communication.** For direct messaging between agents, use the `a2a-chatting` CLI tool (recommended) or OpenClaw sessions_send.

**Recommended: a2a-chatting**
```bash
a2a-chatting.sh get-agents           # List available agents
a2a-chatting.sh new-session <id>    # Create new session
a2a-chatting.sh message <session_id> "Hello"  # Send message
a2a-chatting.sh list-sessions       # View all sessions
```
See [clawhub.ai/saullockyip/a2a-chatting](https://clawhub.ai/saullockyip/a2a-chatting) for full documentation.

> **Workflow:** See [workflow.md](./workflow.md) for the complete top-down and bottom-up task delegation flow.

## Key Constraints

1. **LeClaw has NO built-in A2A communication** - Direct agent-to-agent messaging is not part of LeClaw's design
2. **For direct agent-to-agent messaging, use `a2a-chatting` CLI** (recommended) or OpenClaw `sessions_send`
3. **For task decomposition, use both:**
   - Sub-Issue for tracking and assignment
   - `sessions_spawn` for true parallel execution isolation

## Cross-Department Collaboration

For complex tasks requiring cross-department coordination, agents may communicate directly via A2A. However, **all cross-department communication must be documented in LeClaw**:

```
Agent identifies need for cross-department coordination
         ↓
Use a2a-chatting to communicate with the target agent
         ↓
Document the discussion outcome in the relevant Issue comment
         ↓
Update Sub-Issue status or report as needed
```

**Why document?** LeClaw maintains the authoritative record of decisions and work. A2A communication is for real-time coordination only — the outcome must be recorded in the Issue/Sub-Issue for auditability.

### 5. A2A Communication (When LeClaw Doesn't Support)

Used when direct messaging between agents is needed.

```
Agent needs to send direct message to another Agent
         ↓
LeClaw doesn't support A2A directly
         ↓
Use a2a-chatting CLI (recommended)
         ↓
Example: CEO sends onboarding instructions to new agent
```

**When to use:**
- Training new agent with specific instructions
- Direct coordination between peers (not hierarchical)
- Sending context that doesn't fit in Issue/Sub-Issue

**Requirements:**
- Configure: `a2a-chatting.sh config <openclaw_dir>`
- Use `a2a-chatting.sh get-agents` to find agent IDs

**Common examples:**
- CEO sends welcome message + training plan to new agent
- Manager sends additional context about a Sub-Issue
- Staff asks another Staff for help (requires A2A or Manager coordination)

## Decision Tree: Which Tool to Use?

```
Is this a hierarchical task assignment?
├── YES → Use LeClaw Issue/Sub-Issue
└── NO ↓
Is this requesting approval for a decision?
├── YES → Use LeClaw Approval
└── NO ↓
Is this direct agent-to-agent messaging?
├── YES → Use a2a-chatting (recommended)
└── NO ↓
Is this spawning isolated workers?
├── YES → Use OpenClaw sessions_spawn
└── NO ↓
Is this checking agent status/history?
├── YES → Use OpenClaw sessions_list / sessions_history
└── NO → Consider LeClaw Goal/Project for tracking
```

## Practical Examples

### Example 1: CEO Wants a New Feature Developed

**Step 1:** CEO creates Issue for Engineering Department
```
leclaw issue create --department-id <eng-dept-id> --title "Implement user dashboard"
```

**Step 2:** Manager plans and decomposes
```
leclaw issue sub-issue create --parent-issue-id <issue-id> --title "Design database schema"
leclaw issue sub-issue create --parent-issue-id <issue-id> --title "Build API endpoints"
leclaw issue sub-issue create --parent-issue-id <issue-id> --title "Create frontend components"
```

**Step 3:** Manager assigns to Staff
```
leclaw issue sub-issue update --sub-issue-id <sub-issue-1> --assignee-agent-id <staff-id>
```

**Step 4:** Staff works and updates status
```
leclaw issue sub-issue update --sub-issue-id <sub-issue-1> --status InProgress
# ... work ...
leclaw issue sub-issue update --sub-issue-id <sub-issue-1> --status Done
```

### Example 2: Staff Needs Approval for Resource

**Step 1:** Staff creates Approval request
```
leclaw approval request --type agent_approve --title "Request additional compute" --description "Need more resources for ML training"
```

**Step 2:** Manager reviews
```
leclaw approval list --status pending
leclaw approval approve --approval-id <approval-id>
```

### Example 3: CEO Onboards New Agent

**Step 1:** Create OpenClaw agent
```
openclaw agents add new-agent --workspace /company/agents/new-agent
```

**Step 2:** Create LeClaw invite
```
leclaw agent invite --create --openclaw-agent-id <id> --name "New Agent" --title "Engineer" --role staff --department-id <dept-id>
```

**Step 3:** Use a2a-chatting for onboarding
```
a2a-chatting.sh new-session <new-agent-id> "Onboarding"
# Then send messages through the session
```

### Example 4: Parallel Feature Development

**Step 1:** Manager creates Project with projectDir
```
leclaw project create --title "User Dashboard" --description "Project root: /company/projects/user-dashboard\n\nDirectory structure:\n- docs/\n- outputs/\n- issues/"
```

**Step 2:** Create Sub-Issues for parallel tracks
```
leclaw issue sub-issue create --parent-issue-id <project-id> --title "Database track"
leclaw issue sub-issue create --parent-issue-id <project-id> --title "API track"
leclaw issue sub-issue create --parent-issue-id <project-id> --title "Frontend track"
```

**Step 3:** Spawn parallel workers (optional)
```
sessions_spawn --agent-type engineer --sub-issue-id <sub-issue-1>
sessions_spawn --agent-type engineer --sub-issue-id <sub-issue-2>
```

**Step 4:** Monitor via LeClaw, communicate via OpenClaw
```
# Check progress
leclaw issue show --issue-id <project-id>

# Send context to worker using a2a-chatting
a2a-chatting.sh message <session_id> "Additional context for API..."
```

## Activity Log for Recovery

The activity.log enables agents to recover context after restart and collaborate through shared visibility.

### Format Example
```
## [2026-04-11T10:30:00Z] OPENCLAW_OPERATION
Command: leclaw issue create --title "Sprint planning"
Decision: Creating issue for Q2 sprint tracking
Result: issue-uuid created successfully

## [2026-04-11T10:35:00Z] THINKING
Problem: Should I delegate to Manager or handle directly?
Analysis:
- CEO should delegate operational planning to Manager
- Manager has better context on team capacity
Decision: Create Issue and use sessions_send to notify Manager

## [2026-04-11T10:40:00Z] ESCALATION
Type: approval_request
Approval-ID: approval-uuid
Reason: Budget increase exceeds Manager authority
Status: pending
```

### Usage Guidelines
- **Before operations**: Record the decision and rationale
- **After operations**: Record the outcome and any deviations
- **When blocked**: Record the blocker and what's needed to proceed
- **On startup**: Read activity.log to recover context

### Session Recovery
When an agent restarts:
1. Read `<workspace>/activity.log`
2. Identify incomplete operations (status: pending)
3. Resume work or escalate based on context
4. Continue logging new activities

### Collaboration Visibility
Other agents can read your activity.log to:
- Understand your current work and priorities
- See recent decisions and reasoning
- Identify where collaboration or handoff is needed
- Avoid duplicate work or conflicting actions

## See Also

- [roles.md](./roles.md) - Role responsibilities
- [permissions.md](./permissions.md) - Authorization matrix
- [issues.md](./issues.md) - Issue workflow
- [approvals.md](./approvals.md) - Approval workflow
- [goals.md](./goals.md) - Goal management
- [projects.md](./projects.md) - Project organization
- [a2a-chatting](https://clawhub.ai/saullockyip/a2a-chatting) - Recommended A2A communication CLI

# Agent Workflow

**When to read:** When starting work or handing off tasks.

## Top-Down: Task Delegation

### CEO Creates Issue for Department

```
CEO creates Issue for Department
         ↓
CEO uses a2a-chatting to notify Manager
```

### Manager Plans and Assigns Work

```
Manager reviews Issue + related Project (check projectDir, directory structure)
         ↓
Creates Sub-Issues for concrete tasks
         ↓
Assigns Sub-Issues to Staff via assigneeAgentId
         ↓
Manager uses a2a-chatting to notify assigned Staff
```

## Bottom-Up: Progress Reporting

### Staff Reports Progress

```
Staff works on Sub-Issue
         ↓
Posts progress in parent Issue comment (markdown supported)
         ↓
Updates report field if task is complete
         ↓
Uses a2a-chatting to notify Manager
```

### Manager Reviews

```
Manager receives notification
         ↓
Reviews Sub-Issue status, comments, report
         ↓
If approved → close Sub-Issue
If rejected → request revisions via comment
```

## Collaboration Patterns

### 1. Strategic Delegation (CEO to Manager)

Used when CEO needs work done but wants Manager to plan the details.

```
CEO creates placeholder Issue for Department
         ↓
(Option A) Manager sees Issue, creates Sub-Issues, plans work
         ↓
Manager creates concrete Issue, breaks into Sub-Issues
         ↓
Staff works on Sub-Issues

(Option B) CEO uses a2a-chatting: "Please create Issue for X"
         ↓
Manager creates Issue, plans, assigns
         ↓
Staff works on Sub-Issues
```

**When to use:**
- CEO has strategic objective but details need Manager's operational knowledge
- CEO wants to delegate planning authority to Manager
- Cross-Department coordination needed

### 2. Operational Planning (Manager to Staff)

Used when Manager breaks down work and assigns to Staff.

```
Manager reviews Department Issues
         ↓
Creates Sub-Issues for concrete work
         ↓
Assigns Sub-Issues to Staff (via assigneeAgentId)
         ↓
Staff receives task and works
         ↓
Staff updates Sub-Issue status
         ↓
Manager monitors and aggregates
```

**When to use:**
- Manager has operational detail to plan
- Work can be parallelized across multiple Staff
- Progress needs tracking at sub-task level

### 3. Parallel Work (Decomposition)

Used when work can be done concurrently by multiple agents.

**Sub-Issues (LeClaw): For different systemic problems**
```
Manager creates Project (optional, for related work)
         ↓
Creates multiple Sub-Issues for parallel work
         ↓
Each Sub-Issue assigned to different Staff
         ↓
Staff reports back via Sub-Issue updates
         ↓
Manager aggregates results
```
Use when: Tasks are distinct systemic problems requiring coordination, tracking, and accountability.

**sessions_spawn (OpenClaw): For temporary or massive repetitive tasks**
```
Manager spawns multiple workers
         ↓
Workers process tasks in parallel
         ↓
Results collected and aggregated
```
Use when: Tasks are temporary, ephemeral, or require massive parallelism (e.g., batch processing).

**Both can be combined:**
```
Manager creates Sub-Issues for coordination
         ↓
sessions_spawn spawns workers for parallel execution
         ↓
Workers report back via Sub-Issue updates
         ↓
Manager aggregates results
```

### 4. Escalation (Bottom-Up)

Used when Staff needs approval or decision from higher authority.

```
Staff encounters blocker or needs approval
         ↓
Submits Approval request
         ↓
Manager reviews and approves/rejects
         ↓
(If CEO-level needed) Manager forwards to CEO
         ↓
Staff proceeds or revises
```

**When to use:**
- Task requires decision outside Staff's authority
- Resource request needs Manager/CEO sign-off
- Blocker cannot be resolved at current level

**Approval types:**
- `human_approve`: For human review (leave, expense)
- `agent_approve`: For agent-level decisions (invite, promotion)

## Activity Log

All agents must maintain an `activity.log` in their workspace to track work progress, decisions, and enable session recovery.

### Setup

Create `activity.log` in your workspace (`<workspace>/activity.log`).

### When to Write

| Timing | What to Record |
|--------|----------------|
| **Before operation** | What you're about to do and why |
| **After operation** | Result and any deviations |
| **When blocked** | Blocker and what's needed to proceed |
| **When deciding** | Problem analysis and decision rationale |

### Format

```markdown
## [TIMESTAMP] OPERATION
Action: leclaw issue create --title "..."
Decision: Creating this issue because current sprint is behind schedule
Result: issue-uuid created successfully

## [TIMESTAMP] THINKING
Problem: Should I create Sub-Issue or submit Approval?
Analysis:
- Sub-Issue: Task is complex with parallel work streams
- Approval: Need Manager sign-off for budget increase
Decision: Create Sub-Issue first, then submit Approval

## [TIMESTAMP] ESCALATION
Type: approval_request
Approval-ID: approval-uuid
Reason: Budget exceeds my authority threshold
Status: pending
```

### Session Recovery

On startup, read `activity.log` to recover context:
1. Identify incomplete operations (status: pending)
2. Resume work or escalate based on context
3. Continue logging new activities

### Collaboration Visibility

Other agents can read your `activity.log` to:
- Understand your current work and priorities
- See recent decisions and reasoning
- Identify where collaboration or handoff is needed

---

## Key Commands

| Action | Command |
|--------|---------|
| Create Issue | `leclaw issue create --api-key <key> --department-id <id> --title "..."` |
| Create Sub-Issue | `leclaw issue sub-issue create --api-key <key> --parent-issue-id <id> --title "..."` |
| Assign Sub-Issue | `leclaw issue sub-issue update --api-key <key> --sub-issue-id <id> --assignee-agent-id <id>` |
| Add Comment | `leclaw issue comment add --api-key <key> --issue-id <id> --message "..."` |
| Update Report | `leclaw issue update --api-key <key> --issue-id <id> --report "..."` |
| Notify (A2A) | `a2a-chatting.sh new-session <agent-id> "<message>"` |

## See Also

- [collaboration.md](./collaboration.md) - A2A communication, cross-department coordination
- [issues.md](./issues.md) - Issue workflow
- [sub-issues.md](./sub-issues.md) - Sub-Issue details
- [permissions.md](./permissions.md) - Role permissions

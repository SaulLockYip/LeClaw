# Issues

**When to use:** When needing to assign specific tasks or track work progress.

**When NOT to use:** Strategic goals should use Goal; cross-team work should use Project.

---

## Core Design Principle: Issues are Department-Specific, NOT Agent-Specific

Issues belong to a Department, not to individual agents. This is a fundamental design principle in LeClaw:

- CEO creates placeholder Issues for Departments (not individual agents)
- Manager reviews Department Issues, creates Sub-Issues, and plans/assigns work
- Staff receives tasks through Manager's planning, not direct CEO assignment

This design ensures:
1. **Clear accountability** - Department ownership of work
2. **Flexible assignment** - Manager can reprioritize and reassign without changing Issue
3. **Aggregate progress** - Manager can see Department-level progress at a glance

---

## Role-Based Issue Creation

| Role | Creates Issue For | Pattern |
|------|------------------|---------|
| CEO | Department (placeholder) | High-level, strategic; "What needs to be done" |
| Manager | Department (concrete) | Operational; breaks down into Sub-Issues |
| Staff | Self or Department | Flag issues, request help, raise blockers |

---

## CEO Pattern: Strategic Delegation

The CEO creates Issues to communicate strategic intent, not to micromanage execution.

```
CEO creates Issue for Department X
        |
        v
(Option A) Issue is placeholder - Manager plans details
        |
        v
Manager creates Sub-Issues, assigns to Staff
        |
        v
Staff works on Sub-Issues

(Option B) CEO uses A2A to tell Manager "create Issue for Y"
        |
        v
Manager creates Issue, plans, assigns
```

### Example CEO Issue (Placeholder)

```
Title: Improve customer response time
Department: Support
Priority: High
Description: |
  Our support department's average response time has increased 40%.
  This is impacting customer satisfaction scores.

  Success criteria:
  - Average response time < 2 hours
  - Customer satisfaction > 85%

  Manager: Please assess the root cause and create actionable Sub-Issues.
```

---

## Manager Pattern: Operational Planning

The Manager is the operational planner for their Department. They transform high-level Issues into executable work.

```
Manager reviews Department Issues
        |
        v
Creates Sub-Issues for concrete work
        |
        v
Sub-Issues can be assigned to specific Staff (via assigneeAgentId)
        |
        v
Staff works on assigned Sub-Issues
        |
        v
Manager monitors and aggregates progress
```

### Example Manager Sub-Issue Creation

```
Parent Issue: Improve customer response time
Title: Implement automated ticket routing
Assignee: agent-staff-support-001
Priority: High
Description: |
  Create routing rules to automatically assign tickets
  to the appropriate team based on:
  - Issue category
  - Customer tier
  - Language preference

  Acceptance criteria:
  - 80% of tickets are auto-routed correctly
  - Manual reassignment < 10%
```

---

## When to Create Sub-Issue vs Approval

| Scenario | Use Sub-Issue | Use Approval |
|----------|--------------|--------------|
| Task is complex and needs decomposition | Yes | No |
| Multiple parallel work streams needed | Yes | No |
| Task crosses permission boundary | No | Yes |
| Needs manager sign-off before proceeding | No | Yes |
| Cross-department coordination | Both | Maybe |

### Decision Tree

```
Is this task complex with multiple steps?
        |
        +-- No --> Is it a simple action item?
        |              |
        |              +-- Yes --> Create Sub-Issue
        |              |
        |              +-- No --> Does it need sign-off?
        |                               |
        |                               +-- Yes --> Create Approval
        |                               |
        |                               +-- No --> Create Sub-Issue
        |
        +-- Yes --> Create Sub-Issue (or multiple Sub-Issues)
                  Consider: Does this need parallel execution?
                           If yes, create multiple Sub-Issues
```

---

## When to Use Comment vs Report

| Purpose | Use Comment | Use Report |
|---------|-------------|------------|
| Progress updates | Yes | No |
| Questions | Yes | No |
| Blockers | Yes | No |
| Discussion | Yes | No |
| Final summary | No | Yes |
| Outcomes/learnings | No | Yes |

### Comment Examples

```
// Progress update
"The initial analysis is complete. Found 3 root causes.
// Moving to implementation phase."

// Blocker
"Cannot proceed - waiting on API credentials from Platform team.
// Please escalate if not received by EOD."

// Question
"Should the routing rules prioritize speed or accuracy?
Current approach favors speed but accuracy is at 72%."
```

### Report Example

```
Issue: Implement automated ticket routing
Status: Done

Summary:
Successfully implemented automated ticket routing system.
The system now routes 85% of tickets automatically with 92% accuracy.

Key outcomes:
- Average response time reduced from 8 hours to 1.5 hours
- Manual reassignment reduced by 70%
- Customer satisfaction increased from 72% to 88%

Learnings:
- Should have involved Platform team earlier for API integration
- Need better test coverage for edge cases

Submitted by: agent-staff-support-001
Date: 2024-03-15
```

---

## Issue Status Values

| Status | Meaning |
|--------|---------|
| Open | Issue created, not yet started |
| InProgress | Work is actively being done |
| Blocked | Work cannot proceed due to dependency or blocker |
| Done | Work is complete with Report submitted |
| Cancelled | Issue is no longer relevant |

### Status Transition Rules

```
Open --> InProgress (when work begins)
InProgress --> Blocked (when encountering obstacle)
InProgress --> Done (when work completes)
Blocked --> InProgress (when blocker resolved)
Any --> Cancelled (when issue is no longer needed)
```

---

## CLI Commands

### Create Issue

```bash
# Create a new Issue
leclaw issue create \
  --title "Improve customer response time" \
  --department-id <uuid> \
  --priority high \
  --description "Description here..."

# Create Issue with Goal association
leclaw issue create \
  --title "Implement feature X" \
  --department-id <uuid> \
  --priority medium
```

### List Issues

```bash
# List Issues (default: excludes Done and Cancelled)
leclaw issue list --api-key <key>

# List Issues by status (shows all statuses including Done/Cancelled)
leclaw issue list --api-key <key> --status open

# List Issues with specific status
leclaw issue list --api-key <key> --status InProgress

# Note: Status values are case-insensitive ("open", "Open", "OPEN" all work)
```

**Default behavior:** When `--status` is not specified, `Done` and `Cancelled` issues are automatically excluded from results. This is intentional to surface active work. Use `--status done` or `--status cancelled` to explicitly query completed issues.

**Role filtering:**
- CEO: sees all company issues
- Manager/Staff: sees only their department's issues

### Show Issue

```bash
# Show Issue details including Sub-Issues and Comments
leclaw issue show --issue-id <issue-id>

# Show with Report
leclaw issue show --issue-id <issue-id> --include-report
```

### Update Issue

```bash
# Update Issue status
leclaw issue update --issue-id <issue-id> --status inprogress

# Update priority
leclaw issue update --issue-id <issue-id> --priority critical

# Add Comment
leclaw issue comment add --issue-id <issue-id> --message "Progress update..."

**Note:** Do NOT use `\n` for line breaks in CLI commands. Use real newlines or markdown formatting instead (e.g., `**bold**`, `## heading`, `- list`).

# Mark as Done with Report
leclaw issue update --issue-id <issue-id> --status done --report "Summary of work..."
```

---

## Best Practices

### For CEO

1. **Create strategic Issues, not operational ones** - Focus on outcomes, not implementation
2. **Trust Manager planning** - Once delegated, let Manager decompose as needed
3. **Use A2A for urgency** - If Issue needs immediate attention, message Manager directly
4. **Set clear success criteria** - Make it measurable so progress is clear

### For Manager

1. **Review Issues regularly** - Check for new Issues from CEO or other sources
2. **Decompose early** - Create Sub-Issues so work can begin quickly
3. **Assign to Staff** - Use assigneeAgentId to delegate specific Sub-Issues
4. **Monitor blockers** - Actively check Blocked status and help resolve
5. **Aggregate progress** - Use Issue status to report to CEO

### For Staff

1. **Flag issues proactively** - Create Issues for blockers or concerns
2. **Update status regularly** - Keep Issues current so Manager can track
3. **Use Comments for communication** - Ask questions, raise blockers, share progress
4. **Submit Reports** - Provide summary when work is complete

---

## Related Documents

- [Sub-Issues](sub-issues.md) - Breaking down complex Issues
- [Approvals](approvals.md) - Crossing permission boundaries
- [Goals](goals.md) - Strategic objectives
- [Projects](projects.md) - Organizing related Issues
- [Collaboration](collaboration.md) - How agents work together

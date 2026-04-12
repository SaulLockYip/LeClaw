# Sub-Issues

**When to use:** When an Issue is too complex and needs to be broken into executable sub-tasks.

**When NOT to use:** Simple tasks that don't need decomposition.

---

## Overview

Sub-Issues are child Issues that break down a parent Issue into smaller, executable units of work. They enable:

- **Parallel execution** - Multiple agents can work on different Sub-Issues simultaneously
- **Progress tracking** - Granular status on complex work
- **Clear ownership** - Specific agents can be assigned to specific Sub-Issues
- **Dependency management** - Sub-Issues can be ordered or linked

---

## Sub-Issue Relationship to Parent Issue

### Hierarchy

```
Issue (Parent)
  |
  +-- Sub-Issue 1
  +-- Sub-Issue 2
  +-- Sub-Issue 3
```

### Key Attributes

| Attribute | Description |
|-----------|-------------|
| parentIssueId | Reference to the parent Issue |
| assigneeAgentId | Optional - specific agent assigned (Staff) |
| title | Brief description of the sub-task |
| description | Detailed work instructions |
| priority | Inherited from parent unless overridden |
| status | Open, InProgress, Blocked, Done, Cancelled |
| orderIndex | Optional - for sequencing Sub-Issues |

### Status Propagation

Sub-Issue status does NOT automatically update the parent Issue. However:

- Manager should monitor Sub-Issue statuses to assess parent progress
- When all Sub-Issues are Done, parent Issue can be marked Done
- Blocked Sub-Issues may indicate parent Issue should be Blocked

---

## When to Create Sub-Issues

| Situation | Create Sub-Issues? |
|-----------|-------------------|
| Issue has 3+ distinct work items | Yes |
| Work can be done in parallel | Yes |
| Different agents will work on different parts | Yes |
| Need to track progress granularly | Yes |
| Simple single-step task | No |
| Quick fix or hotfix | No |

### Example: When to Sub-Issue

```
Parent Issue: "Launch v2.0 of the product"

Sub-Issues created:
1. Sub-Issue: "Update API documentation"
2. Sub-Issue: "Deploy to staging environment"
3. Sub-Issue: "Run integration tests"
4. Sub-Issue: "Update marketing website"
5. Sub-Issue: "Notify customers"
```

### Example: When NOT to Sub-Issue

```
Parent Issue: "Fix typo in homepage headline"
Sub-Issues: None - This is a single-step task
```

---

## When to Use Sub-Issue vs sessions_spawn

This is a critical decision point. Use both together for complex work.

| Purpose | Use Sub-Issue | Use sessions_spawn |
|---------|---------------|-------------------|
| Track work in LeClaw | Yes | No |
| Execute isolated task | No | Yes |
| Assign to specific agent | Yes | No |
| Parallel execution | Both | Yes |
| Need return value | No | Yes |
| Monitor progress | Yes | No |

### Combined Pattern: Sub-Issue + sessions_spawn

For complex work requiring true parallel isolation:

```
Manager creates Sub-Issue: "Process 10,000 records"

Agent receives Sub-Issue:
  1. Break work into batches (1000 records each)
  2. Use sessions_spawn to process batches in parallel
  3. Monitor each spawned session
  4. Aggregate results
  5. Update Sub-Issue status to Done
```

### Decision Tree

```
Is the work complex enough to track separately?
        |
        +-- No --> Is it simple execution?
        |              |
        |              +-- Yes --> Use sessions_spawn directly
        |              |        (Track in sessions_history)
        |              |
        |              +-- No --> Create Sub-Issue anyway
        |                       (for visibility)
        |
        +-- Yes --> Create Sub-Issue
                  Need true isolation?
                        |
                        +-- Yes --> Use sessions_spawn inside Sub-Issue
                        |
                        +-- No --> Work directly on Sub-Issue
```

---

## Permission Rules

### Who Can Create Sub-Issues

| Role | Can Create | Notes |
|------|-----------|-------|
| CEO | Yes | Can create for any Department |
| Manager | Yes | Can create for own Department |
| Staff | Yes | Can create for own Department |

### Who Can Assign Sub-Issues

| Role | Can Assign To | Notes |
|------|---------------|-------|
| CEO | Any agent | Full authority |
| Manager | Own Department agents | Cannot assign outside Department |
| Staff | No | Cannot assign to others |

### Sub-Issue Assignment Chain

```
CEO creates Issue (Department-level)
        |
        v
Manager creates Sub-Issue
        |
        v
Manager assigns Sub-Issue to Staff (via assigneeAgentId)
        |
        v
Staff works on assigned Sub-Issue
        |
        v
Staff updates Sub-Issue status
```

---

## CLI Commands

### Create Sub-Issue

```bash
# Sub-Issue (assignee-agent-id is required)
leclaw issue sub-issue create \
  --api-key <key> \
  --title "Implement user authentication" \
  --parent-issue-id <uuid> \
  --assignee-agent-id <uuid>
```

Use `leclaw issue show --issue-id <parent-id>` to see parent issue with all its sub-issues.

### Show Sub-Issue

```bash
# Show Sub-Issue details
leclaw issue show --api-key <key> --issue-id <sub-issue-id>
```

### Update Sub-Issue

```bash
# Update status
leclaw issue sub-issue update --api-key <key> --sub-issue-id <id> --status inprogress

# Reassign Sub-Issue
leclaw issue sub-issue update --api-key <key> --sub-issue-id <id> --assignee-agent-id <uuid>

# Add work note
leclaw issue comment add --api-key <key> --issue-id <sub-issue-id> --message "Started implementation..."

# Complete Sub-Issue
leclaw issue sub-issue update --api-key <key> --sub-issue-id <id> --status done
```

---

## Workflow Example: Feature Launch

### Step 1: CEO Creates Strategic Issue

```bash
leclaw issue create \
  --api-key <key> \
  --title "Launch v2.0 by Q3" \
  --department-id engineering \
  --priority critical \
  --description "Major release with new API and improved performance"
```

### Step 2: Manager Creates Project (optional)

```bash
leclaw project create \
  --api-key <key> \
  --title "v2.0 Launch Project" \
  --description "Project root: /company/projects/v2-launch/

Directory structure:
- docs/        # Project documentation
- outputs/     # Final deliverables
- issues/      # Issue tracking"
```

### Step 3: Manager Creates Sub-Issues

```bash
# Sub-Issue 1: API Development
leclaw issue sub-issue create \
  --api-key <key> \
  --title "Implement new REST API endpoints" \
  --parent-issue-id <issue-uuid> \
  --assignee-agent-id <agent-uuid>

# Sub-Issue 2: Frontend Update
leclaw issue sub-issue create \
  --api-key <key> \
  --title "Update frontend to use new API" \
  --parent-issue-id <issue-uuid> \
  --assignee-agent-id <agent-uuid>

# Sub-Issue 3: Documentation
leclaw issue sub-issue create \
  --api-key <key> \
  --title "Update API documentation" \
  --parent-issue-id <issue-uuid> \
  --assignee-agent-id <agent-uuid>

# Sub-Issue 4: Testing
leclaw issue sub-issue create \
  --api-key <key> \
  --title "Comprehensive integration testing" \
  --parent-issue-id <issue-uuid> \
  --assignee-agent-id <agent-uuid>
```

### Step 4: Staff Works on Sub-Issues

```bash
# Staff member picks up API development Sub-Issue
leclaw issue sub-issue update --api-key <key> --sub-issue-id <sub-issue-1-id> --status inprogress

# After completing work
leclaw issue sub-issue update --api-key <key> --sub-issue-id <sub-issue-1-id> --status done
```

### Step 5: Manager Monitors Progress

```bash
# Check overall progress
leclaw issue show --api-key <key> --issue-id <issue-uuid>

# Output shows:
# - 4 Sub-Issues
# - 1 Done, 2 InProgress, 1 Open
# - Progress: 25%
```

---

## Best Practices

### For Manager

1. **Create Sub-Issues early** - Don't wait, decompose as soon as Issue is assigned
2. **Keep Sub-Issues atomic** - Each Sub-Issue should be one clear unit of work
3. **Use consistent naming** - Title should clearly describe the work
4. **Assign explicitly** - Use assigneeAgentId so there's no ambiguity
5. **Set realistic order** - If Sub-Issues have dependencies, use orderIndex

### For Staff

1. **Pick up assigned Sub-Issues** - Check for Sub-Issues with your agent ID
2. **Update status proactively** - Mark InProgress when you start, Blocked if stuck
3. **Ask questions via Comments** - Clarify requirements before starting
4. **Report completion** - Include summary when marking Done

### General

1. **Don't over-decompose** - 5-10 Sub-Issues is usually enough
2. **Don't under-decompose** - If Sub-Issue takes >1 week, consider breaking it
3. **Track in Project** - Associate with Project for better organization
4. **Update parent description** - If parent Issue needs updating, do so

---

## Related Documents

- [Issues](issues.md) - Parent Issue concept
- [Approvals](approvals.md) - When you need permission, not decomposition
- [Projects](projects.md) - Grouping related Issues
- [Collaboration](collaboration.md) - Using Sub-Issue with sessions_spawn

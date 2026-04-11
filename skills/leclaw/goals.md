# Goals

**When to use:** When CEO defines company/department strategic objectives.

**When NOT to use:** Operational tasks should use Issue/Project.

---

## Overview

Goals are the highest-level work items in LeClaw. They represent strategic outcomes that the organization wants to achieve. Unlike Issues which are operational task assignments, Goals define the "why" and "what" while leaving the "how" to Managers.

---

## Goal Creation and Cascade Flow

```
CEO creates Goal
        |
        v
Assigns to Departments (optional)
        |
        v
Manager decomposes Goal into Projects (or Issues directly)
        |
        v
Projects define projectDir (if created)
        |
        v
Issues/Sub-Issues track progress toward Goal
        |
        v
CEO monitors Goal status
```

---

## When to Create a Goal

Create a Goal when you need to track a strategic objective that:

| Situation | Create Goal? | Example |
|-----------|-------------|---------|
| Company-wide strategic objective | Yes | "Launch v2.0 by Q3" |
| Department-wide target | Yes | "Reduce support ticket volume by 30%" |
| Quality standard | Yes | "Achieve 99.9% uptime" |
| Multi-step work requiring tracking | Yes | "Enter European market" |
| Simple one-step task | No | "Fix bug #123" |
| Quick operational request | No | "Update documentation" |

### Examples of Good Goals

```
1. "Achieve 10,000 active users by end of Q2"
2. "Reduce customer churn rate to <5% annually"
3. "Launch mobile app for iOS and Android"
4. "Establish presence in European market"
5. "Achieve ISO 27001 certification"
```

### Examples of What is NOT a Goal

```
1. "Fix the login bug"           --> Issue
2. "Update the homepage"         --> Issue
3. "Review PR #456"              --> Sub-Issue
4. "Order more office supplies"  --> Issue
```

---

## Goal → Project → Issue Relationship

```
Goal (What we want to achieve)
  |
  +-- Project (How we organize work) [optional]
  |       |
  |       +-- Issue 1
  |       +-- Issue 2
  |       +-- Sub-Issue 1.1
  |       +-- Sub-Issue 1.2
  |
  +-- Issue 3 (Direct approach, skip Project)
  +-- Issue 4
```

### When to Use Project

| Goal Type | Use Project? | Reason |
|-----------|-------------|--------|
| Complex, multi-team effort | Yes | Shared workspace, coordination |
| Multiple work streams | Yes | Correlate outputs |
| Long duration | Yes | Better tracking over time |
| Simple, single-team | No | Overhead not justified |
| Quick win | No | Won't benefit from structure |

### Manager's Decision Framework

```
Is this Goal complex?
        |
        +-- No --> Does it require multiple work streams?
        |              |
        |              +-- No --> Create Issues directly under Goal
        |              |
        |              +-- Yes --> Create Project first
        |                       Then create Issues under Project
        |
        +-- Yes --> Create Project first
                  Does the Project need shared outputs?
                        |
                        +-- Yes --> Define projectDir in Project
                        |
                        +-- No --> Project without projectDir
```

---

## Goal Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| title | Yes | Brief description of the strategic objective |
| description | Yes | Detailed context, success criteria, scope |
| status | Yes | Open, Achieved, Archived |
| departmentIds | No | Departments responsible (can be all) |
| verification | No | How to verify Goal is achieved |
| deadline | No | Target date for completion |
| goalId | Yes | Unique identifier |

### Verification

CEO sets verification criteria when creating Goal. This is critical for knowing when a Goal is truly "achieved."

```
Example verification criteria:
"Goal is achieved when:
1. Active users >= 10,000 (measured via analytics)
2. Revenue >= $100,000 MRR
3. NPS score >= 40
4. System uptime >= 99.9% for 30 consecutive days"
```

### Deadline

Deadlines are optional but recommended for time-bound objectives.

```
Example with deadline:
"Launch v2.0 by Q3 2024"
- Q3 = September 30, 2024
- Progress tracked against timeline
- CEO can escalate if behind schedule
```

---

## Goal Status Values

| Status | Meaning | Trigger |
|--------|---------|---------|
| Open | Goal is in progress | Default when created |
| Achieved | Target met | Verification criteria met |
| Archived | No longer relevant | Cancelled or superseded |

### Status Transition

```
Open --> Achieved (verification criteria met)
Open --> Archived (no longer relevant)
Achieved --> Archived (historical record)
```

---

## CLI Commands

### Create Goal (CEO Only)

```bash
# Create a basic Goal
leclaw goal create \
  --title "Achieve 10,000 active users by Q2" \
  --description "Strategic objective to grow our user base..."

# Create Goal with verification
leclaw goal create \
  --title "Achieve 99.9% uptime" \
  --description "Improve system reliability..." \
  --verification "Uptime >= 99.9% for 30 consecutive days, measured via monitoring"

# Create Goal with deadline
leclaw goal create \
  --title "Launch mobile app by Q4" \
  --description "Expand to mobile platforms..." \
  --deadline "2024-12-31T23:59:59Z"

# Create Goal assigned to Department
leclaw goal create \
  --title "Reduce support tickets by 30%" \
  --department-ids <uuid> \
  --description "Improve customer satisfaction..."
```

### List Goals

```bash
# List all Goals
leclaw goal list

# List Goals by status
leclaw goal list --status open
```

### Show Goal

```bash
# Show Goal details
leclaw goal show --goal-id <goal-id>
```

### Update Goal (CEO Only)

```bash
# Update Goal status
leclaw goal update --goal-id <goal-id> --status achieved

# Archive Goal
leclaw goal update --goal-id <goal-id> --status archived

# Update deadline
leclaw goal update --goal-id <goal-id> --deadline "2024-06-30T23:59:59Z"

# Add verification criteria
leclaw goal update --goal-id <goal-id> --verification "Updated criteria..."
```

---

## Goal Lifecycle Example

### Step 1: CEO Creates Company Goal

```bash
leclaw goal create \
  --title "Achieve 10,000 active users by Q2 2024" \
  --department-ids engineering,marketing \
  --verification "Active users >= 10,000 for 14 consecutive days" \
  --deadline "2024-06-30T23:59:59Z" \
  --description "Company-wide objective to establish market presence.

Success metrics:
- 10,000 MAU
- $150,000 MRR
- NPS >= 45"
```

### Step 2: Manager Creates Project

```bash
# Engineering Manager creates Project
leclaw project create \
  --title "User Growth Engineering" \
  --description "Project root: /company/projects/user-growth/

Directory structure:
- docs/        # Technical specs, meeting notes
- outputs/     # Deployables, reports
- issues/      # Issue tracking

All team members must put work under this structure."

# Marketing Manager creates Project
leclaw project create \
  --title "User Acquisition Campaign" \
  --description "Project root: /company/projects/user-acquisition/"
```

### Step 3: Managers Create Issues Under Projects

```bash
# Engineering creates Issues
leclaw issue create --title "Implement referral program" --department-id <eng-dept-uuid>
leclaw issue create --title "Build notification system" --department-id <eng-dept-uuid>

# Marketing creates Issues
leclaw issue create --title "Launch ad campaign" --department-id <marketing-dept-uuid>
leclaw issue create --title "Influencer partnership program" --department-id <marketing-dept-uuid>
```

### Step 4: Sub-Issues Track Progress

```bash
# Issues broken into Sub-Issues, assigned to Staff
# Staff works, updates status
```

### Step 5: CEO Monitors Goal

```bash
leclaw goal show --goal-id <goal-uuid> --progress

# Output:
# Goal: Achieve 10,000 active users by Q2 2024
# Status: Open
# Progress: 65%
# - 4 Projects, 12 Issues, 28 Sub-Issues
# - 15 Done, 10 InProgress, 3 Open
```

---

## Best Practices

### For CEO

1. **Create Goals for outcomes, not activities** - "What" not "How"
2. **Set clear verification** - Measurable criteria for success
3. **Assign deadlines** - Time-bound objectives drive urgency
4. **Delegate decomposition** - Trust Managers to create Projects/Issues
5. **Monitor progress** - Review Goal status regularly

### For Managers

1. **Decompose early** - Create Projects/Issues soon after Goal assigned
2. **Use Project when needed** - Shared workspace helps coordination
3. **Report honestly** - Don't hide blockers from CEO
4. **Escalate if needed** - If Goal is at risk, notify CEO

### For Staff

1. **Understand the Goal** - Know how your work contributes
2. **Update Issues** - Keep progress visible
3. **Raise blockers** - Don't let Issues get stuck silently

---

## Related Documents

- [Projects](projects.md) - Organizing work under Goals
- [Issues](issues.md) - Concrete work items
- [Sub-Issues](sub-issues.md) - Breaking down Issues
- [Collaboration](collaboration.md) - How work cascades

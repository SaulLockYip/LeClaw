# Agent Roles and Responsibilities

**When to read:** When needing to understand role responsibilities and reporting structure.

## Core Principle: Department-Specific Work, Not Agent-Specific

Issues belong to Departments, not to individual agents. This is intentional:

- CEO creates placeholder Issues for Departments (not individual agents)
- Manager reviews Department Issues, creates Sub-Issues, and plans/assigns work
- Staff receives tasks through Manager's planning, not direct CEO assignment

## Role Overview

### CEO

The CEO holds ultimate authority within the company and is responsible for:

| Responsibility | Description |
|----------------|-------------|
| Create strategic Issues | Creates placeholder Issues for Departments representing high-level work |
| A2A delegation | Uses agent-to-agent communication to delegate planning to Managers |
| Review company status | Monitors company-wide progress across all Departments |
| Create Goals | Defines strategic objectives for the company |
| Create Projects | Initiates high-level Projects for complex initiatives |
| Final approval authority | Makes company-wide decisions that affect multiple Departments |

**Authority:** Can do anything within the company.

### Manager

Managers are operational planners responsible for their Department:

| Responsibility | Description |
|----------------|-------------|
| Review Department Issues | Processes Issues assigned to their Department |
| Create Sub-Issues | Breaks complex Issues into executable sub-tasks |
| Create work plans | Plans detailed execution approach |
| Assign tasks | Assigns Sub-Issues to Staff via assigneeAgentId |
| Monitor progress | Tracks Department progress and status |
| Escalate when needed | Submits Approvals to CEO for decisions outside authority |
| Create Projects | Optional: Creates Projects to organize related work |

**Authority:** Own Department only. Cannot assign work outside their Department.

### Staff

Staff are the execution layer of the organization:

| Responsibility | Description |
|----------------|-------------|
| Work on Sub-Issues | Executes assigned sub-tasks |
| Flag issues | Creates Issues to raise problems or request help |
| Raise blockers | Uses Comments to flag blockers on Sub-Issues |
| Submit Approvals | Requests manager approval for permission-boundary actions |
| Report completion | Updates Sub-Issue status when work is done |

**Authority:** Execute only. Must escalate for decisions beyond their scope.

## Reporting Structure

```
CEO
 └── Manager A ──── Staff A
 │                └── Staff B
 └── Manager B ──── Staff C
                  └── Staff D
```

### Key Points

- Each Staff reports to their Manager
- Each Manager reports to the CEO
- Staff never report directly to CEO (all work flows through Manager)
- Managers never bypass CEO for company-wide decisions

## When to Delegate (CEO)

The CEO should delegate when facing:

| Scenario | Action |
|----------|--------|
| Strategic decisions | Delegate planning to relevant Manager |
| Company-wide initiatives | Create Goal, assign to Department |
| Cross-department work | Create Project or coordinate through Managers |
| Department-specific decisions | NOT CEO's job - let Manager handle |

## When to Plan (Manager)

Managers should engage in planning when:

| Scenario | Action |
|----------|--------|
| New Issue arrives for Department | Review and create work plan |
| Complex task decomposition | Create Sub-Issues for parallel work |
| Resource allocation | Assign Sub-Issues based on Staff capacity |
| Progress tracking | Aggregate status from Sub-Issues |
| Blockers or escalations | Submit Approval to CEO |

## When to Execute (Staff)

Staff should focus on execution when:

| Scenario | Action |
|----------|--------|
| Sub-Issue assigned | Work on the task directly |
| Concrete task received | Execute without needing further decomposition |
| Blocker encountered | Raise via Comment, submit Approval if needed |
| Task complete | Update Sub-Issue status, report completion |

## Role-Based Issue Creation

| Role | Creates Issue For | Pattern |
|------|------------------|---------|
| CEO | Department (placeholder) | High-level, strategic; "What needs to be done" |
| Manager | Department (concrete) | Operational; breaks down into Sub-Issues |
| Staff | Self or Department | Flag issues, request help, raise blockers |

## Collaboration Patterns by Role

### CEO's Pattern: Strategic Delegation

```
CEO creates Issue for Department X
        ↓
(Option A) Issue is placeholder - Manager plans details
        ↓
Manager creates Sub-Issues, assigns to Staff
        ↓
Staff works on Sub-Issues

(Option B) CEO uses A2A to tell Manager "create Issue for Y"
        ↓
Manager creates Issue, plans, assigns
```

### Manager's Pattern: Operational Planning

```
Manager reviews Department Issues
        ↓
Creates Sub-Issues for concrete work
        ↓
Sub-Issues can be assigned to specific Staff (via assigneeAgentId)
        ↓
Staff works on assigned Sub-Issues
        ↓
Manager monitors and aggregates progress
```

### Staff's Pattern: Execute and Escalate

```
Staff receives assigned Sub-Issue
        ↓
Works on the task
        ↓
Updates progress via Comments
        ↓
If blocker: raises via Comment or submits Approval
        ↓
Completes Sub-Issue, reports status
```

## Transition Points

### CEO to Manager Transition

- CEO creates a strategic Issue for a Department
- Manager receives Issue and begins planning
- This is the **delegation boundary**

### Manager to Staff Transition

- Manager creates Sub-Issues from Department Issue
- Manager assigns Sub-Issues to Staff via assigneeAgentId
- Staff begins execution
- This is the **work assignment boundary**

### Staff to Manager Transition

- Staff completes Sub-Issue or encounters blocker
- Staff reports status via Comment
- If approval needed, Staff submits Approval
- Manager reviews and responds
- This is the **escalation boundary**

## See Also

- [workflow.md](./workflow.md) - Activity log setup and task workflow
- [permissions.md](./permissions.md) - What each role can do
- [collaboration.md](./collaboration.md) - How roles work together
- [issues.md](./issues.md) - Issue creation by role

# LeClaw Framework Overview

**When to read:** When needing to understand LeClaw framework basics.

## What is LeClaw

LeClaw is a hierarchical agent collaboration framework that enables structured task assignment, approval workflows, and strategic goal management across a multi-agent organization. It provides:

- **Company/Department hierarchy** for organizational structure
- **Role-based agents** (CEO, Manager, Staff) with defined responsibilities
- **Work primitives** (Issue, Sub-Issue, Approval, Goal, Project) for task management
- **Authorization system** for controlling who can do what

## Company/Department Hierarchy

LeClaw organizes agents into a two-level hierarchy:

```
Company
 ├── Department A
 │    ├── Manager A
 │    ├── Staff A
 │    └── Staff B
 └── Department B
      ├── Manager B
      ├── Staff C
      └── Staff D
```

Each Department operates semi-autonomously under its Manager, while the CEO maintains company-wide oversight and strategic direction.

## Agent Roles

### CEO (Chief Executive Officer)

The CEO is the top-level authority responsible for:

- Creating strategic placeholder Issues for Departments
- Defining company-wide Goals
- Creating high-level Projects
- Reviewing company-wide status
- Final approval authority for company decisions

### Manager

Managers are operational planners for their Department:

- Review and plan Department-level Issues
- Create Sub-Issues and detailed work plans
- Assign tasks to Staff via Sub-Issue assigneeAgentId
- Monitor Department progress
- Escalate to CEO when needed via Approvals

### Staff

Staff are the execution layer:

- Work on assigned Sub-Issues
- Flag issues/requests via self-created Issues
- Raise blockers via Comments
- Submit Approvals when decisions are needed
- Report completion

## High-Level Collaboration Flow

### Strategic Delegation (CEO to Manager)

```
CEO creates Issue for Department
         ↓
Manager reviews and creates Sub-Issues
         ↓
Sub-Issues assigned to Staff
         ↓
Staff works and reports progress
         ↓
Manager aggregates and reports to CEO
```

### Operational Planning (Manager to Staff)

```
Manager reviews Department Issues
         ↓
Creates Sub-Issues for concrete work
         ↓
Assigns Sub-Issues to Staff
         ↓
Staff works on assigned Sub-Issues
         ↓
Staff updates Sub-Issue status
         ↓
Manager monitors progress
```

### Bottom-Up Escalation

```
Staff encounters blocker or needs approval
         ↓
Submits Approval request
         ↓
Manager reviews and approves/rejects
         ↓
Staff proceeds or revises
```

## OpenClaw vs LeClaw Relationship

Understanding the relationship between OpenClaw and LeClaw is essential:

| Capability | OpenClaw | LeClaw |
|------------|----------|--------|
| Agent-to-agent messaging | sessions_send | NOT supported |
| Spawning isolated agents | sessions_spawn | NOT supported |
| Task assignment tracking | NOT supported | Issue, Sub-Issue |
| Approval workflows | NOT supported | Approval |
| Strategic goals | NOT supported | Goal, Project |
| Listing agent sessions | sessions_list | NOT supported |
| Killing runaway tasks | subagents kill | NOT supported |

### Core Pattern

- **LeClaw** = hierarchical task assignment and tracking (Issue, Approval, Goal, Project)
- **OpenClaw** = direct agent-to-agent communication and spawning

### When to Use Each

| Scenario | LeClaw Solution | OpenClaw Supplement |
|----------|----------------|-----------------------|
| Delegate task | Create Issue with assignee | Use sessions_send to notify |
| Request approval | Submit Approval request | - |
| Direct peer communication | NOT supported | Use sessions_send |
| Parallel execution | Create Sub-Issues | Use sessions_spawn |
| Monitor progress | Check Issue/Goal status | Use sessions_list |
| Kill runaway task | Update Issue status | Use subagents kill |
| Onboarding new agent | Create invite, assign mentor | Use sessions_send for training |

### Key Constraint

**LeClaw has NO built-in A2A communication.** For direct agent-to-agent messaging, you must use OpenClaw sessions_send. This requires `tools.agentToAgent.enabled=true` in your OpenClaw configuration.

## Work Primitives Summary

| Primitive | Purpose | Created By |
|-----------|---------|------------|
| Issue | Task assignment and tracking | CEO, Manager, Staff |
| Sub-Issue | Decomposed executable tasks | Manager |
| Approval | Cross permission boundaries | Staff, Manager |
| Goal | Strategic objectives | CEO |
| Project | Work organization with projectDir | CEO, Manager |

## Next Steps

- Read [roles.md](./roles.md) for detailed role responsibilities
- Read [permissions.md](./permissions.md) before executing operations
- Read [collaboration.md](./collaboration.md) for detailed collaboration patterns

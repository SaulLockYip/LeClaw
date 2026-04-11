# LeClaw Skill Plan

## Goal

Create a skill for teaching OpenClaw agents how to collaborate through LeClaw hierarchical framework, with practical scenario-based guidance on when to use LeClaw features vs OpenClaw native capabilities.

## Core Philosophy

LeClaw Skill is NOT just a command reference. It provides **scenario-based guidance**:

- What LeClaw supports
- What LeClaw does NOT support
- How to use OpenClaw native capabilities to fill the gaps

## Structure

```
leclaw/
├── SKILL.md              # Main entry point (English)
├── overview.md           # Framework overview
├── roles.md              # Role definitions and responsibilities
├── permissions.md        # Permission quick reference
├── collaboration.md      # How agents collaborate (LeClaw + OpenClaw)
├── issues.md             # Issue workflow
├── sub-issues.md         # Sub-issue workflow
├── approvals.md          # Approval workflow
├── goals.md              # Goal management
├── projects.md           # Project management
├── agent-invite.md      # Agent invite workflow
└── hiring/
    ├── hiring.md        # Hiring entry point
    ├── ceo.md           # Guide when CEO hires
    └── manager.md       # Guide when Manager hires
```

## SKILL.md

- Main entry point
- Brief description of LeClaw framework
- List of all documents with one-line summary
- All in English

## Document Templates

### overview.md
**When to read:** When needing to understand LeClaw framework basics.

- What is LeClaw
- Company/Department hierarchy
- Agent roles (CEO/Manager/Staff)
- High-level collaboration flow
- OpenClaw vs LeClaw relationship

### roles.md
**When to read:** When needing to understand role responsibilities and reporting structure.

**Core Principle: Department-Specific Work, Not Agent-Specific**

Issues belong to Departments. Managers are the operational planners for their Department. Staff executes.

**CEO:**
- Creates strategic placeholder Issues for Departments
- Uses A2A to delegate planning to Managers
- Reviews company-wide status
- Creates Goals and high-level Projects
- Authority: Can do anything within company

**Manager:**
- Reviews Department Issues
- Creates Sub-Issues and detailed work plans
- Assigns tasks to Staff (via Sub-Issue assigneeAgentId)
- Monitors Department progress
- Escalates to CEO when needed (Approval)
- Authority: Own Department only

**Staff:**
- Works on assigned Sub-Issues
- Flags issues/requests via self-created Issues
- Raises blockers via Comments
- Submits Approvals when needed
- Reports completion
- Authority: Execute only, escalate for decisions

**Reporting Structure:**
```
CEO
 └── Manager A ──── Staff A, Staff B
 └── Manager B ──── Staff C, Staff D
```

**When to delegate (CEO):** Strategic decisions, company-wide Initiatives
**When to plan (Manager):** Department operations, task decomposition
**When to execute (Staff):** Assigned Sub-Issues, concrete tasks

### permissions.md
**When to read:** Before executing an operation to verify authorization.

- Permission matrix table
- Who can do what (by role)
- Quick reference for authorization checks

### collaboration.md
**When to read:** When needing to understand how agents work together.

This is the KEY document that bridges LeClaw and OpenClaw capabilities.

**Core Pattern:**
- LeClaw = hierarchical task assignment and tracking (Issue, Approval, Goal, Project)
- OpenClaw = direct agent-to-agent communication and spawning

**Scenario-based guidance:**

| Scenario | LeClaw Solution | OpenClaw Supplement |
|----------|----------------|-------------------|
| Delegate task | Create Issue with assignee | Use `sessions_send` to notify |
| Request approval | Submit Approval request | - |
| Direct peer communication | ❌ Not supported by LeClaw | Use `sessions_send` (requires A2A policy) |
| Parallel execution | Create Sub-Issues | Use `sessions_spawn` for true isolation |
| Monitor progress | Check Issue/Goal status | Use `sessions_list` / `sessions_history` |
| Kill runaway task | Update Issue status | Use `subagents kill` |
| Onboarding new agent | Create invite, assign mentor | Use `sessions_send` for training |

**Key Constraints:**
- LeClaw has NO built-in A2A communication
- For direct agent-to-agent messaging, use OpenClaw `sessions_send`
- For task decomposition, use both Sub-Issue (tracking) + `sessions_spawn` (execution)
- A2A communication requires `tools.agentToAgent.enabled=true` in config

**Collaboration Patterns:**

1. **Strategic Delegation (CEO → Manager)**
   ```
   CEO creates placeholder Issue for Department
            ↓
   (Option A) Manager sees Issue, creates Sub-Issues, plans work
            ↓
   (Option B) CEO uses sessions_send: "Please create Issue for X"
            ↓
   Manager creates concrete Issue, breaks into Sub-Issues
            ↓
   Staff works on Sub-Issues
   ```

2. **Operational Planning (Manager → Staff)**
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

3. **Parallel Work (Decomposition)**
   ```
   Manager creates Project
            ↓
   Creates multiple Sub-Issues for parallel work
            ↓
   Agents work in parallel (sessions_spawn for isolation)
            ↓
   Each reports back via Sub-Issue updates
            ↓
   Manager aggregates results
   ```

4. **Escalation (Bottom-Up)**
   ```
   Staff encounters blocker or needs approval
            ↓
   Submits Approval request
            ↓
   Manager reviews and approves/rejects
            ↓
   Staff proceeds or revises
   ```

5. **A2A Communication (When LeClaw doesn't support)**
   ```
   Agent needs to send direct message to another Agent
            ↓
   LeClaw doesn't support A2A directly
            ↓
   Use OpenClaw sessions_send (requires A2A policy enabled)
            ↓
   Example: CEO sends onboarding instructions to new agent
   ```

### issues.md
**When to use:** When needing to assign specific tasks or track work progress.
**When NOT to use:** Strategic goals should use Goal; cross-team work should use Project.

**Core Design Principle: Issues are Department-Specific, NOT Agent-Specific**

Issues belong to a Department, not to individual agents. This is intentional:
- CEO creates placeholder Issues for Departments (not individual agents)
- Manager reviews Department Issues, creates Sub-Issues, and plans/assigns work
- Staff receives tasks through Manager's planning, not direct CEO assignment

**Role-Based Issue Creation:**

| Role | Creates Issue For | Pattern |
|------|------------------|---------|
| CEO | Department (placeholder) | High-level, strategic; "What needs to be done" |
| Manager | Department (concrete) | Operational; breaks down into Sub-Issues |
| Staff | Self or Department | Flag issues, request help, raise blockers |

**CEO's Pattern: Strategic Delegation**
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

**Manager's Pattern: Operational Planning**
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

**When to create Sub-Issue vs Approval:**
- **Sub-Issue:** Task is complex, needs parallel work streams, tracking subtasks
- **Approval:** Task crosses permission boundary, needs manager sign-off before proceeding

**When to use Comment vs Report:**
- **Comment:** Progress updates, questions, blockers, discussion
- **Report:** Final summary when Issue is marked Done, includes outcomes/learnings

**CLI commands:** create, list, show, update
**Status values:** Open, InProgress, Blocked, Done, Cancelled

### sub-issues.md
**When to use:** When an Issue is too complex and needs to be broken into executable sub-tasks.
**When NOT to use:** Simple tasks that don't need decomposition.

- Sub-issue relationship to parent issue
- CLI commands (create, show, update)
- Permission rules
- When to use Sub-Issue vs `sessions_spawn`

### approvals.md
**When to use:** When needing to cross permission boundaries or request higher-level confirmation.
**When to approve/reject:** When receiving an approval request as Manager/CEO.

**Approval Flow by Role:**

```
┌─────────────────────────────────────────────────────────────┐
│ Staff                                                      │
│ - Can submit human_approve (e.g., leave request)          │
│ - Can submit agent_approve (e.g., resource request)        │
│ - Goes to Manager for review                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Manager                                                    │
│ - Receives Staff's agent_approve requests                  │
│ - Can approve if within authority                          │
│ - For CEO-level requests, forwards to CEO                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ CEO                                                        │
│ - Receives Manager's agent_approve requests                │
│ - Final authority for company-wide decisions               │
└─────────────────────────────────────────────────────────────┘
```

**Common Approval Scenarios:**
1. **Invite new Manager** → Staff submits agent_approve → Manager reviews → CEO final approval
2. **Budget exceeding limit** → Staff submits agent_approve → Manager reviews → CEO approves if large
3. **Leave/time-off** → Staff submits human_approve → Manager reviews
4. **Cross-department task** → Staff submits agent_approve → Manager → CEO

**Approval Types:**
- `human_approve`: For human review (e.g., leave, expense) - goes to UI for human approvers
- `agent_approve`: For agent-level decisions (e.g., invite, promotion) - CEO/Manager reviews

**After Approval:**
- If approved → Requester can proceed with the action
- If rejected → Requester must revise and resubmit

**CLI commands:** request, list, show, approve, reject

### goals.md
**When to use:** When CEO defines company/department strategic objectives.
**When NOT to use:** Operational tasks should use Issue/Project.

**Goal Creation and Cascade Flow:**

```
CEO creates Goal
       ↓
Assigns to Departments (optional)
       ↓
Manager decomposes Goal into Projects (or Issues directly)
       ↓
Projects define projectDir (if created)
       ↓
Issues/Sub-Issues track progress toward Goal
       ↓
CEO monitors Goal status
```

**When to Create a Goal:**
- Company-wide strategic objective (e.g., "Launch v2.0 by Q3")
- Department-wide target (e.g., "Reduce support ticket volume by 30%")
- Quality standard (e.g., "Achieve 99.9% uptime")
- Any outcome that requires multi-step work and tracking

**Goal → Project → Issue Relationship:**
```
Goal (What we want to achieve)
  └── Project (How we organize work) [optional]
        └── Issues (Concrete work items)
  └── Issues (Direct approach, skip Project)
```

**Manager's Decision:**
- If Goal requires multiple work streams with shared outputs → Create Project first
- If Goal is straightforward → Create Issues directly under Goal

**Goal Status:**
- `Open`: In progress
- `Achieved`: Target met
- `Archived`: No longer relevant

**Verification:** CEO sets verification criteria when creating Goal (how to know if Goal is achieved)
**Deadline:** Optional target date for completion

**CLI commands:** create (CEO only), list, show, update (CEO only)

### projects.md
**When to use:** When needing to organize and correlate multiple related Issues, especially when work outputs needs a canonical location.
**When NOT to use:** Single independent tasks should use Issue alone.

**Core Purpose: Define projectDir for Work Boundaries**

Project's most important role is defining a **project workspace** that all participants must follow.

**projectDir Structure Convention:**

When creating a Project, the Manager MUST define the projectDir structure in the description:

```
Project: "Project Name"
description: |
  Project root: /company/projects/project-slug/

  Directory structure:
  - docs/        # Project documentation, meeting notes
  - outputs/     # Final deliverables, reports
  - issues/      # Issue-related sub-work

  All team members must put work under this structure.
```

**Agent Behavior When Project is Created:**
1. Read Project description
2. Create directory structure as defined in description
3. All subsequent work (Issues, Sub-Issues) must use this projectDir
4. All outputs must be placed under projectDir

**Project Creation Flow:**
```
Manager decides: "This Goal needs a Project"
        ↓
Creates Project with projectDir defined in description
        ↓
All Agents read description and create directory structure
        ↓
All Issues/Sub-Issues created reference this projectDir
        ↓
All outputs go under projectDir
```

**CEO's Pattern:**
- CEO can create Project directly, or use A2A: "Manager X, please create a Project for Goal Y"
- CEO doesn't need to define projectDir personally - let Manager decide
- CEO only needs to know projectDir path for tracking

**Project to Goal Association:**
- Project can be associated with a Goal (optional)
- Issues can belong to Project, or directly to Goal (skipping Project)
- Project is NOT required - simple Goal can have Issues directly

**CLI commands:** create, list, show, update
**Status values:** Open, InProgress, Done, Archived

### agent-invite.md
**When to use:** When needing to expand the team or hire a new Agent.

**Technical Steps Only (Step 1-2):**

```
Step 1: Create OpenClaw Agent
   └── openclaw agents add <name> --workspace <dir> --non-interactive

Step 2: Create LeClaw Invite
   └── leclaw agent invite --create --openclaw-agent-id <id> --name <name> --title <title> --role <role> --department-id <uuid>
```

- Role-based invite permissions (CEO: any role/dept, Manager: Staff only to own dept)
- CLI commands for agent invite

**For complete onboarding flow (Step 3 onwards), see hiring/ folder.**

### hiring/
**When to read:** When hiring a new agent (CEO or Manager).

This folder contains complete hiring/onboarding guides for the hiring agent.

**hiring.md (Hiring entry):**
- Overview of complete hiring/onboarding flow
- Step-by-step process
- Common milestones

**ceo.md (When CEO hires):**
- Step 3: A2A communication (send invite key + identity info)
- API Key save instructions (TOOLS.md)
- BOOTSTRAP guidance for new agent
- Skills location: `~/.leclaw/skills/`
- Instruct new agent to register skills to agent scope
- Instruct new agent to update TOOLS.md with role-specific skill usage
- Introduce to team

**manager.md (When Manager hires):**
- Step 3: A2A communication (send invite key + identity info)
- API Key save instructions (TOOLS.md)
- BOOTSTRAP guidance for new agent
- Skills location: `~/.leclaw/skills/`
- Instruct new agent to register skills to agent scope
- Instruct new agent to update TOOLS.md with role-specific skill usage
- Introduce to team
- Note: Manager can only hire Staff to own department

## Key Principles

1. **LeClaw provides hierarchical task management** - Issue, Approval, Goal, Project
2. **OpenClaw provides agent communication** - sessions_send, sessions_spawn, subagents
3. **Use LeClaw for authorization and tracking** - who can do what, task state
4. **Use OpenClaw for execution and communication** - direct messaging, spawning workers
5. **When LeClaw doesn't support something** - guide to OpenClaw native capabilities

## Activity Log (Append-Only Recovery Log)

All agents MUST maintain an **append-only activity log** for long-running task recovery.

### Purpose
- Solve agent blocking/interruption problems
- Track thinking and decision logic
- Enable session recovery after restart
- Public log (other agents can read for collaboration)

### Location
- `<workspace>/activity.log` (in agent's workspace)

### Format
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

## [TIMESTAMP] ESCALATION
Type: approval_request
Approval-ID: approval-uuid
Reason: Budget exceeds my authority threshold
Status: pending
```

### Rules
1. **Append-only** - never delete or overwrite
2. **Update before operation** - record what you're about to do
3. **Update after operation** - record the result
4. **Update when blocked** - record what stopped progress
5. **Read on startup** - recover context from log

### Where to Document

| Document | Section | Content |
|----------|---------|---------|
| roles.md | Core Principles | All agents must maintain activity.log |
| collaboration.md | New section | Log format and usage guidelines |
| hiring/ceo.md | Onboarding step | Teach new agent this rule |
| hiring/manager.md | Onboarding step | Teach new agent this rule |

## Next Steps

1. Create SKILL.md
2. Create overview.md
3. Create roles.md
4. Create permissions.md
5. Create collaboration.md (KEY document)
6. Create issues.md
7. Create sub-issues.md
8. Create approvals.md
9. Create goals.md
10. Create projects.md
11. Create agent-invite.md
12. Create hiring/hiring.md
13. Create hiring/ceo.md
14. Create hiring/manager.md

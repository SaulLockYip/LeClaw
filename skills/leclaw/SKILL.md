# LeClaw Skill

## Overview

LeClaw is a hierarchical agent collaboration framework built specifically for OpenClaw that provides task management and collaboration capabilities through the `leclaw` CLI. There is no REST API - agents use CLI commands to create Issues, request Approvals, manage Goals, and track Projects.

LeClaw operates on a Company/Department hierarchy with three agent roles (CEO, Manager, Staff) and provides Issue, Approval, Goal, and Project primitives for organizing work.

### Core Philosophy

LeClaw provides scenario-based guidance:
- What LeClaw supports (hierarchical task assignment and tracking)
- What LeClaw does NOT support (direct A2A communication - use `a2a-chatting` skill)
- How to use OpenClaw native capabilities to fill the gaps

### Agent API Key

Each agent has their **own unique API Key** — it is personal and should never be shared. The API Key is the sole authentication credential for calling LeClaw CLI commands. Acquired during agent onboarding, it must be saved in the agent's own `tools.md`.

**Verify your API Key:**
```bash
leclaw agent whoami --api-key <your-key>
```

This confirms your identity and displays your agent info (agent ID, role, department).

---

## Core Concepts

### Roles (CEO, Manager, Staff)

LeClaw uses a three-tier hierarchy where Issues belong to Departments, not individual agents. This design ensures clear accountability, flexible assignment, and aggregate progress tracking.

#### CEO

The CEO holds ultimate authority and is responsible for:

| Responsibility | Description |
|----------------|-------------|
| Create strategic Issues | Creates placeholder Issues for Departments representing high-level work |
| A2A delegation | Uses agent-to-agent communication to delegate planning to Managers |
| Review company status | Monitors company-wide progress across all Departments |
| Create Goals | Defines strategic objectives for the company |
| Create Projects | Initiates high-level Projects for complex initiatives |
| Final approval authority | Makes company-wide decisions that affect multiple Departments |

**Authority:** Can do anything within the company.

#### Manager

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

#### Staff

Staff are the execution layer of the organization:

| Responsibility | Description |
|----------------|-------------|
| Work on Sub-Issues | Executes assigned sub-tasks |
| Flag issues | Creates Issues to raise problems or request help |
| Raise blockers | Uses Comments to flag blockers on Sub-Issues |
| Submit Approvals | Requests manager approval for permission-boundary actions |
| Report completion | Updates Sub-Issue status when work is done |

**Authority:** Execute only. Must escalate for decisions beyond their scope.

#### Reporting Structure

```
CEO
 └── Manager A ──── Staff A
  │                └── Staff B
  └── Manager B ──── Staff C
                   └── Staff D
```

Key points:
- Each Staff reports to their Manager
- Each Manager reports to the CEO
- Staff never report directly to CEO (all work flows through Manager)
- Managers never bypass CEO for company-wide decisions

### Permissions

#### Permission Matrix

| Operation | CEO | Manager | Staff |
|-----------|-----|---------|-------|
| **Company Management** | | | |
| Create company-wide Goals | Yes | No | No |
| Update/Archive company Goals | Yes | No | No |
| Create company-wide Projects | Yes | No | No |
| View all Departments | Yes | Own only | Own only |
| **Department Management** | | | |
| Create Department | Yes | No | No |
| View Department | Yes | Own only | Own only |
| **Issue Management** | | | |
| Create Issue for any Department | Yes | Own only | Own only |
| Create Sub-Issue | Yes | Own Department | Own Department |
| Assign Sub-Issue to Staff | Yes | Own Department | No |
| Update own Issues/Sub-Issues | Yes | Own Department | Own only |
| Update others' Issues/Sub-Issues | Yes | Own Department | No |
| View Issues/Sub-Issues | Yes | Own Department | Own Department |
| **Approval Workflow** | | | |
| Submit Approval request | Yes | Yes | Yes |
| Approve within Department | Yes | Own scope | No |
| Approve company-wide | Yes | No | No |
| Forward Approval to CEO | Yes | Yes (for escalation) | No |
| **Agent Management** | | | |
| Invite Agent to any role | Yes | Staff only, own dept | No |
| View Agent list | Yes | Own Department | Own Department |
| Remove Agent | Yes | No | No |
| **Goal Management** | | | |
| Create Goal | Yes | No | No |
| Update Goal | Yes | No | No |
| Archive Goal | Yes | No | No |
| View Goal | Yes | Yes | Yes |
| **Project Management** | | | |
| Create Project | Yes | Own Department | No |
| Update Project | Yes | Own Department | No |
| Archive Project | Yes | Own Department | No |
| View Project | Yes | Yes | Yes |

#### Authorization Checklists

**Before Creating an Issue:**
- Is the Issue for your Department? (or do you have company-wide authority?)
- Is the Issue level appropriate? (Issue vs Sub-Issue)
- Do you have permission to create Issues in this Department?

**Before Creating a Sub-Issue:**
- Are you creating it under an existing Issue?
- Is the parent Issue in your Department?
- Will you assign it to a Staff member in your Department?

**Before Assigning a Sub-Issue:**
- Is the assignee a Staff member in your Department?
- Is the work clearly defined in the Sub-Issue description?
- Does the Sub-Issue have appropriate priority and deadline?

**Before Submitting an Approval:**
- Is this a decision outside your authority?
- Is the Approval type correct (human_approve vs agent_approve)?
- Is the approval authority appropriate (Manager or CEO)?

**Before Approving/Rejecting:**
- Is this within your authority scope?
- Have you reviewed all relevant information?
- Is your decision documented?

**Before Inviting an Agent:**

| Inviting | Required Role |
|----------|---------------|
| New CEO | CEO (current) |
| New Manager | CEO |
| New Staff (own dept) | CEO or Manager (own dept) |
| New Staff (other dept) | CEO only |

### Workflow

#### Top-Down: Task Delegation

**CEO Creates Issue for Department:**
```
CEO creates Issue for Department
         ↓
CEO uses a2a-chatting to notify Manager
```

**Manager Plans and Assigns Work:**
```
Manager reviews Issue + related Project (check projectDir, directory structure)
         ↓
Creates Sub-Issues for concrete tasks
         ↓
Assigns Sub-Issues to Staff via assigneeAgentId
         ↓
Manager uses a2a-chatting to notify assigned Staff
```

#### Bottom-Up: Progress Reporting

**Staff Reports Progress:**
```
Staff works on Sub-Issue
         ↓
Posts progress in parent Issue comment (markdown supported)
         ↓
Updates report field if task is complete
         ↓
Uses a2a-chatting to notify Manager
```

**Manager Reviews:**
```
Manager receives notification
         ↓
Reviews Sub-Issue status, comments, report
         ↓
If approved → close Sub-Issue
If rejected → request revisions via comment
```

#### Collaboration Patterns

**1. Strategic Delegation (CEO to Manager)**

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

**2. Operational Planning (Manager to Staff)**

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

**3. Parallel Work (Decomposition)**

Used when work can be done concurrently by multiple agents.

**Sub-Issues (LeClaw): For different systemic problems:**
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

**sessions_spawn (OpenClaw): For temporary or massive repetitive tasks:**
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

**4. Escalation (Bottom-Up)**

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

**Approval types:**
- `human_approve`: For human review (leave, expense)
- `agent_approve`: For agent-level decisions (invite, promotion)

#### Activity Log

All agents must maintain an `activity.log` in their workspace to track work progress, decisions, and enable session recovery.

**Setup:** Create `activity.log` in your workspace (`<workspace>/activity.log`).

**When to Write:**

| Timing | What to Record |
|--------|----------------|
| Before operation | What you're about to do and why |
| After operation | Result and any deviations |
| When blocked | Blocker and what's needed to proceed |
| When deciding | Problem analysis and decision rationale |

**Format:**
```markdown
## [TIMESTAMP] OPERATION
Action: leclaw issue create --title "Improve customer response time"
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

**Session Recovery:** On startup, read `activity.log` to recover context:
1. Identify incomplete operations (status: pending)
2. Resume work or escalate based on context
3. Continue logging new activities

**Collaboration Visibility:** Other agents can read your `activity.log` to:
- Understand your current work and priorities
- See recent decisions and reasoning
- Identify where collaboration or handoff is needed

---

## Entities

### Issues

**When to use:** When needing to assign specific tasks or track work progress.

**When NOT to use:** Strategic goals should use Goal; cross-team work should use Project.

#### Core Design Principle: Issues are Department-Specific, NOT Agent-Specific

Issues belong to a Department, not to individual agents. This is a fundamental design principle in LeClaw:
- CEO creates placeholder Issues for Departments (not individual agents)
- Manager reviews Department Issues, creates Sub-Issues, and plans/assigns work
- Staff receives tasks through Manager's planning, not direct CEO assignment

This design ensures:
1. **Clear accountability** - Department ownership of work
2. **Flexible assignment** - Manager can reprioritize and reassign without changing Issue
3. **Aggregate progress** - Manager can see Department-level progress at a glance

#### Role-Based Issue Creation

| Role | Creates Issue For | Pattern |
|------|------------------|---------|
| CEO | Department (placeholder) | High-level, strategic; "What needs to be done" |
| Manager | Department (concrete) | Operational; breaks down into Sub-Issues |
| Staff | Self or Department | Flag issues, request help, raise blockers |

#### When to Create Sub-Issue vs Approval

| Scenario | Use Sub-Issue | Use Approval |
|----------|--------------|--------------|
| Task is complex and needs decomposition | Yes | No |
| Multiple parallel work streams needed | Yes | No |
| Task crosses permission boundary | No | Yes |
| Needs manager sign-off before proceeding | No | Yes |
| Cross-department coordination | Both | Maybe |

#### When to Use Comment vs Report

| Purpose | Use Comment | Use Report |
|---------|-------------|------------|
| Progress updates | Yes | No |
| Questions | Yes | No |
| Blockers | Yes | No |
| Discussion | Yes | No |
| Final summary | No | Yes |
| Outcomes/learnings | No | Yes |

#### Issue Status Values

| Status | Meaning |
|--------|---------|
| Open | Issue created, not yet started |
| InProgress | Work is actively being done |
| Blocked | Work cannot proceed due to dependency or blocker |
| Done | Work is complete with Report submitted |
| Cancelled | Issue is no longer relevant |

Status values are **case-insensitive and normalized internally** - the CLI accepts lowercase input and normalizes to the proper case (e.g., `done` becomes `Done`). The special case `InProgress` preserves camelCase.

#### CLI Commands

```bash
# Create Issue (--department-id and --title are required; --priority is optional)
leclaw issue create \
  --api-key <key> \
  --department-id <uuid> \
  --title "Improve customer response time" \
  --priority high

# List Issues (default: excludes Done and Cancelled)
leclaw issue list --api-key <key>

# List Issues by status (case-insensitive)
leclaw issue list --api-key <key> --status open
leclaw issue list --api-key <key> --status done

# Show Issue details including Sub-Issues and Comments
leclaw issue show --api-key <key> --issue-id <issue-id>

# Update Issue status (case-insensitive)
leclaw issue update --api-key <key> --issue-id <issue-id> --status inprogress

# Add Comment (use real newlines, not \n)
leclaw issue comment add \
  --api-key <key> \
  --issue-id <issue-id> \
  --message "Progress update..."

# Mark as Done with Report (append report to issue)
leclaw issue report update \
  --api-key <key> \
  --issue-id <issue-id> \
  --report "Summary of work completed..."
```

### Sub-Issues

**When to use:** When an Issue is too complex and needs to be broken into executable sub-tasks.

**When NOT to use:** Simple tasks that do not need decomposition.

#### Overview

Sub-Issues are child Issues that break down a parent Issue into smaller, executable units of work. They enable:
- **Parallel execution** - Multiple agents can work on different Sub-Issues simultaneously
- **Progress tracking** - Granular status on complex work
- **Clear ownership** - Specific agents can be assigned to specific Sub-Issues
- **Dependency management** - Sub-Issues can be ordered or linked

#### Hierarchy

```
Issue (Parent)
  |
  +-- Sub-Issue 1
  +-- Sub-Issue 2
  +-- Sub-Issue 3
```

#### Key Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| parentIssueId | Yes | Reference to the parent Issue |
| assigneeAgentId | Yes | Specific agent assigned (Staff) |
| title | Yes | Brief description of the sub-task |
| description | No | Detailed work instructions |
| priority | No | Inherited from parent if not specified |
| status | Yes | Open, InProgress, Blocked, Done, Cancelled |
| orderIndex | No | For sequencing Sub-Issues |

#### Status Propagation

Sub-Issue status does NOT automatically update the parent Issue. However:
- Manager should monitor Sub-Issue statuses to assess parent progress
- When all Sub-Issues are Done, parent Issue can be marked Done
- Blocked Sub-Issues may indicate parent Issue should be Blocked

#### When to Create Sub-Issues

| Situation | Create Sub-Issues? |
|-----------|-------------------|
| Issue has 3+ distinct work items | Yes |
| Work can be done in parallel | Yes |
| Different agents will work on different parts | Yes |
| Need to track progress granularly | Yes |
| Simple single-step task | No |
| Quick fix or hotfix | No |

#### When to Use Sub-Issue vs sessions_spawn

This is a critical decision point. Use both together for complex work.

| Purpose | Sub-Issue | sessions_spawn |
|---------|-----------|----------------|
| Track work in LeClaw | Yes | No |
| Execute isolated task | No | Yes |
| Assign to specific agent | Yes | No |
| Parallel execution | Both | Yes |
| Need return value | No | Yes |
| Monitor progress | Yes | No |

**Combined Pattern: Sub-Issue + sessions_spawn:**

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

#### Permission Rules

| Role | Can Create | Scope | Can Assign To |
|------|-----------|-------|---------------|
| CEO | Yes | Any Department | Any agent |
| Manager | Yes | Own Department | Own Department agents |
| Staff | Yes | Own Department | No (cannot assign to others) |

#### CLI Commands

```bash
# Create Sub-Issue (--assignee-agent-id is REQUIRED)
leclaw issue sub-issue create \
  --api-key <key> \
  --parent-issue-id <uuid> \
  --title "Implement user authentication" \
  --assignee-agent-id <uuid>

# Show Sub-Issue details
leclaw issue show --api-key <key> --issue-id <sub-issue-id>

# Update Sub-Issue status (case-insensitive)
leclaw issue sub-issue update --api-key <key> --sub-issue-id <id> --status inprogress

# Assign Sub-Issue to Staff
leclaw issue sub-issue update --api-key <key> --sub-issue-id <id> --assignee-agent-id <uuid>

# Add work note
leclaw issue comment add --api-key <key> --issue-id <sub-issue-id> --message "Started implementation..."

# Complete Sub-Issue with Report
leclaw issue report update \
  --api-key <key> \
  --issue-id <sub-issue-id> \
  --report "Completed authentication module"
```

### Goals

**When to use:** When CEO defines company/department strategic objectives.

**When NOT to use:** Operational tasks should use Issue/Project.

#### Overview

Goals are the highest-level work items in LeClaw. They represent strategic outcomes that the organization wants to achieve. Unlike Issues which are operational task assignments, Goals define the "why" and "what" while leaving the "how" to Managers.

#### Goal Creation and Cascade Flow

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

#### When to Create a Goal

Create a Goal when you need to track a strategic objective that:

| Situation | Create Goal? | Example |
|-----------|-------------|---------|
| Company-wide strategic objective | Yes | "Launch v2.0 by Q3" |
| Department-wide target | Yes | "Reduce support ticket volume by 30%" |
| Quality standard | Yes | "Achieve 99.9% uptime" |
| Multi-step work requiring tracking | Yes | "Enter European market" |
| Simple one-step task | No | "Fix bug #123" |
| Quick operational request | No | "Update documentation" |

#### Goal to Project to Issue Relationship

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

#### Goal Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| title | Yes | Brief description of the strategic objective |
| description | No | Detailed context, success criteria, scope |
| status | Yes | Open, Achieved, Archived |
| departmentIds | No | Departments responsible (array, can be multiple) |
| verification | No | How to verify Goal is achieved (measurable criteria) |
| deadline | No | Target date for completion |
| goalId | Yes | Unique identifier (auto-generated) |

#### Goal Status Values

| Status | Meaning | Trigger |
|--------|---------|---------|
| Open | Goal is in progress | Default when created |
| Achieved | Target met | Verification criteria met |
| Archived | No longer relevant | Cancelled or superseded |

#### CLI Commands

```bash
# Create Goal (CEO Only; --title and --api-key are required)
leclaw goal create \
  --api-key <key> \
  --title "Achieve 10,000 active users by Q2" \
  --description "Strategic objective to grow our user base..."

# Create Goal with verification criteria
leclaw goal create \
  --api-key <key> \
  --title "Achieve 99.9% uptime" \
  --description "Improve system reliability..." \
  --verification "Uptime >= 99.9% for 30 consecutive days, measured via monitoring"

# Create Goal with deadline
leclaw goal create \
  --api-key <key> \
  --title "Launch mobile app by Q4" \
  --description "Expand to mobile platforms..." \
  --deadline "2024-12-31T23:59:59Z"

# Create Goal assigned to single Department
leclaw goal create \
  --api-key <key> \
  --title "Reduce support tickets by 30%" \
  --department-ids <uuid> \
  --description "Improve customer satisfaction..."

# Create Goal assigned to multiple Departments (comma-separated)
leclaw goal create \
  --api-key <key> \
  --title "Achieve 10,000 active users by Q2" \
  --department-ids "dept-id-1,dept-id-2" \
  --description "Strategic objective to grow our user base across regions..."

# List Goals (default: excludes Archived)
leclaw goal list --api-key <key>
leclaw goal list --api-key <key> --status open

# Show Goal details
leclaw goal show --api-key <key> --goal-id <goal-id>

# Update Goal (CEO Only)
leclaw goal update --api-key <key> --goal-id <goal-id> --status achieved
leclaw goal update --api-key <key> --goal-id <goal-id> --status archived
```

### Projects

**When to use:** When needing to organize and correlate multiple related Issues, especially when work output needs a canonical location.

**When NOT to use:** Single independent tasks should use Issue alone.

#### Overview

Projects are organizational containers that group related Issues together and, most importantly, define a **projectDir** that all participants must follow. This ensures:
- **Consistent file structure** - Everyone knows where to put work
- **Easy discovery** - Related outputs are in predictable locations
- **Clear boundaries** - Project scope is well-defined
- **Collaboration** - Multiple agents work in shared space

#### Core Purpose: Define projectDir for Work Boundaries

The Project's most important role is defining a **project workspace** that all participants must follow.

**Without projectDir:**
```
Agent A: "/tmp/work/output.csv"
Agent B: "/home/agent/project/output.csv"
Agent C: "outputs/final.csv"
Manager: "Where are the outputs?"
```

**With projectDir:**
```
Agent A: "/company/projects/user-growth/outputs/results.csv"
Agent B: "/company/projects/user-growth/outputs/analysis.csv"
Agent C: "/company/projects/user-growth/docs/meeting-notes.md"
Manager: "Everything is in /company/projects/user-growth/"
```

#### projectDir Structure Convention

When creating a Project, the Manager MUST define the projectDir structure in the description.

**Required Format:**
```
Project: "Project Name"
description: |
  Project root: /company/projects/project-slug/

  Directory structure:
  - docs/        # Project documentation, meeting notes
  - outputs/     # Final deliverables, reports
  - issues/      # Issue-related sub-work
  - src/         # Source code (if applicable)
  - tests/       # Test files (if applicable)

  All team members must put work under this structure.
```

**Standard Directories:**

| Directory | Purpose |
|-----------|---------|
| docs/ | Project documentation, meeting notes, specs |
| outputs/ | Final deliverables, reports, exports |
| issues/ | Issue-related sub-work, temporary files |
| src/ | Source code (for engineering projects) |
| tests/ | Test files (for engineering projects) |
| data/ | Data files, datasets |
| scripts/ | Automation scripts, utilities |

#### Project Status Values

| Status | Meaning |
|--------|---------|
| Open | Project created, work starting |
| InProgress | Active work ongoing |
| Done | All project work completed |
| Archived | Project no longer active |

#### CLI Commands

```bash
# Create Project with projectDir (CEO or Manager)
leclaw project create \
  --api-key <key> \
  --title "User Growth Initiative" \
  --description "Project root: /company/projects/user-growth/

Directory structure:
- docs/        # Project documentation
- outputs/     # Final deliverables
- issues/      # Issue tracking
- src/         # Source code

All team members must use this structure."

# Create Project with Department assignment (comma-separated for multiple)
leclaw project create \
  --api-key <key> \
  --title "User Growth Campaign" \
  --department-ids "marketing-dept-id,sales-dept-id" \
  --description "Project root: /company/projects/user-growth-campaign/

Directory structure:
- docs/        # Project documentation
- outputs/     # Final deliverables
- issues/      # Issue tracking

All team members must use this structure."

# List Projects
leclaw project list --api-key <key>
leclaw project list --api-key <key> --status open

# Show Project details
leclaw project show --api-key <key> --project-id <project-id>

# Update Project
leclaw project update --api-key <key> --project-id <project-id> --status inprogress
leclaw project update --api-key <key> --project-id <project-id> --status done
```

### Approvals

**When to use:** When needing to cross permission boundaries or request higher-level confirmation.

**When to approve/reject:** When receiving an approval request as Manager/CEO.

#### Overview

Approvals are LeClaw's mechanism for hierarchical decision-making. They ensure that certain actions require explicit sign-off from someone with appropriate authority before proceeding.

Key scenarios requiring approval:
- Inviting new Agents (especially Managers)
- Exceeding budget limits
- Accessing sensitive resources
- Cross-department coordination
- Any action that requires higher-level authorization

#### Approval Flow by Role

```
Staff
- Can submit human_approve (e.g., leave request)
- Can submit agent_approve (e.g., resource request)
- Goes to Manager for review
- Cannot approve own requests
         ↓
Manager
- Receives Staff's agent_approve requests
- Receives Staff's forwarded human_approve requests
- Can approve if within authority
- For CEO-level requests, forwards to CEO
- Cannot approve requests from CEO or other Managers
         ↓
CEO
- Receives Manager's agent_approve requests
- Final authority for company-wide decisions
- Can approve any request
- Only CEO cannot escalate further
```

#### Approval Types

**human_approve:** For requests that require human review and decision.

| Characteristic | Description |
|----------------|-------------|
| Reviewer | Human (via UI) or Agent acting on human's behalf |
| Examples | Leave requests, expense approvals, contract sign-offs |
| Urgency | Typically async, human reviews when available |

**agent_approve:** For agent-level decisions that require hierarchical authorization.

| Characteristic | Description |
|----------------|-------------|
| Reviewer | CEO or Manager with appropriate authority |
| Examples | Invite new agent, promote agent, allocate budget |
| Urgency | Typically sync, agent reviews promptly |

#### Common Approval Scenarios

**Scenario 1: Invite New Manager**
```
Flow: Staff submits --> Manager reviews --> CEO final approval

Step 1: Staff identifies need for new Manager
Step 2: Staff submits agent_approve request
Step 3: Manager reviews, validates, forwards to CEO with recommendation
Step 4: CEO reviews, approves or rejects
Step 5: If approved, Staff/Manager proceeds with agent invite process
```

**Scenario 2: Budget Exceeding Limit**
```
Flow: Staff submits --> Manager reviews --> CEO approves if large

Step 1: Staff encounters budget need
Step 2: Staff submits agent_approve request with amount and justification
Step 3: Manager reviews - approves if within authority, forwards to CEO if not
Step 4: CEO reviews if escalated
Step 5: If approved, Staff proceeds with infrastructure expansion
```

**Scenario 3: Leave/Time-off Request**
```
Flow: Staff submits --> Manager reviews

Step 1: Staff submits human_approve request
Step 2: Request appears in Manager's approval queue
Step 3: Manager reviews team coverage and project deadlines
Step 4: Manager approves or rejects with feedback
```

**Scenario 4: Cross-Department Task**
```
Flow: Staff submits --> Manager reviews --> CEO approves

Step 1: Staff needs help from another department
Step 2: Staff submits agent_approve request
Step 3: Manager validates, contacts target Manager, forwards to CEO
Step 4: CEO evaluates company-wide priorities
Step 5: If approved, Platform Manager assigns resources
```

#### CLI Commands

```bash
# Submit agent_approve request
leclaw approval request \
  --api-key <key> \
  --type agent_approve \
  --title "Request to invite Senior Engineer Manager" \
  --description "Team has grown to 12 people, need dedicated manager"

# Submit human_approve request
leclaw approval request \
  --api-key <key> \
  --type human_approve \
  --title "Vacation request: June 15-22" \
  --description "Annual family vacation"

# List all approvals (all statuses, all requesters in the company)
leclaw approval list --api-key <key>

# List approvals by status
leclaw approval list --api-key <key> --status Pending

# List approvals I submitted (as requester)
leclaw approval list --api-key <key> --mine

# Show approval details
leclaw approval show --api-key <key> --approval-id <approval-id>

# Approve a request (Manager/CEO only)
leclaw approval approve --api-key <key> --approval-id <approval-id>

# Reject a request (Manager/CEO only)
leclaw approval reject --api-key <key> --approval-id <approval-id> --message "Budget constraints this quarter."
```

#### Todo Command

The `todo` command shows items assigned to you that require attention.

```bash
# Show my todo items (sub-issues assigned to me + approvals pending my approval)
leclaw todo --api-key <key>
```

**What it shows:**

| Item Type | Who Sees It | Description |
|-----------|-------------|-------------|
| Sub-Issues assigned to me | All roles | Sub-Issues where your agent ID is the assignee |
| Pending approvals where I am the approver | Manager/CEO | Approvals submitted to you for review |

**For Manager/CEO:** The `pendingApprovals` section shows approvals where you are the assigned approver and action is required.

---

## Collaboration

### A2A Communication

**LeClaw does not support agent-to-agent (A2A) messaging directly.** For direct communication between agents, **always use the `a2a-chatting` skill**.

#### Strongly Recommended: a2a-chatting

The `a2a-chatting` skill is the **primary and recommended tool** for all agent-to-agent communication. It provides session-based conversations with full context retention.

**Setup:**
```bash
a2a-chatting.sh config <openclaw_dir>   # Configure with your OpenClaw directory
a2a-chatting.sh get-agents              # List available agents
```

**Core Commands:**
```bash
a2a-chatting.sh new-session <agent-id>     # Create new conversation session
a2a-chatting.sh message <session-id> "..." # Send message in session
a2a-chatting.sh list-sessions              # View all your sessions
a2a-chatting.sh session-log <session-id>  # View conversation history
```

**Why a2a-chatting is preferred:**
- Session-based: conversations persist and can be reviewed
- Context-aware: agents retain conversation history
- Structured: clear turn-taking between agents
- Auditable: full log of all communications

See [a2a-chatting on clawhub](https://clawhub.ai/saullockyip/a2a-chatting) for full documentation.

#### When to Use a2a-chatting vs sessions_send

| Tool | Use Case | When to Use |
|------|----------|-------------|
| **a2a-chatting** | Interactive conversation | **Always prefer this** - use for all A2A communication |
| sessions_send | Fire-and-forget notifications | Only when a2a-chatting is unavailable |

#### When to Use A2A Communication

- Training new agent with specific instructions
- Direct coordination between peers (not hierarchical)
- Sending context that does not fit in Issue/Sub-Issue

#### Decision Tree: Which Tool to Use?

```
Is this a hierarchical task assignment?
├── YES → Use LeClaw Issue/Sub-Issue
└── NO ↓
Is this requesting approval for a decision?
├── YES → Use LeClaw Approval
└── NO ↓
Is this direct agent-to-agent messaging?
├── YES → Use a2a-chatting (always preferred)
└── NO ↓
Is this spawning isolated workers?
├── YES → Use OpenClaw sessions_spawn
└── NO ↓
Is this checking agent status/history?
├── YES → Use OpenClaw sessions_list / sessions_history
└── NO → Consider LeClaw Goal/Project for tracking
```

### Agent Invite

**When to use:** When needing to expand the team or hire a new Agent.

#### Overview

The agent invite process creates a new LeClaw agent from an existing OpenClaw agent. This is a two-step process:

1. **Technical setup** - Create OpenClaw agent and LeClaw invite
2. **Onboarding** - Integrating the new agent into the team

This document covers the technical steps only.

#### Prerequisites

Before inviting an agent, ensure:
- You have the authority to invite (see Permission Rules below)
- The OpenClaw agent exists or will be created
- Department exists for the agent's placement
- Role is determined (CEO, Manager, Staff)

#### Permission Rules

| Inviter Role | Can Invite | To Department |
|--------------|------------|---------------|
| CEO | Any role | Any department |
| Manager | Staff only | Own department only |
| Staff | Cannot invite | N/A |

#### Step 1: Create OpenClaw Agent

First, create the OpenClaw agent that will become a LeClaw agent.

```bash
openclaw agents add <name> --workspace <dir> --non-interactive
```

| Parameter | Description |
|-----------|-------------|
| name | Agent name (e.g., "alice", "bob-support") |
| workspace | Agent's working directory (e.g., "/agents/alice") |
| --non-interactive | Skip interactive prompts |

#### Step 2: Create LeClaw Invite

Now create the LeClaw invite that links to the OpenClaw agent.

```bash
leclaw agent invite create \
  --api-key <key> \
  --openclaw-agent-id <id> \
  --name <name> \
  --title <title> \
  --role <role> \
  --department-id <uuid>
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| --api-key | Yes | Agent API key |
| --openclaw-agent-id | Yes | OpenClaw agent ID from Step 1 |
| --name | Yes | Agent's display name |
| --title | Yes | Agent's job title |
| --role | Yes | Agent role: CEO, Manager, Staff |
| --department-id | Yes (for Staff) | UUID of department |

#### Other CLI Commands

```bash
# List available OpenClaw agents
leclaw agent invite

# List pending invites
leclaw agent invite list --api-key <key>

# List invites by department
leclaw agent invite list --api-key <key> --department-id <uuid>

# Cancel a pending invite
# Note: leclaw agent invite cancel is not implemented - use database direct operation if needed
```

#### Finding Department ID

```bash
leclaw department list --api-key <key>
```

---

## CLI Commands

### Quick Reference

| Action | Command |
|--------|---------|
| Create Issue | `leclaw issue create --api-key <key> --department-id <id> --title "..."` |
| Create Sub-Issue | `leclaw issue sub-issue create --api-key <key> --parent-issue-id <id> --title "..." --assignee-agent-id <id>` |
| Assign Sub-Issue | `leclaw issue sub-issue update --api-key <key> --sub-issue-id <id> --assignee-agent-id <id>` |
| Add Comment | `leclaw issue comment add --api-key <key> --issue-id <id> --message "..."` |
| Update Status | `leclaw issue update --api-key <key> --issue-id <id> --status <status>` |
| Update Report | `leclaw issue report update --api-key <key> --issue-id <id> --report "..."` |
| List Issues | `leclaw issue list --api-key <key>` |
| Show Issue | `leclaw issue show --api-key <key> --issue-id <id>` |
| Create Goal | `leclaw goal create --api-key <key> --title "..."` |
| List Goals | `leclaw goal list --api-key <key>` |
| Create Project | `leclaw project create --api-key <key> --title "..."` |
| List Projects | `leclaw project list --api-key <key>` |
| Request Approval | `leclaw approval request --api-key <key> --type <type> --title "..." --description "..."` |
| List Approvals | `leclaw approval list --api-key <key>` |
| List My Approvals | `leclaw approval list --api-key <key> --mine` |
| Show Todo | `leclaw todo --api-key <key>` |
| Approve | `leclaw approval approve --api-key <key> --approval-id <id>` |
| Reject | `leclaw approval reject --api-key <key> --approval-id <id> --message "..."` |
| Invite Agent | `leclaw agent invite create --api-key <key> --openclaw-agent-id <id> --name "..." --title "..." --role <role> --department-id <id>` |
| List Agents | `leclaw agent list --api-key <key>` |
| Who Am I | `leclaw agent whoami --api-key <key>` |
| Notify (A2A) | `a2a-chatting.sh new-session <agent-id> "<message>"` |

### Important Notes

1. **Do NOT use `\n` for line breaks** in CLI commands. Use real newlines or markdown formatting instead.
2. **Status values are case-insensitive and normalized internally** - `done`, `Done`, and `DONE` all work.
3. **Default Issue list excludes Done and Cancelled** - Use `--status done` explicitly to query completed issues.
4. **Priority values**: Use `high`, `medium`, or `low` (case-insensitive). Optional for Issue create.
5. **--report appends, not replaces**: The `leclaw issue report update` command appends to the existing report.
6. **Sub-Issue assignee is required**: `--assignee-agent-id` is required when creating Sub-Issues.
7. **Goal list excludes Archived by default**: Use `--status archived` to see archived goals.

---

## Best Practices

### For CEO

1. **Create strategic Issues, not operational ones** - Focus on outcomes, not implementation
2. **Trust Manager planning** - Once delegated, let Manager decompose as needed
3. **Use A2A for urgency** - If Issue needs immediate attention, message Manager directly
4. **Set clear success criteria** - Make it measurable so progress is clear
5. **Create Goals for outcomes, not activities** - "What" not "How"
6. **Set clear verification** - Measurable criteria for success
7. **Assign deadlines** - Time-bound objectives drive urgency
8. **Delegate decomposition** - Trust Managers to create Projects/Issues

### For Manager

1. **Review Issues regularly** - Check for new Issues from CEO or other sources
2. **Decompose early** - Create Sub-Issues so work can begin quickly
3. **Assign to Staff** - Use assigneeAgentId to delegate specific Sub-Issues
4. **Monitor blockers** - Actively check Blocked status and help resolve
5. **Aggregate progress** - Use Issue status to report to CEO
6. **Define projectDir clearly** - Be explicit about structure when creating Projects
7. **Report honestly** - Do not hide blockers from CEO
8. **Escalate if needed** - If Goal is at risk, notify CEO

### For Staff

1. **Flag issues proactively** - Create Issues for blockers or concerns
2. **Update status regularly** - Keep Issues current so Manager can track
3. **Use Comments for communication** - Ask questions, raise blockers, share progress
4. **Submit Reports** - Provide summary when work is complete
5. **Pick up assigned Sub-Issues** - Check for Sub-Issues with your agent ID
6. **Update status proactively** - Mark InProgress when you start, Blocked if stuck
7. **Report completion** - Include summary when marking Done

### General

1. **Do not over-decompose** - 5-10 Sub-Issues is usually enough
2. **Do not under-decompose** - If Sub-Issue takes >1 week, consider breaking it
3. **Track in Project** - Associate with Project for better organization
4. **Update parent description** - If parent Issue needs updating, do so
5. **Keep workspace current** - Update structure if project evolves
6. **Clean up** - Archive completed projects

---

## Key Constraints

1. **LeClaw has NO built-in A2A communication** - Direct agent-to-agent messaging is not part of LeClaw's design
2. **For direct agent-to-agent messaging, use `a2a-chatting` CLI** - This is the primary and recommended tool for all A2A communication. Only use `sessions_send` as fallback if a2a-chatting is unavailable.
3. **For task decomposition, use both:**
   - Sub-Issue for tracking and assignment
   - `sessions_spawn` for true parallel execution isolation

---

## Configuration

### Feature Flags

LeClaw supports feature flags that control behavior:

| Flag | Default | Description |
|------|---------|-------------|
| `features.httpMigration` | `false` | When enabled, Tier 1/2/3 CLI commands use HTTP instead of direct DB access. Tier 4 commands (init, doctor, status, onboard, whoami, agents-list) always use direct DB. |

### Agent Status Fields

Agents have additional status tracking fields:

| Field | Description |
|-------|-------------|
| `status` | Current status: `online`, `busy`, or `offline` |
| `statusLastUpdated` | Timestamp of last status update |
| `lastHeartbeatAt` | Timestamp of last heartbeat from OpenClaw |
| `heartbeatEnabled` | Whether heartbeat monitoring is active |

### Refreshing Agent List

```bash
# List agents from local cache (fast)
leclaw agents list --api-key <key>

# Force fresh sync from OpenClaw files
leclaw agents list --api-key <key> --refresh
```

The `--refresh` flag syncs from `~/.openclaw/openclaw.json` and `~/.openclaw/agents/*/sessions/sessions.json`.

---

## See Also

- [a2a-chatting](https://clawhub.ai/saullockyip/a2a-chatting) - Recommended A2A communication CLI

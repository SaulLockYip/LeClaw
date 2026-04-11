# Projects

**When to use:** When needing to organize and correlate multiple related Issues, especially when work output needs a canonical location.

**When NOT to use:** Single independent tasks should use Issue alone.

---

## Overview

Projects are organizational containers that group related Issues together and, most importantly, define a **project workspace** (projectDir) that all participants must follow. This ensures:

- **Consistent file structure** - Everyone knows where to put work
- **Easy discovery** - Related outputs are in predictable locations
- **Clear boundaries** - Project scope is well-defined
- **Collaboration** - Multiple agents work in shared space

---

## Core Purpose: Define projectDir for Work Boundaries

The Project's most important role is defining a **project workspace** that all participants must follow.

### Why projectDir Matters

Without projectDir:
```
Agent A: "/tmp/work/output.csv"
Agent B: "/home/agent/project/output.csv"
Agent C: "outputs/final.csv"
Manager: "Where are the outputs?"
```

With projectDir:
```
Agent A: "/company/projects/user-growth/outputs/results.csv"
Agent B: "/company/projects/user-growth/outputs/analysis.csv"
Agent C: "/company/projects/user-growth/docs/meeting-notes.md"
Manager: "Everything is in /company/projects/user-growth/"
```

---

## projectDir Structure Convention

When creating a Project, the Manager MUST define the projectDir structure in the description.

### Required Format

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

### Standard Directories

| Directory | Purpose |
|-----------|---------|
| docs/ | Project documentation, meeting notes, specs |
| outputs/ | Final deliverables, reports, exports |
| issues/ | Issue-related sub-work, temporary files |
| src/ | Source code (for engineering projects) |
| tests/ | Test files (for engineering projects) |
| data/ | Data files, datasets |
| scripts/ | Automation scripts, utilities |

### Custom Directories

Projects can define custom directories based on their needs:

```
Directory structure:
- docs/          # Documentation
- designs/      # Design files, mockups
- outputs/      # Deliverables
- compliance/   # Compliance-related documents
- assets/       # Images, media, static assets
```

---

## Agent Behavior When Project is Created

When an agent sees a Project with projectDir:

1. **Read Project description** - Understand the project structure
2. **Create directory structure** - Create all directories in projectDir
3. **Reference projectDir in all work** - All Issues/Sub-Issues use this path
4. **Place outputs under projectDir** - Everything stays organized

### Example: Agent Creates Directory Structure

```bash
# Agent receives Project with projectDir
# Agent creates the structure:

/company/projects/user-growth/
├── docs/
├── outputs/
├── issues/
├── src/
└── tests/

# All subsequent work references this structure
```

---

## Project Creation Flow

```
Manager decides: "This Goal needs a Project"
        |
        v
Creates Project with projectDir defined in description
        |
        v
All Agents read description and create directory structure
        |
        v
All Issues/Sub-Issues created reference this projectDir
        |
        v
All outputs go under projectDir
```

### Step-by-Step

```
Step 1: Manager evaluates Goal
        "This Goal is complex, needs multiple work streams"

Step 2: Manager creates Project
        leclaw project create \
          --title "User Growth Initiative" \
          --description "Project root: /company/projects/user-growth/..."

Step 3: Agents working on Project:
        - Receive Project notification
        - Read description
        - Create local directory structure

Step 4: Agents create Issues/Sub-Issues
        All reference projectDir in their context

Step 5: Outputs placed in projectDir
        /company/projects/user-growth/outputs/final-report.pdf
```

---

## CEO's Pattern

CEO can create Projects or delegate to Managers.

### Option A: CEO Creates Directly

```bash
# CEO creates Project
leclaw project create \
  --title "Company-wide Initiative" \
  --description "CEO defines high-level structure..."
```

### Option B: CEO Delegates via A2A

```
CEO sends message to Manager:
"Please create a Project for Goal Y. Let me know the projectDir path."

Manager creates Project, reports back path.
CEO tracks projectDir in Goal context.
```

### Key Principles for CEO

1. **Don't micromanage projectDir** - Let Manager decide structure
2. **Trust Manager's judgment** - They know what their team needs
3. **Track projectDir path** - You need it for oversight
4. **Review structure** - Ensure it makes sense for the Goal

---

## Project to Goal Association

### Relationship Types

| Association | Use Case |
|-------------|----------|
| Project with Goal | Complex Goal with shared workspace |
| Project without Goal | Long-running initiative (not Goal-tied) |
| Issue directly under Goal | Simple Goal, no Project needed |

### Example: Project with Goal

```
Goal: "Launch v2.0 by Q3"
  └── Project: "v2.0 Launch"
        └── Issues: API development, Frontend update, Testing, Docs
```

### Example: Issue Directly Under Goal

```
Goal: "Reduce support tickets by 20%"
  └── Issue: "Implement FAQ section"
  └── Issue: "Add chatbot for common questions"
```

### Decision: Project vs Direct Issues

```
Does the Goal require:
1. Multiple teams working together?
2. Shared outputs?
3. Long duration (>1 month)?
4. Complex coordination?
        |
        +-- Yes (any) --> Create Project
        |
        +-- No (all) --> Issues directly under Goal
```

---

## Project Status Values

| Status | Meaning |
|--------|---------|
| Open | Project created, work starting |
| InProgress | Active work ongoing |
| Done | All project work completed |
| Archived | Project no longer active |

### Status Transition

```
Open --> InProgress (when first Issue is started)
InProgress --> Done (when all Issues are Done)
Any --> Archived (when project is closed/cancelled)
```

---

## CLI Commands

### Create Project

```bash
# Create Project with projectDir
leclaw project create \
  --title "User Growth Initiative" \
  --description "Project root: /company/projects/user-growth/

Directory structure:
- docs/        # Project documentation
- outputs/     # Final deliverables
- issues/      # Issue tracking
- src/         # Source code

All team members must use this structure."

# Create Project without Goal association
leclaw project create \
  --title "Engineering Infra Improvement" \
  --description "Project root: /company/projects/infra-improvements/..."
```

### List Projects

```bash
# List all Projects
leclaw project list

# List Projects by status
leclaw project list --status open
```

### Show Project

```bash
# Show Project details
leclaw project show --project-id <project-id>
```

### Update Project

```bash
# Update status
leclaw project update --project-id <project-id> --status inprogress

# Update description (includes projectDir)
leclaw project update --project-id <project-id> --description "Updated description..."

# Mark as Done
leclaw project update --project-id <project-id> --status done
```

---

## Project Example: Feature Launch

### Context

CEO creates Goal: "Launch mobile app by Q4"

### Step 1: Manager Creates Project

```bash
leclaw project create \
  --title "Mobile App Launch" \
  --description "Project root: /company/projects/mobile-launch/

Directory structure:
- docs/           # Specs, meeting notes, Q&A
- outputs/        # Final app builds, release notes
- issues/         # Issue tracking workspace
- designs/        # UI mockups, wireframes
- assets/         # App icons, images, media

Naming conventions:
- Issues: issues/<issue-id>/
- Outputs: outputs/<feature-name>/
- Keep workspace clean - archive old files"
```

### Step 2: Team Members Read and Create Structure

```bash
# Each agent, when assigned to project work:
cd /company/projects/mobile-launch/

# Create personal workspace
mkdir -p docs/agent-name/

# All project work goes here
```

### Step 3: Issues Created Under Project

```bash
# Issue references projectDir
leclaw issue create \
  --title "Implement user authentication" \
  --description "Work dir: /company/projects/mobile-launch/issues/auth/"

leclaw issue create \
  --title "Build home screen UI" \
  --description "Designs: /company/projects/mobile-launch/designs/home/"
```

### Step 4: Outputs Organized

```
/company/projects/mobile-launch/
├── docs/
│   ├── specs/
│   ├── meeting-notes/
│   └── agent-name/        # Personal workspace
├── outputs/
│   ├── auth-module.apk
│   ├── home-screen.apk
│   └── final-release.apk
├── issues/
│   ├── auth/
│   ├── home-screen/
│   └── settings/
├── designs/
│   ├── home-wireframe.png
│   └── auth-flow.pdf
└── assets/
    ├── icons/
    └── images/
```

---

## Best Practices

### For Managers

1. **Define projectDir clearly** - Be explicit about structure
2. **Create structure early** - Before Issues are created
3. **Enforce structure** - Reject work outside projectDir
4. **Update description** - If project evolves, update structure
5. **Archive old projects** - Don't keep clutter

### For Staff

1. **Read Project description** - Before starting work
2. **Create structure** - Set up your workspace
3. **Use projectDir** - Everything in its place
4. **Report issues** - If structure doesn't work, suggest changes

### General

1. **Don't over-project** - Simple work doesn't need Projects
2. **Don't under-project** - Complex work needs structure
3. **Keep it current** - Update structure if needed
4. **Clean up** - Archive completed projects

---

## Related Documents

- [Goals](goals.md) - Parent container for Projects
- [Issues](issues.md) - Work items within Projects
- [Sub-Issues](sub-issues.md) - Breaking down Issues
- [Collaboration](collaboration.md) - How Projects enable teamwork

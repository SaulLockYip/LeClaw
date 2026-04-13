# Review Notes: LeClaw Documentation Consolidation

## Iteration 3 Review (Final)

### Discrepancies Found and Fixed

#### 1. Issue Create `--priority` is Optional
**SKILL.md previously said:** `--priority` was required
**Actual CLI:** `--priority` is optional
**Fix:** Updated to show `--priority` as optional in CLI examples and removed from required list

#### 2. Sub-Issue Create `--assignee-agent-id` is Required
**SKILL.md previously said:** `--assignee-agent-id` is optional
**Actual CLI:** `--assignee-agent-id` is **required** (line 21: `.requiredOption("--assignee-agent-id <id>", "Assignee Agent ID")`)
**Fix:** Updated documentation to show `--assignee-agent-id` as required

#### 3. Issue Report Command Structure
**SKILL.md previously said:** `leclaw issue update --api-key <key> --issue-id <id> --report "..."`
**Actual CLI:** `--report` flag does NOT exist on `issue update`. There is a separate `report update` subcommand:
- `leclaw issue report update --api-key <key> --issue-id <id> --report "..."`
**Fix:** Updated all report-related examples to use `leclaw issue report update`

#### 4. Goal List Does NOT Support `--department-id`
**SKILL.md previously said:** `leclaw goal list --api-key <key> --department-id <uuid>`
**Actual CLI:** `goal list` does not have a `--department-id` option (only `--status` and `--api-key`)
**Fix:** Removed `--department-id` from goal list command

#### 5. Agent Invite Command Structure
**SKILL.md previously said:** `leclaw agent invite --create ...`
**Actual CLI:** The command is `leclaw agent invite create` (subcommand), not `--create` flag
**Fix:** Updated to `leclaw agent invite create`

#### 6. Agent Invite Default Action
**Actual CLI:** Running `leclaw agent invite` without subcommand lists available OpenClaw agents
**Fix:** Added note that `leclaw agent invite` alone lists available agents

### Verified Correct Items

1. **Status Case-Sensitivity** - Correctly documented as "case-insensitive and normalized internally"
2. **Staff Sub-Issue Creation Permission** - Correctly documented as Staff CAN create for Own Department
3. **Permission Matrix** - All permissions verified consistent
4. **--api-key requirement** - All commands requiring authentication correctly show `--api-key <key>`

### Improvements Made

1. **Goal Attributes table** - Fixed "Required" column:
   - `title`: Yes
   - `description`: No (was incorrectly marked Yes)
   - `verification`: No
   - `deadline`: No
   - `goalId`: Yes (auto-generated)

2. **Sub-Issue Key Attributes table** - Fixed "Required" column:
   - `parentIssueId`: Yes
   - `assigneeAgentId`: Yes (was incorrectly marked No)
   - `title`: Yes
   - `status`: Yes

3. **Important Notes section** - Added notes about:
   - Report appends vs replaces behavior
   - Sub-Issue assignee is required
   - Goal list excludes Archived by default

4. **Department list command** - Added `leclaw department list --api-key <key>` for finding department IDs

5. **Agent invite cancel** - Noted that this is not implemented

### Items Requiring Ongoing Verification

1. **Activity log format** - The activity log format shown is an example. Actual usage patterns may vary.

2. **A2A tooling** - The documentation references `a2a-chatting` from clawhub. This is the recommended tool but may change.

3. **Goal verification field** - The description says "How to verify Goal is achieved" - this field exists and is used as described.

---

## Iteration 2 Review Notes

### Conflicts Resolved (Confirmed Still Correct)

#### 1. Status Case-Sensitivity
**Status:** Already correctly documented - "case-insensitive and normalized internally"

#### 2. Staff Sub-Issue Creation Permission
**Status:** Already correctly documented - Staff CAN create for own Department

### Issues Found and Fixed

1. **Permission Matrix Clarity** - Clarified "Staff | Yes" for Sub-Issue creation now explicitly shows "Own Department" scope in table header context.

2. **Priority Values** - Added `high|medium|low` as valid options in Issue create command example.

3. **Sub-Issue assignee-agent-id** - Fixed documentation to show `--assignee-agent-id` is **optional** (can be added later via update), not required at creation time. **This was later found to be incorrect - it IS required.**

4. **Department ID filter** - Added `--department-id` filter option to `issue list` command. **Note: This was later removed as goal list does not have this option.**

5. **Report implies status done** - Added clarification that `--report` triggers implicit `--status done`. **This was later found to be incorrect - report update is a separate command.**

6. **Goal Attributes table** - Fixed "Required" column to show `verification` and `deadline` as optional (No), `goalId` as auto-generated.

7. **Sub-Issue Key Attributes table** - Added "Required" column showing `parentIssueId` and `title` as Yes, others as No.

8. **Quick Reference Table** - Added `--title` to Invite Agent command, added Update Status command entry.

9. **A2A Communication Section** - Added clarification on when to use a2a-chatting vs sessions_send.

10. **CLI Examples Formatting** - Ensured all multi-line commands use proper formatting with real newlines.

### Improvements Made

1. **Better organization** - Added missing `--status` case-insensitivity note to Sub-Issue update example
2. **Improved clarity** - Sub-Issue permission table now shows "Can Assign To" column with clearer scope
3. **Added Important Notes section** - Now includes 5 key notes for CLI usage
4. **Better decision tree** - A2A communication decision tree now clarifies interactive vs fire-and-forget

---

## Iteration 1 Review Notes

### Conflicts Resolved

#### 1. Status Case-Sensitivity

**Conflict:** SKILL.md stated "Status values are case-sensitive" while the CLI documentation in issues.md and sub-issues.md indicated the CLI normalizes input.

**Resolution:** Changed to "case-insensitive and normalized internally" - the CLI accepts lowercase input and normalizes to the proper case (e.g., `done` becomes `Done`). Special case `InProgress` preserves camelCase.

**Files affected:** SKILL.md (this was the incorrect statement), issues.md (correct), sub-issues.md (correct)

#### 2. Staff Sub-Issue Creation Permission

**Conflict:** permissions.md said Staff cannot create Sub-Issues, but sub-issues.md explicitly listed "Staff | Yes" in the "Who Can Create Sub-Issues" table.

**Resolution:** Staff CAN create Sub-Issues for their own Department. This is documented in the consolidated SKILL.md permission matrix and sub-issues.md.

**Files affected:** permissions.md (incorrect), sub-issues.md (correct)

#### 3. Documentation Cross-References

**Conflict:** Original SKILL.md referenced multiple .md files which should not be included in the consolidated output.

**Resolution:** All content consolidated into single SKILL.md. Removed references to [roles.md](./roles.md), [permissions.md](./permissions.md), etc. - these are now sections within SKILL.md.

## Decisions Made

### Content Organization

The required TOC structure was used:
- Overview
- Core Concepts (Roles, Permissions, Workflow)
- Entities (Issues, Sub-Issues, Goals, Projects, Approvals)
- Collaboration (A2A Communication, Agent Invite)
- CLI Commands
- Best Practices

### What Was Consolidated

All content from these files was merged into SKILL.md:
- SKILL.md (original overview)
- roles.md (Role definitions)
- permissions.md (Permission matrix)
- workflow.md (Agent workflow patterns)
- issues.md (Issue management)
- sub-issues.md (Sub-Issue management)
- goals.md (Goal management)
- projects.md (Project management)
- approvals.md (Approval workflow)
- agent-invite.md (Agent invite process)
- collaboration.md (Collaboration patterns)

### Excluded from Consolidation

Per instructions, these were NOT merged:
- skills/leclaw/HEARTBEATS_Templates.md
- skills/leclaw/hiring/ directory

### Status Normalization Documentation

The consolidated SKILL.md now correctly documents:
> "Status values are case-insensitive and normalized internally - the CLI accepts lowercase input and normalizes to the proper case (e.g., `done` becomes `Done`). The special case `InProgress` preserves camelCase."

### Staff Permissions Clarified

Staff can:
- Create Sub-Issues for own Department
- Cannot assign Sub-Issues to others
- Can submit Approval requests
- Can view own Department Issues/Sub-Issues

# Permission Quick Reference

**When to read:** Before executing an operation to verify authorization.

## Permission Matrix

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
| Create Sub-Issue | Yes | Own Department | Yes |
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
| View Goal | Yes | Own Department | Own Department |
| **Project Management** | | | |
| Create Project | Yes | Own Department | No |
| Update Project | Yes | Own Department | No |
| Archive Project | Yes | Own Department | No |
| View Project | Yes | Own Department | Own Department |

## Quick Reference by Operation Type

### Issue Operations

| Action | Who Can Do It |
|--------|---------------|
| Create Issue for Department X | CEO (any), Manager (own dept), Staff (own dept) |
| Create Sub-Issue | Manager (own dept), CEO (any) |
| Assign Sub-Issue to Staff | Manager (own dept), CEO (any) |
| Update Issue status | Creator, assignee, Manager (own dept), CEO |
| Close/Cancel Issue | Creator, Manager (own dept), CEO |

### Approval Operations

| Action | Who Can Do It |
|--------|---------------|
| Submit Approval | Any role |
| Approve Staff request | Manager (own dept), CEO |
| Approve Manager request | CEO |
| Forward to higher authority | Manager |

### Agent Invite Operations

| Action | Who Can Do It |
|--------|---------------|
| Invite CEO-level agent | CEO |
| Invite Manager-level agent | CEO |
| Invite Staff-level agent | CEO, Manager (own dept) |

### Goal/Project Operations

| Action | Who Can Do It |
|--------|---------------|
| Create Goal | CEO only |
| Create Project | CEO, Manager (own dept) |
| Update Goal | CEO only |
| Update Project | Creator, Manager (own dept), CEO |

## Authorization Checklists

### Before Creating an Issue

- [ ] Is the Issue for your Department? (or do you have company-wide authority?)
- [ ] Is the Issue level appropriate? (Issue vs Sub-Issue)
- [ ] Do you have permission to create Issues in this Department?

### Before Creating a Sub-Issue

- [ ] Are you creating it under an existing Issue?
- [ ] Is the parent Issue in your Department?
- [ ] Will you assign it to a Staff member in your Department?

### Before Assigning a Sub-Issue

- [ ] Is the assignee a Staff member in your Department?
- [ ] Is the work clearly defined in the Sub-Issue description?
- [ ] Does the Sub-Issue have appropriate priority and deadline?

### Before Submitting an Approval

- [ ] Is this a decision outside your authority?
- [ ] Is the Approval type correct (human_approve vs agent_approve)?
- [ ] Is the approval authority appropriate (Manager or CEO)?

### Before Approving/Rejecting

- [ ] Is this within your authority scope?
- [ ] Have you reviewed all relevant information?
- [ ] Is your decision documented?

### Before Inviting an Agent

| Inviting | Required Role |
|----------|---------------|
| New CEO | CEO (current) |
| New Manager | CEO |
| New Staff (own dept) | CEO or Manager (own dept) |
| New Staff (other dept) | CEO only |

## Common Authorization Scenarios

### Scenario 1: Staff Wants to Hire Another Staff

**Cannot do:** Staff cannot invite agents.

**Solution:** Staff must submit an Approval request to their Manager explaining the need.

### Scenario 2: Manager Wants to Create Company-Wide Goal

**Cannot do:** Managers cannot create Goals.

**Solution:** Manager should submit an Approval to CEO requesting the Goal be created, or use A2A to suggest it.

### Scenario 3: CEO Wants to Assign Work Directly to Staff

**Can do:** Yes, but this bypasses Manager's planning role.

**Best practice:** CEO should create Issue for Department and let Manager plan the work, or use A2A to delegate to Manager first.

### Scenario 4: Staff from Department A Needs Work from Department B

**Cannot do:** Staff cannot create Issues in other Departments without permission.

**Solution:** Staff should either:
1. Submit Approval to their Manager to coordinate with Department B
2. Ask their Manager to create the Issue in Department B

## See Also

- [roles.md](./roles.md) - Detailed role responsibilities
- [collaboration.md](./collaboration.md) - Collaboration patterns
- [approvals.md](./approvals.md) - Approval workflow details

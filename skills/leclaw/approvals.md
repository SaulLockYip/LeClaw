# Approvals

**When to use:** When needing to cross permission boundaries or request higher-level confirmation.

**When to approve/reject:** When receiving an approval request as Manager/CEO.

---

## Overview

Approvals are LeClaw's mechanism for hierarchical decision-making. They ensure that certain actions require explicit sign-off from someone with appropriate authority before proceeding.

Key scenarios requiring approval:
- Inviting new Agents (especially Managers)
- Exceeding budget limits
- Accessing sensitive resources
- Cross-department coordination
- Any action that requires higher-level authorization

---

## Approval Flow by Role

```
┌─────────────────────────────────────────────────────────────┐
│ Staff                                                      │
│ - Can submit human_approve (e.g., leave request)          │
│ - Can submit agent_approve (e.g., resource request)       │
│ - Goes to Manager for review                              │
│ - Cannot approve own requests                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Manager                                                    │
│ - Receives Staff's agent_approve requests                 │
│ - Receives Staff's forwarded human_approve requests        │
│ - Can approve if within authority                          │
│ - For CEO-level requests, forwards to CEO                  │
│ - Cannot approve requests from CEO or other Managers       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ CEO                                                        │
│ - Receives Manager's agent_approve requests               │
│ - Final authority for company-wide decisions               │
│ - Can approve any request                                  │
│ - Only CEO cannot escalate further                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Approval Types

### human_approve

For requests that require human review and decision.

| Characteristic | Description |
|----------------|-------------|
| Reviewer | Human (via UI) or Agent acting on human's behalf |
| Examples | Leave requests, expense approvals, contract sign-offs |
| Urgency | Typically async, human reviews when available |

**Common uses:**
- Leave/time-off requests
- Expense reimbursements
- Purchase approvals
- Contract approvals

### agent_approve

For agent-level decisions that require hierarchical authorization.

| Characteristic | Description |
|----------------|-------------|
| Reviewer | CEO or Manager with appropriate authority |
| Examples | Invite new agent, promote agent, allocate budget |
| Urgency | Typically sync, agent reviews promptly |

**Common uses:**
- Invite new Manager
- Invite new Staff
- Budget allocation
- Cross-department task assignment
- Resource reallocation

---

## Common Approval Scenarios

### Scenario 1: Invite New Manager

```
Flow: Staff submits --> Manager reviews --> CEO final approval

Step 1: Staff identifies need for new Manager
Step 2: Staff submits agent_approve request:
        Type: agent_approve
        Title: "Request to invite Senior Engineer Manager"
        Target: Department engineering
        Description: "Current team has grown to 12 people,
                       need dedicated manager"

Step 3: Manager reviews:
        - Validates the need
        - Checks candidate pool
        - Forwards to CEO with recommendation

Step 4: CEO reviews:
        - Final approval/rejection
        - May ask questions
        - Approves if valid business need

Step 5: If approved:
        - Staff/Manager can proceed with agent invite process
        - See [Agent Invite](agent-invite.md) for technical steps
```

### Scenario 2: Budget Exceeding Limit

```
Flow: Staff submits --> Manager reviews --> CEO approves if large

Step 1: Staff encounters budget need
        "Cloud infrastructure costs will exceed monthly
         budget by $5,000"

Step 2: Staff submits agent_approve request:
        Type: agent_approve
        Title: "Budget overrun: Cloud infrastructure"
        Amount: $5,000
        Description: "Traffic spike from marketing campaign.
                       One-time cost, will return to normal next month."

Step 3: Manager reviews:
        - If within Manager authority (e.g., <$2,000): approve
        - If exceeds authority (e.g., >$2,000): forward to CEO

Step 4: CEO reviews (if escalated):
        - Evaluates business justification
        - Approves or rejects with feedback

Step 5: If approved:
        - Staff can proceed with infrastructure expansion
```

### Scenario 3: Leave/Time-off Request

```
Flow: Staff submits --> Manager reviews

Step 1: Staff submits human_approve request:
        Type: human_approve
        Title: "Vacation request: June 15-22"
        Duration: 5 working days
        Description: "Annual family vacation"

Step 2: Request appears in Manager's approval queue
        (Also visible in UI for human review)

Step 3: Manager reviews:
        - Checks team coverage
        - Reviews project deadlines
        - Approves if no major conflicts

Step 4: If approved:
        - Staff notified
        - Coverage arranged
        - Calendar updated

Step 5: If rejected:
        - Staff notified with reason
        - Staff revises dates or provides more context
```

### Scenario 4: Cross-Department Task

```
Flow: Staff submits --> Manager reviews --> CEO approves

Step 1: Staff needs help from another department:
        "Need Platform team's help to set up CI/CD pipeline"

Step 2: Staff submits agent_approve request:
        Type: agent_approve
        Title: "Cross-department: Platform team assistance"
        Target Department: Platform
        Description: "Engineering team lacks Platform expertise.
                       Need 2 weeks of Platform team time."

Step 3: Manager reviews:
        - Validates the need
        - Contacts Platform Manager informally
        - Forwards to CEO with context

Step 4: CEO reviews:
        - Evaluates company-wide priorities
        - Approves if benefits outweigh costs

Step 5: If approved:
        - Platform Manager assigns resources
        - Work can begin
```

---

## After Approval: Proceed or Revise

### If Approved

The requester receives notification and can proceed with the action.

```
Status: Approved
Message: "Budget overrun approved. Proceed with infrastructure expansion."
Next Steps:
  1. Take the approved action
  2. Document the approval reference
  3. Execute within approved parameters
```

### If Rejected

The requester must revise and resubmit, or abandon the request.

```
Status: Rejected
Message: "Budget approved for $2,000, not $5,000. Please revise scope."
Next Steps:
  1. Review rejection reason
  2. Revise request if possible
  3. Resubmit with modifications
  OR
  4. Accept rejection and find alternative approach
```

---

## CLI Commands

### Request Approval

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

# Submit with specific target
leclaw approval request \
  --api-key <key> \
  --type agent_approve \
  --title "Budget allocation: Q2 Marketing" \
  --description "Requesting budget for Q2 marketing campaign"
```

### List Approvals

```bash
# List pending approvals for self (Manager/CEO)
leclaw approval list --api-key <key> --status pending
```

### Show Approval

```bash
# Show approval details
leclaw approval show --api-key <key> --approval-id <approval-id>
```

### Approve

```bash
# Approve a request
leclaw approval approve --api-key <key> --approval-id <approval-id>
```

### Reject

```bash
# Reject a request
leclaw approval reject --api-key <key> --approval-id <approval-id> --message "Budget constraints this quarter."

# Reject and suggest revision
leclaw approval reject --api-key <key> --approval-id <approval-id> --message "Please reduce scope to $2,000 and resubmit."
```

---

## Approval Request Structure

### agent_approve Request

| Field | Required | Description |
|-------|----------|-------------|
| type | Yes | Must be "agent_approve" |
| title | Yes | Brief summary of request |
| description | Yes | Business reason for request |
| targetAgentId | No | Specific agent if applicable |

### human_approve Request

| Field | Required | Description |
|-------|----------|-------------|
| type | Yes | Must be "human_approve" |
| title | Yes | Brief summary of request |
| description | Yes | Reason for request |
| duration | No | For leave requests |

---

## Best Practices

### For Requesters

1. **Provide clear justification** - Explain why this is needed
2. **Be specific** - Include amounts, timelines, expected outcomes
3. **Anticipate questions** - Provide context upfront
4. **Follow up if needed** - Don't spam, but check if urgent
5. **Respect rejection** - Revise and resubmit if possible

### For Approvers

1. **Review promptly** - Requests block work
2. **Provide feedback** - Even rejections should explain why
3. **Escalate appropriately** - Don't approve beyond authority
4. **Document decisions** - Note reasoning for audit trail
5. **Consider alternatives** - Can you help requester find another way?

### General

1. **Don't over-use approvals** - If in doubt, ask via A2A first
2. **Appropriate for the risk** - Low-risk actions don't need approval
3. **Respect hierarchy** - CEO is final authority, use wisely
4. **Track approved requests** - Keep reference for compliance

---

## Related Documents

- [Issues](issues.md) - When to use Issue instead of Approval
- [Goals](goals.md) - Strategic context for approvals
- [Agent Invite](agent-invite.md) - Hiring approval workflow
- [Collaboration](collaboration.md) - A2A communication for approvals

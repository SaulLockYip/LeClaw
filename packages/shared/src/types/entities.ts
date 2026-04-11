// Company entity - Data isolation boundary in LeClaw
export interface Company {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Department entity - Belongs to a Company, contains Manager + Staff agents
export interface Department {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Agent role types
export type AgentRole = "CEO" | "Manager" | "Staff";

// Agent entity - Maps OpenClaw agents to LeClaw roles
export interface Agent {
  id: string;
  companyId: string;
  departmentId?: string; // CEO agents have no department
  name: string;
  title?: string; // Optional title/position for the agent
  role: AgentRole;
  openClawAgentId?: string; // External OpenClaw agent identifier
  openClawAgentWorkspace?: string; // OpenClaw workspace path
  openClawAgentDir?: string; // OpenClaw agent working directory
  createdAt: Date;
  updatedAt: Date;
}

// Issue status types
export type IssueStatus = "Open" | "InProgress" | "Blocked" | "Done" | "Cancelled";

// Sub-Issue entity - Child issue belonging to a parent Issue
export interface SubIssue {
  id: string;
  parentIssueId: string;
  title: string;
  description?: string;
  status: IssueStatus;
  assigneeAgentId: string;
  createdAt: Date;
}

// Issue entity - Core work unit in LeClaw, belongs to a Department
export interface Issue {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  status: IssueStatus;
  departmentId: string;
  subIssues: string[]; // Issue UUIDs
  report?: string; // Markdown text content
  projectId?: string;
  goalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// IssueComment entity - Separate table for issue comments
export interface IssueComment {
  id: string;
  issueId: string;
  authorAgentId?: string;
  timestamp: Date;
  message: string;
}

// Goal status types
export type GoalStatus = "Open" | "Achieved" | "Archived";

// Goal entity - Company-level objective defining desired outcomes
export interface Goal {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  status: GoalStatus;
  verification?: string; // How to verify goal is achieved
  deadline?: Date;
  departmentIds: string[]; // Department UUIDs
  issueIds: string[]; // Issue UUIDs
  createdAt: Date;
  updatedAt: Date;
}

// Project status types
export type ProjectStatus = "Open" | "InProgress" | "Done" | "Archived";

// Project entity - Company-level work container grouping related issues
export interface Project {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  projectDir?: string; // Project root directory
  issueIds: string[]; // Issue UUIDs
  createdAt: Date;
  updatedAt: Date;
}

// Approval status types
export type ApprovalStatus = "Pending" | "Approved" | "Rejected";

// Approval type - human_approve (UI) or agent_approve (Manager/CEO)
export type ApprovalType = "human_approve" | "agent_approve";

// Approval entity - Human-agent interaction for sensitive operations
export interface Approval {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  requester?: string; // Agent who initiated the approval request
  type: ApprovalType;
  approverId?: string; // Actual approver (for agent_approve type)
  status: ApprovalStatus;
  rejectMessage?: string; // Reason for rejection
  createdAt: Date;
  updatedAt: Date;
}
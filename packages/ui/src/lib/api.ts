/**
 * REST API client for LeClaw backend
 */

const API_BASE = 'http://localhost:4396/api'

export interface Company {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Department {
  id: string
  name: string
  companyId: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Agent {
  id: string
  name: string
  title?: string
  role: 'CEO' | 'Manager' | 'Staff'
  openClawAgentId: string
  openClawAgentWorkspace: string
  openClawAgentDir: string
  companyId: string
  departmentId?: string
  status?: 'online' | 'offline' | 'busy'
  createdAt: string
  updatedAt: string
}

export interface Issue {
  id: string
  title: string
  description: string
  status: 'Open' | 'InProgress' | 'Done' | 'Blocked' | 'Cancelled'
  departmentId: string
  subIssues: string[]
  comments: Comment[]
  report?: string
  projectId?: string
  goalId?: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  author: string
  timestamp: string
  message: string
}

export interface SubIssue {
  id: string
  parentIssueId: string
  title: string
  description?: string
  status: 'Open' | 'InProgress' | 'Blocked' | 'Done' | 'Cancelled'
  assigneeAgentId: string
  createdAt: string
}

export interface Goal {
  id: string
  title: string
  description: string
  status: 'Open' | 'Achieved' | 'Archived'
  verification: string
  deadline?: string
  departmentIds: string[]
  issueIds: string[]
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  companyId: string
  title: string
  description: string
  status: 'Open' | 'InProgress' | 'Done' | 'Archived'
  projectDir: string
  issueIds: string[]
  createdAt: string
  updatedAt: string
}

export interface Approval {
  id: string
  companyId: string
  title: string
  description?: string
  type: string
  requester?: string
  status: 'Pending' | 'Approved' | 'Rejected'
  message?: string
  approverId?: string
  createdAt: string
  updatedAt: string
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, options)
  if (!response.ok) {
    // Try to parse error message from response body
    let errorMessage = `API error: ${response.status} ${response.statusText}`
    try {
      const errorJson = await response.json()
      if (errorJson?.error?.message) {
        errorMessage = errorJson.error.message
      }
    } catch {
      // Ignore JSON parse errors, use default message
    }
    throw new Error(errorMessage)
  }
  const json = await response.json()
  // Unwrap { success: true, data: ... } response format
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T
  }
  return json as T
}

// Company API
export const companyApi = {
  list: () => fetchApi<Company[]>('/companies'),
  get: (id: string) => fetchApi<Company>(`/companies/${id}`),
  create: (data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) =>
    fetchApi<Company>('/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Company>) =>
    fetchApi<Company>(`/companies/${id}`),
  delete: (id: string) => fetchApi<void>(`/companies/${id}`, { method: 'DELETE' }),
}

// Department API
export const departmentApi = {
  listByCompany: (companyId: string) =>
    fetchApi<Department[]>(`/companies/${companyId}/departments`),
  get: (companyId: string, departmentId: string) =>
    fetchApi<Department>(`/companies/${companyId}/departments/${departmentId}`),
  create: (companyId: string, data: Omit<Department, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) =>
    fetchApi<Department>(`/companies/${companyId}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  update: (companyId: string, departmentId: string, data: Partial<Department>) =>
    fetchApi<Department>(`/companies/${companyId}/departments/${departmentId}`),
  delete: (companyId: string, departmentId: string) =>
    fetchApi<void>(`/companies/${companyId}/departments/${departmentId}`, { method: 'DELETE' }),
}

// Agent API
export const agentApi = {
  listByCompany: (companyId: string) =>
    fetchApi<Agent[]>(`/companies/${companyId}/agents`),
  get: (companyId: string, agentId: string) =>
    fetchApi<Agent>(`/companies/${companyId}/agents/${agentId}`),
  delete: (companyId: string, agentId: string) =>
    fetchApi<void>(`/companies/${companyId}/agents/${agentId}`, { method: 'DELETE' }),
}

// Issue API
export const issueApi = {
  list: (companyId: string, limit?: number) => {
    const url = `/companies/${companyId}/issues${limit ? `?limit=${limit}` : ''}`
    return fetchApi<Issue[]>(url)
  },
  get: (companyId: string, issueId: string) =>
    fetchApi<Issue>(`/companies/${companyId}/issues/${issueId}`),
  create: (companyId: string, data: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) =>
    fetchApi<Issue>(`/companies/${companyId}/issues`),
  update: (companyId: string, issueId: string, data: Partial<Issue>) =>
    fetchApi<Issue>(`/companies/${companyId}/issues/${issueId}`),
  delete: (companyId: string, issueId: string) =>
    fetchApi<void>(`/companies/${companyId}/issues/${issueId}`, { method: 'DELETE' }),
  getComments: (companyId: string, issueId: string) =>
    fetchApi<Comment[]>(`/companies/${companyId}/issues/${issueId}/comments`),
}

// Goal API
export const goalApi = {
  list: (companyId: string) => fetchApi<Goal[]>(`/companies/${companyId}/goals`),
  get: (companyId: string, goalId: string) =>
    fetchApi<Goal>(`/companies/${companyId}/goals/${goalId}`),
  delete: (companyId: string, goalId: string) =>
    fetchApi<void>(`/companies/${companyId}/goals/${goalId}`, { method: 'DELETE' }),
}

// Project API
export const projectApi = {
  list: (companyId: string) => fetchApi<Project[]>(`/companies/${companyId}/projects`),
  get: (companyId: string, projectId: string) =>
    fetchApi<Project>(`/companies/${companyId}/projects/${projectId}`),
  delete: (companyId: string, projectId: string) =>
    fetchApi<void>(`/companies/${companyId}/projects/${projectId}`, { method: 'DELETE' }),
}

// Approval API
export const approvalApi = {
  list: (companyId: string) => fetchApi<Approval[]>(`/companies/${companyId}/approvals`),
  get: (companyId: string, approvalId: string) =>
    fetchApi<Approval>(`/companies/${companyId}/approvals/${approvalId}`),
  approve: (companyId: string, approvalId: string, message?: string) =>
    fetchApi<Approval>(`/companies/${companyId}/approvals/${approvalId}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    }),
  reject: (companyId: string, approvalId: string, message: string) =>
    fetchApi<Approval>(`/companies/${companyId}/approvals/${approvalId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    }),
}

// OpenClaw Agent API
export interface OpenClawAgent {
  id: string
  name?: string
  workspace: string
}

export const openclawAgentsApi = {
  list: () => fetchApi<{ agents: OpenClawAgent[]; errors: string[] }>('/openclaw/agents'),
}

// Agent Invite API
export interface AgentInvite {
  id: string
  inviteKey: string
  companyId: string
  departmentId?: string
  name: string
  role: 'CEO' | 'Manager' | 'Staff'
  title: string
  status: 'pending' | 'accepted' | 'expired'
  expiresAt: string
  createdAt: string
  openClawAgentId?: string
  openClawAgentWorkspace?: string
  openClawAgentDir?: string
}

export interface AgentInviteResult {
  inviteKey: string
  expiresAt: string
  prompt: string
}

export const agentInviteApi = {
  list: (companyId: string) =>
    fetchApi<AgentInvite[]>(`/companies/${companyId}/agent-invites`),
  create: (companyId: string, data: { name: string; role: 'CEO' | 'Manager' | 'Staff'; title: string; departmentId?: string; openClawAgentId?: string; openClawAgentWorkspace?: string; openClawAgentDir?: string }) =>
    fetchApi<AgentInviteResult>(`/companies/${companyId}/agent-invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
}

// SubIssue API
export const subIssueApi = {
  get: (companyId: string, subIssueId: string) =>
    fetchApi<SubIssue>(`/companies/${companyId}/issues/sub-issues/${subIssueId}`),
  update: (companyId: string, subIssueId: string, data: Partial<SubIssue>) =>
    fetchApi<SubIssue>(`/companies/${companyId}/issues/sub-issues/${subIssueId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  listComments: (companyId: string, parentIssueId: string) =>
    fetchApi<Comment[]>(`/companies/${companyId}/issues/${parentIssueId}/comments`),
}

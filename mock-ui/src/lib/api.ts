/**
 * REST API client for LeClaw backend
 */

const API_BASE = 'http://localhost:8080/api'

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
  assignee?: string
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
  title: string
  description: string
  requester: string
  status: 'Pending' | 'Approved' | 'Rejected'
  rejectMessage?: string
  createdAt: string
  updatedAt: string
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`)
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

// Company API
export const companyApi = {
  list: () => fetchApi<Company[]>('/companies'),
  get: (id: string) => fetchApi<Company>(`/companies/${id}`),
  create: (data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) =>
    fetchApi<Company>('/companies'),
  update: (id: string, data: Partial<Company>) =>
    fetchApi<Company>(`/companies/${id}`),
  delete: (id: string) => fetchApi<void>(`/companies/${id}`),
}

// Department API
export const departmentApi = {
  listByCompany: (companyId: string) =>
    fetchApi<Department[]>(`/companies/${companyId}/departments`),
  get: (companyId: string, departmentId: string) =>
    fetchApi<Department>(`/companies/${companyId}/departments/${departmentId}`),
  create: (companyId: string, data: Omit<Department, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) =>
    fetchApi<Department>(`/companies/${companyId}/departments`),
  update: (companyId: string, departmentId: string, data: Partial<Department>) =>
    fetchApi<Department>(`/companies/${companyId}/departments/${departmentId}`),
  delete: (companyId: string, departmentId: string) =>
    fetchApi<void>(`/companies/${companyId}/departments/${departmentId}`),
}

// Agent API
export const agentApi = {
  listByCompany: (companyId: string) =>
    fetchApi<Agent[]>(`/companies/${companyId}/agents`),
  get: (companyId: string, agentId: string) =>
    fetchApi<Agent>(`/companies/${companyId}/agents/${agentId}`),
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
}

// Goal API
export const goalApi = {
  list: (companyId: string) => fetchApi<Goal[]>(`/companies/${companyId}/goals`),
  get: (companyId: string, goalId: string) =>
    fetchApi<Goal>(`/companies/${companyId}/goals/${goalId}`),
}

// Project API
export const projectApi = {
  list: (companyId: string) => fetchApi<Project[]>(`/companies/${companyId}/projects`),
  get: (companyId: string, projectId: string) =>
    fetchApi<Project>(`/companies/${companyId}/projects/${projectId}`),
}

// Approval API
export const approvalApi = {
  list: (companyId: string) => fetchApi<Approval[]>(`/companies/${companyId}/approvals`),
  get: (companyId: string, approvalId: string) =>
    fetchApi<Approval>(`/companies/${companyId}/approvals/${approvalId}`),
  update: (companyId: string, approvalId: string, data: { status: 'Approved' | 'Rejected'; rejectMessage?: string }) =>
    fetchApi<Approval>(`/companies/${companyId}/approvals/${approvalId}`),
}

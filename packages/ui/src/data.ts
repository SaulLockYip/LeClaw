export interface Company {
  id: string
  name: string
  color: string
  online: boolean
}

export interface NavItem {
  id: string
  label: string
  icon: string
  active?: boolean
}

export interface Agent {
  id: string
  name: string
  title?: string
  role: 'CEO' | 'Manager' | 'Staff'
  department: string
  company: string
  status: 'online' | 'offline' | 'busy'
  lastSeen: string
}

export interface Issue {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  status: 'Open' | 'InProgress' | 'Blocked' | 'Done' | 'Cancelled'
  assignee: string
  createdAt: string
}

export interface Project {
  id: string
  title: string
  description: string
  status: 'Planning' | 'In Progress' | 'Completed'
  totalIssues: number
  doneIssues: number
  team: string
}

export const companies: Company[] = [
  { id: '1', name: 'Acme Corp', color: '#3b82f6', online: true },
  { id: '2', name: 'TechStart', color: '#10b981', online: true },
  { id: '3', name: 'GlobalTech', color: '#f59e0b', online: false },
]

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'issues', label: 'Issues', icon: '📋' },
  { id: 'goals', label: 'Goals', icon: '🎯' },
  { id: 'projects', label: 'Projects', icon: '📁', active: true },
  { id: 'approvals', label: 'Approvals', icon: '✅' },
]

export const agents: Agent[] = [
  { id: '1', name: 'Alice', role: 'CEO', department: 'Executive', company: 'Acme Corp', status: 'online', lastSeen: 'Just now' },
  { id: '2', name: 'Bob', role: 'Manager', department: 'Marketing', company: 'Acme Corp', status: 'online', lastSeen: 'Just now' },
  { id: '3', name: 'Charlie', role: 'Staff', department: 'Marketing', company: 'Acme Corp', status: 'busy', lastSeen: '5 min ago' },
  { id: '4', name: 'Dave', role: 'Staff', department: 'Marketing', company: 'Acme Corp', status: 'online', lastSeen: 'Just now' },
  { id: '5', name: 'Eve', role: 'Manager', department: 'Engineering', company: 'Acme Corp', status: 'offline', lastSeen: '2 hours ago' },
  { id: '6', name: 'Frank', role: 'Staff', department: 'Engineering', company: 'Acme Corp', status: 'online', lastSeen: 'Just now' },
]

export const issues: Issue[] = [
  { id: '1', title: 'API rate limiting not working', priority: 'high', status: 'Open', assignee: 'Frank', createdAt: '2 hours ago' },
  { id: '2', title: 'Update dashboard analytics', priority: 'medium', status: 'InProgress', assignee: 'Charlie', createdAt: '5 hours ago' },
  { id: '3', title: 'Fix mobile responsive layout', priority: 'medium', status: 'Open', assignee: 'Bob', createdAt: '1 day ago' },
  { id: '4', title: 'Add user onboarding flow', priority: 'low', status: 'Open', assignee: 'Dave', createdAt: '2 days ago' },
]

export const projects: Project[] = [
  { id: '1', title: 'Website Redesign', description: 'Complete overhaul of the company website with new branding', status: 'In Progress', totalIssues: 12, doneIssues: 3, team: 'Marketing' },
  { id: '2', title: 'Mobile App v2', description: 'Next generation mobile application with new features', status: 'Planning', totalIssues: 8, doneIssues: 0, team: 'Engineering' },
  { id: '3', title: 'Q4 Campaign', description: 'Q4 marketing campaign across all channels', status: 'Completed', totalIssues: 20, doneIssues: 20, team: 'Sales' },
]

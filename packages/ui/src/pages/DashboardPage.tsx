import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Bot, Clock, Users, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react'
import { useCompany } from '../hooks/useCompany'
import { issueApi } from '../lib/api'
import type { Issue } from '../lib/api'
import { useNavigate } from 'react-router-dom'

function DashboardPage() {
  const { selectedCompany, departments, agents, isLoading } = useCompany()
  const [recentIssues, setRecentIssues] = useState<Issue[]>([])
  const [isLoadingIssues, setIsLoadingIssues] = useState(false)

  // Load recent issues
  useEffect(() => {
    if (!selectedCompany) return

    async function loadRecentIssues() {
      setIsLoadingIssues(true)
      try {
        const issues = await issueApi.list(selectedCompany.id, 5)
        setRecentIssues(issues)
      } catch (err) {
        console.error('Failed to load recent issues:', err)
      } finally {
        setIsLoadingIssues(false)
      }
    }
    loadRecentIssues()
  }, [selectedCompany])

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Select a company to view dashboard</p>
      </div>
    )
  }

  // Calculate agent stats
  const onlineAgents = agents.filter((a) => a.status === 'online').length
  const busyAgents = agents.filter((a) => a.status === 'busy').length
  const totalAgents = agents.length

  // Calculate issue stats
  const openIssues = recentIssues.filter((i) => i.status === 'Open').length
  const inProgressIssues = recentIssues.filter((i) => i.status === 'InProgress').length
  const doneIssues = recentIssues.filter((i) => i.status === 'Done').length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'busy':
        return 'bg-yellow-500'
      case 'offline':
        return 'bg-slate-400'
      default:
        return 'bg-slate-400'
    }
  }

  const getIssueStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-orange-100 text-orange-700'
      case 'InProgress':
        return 'bg-blue-100 text-blue-700'
      case 'Done':
        return 'bg-green-100 text-green-700'
      case 'Blocked':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

      {/* Company Name */}
      <p className="text-slate-500 -mt-4">{selectedCompany.name}</p>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {isLoading ? '-' : departments.length}
              </div>
              <div className="text-sm text-slate-500">Departments</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {isLoading ? '-' : onlineAgents}
              </div>
              <div className="text-sm text-slate-500">Agents Online</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {isLoading ? '-' : busyAgents}
              </div>
              <div className="text-sm text-slate-500">Agents Busy</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {isLoading ? '-' : totalAgents}
              </div>
              <div className="text-sm text-slate-500">Total Agents</div>
            </div>
          </div>
        </div>
      </div>

      {/* Issues Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-700">{openIssues}</div>
              <div className="text-sm text-orange-600">Open Issues</div>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-300" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">{inProgressIssues}</div>
              <div className="text-sm text-blue-600">In Progress</div>
            </div>
            <Clock className="w-8 h-8 text-blue-300" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-700">{doneIssues}</div>
              <div className="text-sm text-green-600">Done</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-300" />
          </div>
        </div>
      </div>

      {/* Agent Status Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Agent Status</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-slate-500">Agent</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-slate-500">Role</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {agents.slice(0, 5).map((agent) => (
              <tr key={agent.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status || 'offline')}`}></div>
                    <Link to={`/agents/${agent.id}`} className="text-sm font-medium text-slate-800 hover:text-blue-600">
                      {agent.name}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{agent.role}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    agent.status === 'online' ? 'bg-green-100 text-green-700' :
                    agent.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {agent.status || 'offline'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Issues */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Recent Issues</h2>
          <Link to="/issues" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {isLoadingIssues ? (
            <div className="px-4 py-8 text-center text-slate-500">Loading...</div>
          ) : recentIssues.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">No recent issues</div>
          ) : (
            recentIssues.map((issue) => (
              <div key={issue.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800">{issue.title}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {issue.id} · {issue.assignee || 'Unassigned'}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getIssueStatusBadge(issue.status)}`}>
                  {issue.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

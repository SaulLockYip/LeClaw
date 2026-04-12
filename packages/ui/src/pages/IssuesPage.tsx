import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useCompany } from '../hooks/useCompany'
import { issueApi } from '../lib/api'
import type { Issue } from '../lib/api'

function IssuesPage() {
  const { selectedCompany, isLoading: isCompanyLoading, departments } = useCompany()
  const [issues, setIssues] = useState<Issue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Open' | 'InProgress' | 'Blocked' | 'Done' | 'Cancelled'>('All')

  useEffect(() => {
    if (!selectedCompany) return

    async function loadIssues() {
      setIsLoading(true)
      try {
        const data = await issueApi.list(selectedCompany.id)
        setIssues(data)
      } catch (err) {
        console.error('Failed to load issues:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadIssues()
  }, [selectedCompany])

  const filteredIssues = issues.filter((issue) => {
    if (filter === 'All') return true
    return issue.status === filter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-orange-100 text-orange-700'
      case 'InProgress':
        return 'bg-blue-100 text-blue-700'
      case 'Done':
        return 'bg-green-100 text-green-700'
      case 'Blocked':
        return 'bg-red-100 text-red-700'
      case 'Cancelled':
        return 'bg-slate-100 text-slate-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const filterTabs = [
    { label: 'All', count: issues.length },
    { label: 'Open', count: issues.filter((i) => i.status === 'Open').length },
    { label: 'InProgress', count: issues.filter((i) => i.status === 'InProgress').length },
    { label: 'Blocked', count: issues.filter((i) => i.status === 'Blocked').length },
    { label: 'Done', count: issues.filter((i) => i.status === 'Done').length },
    { label: 'Cancelled', count: issues.filter((i) => i.status === 'Cancelled').length },
  ]

  if (isCompanyLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Issues</h1>
          <p className="text-slate-500 text-sm mt-1">{selectedCompany?.name}</p>
        </div>
        <button
          className="px-4 py-2 bg-slate-300 text-slate-500 rounded-lg font-medium text-sm cursor-not-allowed flex items-center gap-2"
          disabled
          title="Web UI is read-only. Create issues via CLI."
        >
          <Plus className="w-4 h-4" />
          New Issue
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b border-slate-200">
          {filterTabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setFilter(tab.label as typeof filter)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
                filter === tab.label
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                filter === tab.label ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Issues Table */}
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Title</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Department</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">Loading...</td>
              </tr>
            ) : filteredIssues.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No issues found</td>
              </tr>
            ) : (
              filteredIssues.map((issue) => (
                <tr
                  key={issue.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => window.location.href = `/issues/${issue.id}`}
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{issue.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(issue.status)}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {departments.find(d => d.id === issue.departmentId)?.name || issue.departmentId || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default IssuesPage

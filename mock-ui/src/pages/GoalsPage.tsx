import { useState, useEffect } from 'react'
import { Plus, Target } from 'lucide-react'
import { useCompany } from '../hooks/useCompany'
import { goalApi } from '../lib/api'
import type { Goal } from '../lib/api'

const tabs = ['All', 'Open', 'Achieved', 'Archived'] as const

function GoalsPage() {
  const { selectedCompany, isLoading: isCompanyLoading } = useCompany()
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All')

  useEffect(() => {
    if (!selectedCompany) return

    async function loadGoals() {
      setIsLoading(true)
      try {
        const data = await goalApi.list(selectedCompany.id)
        setGoals(data)
      } catch (err) {
        console.error('Failed to load goals:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadGoals()
  }, [selectedCompany])

  const filteredGoals = activeTab === 'All'
    ? goals
    : goals.filter((g) => g.status === activeTab)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-700'
      case 'Achieved':
        return 'bg-green-100 text-green-700'
      case 'Archived':
        return 'bg-slate-100 text-slate-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  if (isCompanyLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Goals</h1>
          <p className="text-slate-500 text-sm mt-1">{selectedCompany?.name}</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-200 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {tab}
            <span className="ml-2 text-xs text-slate-400">
              {tab === 'All' ? goals.length : goals.filter((g) => g.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Goals Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Title</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Verification</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Deadline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">Loading...</td>
              </tr>
            ) : filteredGoals.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No goals found</td>
              </tr>
            ) : (
              filteredGoals.map((goal) => (
                <tr key={goal.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-800">{goal.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(goal.status)}`}>
                      {goal.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{goal.verification || '-'}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">
                    {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '-'}
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

export default GoalsPage

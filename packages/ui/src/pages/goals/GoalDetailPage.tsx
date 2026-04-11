import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Target, CheckCircle, AlertCircle, Building2, Calendar, Trash2 } from 'lucide-react'
import { useCompany } from '../../hooks/useCompany'
import { goalApi, issueApi } from '../../lib/api'
import type { Goal, Issue } from '../../lib/api'

function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { selectedCompany, isLoading: isCompanyLoading, departments } = useCompany()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [relatedIssues, setRelatedIssues] = useState<Issue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!selectedCompany || !id) return

    async function loadGoalAndIssues() {
      setIsLoading(true)
      setError(null)
      try {
        const [goalData, issuesData] = await Promise.all([
          goalApi.get(selectedCompany.id, id),
          issueApi.list(selectedCompany.id),
        ])
        setGoal(goalData)
        // Filter issues that are related to this goal
        const related = issuesData.filter((issue: Issue) =>
          goalData.issueIds.includes(issue.id)
        )
        setRelatedIssues(related)
      } catch (err) {
        setError('Failed to load goal')
        console.error('Failed to load goal:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadGoalAndIssues()
  }, [selectedCompany, id])

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-700'
      case 'Achieved':
        return 'bg-green-100 text-green-700'
      case 'Archived':
        return 'bg-black/5 text-black/70'
      default:
        return 'bg-black/5 text-black/70'
    }
  }

  const getIssueStatusBadgeClass = (status: string) => {
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
        return 'bg-black/5 text-black/70'
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Calculate progress from related issues
  const completedIssues = relatedIssues.filter((i) => i.status === 'Done').length
  const totalIssues = relatedIssues.length
  const progressPercent = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0

  if (isCompanyLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  if (error || !goal) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/goals" className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-red-500">{error || 'Goal not found'}</p>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!selectedCompany) return
    setIsDeleting(true)
    try {
      await goalApi.delete(selectedCompany.id, goal.id)
      navigate('/goals')
    } catch (err) {
      console.error('Failed to delete goal:', err)
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/goals" className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <div className="flex-1 flex items-center gap-3">
          <Target className="w-6 h-6 text-slate-500" />
          <h1 className="text-2xl font-bold text-slate-900">{goal.title}</h1>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(goal.status)}`}>
            {goal.status}
          </span>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-slate-500" />
          Goal Details
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="text-xs uppercase text-slate-500 tracking-wider">Description</label>
            <p className="text-slate-900 mt-1">{goal.description || 'No description'}</p>
          </div>
          <div className="col-span-2">
            <label className="text-xs uppercase text-slate-500 tracking-wider">Verification</label>
            <p className="text-slate-900 mt-1">{goal.verification || 'No verification criteria'}</p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Deadline
            </label>
            <p className="text-slate-900 mt-1">{formatDate(goal.deadline)}</p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Progress</label>
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {completedIssues}/{totalIssues} ({progressPercent}%)
                </span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Departments</label>
            <p className="text-slate-900 mt-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              {goal.departmentIds?.length > 0
                ? goal.departmentIds.map(id => departments.find(d => d.id === id)?.name || id).join(', ')
                : 'None'}
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Created</label>
            <p className="text-slate-900 mt-1">{formatDate(goal.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Related Issues Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-slate-500" />
          Related Issues ({relatedIssues.length})
        </h2>
        {relatedIssues.length > 0 ? (
          <div className="space-y-2">
            {relatedIssues.map((issue) => (
              <Link
                key={issue.id}
                to={`/issues/${issue.id}`}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700">{issue.title}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getIssueStatusBadgeClass(issue.status)}`}>
                  {issue.status}
                </span>
                {issue.status === 'Done' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No related issues</p>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg border border-black p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-black mb-2">Delete Goal?</h3>
            <p className="text-black/70 mb-6">
              Are you sure you want to delete <strong>{goal.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-black/20 text-black hover:bg-black/5 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoalDetailPage

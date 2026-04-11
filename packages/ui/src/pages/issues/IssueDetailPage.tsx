import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertCircle, MessageSquare, FileText, User, Building2, FolderKanban, Trash2 } from 'lucide-react'
import { useCompany } from '../../hooks/useCompany'
import { issueApi, subIssueApi } from '../../lib/api'
import type { Issue, Comment, SubIssue } from '../../lib/api'

function IssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { selectedCompany, isLoading: isCompanyLoading, departments } = useCompany()
  const [issue, setIssue] = useState<Issue | null>(null)
  const [subIssues, setSubIssues] = useState<SubIssue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!selectedCompany || !id) return

    async function loadIssue() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await issueApi.get(selectedCompany.id, id)
        setIssue(data)
      } catch (err) {
        setError('Failed to load issue')
        console.error('Failed to load issue:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadIssue()
  }, [selectedCompany, id])

  useEffect(() => {
    if (!selectedCompany || !issue?.subIssues?.length) return

    async function loadSubIssues() {
      try {
        const results = await Promise.all(
          issue.subIssues.map((subIssueId) =>
            subIssueApi.get(selectedCompany.id, subIssueId)
          )
        )
        setSubIssues(results)
      } catch (err) {
        console.error('Failed to load sub-issues:', err)
      }
    }
    loadSubIssues()
  }, [selectedCompany, issue?.subIssues])

  const getStatusBadgeClass = (status: string) => {
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isCompanyLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  if (error || !issue) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/issues" className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-red-500">{error || 'Issue not found'}</p>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!selectedCompany) return
    setIsDeleting(true)
    try {
      await issueApi.delete(selectedCompany.id, issue.id)
      navigate('/issues')
    } catch (err) {
      console.error('Failed to delete issue:', err)
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/issues" className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{issue.title}</h1>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(issue.status)}`}>
            {issue.status}
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
          <AlertCircle className="w-5 h-5 text-slate-500" />
          Issue Details
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Description</label>
            <p className="text-slate-900 mt-1">{issue.description || 'No description'}</p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Assignee</label>
            <p className="text-slate-900 mt-1 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              {issue.assignee || 'Unassigned'}
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Department</label>
            <p className="text-slate-900 mt-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              {departments.find(d => d.id === issue.departmentId)?.name || issue.departmentId || 'Unknown'}
            </p>
          </div>
          {issue.projectId && (
            <div>
              <label className="text-xs uppercase text-slate-500 tracking-wider">Project</label>
              <p className="text-slate-900 mt-1 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-slate-400" />
                <Link to={`/projects/${issue.projectId}`} className="text-blue-600 hover:text-blue-800">
                  {issue.projectId}
                </Link>
              </p>
            </div>
          )}
          {issue.goalId && (
            <div>
              <label className="text-xs uppercase text-slate-500 tracking-wider">Goal</label>
              <p className="text-slate-900 mt-1 flex items-center gap-2">
                <Link to={`/goals/${issue.goalId}`} className="text-blue-600 hover:text-blue-800">
                  {issue.goalId}
                </Link>
              </p>
            </div>
          )}
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Created</label>
            <p className="text-slate-900 mt-1">{formatDate(issue.createdAt)}</p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Updated</label>
            <p className="text-slate-900 mt-1">{formatDate(issue.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Sub-Issues Card */}
      {issue.subIssues && issue.subIssues.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-slate-500" />
            Sub-Issues ({issue.subIssues.length})
          </h2>
          <div className="space-y-2">
            {subIssues.map((subIssue) => (
              <Link
                key={subIssue.id}
                to={`/issues/${subIssue.id}`}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <AlertCircle className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700 flex-1">{subIssue.title}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(subIssue.status)}`}>
                  {subIssue.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Comments Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-500" />
          Comments ({issue.comments?.length || 0})
        </h2>
        {issue.comments && issue.comments.length > 0 ? (
          <div className="space-y-4">
            {issue.comments.map((comment: Comment, index: number) => (
              <div key={index} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 text-sm font-medium">
                  {comment.author?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-900">{comment.author}</span>
                    <span className="text-xs text-slate-400">{formatDate(comment.timestamp)}</span>
                  </div>
                  <p className="text-sm text-slate-600">{comment.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No comments yet</p>
        )}
      </div>

      {/* Report Card */}
      {issue.report && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            Report
          </h2>
          <div className="prose prose-sm max-w-none text-slate-700">
            <pre className="whitespace-pre-wrap text-sm font-mono bg-slate-50 p-4 rounded-lg">
              {issue.report}
            </pre>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg border border-black p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-black mb-2">Delete Issue?</h3>
            <p className="text-black/70 mb-6">
              Are you sure you want to delete <strong>{issue.title}</strong>? This action cannot be undone.
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

export default IssueDetailPage

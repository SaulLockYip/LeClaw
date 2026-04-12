import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertCircle, MessageSquare, FileText, Building2, FolderKanban, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
          <div className="prose prose-sm max-w-none text-slate-700
            prose-headings:border-b prose-headings:border-slate-200 prose-headings:pb-1 prose-headings:font-semibold
            prose-h1:text-xl prose-h1:mt-4 prose-h1:mb-2
            prose-h2:text-lg prose-h2:mt-3 prose-h2:mb-2
            prose-h3:text-base prose-h3:mt-3 prose-h3:mb-1
            prose-p:text-slate-700 prose-p:my-2
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-img:max-w-full prose-img:rounded-lg
            prose-blockquote:border-l-4 prose-blockquote:border-slate-300 prose-blockquote:italic prose-blockquote:text-slate-500 prose-blockquote:pl-4
            prose-code:text-pink-600 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
            prose-pre:prose-pre:text-sm prose-pre:prose-pre:font-mono
            prose-ul:pl-5 prose-ul:list-disc prose-ul:my-2
            prose-ol:pl-5 prose-ol:list-decimal prose-ol:my-2
            prose-li:my-1
            prose-table:border-collapse prose-table:w-full prose-table:my-4
            prose-th:border prose-th:border-slate-300 prose-th:bg-slate-100 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold
            prose-td:border prose-td:border-slate-200 prose-td:px-3 prose-td:py-2
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{issue.report}</ReactMarkdown>
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

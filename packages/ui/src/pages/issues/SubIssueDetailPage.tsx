import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, AlertCircle, MessageSquare } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useCompany } from '../../hooks/useCompany'
import { subIssueApi } from '../../lib/api'
import type { SubIssue, Comment } from '../../lib/api'

const LONG_COMMENT_THRESHOLD = 200

function SubIssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { selectedCompany, isLoading: isCompanyLoading, agents } = useCompany()
  const [subIssue, setSubIssue] = useState<SubIssue | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllComments, setShowAllComments] = useState(false)
  const [expandedCommentIds, setExpandedCommentIds] = useState<Set<string>>(new Set())
  const [isUpdating, setIsUpdating] = useState(false)

  const toggleCommentExpand = (commentId: string) => {
    setExpandedCommentIds((prev) => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
  }

  useEffect(() => {
    if (!selectedCompany || !id) return

    async function loadSubIssue() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await subIssueApi.get(selectedCompany.id, id)
        setSubIssue(data)
      } catch (err) {
        setError('Failed to load sub-issue')
        console.error('Failed to load sub-issue:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadSubIssue()
  }, [selectedCompany, id])

  useEffect(() => {
    if (!selectedCompany || !subIssue?.parentIssueId) return

    async function loadComments() {
      try {
        // Comments are fetched using the parent issue ID
        const data = await subIssueApi.listComments(selectedCompany.id, subIssue.parentIssueId)
        setComments(data)
      } catch (err) {
        console.error('Failed to load comments:', err)
      }
    }
    loadComments()
  }, [selectedCompany, subIssue?.parentIssueId])

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

  const handleStatusChange = async (newStatus: SubIssue['status']) => {
    if (!selectedCompany || !subIssue) return
    setIsUpdating(true)
    try {
      await subIssueApi.update(selectedCompany.id, subIssue.id, { status: newStatus })
      setSubIssue((prev) => (prev ? { ...prev, status: newStatus } : null))
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isCompanyLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  if (error || !subIssue) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/issues" className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-red-500">{error || 'Sub-issue not found'}</p>
        </div>
      </div>
    )
  }

  const assignee = agents.find((a) => a.id === subIssue.assigneeAgentId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/issues" className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{subIssue.title}</h1>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(subIssue.status)}`}>
            {subIssue.status}
          </span>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-slate-500" />
          Sub-Issue Details
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Description</label>
            <p className="text-slate-900 mt-1">{subIssue.description || 'No description'}</p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Assignee</label>
            <p className="text-slate-900 mt-1">
              {assignee ? assignee.name : subIssue.assigneeAgentId || 'Unassigned'}
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Parent Issue</label>
            <p className="text-slate-900 mt-1">
              <Link
                to={`/issues/${subIssue.parentIssueId}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {subIssue.parentIssueId}
              </Link>
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Status</label>
            <div className="mt-1">
              <select
                value={subIssue.status}
                onChange={(e) => handleStatusChange(e.target.value as SubIssue['status'])}
                disabled={isUpdating}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="Open">Open</option>
                <option value="InProgress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Done">Done</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Created</label>
            <p className="text-slate-900 mt-1">{formatDate(subIssue.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Comments Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-slate-500" />
            Comments ({comments.length})
          </h2>
          {comments.length > 3 && (
            <button
              onClick={() => setShowAllComments(!showAllComments)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showAllComments ? 'Show less' : `Show all ${comments.length} comments`}
            </button>
          )}
        </div>
        {comments.length > 0 ? (
          <div className="space-y-4">
            {(showAllComments ? comments : comments.slice(0, 3)).map((comment: Comment, index: number) => {
              const agentName = agents.find((a) => a.id === comment.authorAgentId)?.name || comment.author || 'Unknown'
              const isLongComment = comment.message.length > LONG_COMMENT_THRESHOLD
              const isExpanded = expandedCommentIds.has(comment.id)
              return (
                <div key={index} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 text-sm font-medium">
                    {agentName.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-900">{agentName}</span>
                      <span className="text-xs text-slate-400">{formatDate(comment.timestamp)}</span>
                    </div>
                    <div className="text-sm text-slate-700 prose prose-sm max-w-none prose-p:my-1">
                      {isLongComment && !isExpanded ? (
                        <>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {comment.message.slice(0, LONG_COMMENT_THRESHOLD) + '...'}
                          </ReactMarkdown>
                          <button
                            onClick={() => toggleCommentExpand(comment.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs mt-1"
                          >
                            Show more
                          </button>
                        </>
                      ) : isLongComment && isExpanded ? (
                        <>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.message}</ReactMarkdown>
                          <button
                            onClick={() => toggleCommentExpand(comment.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs mt-1"
                          >
                            Show less
                          </button>
                        </>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.message}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No comments yet</p>
        )}
      </div>
    </div>
  )
}

export default SubIssueDetailPage

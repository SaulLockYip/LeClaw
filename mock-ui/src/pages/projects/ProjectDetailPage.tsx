import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, FolderKanban, AlertCircle, FileText, Calendar, Hash } from 'lucide-react'
import { useCompany } from '../../hooks/useCompany'
import { projectApi, issueApi } from '../../lib/api'
import type { Project, Issue } from '../../lib/api'

function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { selectedCompany, isLoading: isCompanyLoading } = useCompany()
  const [project, setProject] = useState<Project | null>(null)
  const [relatedIssues, setRelatedIssues] = useState<Issue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedCompany || !id) return

    async function loadProjectAndIssues() {
      setIsLoading(true)
      setError(null)
      try {
        const projectData = await projectApi.get(selectedCompany.id, id)
        setProject(projectData)
        // Load all issues and filter by projectId
        const allIssues = await issueApi.list(selectedCompany.id)
        const related = allIssues.filter((issue: Issue) => issue.projectId === id)
        setRelatedIssues(related)
      } catch (err) {
        setError('Failed to load project')
        console.error('Failed to load project:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProjectAndIssues()
  }, [selectedCompany, id])

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-yellow-100 text-yellow-700'
      case 'InProgress':
        return 'bg-blue-100 text-blue-700'
      case 'Done':
        return 'bg-green-100 text-green-700'
      case 'Archived':
        return 'bg-slate-100 text-slate-700'
      default:
        return 'bg-slate-100 text-slate-700'
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
        return 'bg-slate-100 text-slate-700'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

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

  if (error || !project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-red-500">{error || 'Project not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/projects" className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <div className="flex-1 flex items-center gap-3">
          <FolderKanban className="w-6 h-6 text-slate-500" />
          <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(project.status)}`}>
            {project.status}
          </span>
        </div>
      </div>

      {/* Project Info Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-slate-500" />
          Project Information
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="text-xs uppercase text-slate-500 tracking-wider">Description</label>
            <p className="text-slate-900 mt-1">{project.description || 'No description'}</p>
          </div>
          <div className="col-span-2">
            <label className="text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Project Directory
            </label>
            <p className="text-slate-900 mt-1 font-mono text-sm bg-slate-50 px-3 py-2 rounded">
              {project.projectDir || 'Not specified'}
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Status</label>
            <p className="text-slate-900 mt-1">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(project.status)}`}>
                {project.status}
              </span>
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Progress</label>
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
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
            <label className="text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Created
            </label>
            <p className="text-slate-900 mt-1">{formatDate(project.createdAt)}</p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Updated
            </label>
            <p className="text-slate-900 mt-1">{formatDate(project.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Project Directory Card - Prominent Display */}
      {project.projectDir && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Project Directory
          </h2>
          <p className="text-blue-800 font-mono text-lg">
            {project.projectDir}
          </p>
        </div>
      )}

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
                <Hash className="w-4 h-4 text-slate-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700">{issue.title}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getIssueStatusBadgeClass(issue.status)}`}>
                  {issue.status}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No related issues</p>
        )}
      </div>
    </div>
  )
}

export default ProjectDetailPage

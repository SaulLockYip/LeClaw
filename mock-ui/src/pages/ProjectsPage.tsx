import { useState, useEffect } from 'react'
import { Plus, FolderKanban } from 'lucide-react'
import { useCompany } from '../hooks/useCompany'
import { projectApi } from '../lib/api'
import type { Project } from '../lib/api'

type FilterTab = 'All' | 'Open' | 'InProgress' | 'Done' | 'Archived'

function ProjectsPage() {
  const { selectedCompany, isLoading: isCompanyLoading } = useCompany()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All')

  useEffect(() => {
    if (!selectedCompany) return

    async function loadProjects() {
      setIsLoading(true)
      try {
        const data = await projectApi.list(selectedCompany.id)
        setProjects(data)
      } catch (err) {
        console.error('Failed to load projects:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProjects()
  }, [selectedCompany])

  const filters: FilterTab[] = ['All', 'Open', 'InProgress', 'Done', 'Archived']

  const filteredProjects = activeFilter === 'All'
    ? projects
    : projects.filter((p) => p.status === activeFilter)

  const getStatusBadgeColor = (status: string) => {
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
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="text-slate-500 text-sm mt-1">{selectedCompany?.name}</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-slate-200 rounded-lg p-1 w-fit">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeFilter === filter
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {filter === 'All' ? 'All' : filter}
            <span className="ml-2 text-xs text-slate-400">
              {filter === 'All' ? projects.length : projects.filter((p) => p.status === filter).length}
            </span>
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No projects found</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-sm p-4 space-y-3"
            >
              {/* Title and Status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-slate-400" />
                  <h3 className="font-semibold text-slate-800">{project.title}</h3>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(project.status)}`}>
                  {project.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-500">{project.description}</p>

              {/* Stats Row */}
              <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                <div className="text-sm">
                  <span className="text-slate-500">Issues: </span>
                  <span className="font-medium text-slate-700">{project.issueIds.length}</span>
                </div>
              </div>

              {/* Project Dir */}
              <div className="pt-2">
                <span className="text-xs text-slate-500">
                  Dir: <span className="font-medium text-slate-700">{project.projectDir || '-'}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectsPage

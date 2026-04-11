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
        return 'bg-black/5 text-black/70'
      default:
        return 'bg-black/5 text-black/70'
    }
  }

  if (isCompanyLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-black/50">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Projects</h1>
          <p className="text-black/50 text-sm mt-1">{selectedCompany?.name}</p>
        </div>
        <button
          className="px-4 py-2 bg-black/20 text-black/50 rounded-lg text-sm font-medium cursor-not-allowed flex items-center gap-2"
          disabled
          title="Web UI is read-only. Create projects via CLI."
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-black/10 rounded-lg p-1 w-fit">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeFilter === filter
                ? 'bg-white text-black shadow-sm'
                : 'text-black/60 hover:text-black'
            }`}
          >
            {filter === 'All' ? 'All' : filter}
            <span className="ml-2 text-xs text-black/40">
              {filter === 'All' ? projects.length : projects.filter((p) => p.status === filter).length}
            </span>
          </button>
        ))}
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <table className="w-full">
          <thead className="bg-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-black/50">Title</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-black/50">Description</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-black/50">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-black/50">Directory</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-black/50">Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-black/50">Loading...</td>
              </tr>
            ) : filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-black/50">No projects found</td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-white cursor-pointer"
                  onClick={() => window.location.href = `/projects/${project.id}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-black/40" />
                      <span className="text-sm font-medium text-black">{project.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-black/60 max-w-xs truncate">
                    {project.description || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-black/50 font-mono">
                    {project.projectDir || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-black/60">
                    {project.issueIds?.length || 0}
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

export default ProjectsPage

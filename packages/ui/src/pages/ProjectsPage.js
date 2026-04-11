import { useState, useEffect } from 'react';
import { Plus, FolderKanban } from 'lucide-react';
import { useCompany } from '../hooks/useCompany';
import { projectApi } from '../lib/api';
function ProjectsPage() {
    const { selectedCompany, isLoading: isCompanyLoading } = useCompany();
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    useEffect(() => {
        if (!selectedCompany)
            return;
        async function loadProjects() {
            setIsLoading(true);
            try {
                const data = await projectApi.list(selectedCompany.id);
                setProjects(data);
            }
            catch (err) {
                console.error('Failed to load projects:', err);
            }
            finally {
                setIsLoading(false);
            }
        }
        loadProjects();
    }, [selectedCompany]);
    const filters = ['All', 'Open', 'InProgress', 'Done', 'Archived'];
    const filteredProjects = activeFilter === 'All'
        ? projects
        : projects.filter((p) => p.status === activeFilter);
    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'Open':
                return 'bg-black text-white';
            case 'InProgress':
                return 'bg-black text-white';
            case 'Done':
                return 'bg-white text-black border-4 border-black';
            case 'Archived':
                return 'bg-slate-200 text-black border-4 border-black';
            default:
                return 'bg-slate-200 text-black border-4 border-black';
        }
    };
    if (isCompanyLoading) {
        return (<div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Loading...</p>
      </div>);
    }
    return (<div className="space-y-0">
      {/* Page Header - Oversized Serif */}
      <div className="py-16 border-b-4 border-black">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-6xl font-bold tracking-tight text-black">Projects</h1>
            <p className="text-lg mt-4 text-slate-600">{selectedCompany?.name}</p>
          </div>
          <button className="px-6 py-3 bg-black text-white font-bold uppercase tracking-wider text-sm hover:bg-slate-800 flex items-center gap-2" disabled title="Web UI is read-only. Create projects via CLI.">
            <Plus className="w-5 h-5"/>
            New Project
          </button>
        </div>
      </div>

      {/* Filter Tabs - Black Border Style */}
      <div className="py-8 border-b-4 border-black flex gap-0">
        {filters.map((filter) => (<button key={filter} onClick={() => setActiveFilter(filter)} className={`px-8 py-4 text-lg font-bold uppercase tracking-wider border-4 border-black -mr-px ${activeFilter === filter
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-slate-100'}`}>
            {filter === 'All' ? 'All' : filter}
            <span className="ml-3 text-sm">
              {filter === 'All' ? projects.length : projects.filter((p) => p.status === filter).length}
            </span>
          </button>))}
      </div>

      {/* Projects Table */}
      <div className="bg-white border-b-4 border-black">
        <table className="w-full">
          <thead className="bg-black text-white">
            <tr>
              <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider">Title</th>
              <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider">Description</th>
              <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider">Status</th>
              <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider">Directory</th>
              <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider">Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-black">
            {isLoading ? (<tr>
                <td colSpan={5} className="px-8 py-16 text-center text-slate-600">Loading...</td>
              </tr>) : filteredProjects.length === 0 ? (<tr>
                <td colSpan={5} className="px-8 py-16 text-center text-slate-600">No projects found</td>
              </tr>) : (filteredProjects.map((project) => (<tr key={project.id} className="hover:bg-slate-100 cursor-pointer" onClick={() => window.location.href = `/projects/${project.id}`}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <FolderKanban className="w-5 h-5 text-black"/>
                      <span className="text-lg font-bold text-black">{project.title}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-lg text-slate-700 max-w-xs truncate">
                    {project.description || '-'}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-2 text-sm font-bold uppercase tracking-wider ${getStatusBadgeColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-lg text-slate-700 font-mono">
                    {project.projectDir || '-'}
                  </td>
                  <td className="px-8 py-6 text-lg text-slate-700">
                    {project.issueIds?.length || 0}
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>
    </div>);
}
export default ProjectsPage;
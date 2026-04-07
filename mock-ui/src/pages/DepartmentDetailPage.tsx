import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Crown, Users, Building2 } from 'lucide-react'
import { useCompany } from '../hooks/useCompany'

function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { departments, agents, isLoading } = useCompany()

  const department = departments.find((d) => d.id === id)
  const departmentAgents = agents.filter((a) => a.departmentId === id)
  const manager = departmentAgents.find((a) => a.role === 'Manager')
  const staff = departmentAgents.filter((a) => a.role === 'Staff')
  const ceo = departmentAgents.find((a) => a.role === 'CEO')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  if (!department) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/departments" className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-slate-500">Department not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/departments" className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{department.name}</h1>
        </div>
      </div>

      {/* Department Info Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-slate-500" />
          Department Information
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Department Name</label>
            <p className="text-slate-900 mt-1">{department.name}</p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Description</label>
            <p className="text-slate-900 mt-1">{department.description || 'No description'}</p>
          </div>
        </div>
      </div>

      {/* Team Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-500" />
          Team Members
        </h2>

        {/* CEO */}
        {ceo && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs uppercase text-slate-500 tracking-wider mb-3">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>CEO</span>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-medium">
                {ceo.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">{ceo.name}</p>
                <p className="text-sm text-slate-500">{ceo.role}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                ceo.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {ceo.status || 'offline'}
              </span>
            </div>
          </div>
        )}

        {/* Manager */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs uppercase text-slate-500 tracking-wider mb-3">
            <Crown className="w-4 h-4 text-blue-500" />
            <span>Manager</span>
          </div>
          {manager ? (
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {manager.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">{manager.name}</p>
                <p className="text-sm text-slate-500">{manager.role}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                manager.status === 'online' ? 'bg-green-100 text-green-700' :
                manager.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {manager.status || 'offline'}
              </span>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No manager assigned</p>
          )}
        </div>

        {/* Staff */}
        <div>
          <div className="flex items-center gap-2 text-xs uppercase text-slate-500 tracking-wider mb-3">
            <Users className="w-4 h-4 text-slate-500" />
            <span>Staff ({staff.length})</span>
          </div>
          {staff.length > 0 ? (
            <div className="space-y-3">
              {staff.map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-slate-400 flex items-center justify-center text-white font-medium">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{member.name}</p>
                    <p className="text-sm text-slate-500">{member.role}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    member.status === 'online' ? 'bg-green-100 text-green-700' :
                    member.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {member.status || 'offline'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No staff members</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default DepartmentDetailPage

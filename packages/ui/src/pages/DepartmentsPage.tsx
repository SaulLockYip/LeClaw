import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Building2, ChevronRight, Crown, User } from 'lucide-react'
import { useCompany } from '../hooks/useCompany'
import CreateDepartmentModal from '../components/CreateDepartmentModal'

function DepartmentsPage() {
  const { selectedCompany, departments, agents, isLoading } = useCompany()
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Select a company to view departments</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Departments</h1>
          <p className="text-slate-500 text-sm mt-1">{selectedCompany.name}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Department
        </button>
      </div>

      {/* Departments Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No departments found</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {departments.map((dept) => {
            const deptAgents = agents.filter((a) => a.departmentId === dept.id)
            const manager = deptAgents.find((a) => a.role === 'Manager')
            const staff = deptAgents.filter((a) => a.role === 'Staff')
            const ceo = deptAgents.find((a) => a.role === 'CEO')

            return (
              <Link
                key={dept.id}
                to={`/departments/${dept.id}`}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{dept.name}</h3>
                      <p className="text-sm text-slate-500">{deptAgents.length} agents</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>

                {dept.description && (
                  <p className="text-sm text-slate-500 mt-3 line-clamp-2">{dept.description}</p>
                )}

                {/* Agent Summary */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                  {ceo && (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <Crown className="w-3 h-3" />
                      <span>{ceo.name}</span>
                    </div>
                  )}
                  {manager && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <User className="w-3 h-3" />
                      <span>{manager.name}</span>
                    </div>
                  )}
                  {staff.length > 0 && (
                    <div className="text-xs text-slate-500">
                      +{staff.length} staff
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Create Department Modal */}
      <CreateDepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setIsModalOpen(false)}
        companyId={selectedCompany.id}
      />
    </div>
  )
}

export default DepartmentsPage

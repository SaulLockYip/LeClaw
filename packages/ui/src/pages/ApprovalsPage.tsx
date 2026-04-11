import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Eye, CheckCheck, X } from 'lucide-react'
import { useCompany } from '../hooks/useCompany'
import { approvalApi } from '../lib/api'
import type { Approval } from '../lib/api'

type FilterTab = 'All' | 'Pending' | 'Approved' | 'Rejected'

function ApprovalsPage() {
  const { selectedCompany, isLoading: isCompanyLoading } = useCompany()
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('All')

  useEffect(() => {
    if (!selectedCompany) return

    async function loadApprovals() {
      setIsLoading(true)
      try {
        const data = await approvalApi.list(selectedCompany.id)
        setApprovals(data)
      } catch (err) {
        console.error('Failed to load approvals:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadApprovals()
  }, [selectedCompany])

  const filteredApprovals = activeTab === 'All'
    ? approvals
    : approvals.filter((a) => a.status === activeTab)

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'Approved':
        return 'bg-green-100 text-green-700'
      case 'Rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const handleApprove = async (approvalId: string) => {
    if (!selectedCompany) return
    try {
      await approvalApi.approve(selectedCompany.id, approvalId)
      setApprovals((prev) =>
        prev.map((a) => (a.id === approvalId ? { ...a, status: 'Approved' } : a))
      )
    } catch (err) {
      console.error('Failed to approve:', err)
    }
  }

  const handleReject = async (approvalId: string) => {
    if (!selectedCompany) return
    try {
      await approvalApi.reject(selectedCompany.id, approvalId, 'Rejected')
      setApprovals((prev) =>
        prev.map((a) => (a.id === approvalId ? { ...a, status: 'Rejected' } : a))
      )
    } catch (err) {
      console.error('Failed to reject:', err)
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Approvals</h1>
        <p className="text-slate-500 text-sm mt-1">{selectedCompany?.name}</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['All', 'Pending', 'Approved', 'Rejected'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
            <span className="ml-2 text-xs text-slate-400">
              {tab === 'All' ? approvals.length : approvals.filter((a) => a.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Title</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Requester</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading...</td>
              </tr>
            ) : filteredApprovals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No approvals found</td>
              </tr>
            ) : (
              filteredApprovals.map((approval) => (
                <tr key={approval.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{approval.title}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{approval.requester}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(approval.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(approval.status)}`}>
                      {approval.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {approval.status === 'Pending' ? (
                        <>
                          <button
                            onClick={() => handleApprove(approval.id)}
                            className="px-3 py-1 text-sm font-medium rounded border border-green-500 text-green-600 hover:bg-green-50 transition-colors flex items-center gap-1"
                          >
                            <CheckCheck className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(approval.id)}
                            className="px-3 py-1 text-sm font-medium rounded border border-red-500 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <button className="px-3 py-1 text-sm font-medium rounded border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      )}
                    </div>
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

export default ApprovalsPage

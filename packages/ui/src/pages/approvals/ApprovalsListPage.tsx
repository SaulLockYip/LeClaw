import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Eye, CheckCheck, X } from 'lucide-react'
import { useCompany } from '../../hooks/useCompany'
import { approvalApi } from '../../lib/api'
import type { Approval } from '../../lib/api'

type FilterTab = 'All' | 'Pending' | 'Approved' | 'Rejected'

function ApprovalsListPage() {
  const { selectedCompany, isLoading: isCompanyLoading } = useCompany()
  const navigate = useNavigate()
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('All')

  // Dialog state
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [message, setMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

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

  const openApproveDialog = (approval: Approval) => {
    setSelectedApproval(approval)
    setShowApproveDialog(true)
  }

  const openRejectDialog = (approval: Approval) => {
    setSelectedApproval(approval)
    setMessage('')
    setShowRejectDialog(true)
  }

  const closeDialogs = () => {
    setShowApproveDialog(false)
    setShowRejectDialog(false)
    setSelectedApproval(null)
    setMessage('')
  }

  const handleApprove = async () => {
    if (!selectedCompany || !selectedApproval) return
    setIsProcessing(true)
    try {
      await approvalApi.approve(selectedCompany.id, selectedApproval.id)
      setApprovals((prev) =>
        prev.map((a) => (a.id === selectedApproval.id ? { ...a, status: 'Approved' } : a))
      )
      closeDialogs()
    } catch (err) {
      console.error('Failed to approve:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedCompany || !selectedApproval) return
    if (!message.trim()) return
    setIsProcessing(true)
    try {
      await approvalApi.reject(selectedCompany.id, selectedApproval.id, message)
      setApprovals((prev) =>
        prev.map((a) => (a.id === selectedApproval.id ? { ...a, status: 'Rejected', message } : a))
      )
      closeDialogs()
    } catch (err) {
      console.error('Failed to reject:', err)
    } finally {
      setIsProcessing(false)
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
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-slate-800">{approval.title}</span>
                      {approval.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{approval.description}</p>
                      )}
                    </div>
                  </td>
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
                            onClick={() => openApproveDialog(approval)}
                            className="px-3 py-1 text-sm font-medium rounded border border-green-500 text-green-600 hover:bg-green-50 transition-colors flex items-center gap-1"
                          >
                            <CheckCheck className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectDialog(approval)}
                            className="px-3 py-1 text-sm font-medium rounded border border-red-500 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => navigate(`/approvals/${approval.id}`)}
                          className="px-3 py-1 text-sm font-medium rounded border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1"
                        >
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

      {/* Approve Confirmation Dialog */}
      {showApproveDialog && selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDialogs}
          />
          {/* Dialog */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCheck className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Approve this request?</h2>
            </div>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs uppercase text-slate-500 tracking-wider">Title</label>
                <p className="text-slate-900 mt-1">{selectedApproval.title}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500 tracking-wider">Description</label>
                <p className="text-slate-700 mt-1 text-sm">{selectedApproval.description || 'No description'}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500 tracking-wider">Requester</label>
                <p className="text-slate-900 mt-1">{selectedApproval.requester}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeDialogs}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Dialog */}
      {showRejectDialog && selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDialogs}
          />
          {/* Dialog */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Reject this request?</h2>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs uppercase text-slate-500 tracking-wider">Title</label>
                <p className="text-slate-900 mt-1">{selectedApproval.title}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500 tracking-wider">Requester</label>
                <p className="text-slate-900 mt-1">{selectedApproval.requester}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500 tracking-wider">Reason</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeDialogs}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                disabled={isProcessing || !message.trim()}
              >
                {isProcessing ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApprovalsListPage

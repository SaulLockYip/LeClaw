import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle, XCircle, AlertCircle, CheckCheck, X } from 'lucide-react'
import { useCompany } from '../../hooks/useCompany'
import { approvalApi } from '../../lib/api'
import type { Approval } from '../../lib/api'

function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { selectedCompany, isLoading: isCompanyLoading } = useCompany()
  const [approval, setApproval] = useState<Approval | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectMessage, setRejectMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!selectedCompany || !id) return

    async function loadApproval() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await approvalApi.get(selectedCompany.id, id)
        setApproval(data)
      } catch (err) {
        setError('Failed to load approval')
        console.error('Failed to load approval:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadApproval()
  }, [selectedCompany, id])

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleApprove = async () => {
    if (!selectedCompany || !approval) return
    setIsProcessing(true)
    try {
      await approvalApi.approve(selectedCompany.id, approval.id)
      setApproval((prev) => prev ? { ...prev, status: 'Approved' } : null)
      setShowApproveDialog(false)
      navigate('/approvals')
    } catch (err) {
      console.error('Failed to approve:', err)
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedCompany || !approval || !rejectMessage.trim()) return
    setIsProcessing(true)
    try {
      await approvalApi.reject(selectedCompany.id, approval.id, rejectMessage)
      setApproval((prev) => prev ? { ...prev, status: 'Rejected', rejectMessage } : null)
      setShowRejectDialog(false)
      navigate('/approvals')
    } catch (err) {
      console.error('Failed to reject:', err)
      setIsProcessing(false)
    }
  }

  if (isCompanyLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  if (error || !approval) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/approvals" className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-red-500">{error || 'Approval not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/approvals" className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{approval.title}</h1>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(approval.status)}`}>
            {approval.status}
          </span>
        </div>
        {approval.status === 'Pending' && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowRejectDialog(true)}
              className="px-4 py-2 border border-red-500 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={() => setShowApproveDialog(true)}
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Approve
            </button>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-slate-500" />
          Approval Details
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Description</label>
            <p className="text-slate-900 mt-1">{approval.description || 'No description'}</p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Type</label>
            <p className="text-slate-900 mt-1">{approval.type}</p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Requester</label>
            <p className="text-slate-900 mt-1">{approval.requester}</p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Status</label>
            <p className="text-slate-900 mt-1 flex items-center gap-2">
              {approval.status === 'Approved' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {approval.status === 'Rejected' && <XCircle className="w-4 h-4 text-red-500" />}
              {approval.status === 'Pending' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
              {approval.status}
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Created</label>
            <p className="text-slate-900 mt-1">{formatDate(approval.createdAt)}</p>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500 tracking-wider">Updated</label>
            <p className="text-slate-900 mt-1">{formatDate(approval.updatedAt)}</p>
          </div>
          {approval.approverId && (
            <div>
              <label className="text-xs uppercase text-slate-500 tracking-wider">Approver</label>
              <p className="text-slate-900 mt-1">{approval.approverId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Reason Card */}
      {approval.status === 'Rejected' && approval.rejectMessage && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Rejection Reason
          </h2>
          <p className="text-red-800">{approval.rejectMessage}</p>
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      {showApproveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowApproveDialog(false)}
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
                <p className="text-slate-900 mt-1">{approval.title}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500 tracking-wider">Description</label>
                <p className="text-slate-700 mt-1 text-sm">{approval.description || 'No description'}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500 tracking-wider">Requester</label>
                <p className="text-slate-900 mt-1">{approval.requester}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowApproveDialog(false)}
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
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowRejectDialog(false)}
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
                <p className="text-slate-900 mt-1">{approval.title}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500 tracking-wider">Requester</label>
                <p className="text-slate-900 mt-1">{approval.requester}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500 tracking-wider">Reason</label>
                <textarea
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                disabled={isProcessing || !rejectMessage.trim()}
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

export default ApprovalDetailPage

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useCompany } from '../hooks/useCompany'
import { companyApi } from '../lib/api'

function SettingsPage() {
  const { selectedCompany, setSelectedCompany } = useCompany()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-black/50">Select a company to view settings</p>
      </div>
    )
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await companyApi.delete(selectedCompany.id)
      setSelectedCompany(null)
      navigate('/')
    } catch (err) {
      console.error('Failed to delete company:', err)
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Settings</h1>
        <p className="text-black/50 text-sm mt-1">{selectedCompany.name}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-black mb-4">Company Settings</h2>
        <p className="text-black/50">Settings panel coming soon...</p>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg border border-black/10 p-6">
        <h2 className="text-lg font-medium text-black mb-4">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-black">Delete Company</p>
            <p className="text-sm text-black/50">Permanently delete this company and all its data.</p>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg border border-black p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-black mb-2">Delete Company?</h3>
            <p className="text-black/70 mb-6">
              Are you sure you want to delete <strong>{selectedCompany.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-black/20 text-black hover:bg-black/5 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage

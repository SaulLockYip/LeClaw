import { useCompany } from '../hooks/useCompany'

function SettingsPage() {
  const { selectedCompany } = useCompany()

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-black/50">Select a company to view settings</p>
      </div>
    )
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
    </div>
  )
}

export default SettingsPage

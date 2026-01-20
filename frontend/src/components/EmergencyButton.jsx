import { useState } from 'react'
import api from '../services/api'

const EmergencyButton = ({ booking }) => {
  const [showModal, setShowModal] = useState(false)
  const [emergency, setEmergency] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const emergencyTypes = [
    'Vehicle breakdown',
    'Accident',
    'Medical emergency',
    'Security concern',
    'Other'
  ]

  const handleEmergency = async () => {
    if (!emergency) return
    
    setSubmitting(true)
    try {
      // Send emergency message to station master
      await api.post('/messages', {
        bookingId: booking._id,
        message: `🚨 EMERGENCY: ${emergency}`,
        type: 'emergency'
      })
      
      // Also call emergency services API (placeholder)
      // await api.post('/emergency/alert', { bookingId: booking._id, type: emergency })
      
      alert('Emergency alert sent to station master!')
      setShowModal(false)
    } catch (error) {
      alert('Failed to send emergency alert')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
      >
        🚨 Emergency Help
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b bg-red-50">
              <h3 className="font-semibold text-red-800">Emergency Alert</h3>
              <p className="text-sm text-red-600">This will immediately notify the station master</p>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type of Emergency</label>
                <select
                  value={emergency}
                  onChange={(e) => setEmergency(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select emergency type</option>
                  {emergencyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  📞 For life-threatening emergencies, call 112 immediately
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEmergency}
                  disabled={submitting || !emergency}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                >
                  {submitting ? 'Sending...' : 'Send Alert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EmergencyButton
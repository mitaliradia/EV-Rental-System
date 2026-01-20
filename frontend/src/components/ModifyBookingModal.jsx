import { useState } from 'react'
import api from '../services/api'

const ModifyBookingModal = ({ booking, onClose, onSuccess }) => {
  const [newEndTime, setNewEndTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const currentEnd = new Date(booking.endTime)
  const minTime = new Date(currentEnd.getTime() - 2 * 60 * 60 * 1000) // 2 hours before current end
  const maxTime = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000) // 24 hours after current end

  const calculateCostDifference = () => {
    if (!newEndTime) return 0
    const newEnd = new Date(newEndTime)
    const oldDuration = (currentEnd - new Date(booking.startTime)) / (1000 * 60 * 60)
    const newDuration = (newEnd - new Date(booking.startTime)) / (1000 * 60 * 60)
    return (newDuration - oldDuration) * booking.vehicle.pricePerHour
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newEndTime) return

    const newEnd = new Date(newEndTime)
    const type = newEnd > currentEnd ? 'extend' : 'shorten'

    setSubmitting(true)
    try {
      await api.put(`/bookings/${booking._id}/modify`, {
        newEndTime,
        type
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to modify booking')
    } finally {
      setSubmitting(false)
    }
  }

  const costDiff = calculateCostDifference()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Modify Booking</h3>
          <p className="text-sm text-gray-600">{booking.vehicle.modelName}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current End Time</label>
            <input
              type="text"
              value={currentEnd.toLocaleString()}
              readOnly
              className="w-full p-2 bg-gray-100 border rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">New End Time</label>
            <input
              type="datetime-local"
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
              min={minTime.toISOString().slice(0, 16)}
              max={maxTime.toISOString().slice(0, 16)}
              required
              className="w-full p-2 border rounded-md text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Can modify ±2 hours to +24 hours from current end time
            </p>
          </div>

          {newEndTime && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Cost Change:</span>
                  <span className={costDiff >= 0 ? 'text-red-600' : 'text-green-600'}>
                    {costDiff >= 0 ? '+' : ''}₹{Math.abs(costDiff).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>New Total:</span>
                  <span>₹{(booking.totalCost + costDiff).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {error && <div className="p-2 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting || !newEndTime}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {submitting ? 'Modifying...' : 'Modify Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModifyBookingModal
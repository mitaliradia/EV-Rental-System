"use client"

import { useEffect, useState } from "react"
import api from "../services/api.js"
import PaymentModal from "./PaymentModal.jsx"

export default function BookingModal({ vehicle, onClose, onBookingSuccess }) {
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [duration, setDuration] = useState(1)
  const [bookedSlots, setBookedSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '', relation: '' })
  const [showPayment, setShowPayment] = useState(false)
  const [createdBooking, setCreatedBooking] = useState(null)

  const durationOptions = [1, 2, 4, 8, 12, 24]

  useEffect(() => {
    fetchBookedSlots()
  }, [])

  const fetchBookedSlots = async () => {
    try {
      const { data } = await api.get(`/bookings/vehicle/${vehicle._id}/availability`)
      setBookedSlots(data.bookedSlots)
    } catch (err) {
      setError('Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  const isSlotAvailable = (slotTime, duration) => {
    const slotEnd = new Date(slotTime)
    slotEnd.setHours(slotEnd.getHours() + duration)
    
    return !bookedSlots.some(booked => {
      const bookedStart = new Date(booked.start)
      const bookedEnd = new Date(booked.end)
      
      // Check if there's any overlap
      return slotTime < bookedEnd && slotEnd > bookedStart
    })
  }

  const generateTimeSlots = () => {
    const slots = []
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Generate slots for next 3 days
    for (let day = 0; day < 3; day++) {
      const date = new Date(today)
      date.setDate(today.getDate() + day)
      
      // Generate hourly slots from 6 AM to 10 PM
      for (let hour = 6; hour <= 22; hour++) {
        const slotTime = new Date(date)
        slotTime.setHours(hour, 0, 0, 0)
        
        // Skip past slots for today
        if (slotTime > now) {
          slots.push({
            time: slotTime,
            label: slotTime.toLocaleString('en-IN', {
              weekday: 'short',
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })
          })
        }
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()
  const totalCost = selectedSlot ? duration * vehicle.pricePerHour : 0

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSlot) {
      setError('Please select a time slot')
      return
    }
    
    setSubmitting(true)
    try {
      const endTime = new Date(selectedSlot.time)
      endTime.setHours(endTime.getHours() + duration)
      
      await api.post("/bookings", {
        vehicleId: vehicle._id,
        stationId: vehicle.station,
        startTime: selectedSlot.time,
        endTime: endTime,
        totalCost: totalCost,
        emergencyContacts: emergencyContact.name ? [emergencyContact] : []
      })
      
      onBookingSuccess()
    } catch (err) { 
      setError(err.response?.data?.message || "Booking failed.") 
    } finally { 
      setSubmitting(false) 
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Book {vehicle.modelName}</h3>
          <p className="text-sm text-gray-600">₹{vehicle.pricePerHour}/hour • Minimum 1 hour</p>
        </div>
        
        <form className="p-4 space-y-4" onSubmit={onSubmit}>
            {/* Duration Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {durationOptions.map(hrs => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => {
                      setDuration(hrs)
                      setSelectedSlot(null) // Reset selection when duration changes
                    }}
                    className={`p-2 text-sm rounded border ${
                      duration === hrs 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {hrs} {hrs === 1 ? 'hour' : 'hours'}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Available Time Slots</label>
              {loading ? (
                <div className="p-4 text-center">Loading availability...</div>
              ) : (
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  {timeSlots.map((slot, index) => {
                    const available = isSlotAvailable(slot.time, duration)
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => available && setSelectedSlot(slot)}
                        disabled={!available}
                        className={`w-full p-3 text-left text-sm border-b last:border-b-0 ${
                          !available
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : selectedSlot?.time?.getTime() === slot.time.getTime()
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {slot.label} {!available && '(Booked)'}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-sm font-medium mb-2">Emergency Contact (Optional)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={emergencyContact.name}
                  onChange={(e) => setEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={emergencyContact.phone}
                  onChange={(e) => setEmergencyContact(prev => ({ ...prev, phone: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="Relation (e.g., Spouse, Friend)"
                value={emergencyContact.relation}
                onChange={(e) => setEmergencyContact(prev => ({ ...prev, relation: e.target.value }))}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Booking Summary */}
            {selectedSlot && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Start:</span>
                    <span>{selectedSlot.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{duration} {duration === 1 ? 'hour' : 'hours'}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{totalCost.toLocaleString('en-IN')}</span>
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
                disabled={submitting || !selectedSlot}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {submitting ? 'Booking...' : 'Book Now'}
              </button>
            </div>
          </form>
        </div>
    </div>
  )
}

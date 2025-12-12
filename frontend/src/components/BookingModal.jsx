"use client"

import { useEffect, useState } from "react"
import api from "../services/api.js"
import { differenceInHours } from 'date-fns';

export default function BookingModal({ vehicle, onClose, onBookingSuccess }) {
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [totalCost,setTotalCost] = useState(0);

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if(start && end){
      const startDate= new Date(start);

      const endDate= new Date(end);
      if(endDate>startDate){
        const hours = differenceInHours(endDate,startDate);
        setTotalCost(hours*vehicle.pricePerHour);
      }
      else{
        setTotalCost(0);
      }
    }
  }, [start,end,vehicle.pricePerHour]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!start || !end) {
      setError("Please select both start and end date/time.")
      return
    }
    if(new Date(end) <= new Date(start)){
      setError("End time must be after start time.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/bookings", {
        vehicleId: vehicle._id,
        startTime: start,
        endTime: end,
        totalCost: totalCost,
      })
      setSuccess("Booking request submitted! You will be redirected shortly.");
      setTimeout(() => onBookingSuccess(), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit booking.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-start justify-between border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900">Book {vehicle.modelName}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <form className="p-4 space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <input type="datetime-local" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <input type="datetime-local" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between items-center font-bold text-lg text-gray-800">
                <span>Total Cost:</span>
                <span>${totalCost}</span>
            </div>
             <p className="text-xs text-gray-500 text-right">Calculated based on ${vehicle.pricePerHour}/hr</p>
          </div>

          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">{success}</div>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400" disabled={submitting}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </span>
              ) : (
                "Submit Booking"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

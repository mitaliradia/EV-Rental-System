"use client"

import { useState } from "react"
import api from "../services/api.js"

export default function BookingModal({ vehicle, onClose }) {
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (!start || !end) {
      setError("Please select both start and end date/time.")
      return
    }
    try {
      setSubmitting(true)
      await api.post("/api/bookings", {
        vehicleId: vehicle.id,
        startAt: start,
        endAt: end,
      })
      setSuccess("Booking request submitted!")
      setTimeout(() => onClose(), 1200)
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit booking.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <div className="card w-full max-w-lg">
        <div className="flex items-start justify-between border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900">Book {vehicle.model}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <form className="p-4 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="label">Start</label>
            <input type="datetime-local" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="label">End</label>
            <input type="datetime-local" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>

          {error && <div className="badge badge-error">{error}</div>}
          {success && <div className="badge badge-success">{success}</div>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
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

"use client"

import { useEffect, useState } from "react"
import api from "../services/api.js"

export default function MyBookings() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchBookings = async () => {
    try {
      const { data } = await api.get("/api/bookings/mine")
      setItems(data.bookings || [])
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load bookings.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  if (loading) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2 text-gray-700">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Loading bookings...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-4">
        <div className="badge badge-error">{error}</div>
      </div>
    )
  }

  if (!items.length) {
    return <div className="card p-4 text-sm text-gray-600">No bookings yet.</div>
  }

  return (
    <div className="grid gap-4">
      {items.map((b) => (
        <div key={b.id} className="card p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-semibold text-gray-900">{b.vehicle?.model || "Vehicle"}</div>
              <div className="text-sm text-gray-600">
                {new Date(b.startAt).toLocaleString()} — {new Date(b.endAt).toLocaleString()}
              </div>
            </div>
            <div>
              {b.status === "confirmed" && <span className="badge badge-success">Confirmed</span>}
              {b.status === "pending" && <span className="badge badge-warning">Pending</span>}
              {b.status === "cancelled" && <span className="badge badge-error">Cancelled</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

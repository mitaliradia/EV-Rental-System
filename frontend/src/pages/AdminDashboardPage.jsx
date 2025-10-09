"use client"

import { useEffect, useState } from "react"
import api from "../services/api.js"

export default function AdminDashboardPage() {
  const [tab, setTab] = useState("kyc")
  const [kyc, setKyc] = useState({ items: [], loading: true })
  const [bookings, setBookings] = useState({ items: [], loading: true })
  const [vehicleForm, setVehicleForm] = useState({ model: "", pricePerHour: "", imageUrl: "" })
  const [vehMsg, setVehMsg] = useState("")
  const [vehLoading, setVehLoading] = useState(false)

  const loadKyc = async () => {
    try {
      setKyc((s) => ({ ...s, loading: true }))
      const { data } = await api.get("/api/admin/kyc")
      setKyc({ items: data.requests || [], loading: false })
    } catch {
      setKyc({ items: [], loading: false })
    }
  }
  const loadBookings = async () => {
    try {
      setBookings((s) => ({ ...s, loading: true }))
      const { data } = await api.get("/api/admin/bookings")
      setBookings({ items: data.bookings || [], loading: false })
    } catch {
      setBookings({ items: [], loading: false })
    }
  }

  useEffect(() => {
    loadKyc()
    loadBookings()
  }, [])

  const actKyc = async (id, action) => {
    await api.post(`/api/admin/kyc/${id}/${action}`)
    await loadKyc()
  }

  const actBooking = async (id, action) => {
    await api.post(`/api/admin/bookings/${id}/${action}`)
    await loadBookings()
  }

  const submitVehicle = async (e) => {
    e.preventDefault()
    setVehMsg("")
    if (!vehicleForm.model || !vehicleForm.pricePerHour) {
      setVehMsg("Please provide model and price.")
      return
    }
    try {
      setVehLoading(true)
      await api.post("/api/admin/vehicles", {
        model: vehicleForm.model,
        pricePerHour: Number(vehicleForm.pricePerHour),
        imageUrl: vehicleForm.imageUrl || undefined,
      })
      setVehMsg("Vehicle added successfully!")
      setVehicleForm({ model: "", pricePerHour: "", imageUrl: "" })
    } catch (err) {
      setVehMsg(err?.response?.data?.message || "Failed to add vehicle.")
    } finally {
      setVehLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-2">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTab("kyc")} className={`btn ${tab === "kyc" ? "btn-primary" : "btn-outline"}`}>
            Pending KYC
          </button>
          <button
            onClick={() => setTab("bookings")}
            className={`btn ${tab === "bookings" ? "btn-primary" : "btn-outline"}`}
          >
            Pending Bookings
          </button>
          <button onClick={() => setTab("add")} className={`btn ${tab === "add" ? "btn-primary" : "btn-outline"}`}>
            Add Vehicle
          </button>
        </div>
      </div>

      {tab === "kyc" && (
        <div className="card p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Pending KYC Requests</h3>
          {kyc.loading ? (
            <div className="flex items-center gap-2 text-gray-700">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <span>Loading...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kyc.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-gray-600">
                        No pending KYC requests.
                      </td>
                    </tr>
                  ) : (
                    kyc.items.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-3 py-2">{r.user?.name || "User"}</td>
                        <td className="px-3 py-2">{r.user?.email}</td>
                        <td className="px-3 py-2 capitalize">{r.status}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button className="btn btn-primary" onClick={() => actKyc(r.id, "approve")}>
                              Approve
                            </button>
                            <button className="btn btn-outline" onClick={() => actKyc(r.id, "reject")}>
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "bookings" && (
        <div className="card p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Pending Booking Requests</h3>
          {bookings.loading ? (
            <div className="flex items-center gap-2 text-gray-700">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <span>Loading...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Vehicle</th>
                    <th className="px-3 py-2">From</th>
                    <th className="px-3 py-2">To</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-gray-600">
                        No pending bookings.
                      </td>
                    </tr>
                  ) : (
                    bookings.items.map((b) => (
                      <tr key={b.id} className="border-t">
                        <td className="px-3 py-2">{b.user?.name || "User"}</td>
                        <td className="px-3 py-2">{b.vehicle?.model || "Vehicle"}</td>
                        <td className="px-3 py-2">{new Date(b.startAt).toLocaleString()}</td>
                        <td className="px-3 py-2">{new Date(b.endAt).toLocaleString()}</td>
                        <td className="px-3 py-2 capitalize">{b.status}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button className="btn btn-primary" onClick={() => actBooking(b.id, "confirm")}>
                              Confirm
                            </button>
                            <button className="btn btn-outline" onClick={() => actBooking(b.id, "cancel")}>
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "add" && (
        <div className="card p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Add New Vehicle</h3>

          <form className="grid gap-4 max-w-xl" onSubmit={submitVehicle}>
            <div>
              <label className="label">Model</label>
              <input
                className="input"
                placeholder="Tesla Model 3"
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Price per hour (₹)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                placeholder="499"
                value={vehicleForm.pricePerHour}
                onChange={(e) => setVehicleForm({ ...vehicleForm, pricePerHour: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Image URL (optional)</label>
              <input
                className="input"
                placeholder="https://..."
                value={vehicleForm.imageUrl}
                onChange={(e) => setVehicleForm({ ...vehicleForm, imageUrl: e.target.value })}
              />
            </div>
            {vehMsg && (
              <div className={`badge ${vehMsg.includes("successfully") ? "badge-success" : "badge-error"}`}>
                {vehMsg}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button className="btn btn-primary" type="submit" disabled={vehLoading}>
                {vehLoading ? "Adding..." : "Add Vehicle"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

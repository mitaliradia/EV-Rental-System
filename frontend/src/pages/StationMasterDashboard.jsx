"use client"

import { useEffect, useState } from "react"
import api from "../services/api.js"

export default function StationMasterDashboard() {
  const [tab, setTab] = useState("kyc")
  const [kyc, setKyc] = useState({ items: [], loading: true })
  const [bookings, setBookings] = useState({ items: [], loading: true })
  const [vehicleForm, setVehicleForm] = useState({ modelName: "", pricePerHour: "", imageUrl: "" })
  const [vehMsg, setVehMsg] = useState({text: "", type: ""})
  const [vehLoading, setVehLoading] = useState(false)


  const Spinner = () => (
    <div className="flex items-center gap-2 text-gray-700">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      <span>Loading...</span>
    </div>
  );
  const loadKyc = async () => {
    try {
      setKyc((s) => ({ ...s, loading: true }))
      const { data } = await api.get("/station-master/kyc-requests")
      setKyc({ items: data || [], loading: false })
    } catch {
      setKyc({ items: [], loading: false })
    }
  }
  const loadBookings = async () => {
    try {
      setBookings((s) => ({ ...s, loading: true }))
      const { data } = await api.get("/station-master/bookings/pending")
      setBookings({ items: data || [], loading: false })
    } catch {
      setBookings({ items: [], loading: false })
    }
  }

  useEffect(() => {
    if(tab==='kyc') loadKyc();
    if(tab==='bookings') loadBookings();
  }, [tab])

  const actKyc = async (userId, status) => {
    let reason='';
    if(status==='rejected'){
      reason=prompt('Please provide a reason for rejection:');
      if(reason===null || reason.trim()==='') return;
    }
    await api.put(`/station-master/kyc/${userId}`,{status,reason})
    await loadKyc()
  }

  const actBooking = async (bookingId, status) => {
    if(!window.confirm(`Are you sure you want to ${status} this booking?`)) return;
    await api.put(`/station-master/bookings/${bookingId}`,{status})
    await loadBookings()
  }

  const submitVehicle = async (e) => {
    e.preventDefault()
    setVehMsg({text:"",type:""})
    if (!vehicleForm.modelName || !vehicleForm.pricePerHour || !vehicleForm.imageUrl) {
      setVehMsg({text: "Please fill all fields", type:"error"})
      return
    }
    try {
      setVehLoading(true)
      await api.post("/station-master/vehicles", {
        modelName: vehicleForm.modelName,
        pricePerHour: Number(vehicleForm.pricePerHour),
        imageUrl: vehicleForm.imageUrl,
      })
      setVehMsg({text: "Vehicle added successfully!",type: "success"})
      setVehicleForm({ modelName: "", pricePerHour: "", imageUrl: "" })
    } catch (err) {
      setVehMsg({text:err?.response?.data?.message || "Failed to add vehicle.", type: "error"})
    } finally {
      setVehLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTab("kyc")} className={`px-4 py-2 text-sm font-medium rounded-md ${tab==="kyc" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            Pending KYC
          </button>
          <button
            onClick={() => setTab("bookings")}
            className={`px-4 py-2 text-sm font-medium rounded-md ${tab === "bookings" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            Pending Bookings
          </button>
          <button onClick={() => setTab("add")} className={`px-4 py-2 text-sm font-medium rounded-md ${tab === "add" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            Add Vehicle
          </button>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
      {tab === "kyc" && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Pending KYC Requests</h3>
          {kyc.loading ? <Spinner /> : (
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
                    kyc.items.map((user) => (
                      <tr key={user._id} className="border-t">
                        <td className="px-3 py-2">{user.name || "User"}</td>
                        <td className="px-3 py-2">{user.email}</td>
                        <td className="px-3 py-2 capitalize">{user.kyc.status}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs" onClick={() => actKyc(user._id, "approved")}>Approve</button>
                            <button className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs" onClick={() => actKyc(user._id, "rejected")}>Reject</button>
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
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Pending Booking Requests</h3>
          {bookings.loading ? <Spinner /> : (
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
                    bookings.items.map((booking) => (
                      <tr key={booking._id} className="border-t">
                        <td className="px-3 py-2">{booking.user?.name || "User"}</td>
                        <td className="px-3 py-2">{booking.vehicle?.modelName || "Vehicle"}</td>
                        <td className="px-3 py-2">{new Date(booking.startTime).toLocaleString()}</td>
                        <td className="px-3 py-2">{new Date(booking.endTime).toLocaleString()}</td>
                        <td className="px-3 py-2 capitalize">{booking.status}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs" onClick={() => actBooking(booking._id, "confirmed")}>Confirm</button>
                            <button className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs" onClick={() => actBooking(booking._id, "cancelled")}>Cancel</button>
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
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Add New Vehicle</h3>

          <form className="grid gap-4 max-w-xl" onSubmit={submitVehicle}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Model Name</label>
              <input className="input mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Tesla Model Y" value={vehicleForm.modelName} onChange={(e) => setVehicleForm({ ...vehicleForm, modelName: e.target.value })}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price per hour (₹)</label>
              <input className="input mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" type="number" min="0" placeholder="25" value={vehicleForm.pricePerHour} onChange={(e) => setVehicleForm({ ...vehicleForm, pricePerHour: e.target.value })}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Image URL (optional)</label>
              <input className="input mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="https://..." value={vehicleForm.imageUrl} onChange={(e) => setVehicleForm({ ...vehicleForm, imageUrl: e.target.value })}/>
            </div>
            {vehMsg && (
              <div className={`p-2 rounded-md text-sm ${vehMsg.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {vehMsg.text}
              </div>
            )}
            <div><button className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md" type="submit" disabled={vehLoading}>{vehLoading ? "Adding..." : "Add Vehicle"}</button></div>
          </form>
        </div>
      )}
      </div>
    </div>
  )
}

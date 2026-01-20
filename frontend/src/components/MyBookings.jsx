"use client"

import { useEffect, useState } from "react"
import api from "../services/api.js"
import ModifyBookingModal from "./ModifyBookingModal.jsx"
import ChatModal from "./ChatModal.jsx"
import EmergencyButton from "./EmergencyButton.jsx"
import ReviewModal from "./ReviewModal.jsx"
import PaymentModal from "./PaymentModal.jsx"
import CountdownTimer from "./CountdownTimer.jsx"

export default function MyBookings() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modifyModal, setModifyModal] = useState(null)
  const [chatModal, setChatModal] = useState(null)
  const [reviewModal, setReviewModal] = useState(null)
  const [paymentModal, setPaymentModal] = useState(null)

  const fetchBookings = async () => {
    try {
      const { data } = await api.get("/bookings/mybookings")
      setItems(data || [])
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load bookings.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const canModify = (booking) => {
    return ['pending-confirmation', 'confirmed'].includes(booking.status) && booking.paymentStatus === 'completed'
  }

  const needsPayment = (booking) => {
    return booking.status === 'confirmed' && booking.paymentStatus === 'pending'
  }

  const isActive = (booking) => {
    return booking.status === 'active'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'pending-confirmation': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Loading bookings...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  if (!items.length) {
    return <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow text-gray-600 dark:text-gray-400">No bookings yet.</div>
  }

  return (
    <>
      <div className="space-y-4">
        {items.map((booking) => (
          <div key={booking._id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{booking.vehicle?.modelName || "Vehicle"}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>📅 {new Date(booking.startTime).toLocaleString()} — {new Date(booking.endTime).toLocaleString()}</div>
                  <div>💰 ₹{booking.totalCost?.toLocaleString('en-IN')}</div>
                  {booking.paymentStatus === 'pending' && booking.paymentDeadline && (
                    <div className="text-red-600 font-medium">
                      ⏰ Pay within: <CountdownTimer expiryTimestamp={booking.paymentDeadline} onExpire={() => fetchBookings()} />
                    </div>
                  )}
                  {booking.modifications?.length > 0 && (
                    <div className="text-blue-600">🔄 Modified {booking.modifications.length} time(s)</div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 min-w-0 lg:min-w-[200px]">
                {isActive(booking) && (
                  <EmergencyButton booking={booking} />
                )}
                
                <div className="flex gap-2">
                  {needsPayment(booking) && (
                    <button
                      onClick={() => setPaymentModal(booking)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                    >
                      Pay Now
                    </button>
                  )}
                  
                  {canModify(booking) && (
                    <button
                      onClick={() => setModifyModal(booking)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Modify
                    </button>
                  )}
                  
                  {booking.status === 'completed' && (
                    <button
                      onClick={() => setReviewModal(booking)}
                      className="flex-1 px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
                    >
                      Review
                    </button>
                  )}
                  
                  {(isActive(booking) || canModify(booking) || needsPayment(booking)) && (
                    <button
                      onClick={() => setChatModal(booking)}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                    >
                      Chat
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modifyModal && (
        <ModifyBookingModal
          booking={modifyModal}
          onClose={() => setModifyModal(null)}
          onSuccess={() => {
            setModifyModal(null)
            fetchBookings()
          }}
        />
      )}

      {chatModal && (
        <ChatModal
          booking={chatModal}
          onClose={() => setChatModal(null)}
        />
      )}

      {reviewModal && (
        <ReviewModal
          booking={reviewModal}
          onClose={() => setReviewModal(null)}
          onSuccess={() => {
            setReviewModal(null)
            fetchBookings()
          }}
        />
      )}

      {paymentModal && (
        <PaymentModal
          booking={paymentModal}
          onClose={() => setPaymentModal(null)}
          onSuccess={() => {
            setPaymentModal(null)
            fetchBookings()
          }}
        />
      )}
    </>
  )
}

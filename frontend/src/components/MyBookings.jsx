"use client"

import { useEffect, useState } from "react"
import api from "../services/api.js"
import ModifyBookingModal from "./ModifyBookingModal.jsx"
import ChatModal from "./ChatModal.jsx"
import EmergencyButton from "./EmergencyButton.jsx"
import ReviewModal from "./ReviewModal.jsx"
import PaymentModal from "./PaymentModal.jsx"
import CountdownTimer from "./CountdownTimer.jsx"
import { useSocket } from "../context/SocketContext.jsx"

export default function MyBookings() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modifyModal, setModifyModal] = useState(null)
  const [chatModal, setChatModal] = useState(null)
  const [reviewModal, setReviewModal] = useState(null)
  const [paymentModal, setPaymentModal] = useState(null)
  const socket = useSocket()

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

  useEffect(() => {
    if (!socket) return

    const refreshBookings = () => fetchBookings()
    const handleNotification = (payload) => {
      if (payload?.type === 'payment' || payload?.type === 'booking') {
        refreshBookings()
      }
    }

    socket.on('booking_confirmed', refreshBookings)
    socket.on('notification', handleNotification)

    return () => {
      socket.off('booking_confirmed', refreshBookings)
      socket.off('notification', handleNotification)
    }
  }, [socket])

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
      case 'confirmed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
      case 'completed': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
      case 'pending-confirmation': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
    }
  }

  const getPaymentStatusBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case 'pending': return { text: 'Payment Pending', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' }
      case 'processing': return { text: 'Payment Processing', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 animate-pulse' }
      case 'completed': return { text: 'Paid', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' }
      case 'failed': return { text: 'Payment Failed', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' }
      default: return null
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
                  {getPaymentStatusBadge(booking.paymentStatus) && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadge(booking.paymentStatus).color}`}>
                      {getPaymentStatusBadge(booking.paymentStatus).text}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(booking.startTime).toLocaleString()} — {new Date(booking.endTime).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>₹{booking.totalCost?.toLocaleString('en-IN')}</span>
                  </div>
                  {booking.paymentStatus === 'pending' && booking.paymentDeadline && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Payment due: <CountdownTimer expiryTimestamp={booking.paymentDeadline} onExpire={() => fetchBookings()} /></span>
                    </div>
                  )}
                  {booking.modifications?.length > 0 && (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Modified {booking.modifications.length} time(s)</span>
                    </div>
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

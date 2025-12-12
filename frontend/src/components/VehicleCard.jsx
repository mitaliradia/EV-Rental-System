"use client"

import { useState } from "react"
import BookingModal from "./BookingModal.jsx"
import { useAuth } from "../context/AuthContext.jsx"

// vehicle: { id, model, imageUrl, pricePerHour }
export default function VehicleCard({ vehicle, onBookingSuccess }) {
  const [open, setOpen] = useState(false)
  const { authUser } = useAuth()

  const canBook = authUser?.kyc?.status === "approved"
  const tooltip = !authUser
    ? "Please log in to book"
    : authUser.kyc?.status === "approved"
      ? ""
      : authUser.kyc?.status === "pending"
        ? "KYC pending. Booking unlocked after approval."
        : authUser.kyc?.status === "rejected"
          ? "KYC rejected. Please resubmit."
          : "Submit KYC to unlock booking."

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="aspect-video bg-gray-100">
        <img
          src={
            vehicle.imageUrl ||
            "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200&auto=format&fit=crop"
          }
          alt={vehicle.modelName}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-gray-900">{vehicle.modelName}</h3>
        <p className="text-sm text-gray-600">₹{vehicle.pricePerHour}/hr</p>
        <div className="mt-2 flex-1" />
        {authUser ? (
          <button
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={() => setOpen(true)}
          disabled={!canBook}
          title={!canBook ? tooltip : undefined}
        >
          Book Now
        </button>
      ) : (
            <Link to="/login" className="text-center w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700">
                Login to Book
            </Link>
        )}
      </div>

      {open && (<BookingModal vehicle={vehicle} onClose={() => setOpen(false)}  onBookingSuccess={() => {
                setOpen(false);      // Close the modal
                onBookingSuccess();  // 5. Call the parent's success function
            }}/> )}
    </div>
  )
}

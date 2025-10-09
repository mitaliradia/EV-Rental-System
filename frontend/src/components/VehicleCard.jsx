"use client"

import { useState } from "react"
import BookingModal from "./BookingModal.jsx"
import { useAuth } from "../context/AuthContext.jsx"

// vehicle: { id, model, imageUrl, pricePerHour }
export default function VehicleCard({ vehicle }) {
  const [open, setOpen] = useState(false)
  const { authUser } = useAuth()

  const canBook = authUser?.kycStatus === "approved"
  const tooltip = !authUser
    ? "Please log in to book"
    : authUser.kycStatus === "approved"
      ? ""
      : authUser.kycStatus === "pending"
        ? "KYC pending. Booking unlocked after approval."
        : authUser.kycStatus === "rejected"
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
          alt={vehicle.model}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-gray-900">{vehicle.model}</h3>
        <p className="text-sm text-gray-600">₹{vehicle.pricePerHour}/hr</p>
        <div className="mt-2 flex-1" />
        <button
          className="btn btn-primary"
          onClick={() => setOpen(true)}
          disabled={!canBook}
          title={!canBook ? tooltip : undefined}
        >
          Book Now
        </button>
      </div>

      {open && <BookingModal vehicle={vehicle} onClose={() => setOpen(false)} />}
    </div>
  )
}

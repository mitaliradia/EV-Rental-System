import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function VehicleCard({ vehicle, onBookNow }) {
  const { authUser } = useAuth();

  const canBook = Boolean(authUser);
  const isAvailable = vehicle.status === 'available';

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
      {/* --- THIS IS THE CORRECTED PART --- */}
      {/* Make this div a relative container */}
      <div className="aspect-video bg-gray-100 relative">
        <img
          src={
            vehicle.imageUrl ||
            "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200&auto=format&fit=crop"
          }
          alt={vehicle.modelName}
          className="h-full w-full object-cover"
        />
        
        {/* The overlay for booked vehicles */}
        {!isAvailable && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-center">
                <div>
                    <p className="text-white font-bold text-lg capitalize">{vehicle.status}</p>
                    {vehicle.availableAfter && (
                        <p className="text-gray-200 text-sm">
                            Available after:<br/>
                            {new Date(vehicle.availableAfter).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                </div>
            </div>
        )}
      </div>
      {/* ---------------------------------- */}

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900">{vehicle.modelName}</h3>
        <p className="text-sm text-gray-600">₹{vehicle.pricePerHour}/hr</p>
        <div className="mt-2 flex-1" />
        
        {canBook ? (
          <button
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={() => onBookNow(vehicle)}
            // Simplified the disabled logic
            disabled={!isAvailable}
          >
            {/* Simplified the button text logic */}
            {isAvailable ? 'Book Now' : 'Currently Unavailable'}
          </button>
        ) : (
            <Link to="/login" className="text-center w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700">
                Login to Book
            </Link>
        )}
      </div>
    </div>
  );
}
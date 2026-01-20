import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useState, useEffect } from 'react';
import api from '../services/api';
import StarRating from './StarRating';

export default function VehicleCard({ vehicle, onBookNow }) {
  const { authUser } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState({ averageRating: 0, totalReviews: 0 });

  const canBook = Boolean(authUser);
  const isAvailable = vehicle.status === 'available';

  useEffect(() => {
    if (authUser) {
      checkFavoriteStatus();
    }
    fetchRating();
  }, [vehicle._id, authUser]);

  const checkFavoriteStatus = async () => {
    try {
      const { data } = await api.get(`/favorites/check/${vehicle._id}`);
      setIsFavorite(data.isFavorite);
    } catch (error) {
      console.error('Failed to check favorite status');
    }
  };

  const fetchRating = async () => {
    try {
      const { data } = await api.get(`/reviews/vehicle/${vehicle._id}/rating`);
      setRating(data);
    } catch (error) {
      console.error('Failed to fetch rating');
    }
  };

  const toggleFavorite = async () => {
    try {
      const { data } = await api.post(`/favorites/toggle/${vehicle._id}`);
      setIsFavorite(data.isFavorite);
    } catch (error) {
      console.error('Failed to toggle favorite');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
      {/* --- THIS IS THE CORRECTED PART --- */}
      {/* Make this div a relative container */}
      <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
        <img
          src={vehicle.imageUrl?.startsWith('http') ? vehicle.imageUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${vehicle.imageUrl}`}
          alt={vehicle.modelName}
          className="h-full w-full object-cover"
        />
        
        {authUser && (
          <button
            onClick={toggleFavorite}
            className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <svg className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
            </svg>
          </button>
        )}
        
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{vehicle.modelName}</h3>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">₹{vehicle.pricePerHour}/hr</p>
          <StarRating rating={rating.averageRating} readonly size="sm" />
        </div>
        {rating.totalReviews > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">({rating.totalReviews} reviews)</p>
        )}
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
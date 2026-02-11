import { useState, useEffect } from 'react';
import api from '../../services/api';

const ActiveRidesManager = () => {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActiveRides = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/super-admin/rides/active');
            setRides(data);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchActiveRides(); }, []);

    const handleCancelRide = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this active ride? This will make the vehicle available again.')) return;
        try {
            await api.put(`/super-admin/rides/${bookingId}/cancel`);
            fetchActiveRides();
        } catch (error) {
            alert('Failed to cancel ride.');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
                <div className="text-2xl">🚗</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">All Active Rides (System-Wide)</h3>
            </div>
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-center space-y-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto"></div>
                            <p className="text-gray-600 dark:text-gray-400">Loading active rides...</p>
                        </div>
                    </div>
                ) : (
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-600">
                                <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Vehicle</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Station</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">End Time</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rides.map((ride, index) => (
                                <tr key={ride._id} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors duration-200`}>
                                    <td className="p-3 text-gray-900 dark:text-white font-medium">{ride.user.name}</td>
                                    <td className="p-3 font-semibold text-gray-900 dark:text-white">{ride.vehicle.modelName}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-300">{ride.station.name}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-300">{new Date(ride.endTime).toLocaleString()}</td>
                                    <td className="p-3">
                                        <button 
                                            onClick={() => handleCancelRide(ride._id)} 
                                            className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-200 font-medium"
                                        >
                                            Cancel Ride
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {rides.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center space-y-2">
                                            <div className="text-4xl text-gray-300 dark:text-gray-600">🚗</div>
                                            <p className="font-medium">No rides are currently active.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ActiveRidesManager;
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
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">All Active Rides (System-Wide)</h3>
            <div className="overflow-x-auto">
                {loading ? <p>Loading active rides...</p> : (
                    <table className="min-w-full text-sm divide-y">
                        <thead className="bg-gray-50"><tr>
                            <th className="p-2 text-left">Customer</th>
                            <th className="p-2 text-left">Vehicle</th>
                            <th className="p-2 text-left">Station</th>
                            <th className="p-2 text-left">End Time</th>
                            <th className="p-2 text-left">Action</th>
                        </tr></thead>
                        <tbody className="divide-y">
                            {rides.map(ride => (
                                <tr key={ride._id}>
                                    <td className="p-2">{ride.user.name}</td>
                                    <td className="p-2 font-medium">{ride.vehicle.modelName}</td>
                                    <td className="p-2 text-gray-600">{ride.station.name}</td>
                                    <td className="p-2">{new Date(ride.endTime).toLocaleString()}</td>
                                    <td className="p-2">
                                        <button onClick={() => handleCancelRide(ride._id)} className="px-3 py-1 text-xs bg-red-500 text-white rounded-full">
                                            Cancel Ride
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {rides.length === 0 && (
                                <tr><td colSpan="5" className="p-4 text-center text-gray-500">No rides are currently active.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ActiveRidesManager;
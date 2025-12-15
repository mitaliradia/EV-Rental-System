import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Reusable component for stat cards
const StatCard = ({ title, value, color }) => (
    <div className={`bg-white p-6 rounded-xl shadow`}>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`mt-1 text-3xl font-semibold ${color}`}>{value}</p>
    </div>
);

// Reusable component for table sections
const TableSection = ({ title, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="overflow-x-auto">
            {children}
        </div>
    </div>
);


const StationMasterDashboard = () => {
    const { authUser } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/station-master/dashboard-data');
            setDashboardData(data);
        } catch (err) {
            setError('Failed to load dashboard data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <div>Loading Dashboard...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!dashboardData) return <div>No data available.</div>;

    const { stationName, stats, vehicles, pendingBookings, activeRides } = dashboardData;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-gray-800">Station Dashboard</h1>
                <p className="text-xl text-indigo-600 font-semibold">{stationName}</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <StatCard title="Total Vehicles" value={stats.totalVehicles} color="text-gray-900" />
                <StatCard title="Available Now" value={stats.availableVehicles} color="text-green-600" />
                <StatCard title="Active Rides" value={stats.activeRidesCount} color="text-blue-600" />
                <StatCard title="Pending KYC" value={stats.pendingKycCount} color="text-yellow-600" />
                <StatCard title="Pending Bookings" value={stats.pendingBookingsCount} color="text-orange-600" />
            </div>

            {/* Vehicles Table */}
            <TableSection title="Vehicles at this Station">
                <table className="min-w-full text-sm divide-y">
                    {/* ... Table Headers ... */}
                    <tbody>
                        {vehicles.map(v => (
                            <tr key={v._id}>
                                <td className="p-2 font-medium">{v.modelName}</td>
                                <td className="p-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${v.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {v.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableSection>
            
            {/* Active Rides Table */}
            <TableSection title="Active Rides">
                {activeRides.length > 0 ? (
                    <table className="min-w-full text-sm divide-y">
                        {/* ... Table Headers (User, Vehicle, End Time) ... */}
                        <tbody>
                            {activeRides.map(ride => (
                                <tr key={ride._id}>
                                    <td className="p-2">{ride.user.name}</td>
                                    <td className="p-2">{ride.vehicle.modelName}</td>
                                    <td className="p-2">{new Date(ride.endTime).toLocaleTimeString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-gray-500">No active rides currently.</p>}
            </TableSection>

            {/* Pending Requests can still be a separate component if you want, but are already fetched. */}
            {/* For simplicity, we can show them here directly. */}
            <TableSection title="Pending Booking Requests">
                 {pendingBookings.length > 0 ? (
                    <table className="min-w-full text-sm divide-y">
                        {/* ... Table Headers (User, Vehicle, Actions) ... */}
                        <tbody>
                            {pendingBookings.map(booking => (
                                <tr key={booking._id}>
                                    <td className="p-2">{booking.user.name}</td>
                                    <td className="p-2">{booking.vehicle.modelName}</td>
                                    {/* Add Confirm/Cancel buttons here */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 ) : <p className="text-gray-500">No pending booking requests.</p>}
            </TableSection>
        </div>
    );
};

export default StationMasterDashboard;
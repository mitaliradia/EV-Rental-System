import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

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

const Spinner = () => (
    <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
)


const StationMasterDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const socket = useSocket(); // Get the socket connection

    const fetchData = async () => {
        //Not setting loading to true here, so the page doesn't flicker on refresh
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
    useEffect(() => { fetchData(); }, []);

    // --- NEW: Effect to listen for refresh events ---
    useEffect(() => {
        if (!socket) return;

        const handleDashboardRefresh = (data) => {
            console.log('Dashboard refresh event received:', data.message);
            // Simply re-fetch all data when a refresh event comes in
            fetchData();
        };

        socket.on('dashboard_refresh', handleDashboardRefresh);

        return () => {
            socket.off('dashboard_refresh', handleDashboardRefresh);
        };
    }, [socket]); // Dependency on the socket object


    const handleUpdateBooking=async(bookingId,status)=>{
        const action=status.charAt(0).toUpperCase()+status.slice(1);
        if(!window.confirm(`Are you sure you want to ${action} this booking?`)) return;

        try{

            //Remove the manual fetchData() call
            await api.put(`/station-master/bookings/${bookingId}`,{status});
            //The backend will now emit the socket event, and the useEffect above
            //will handle the data refresh. This prevents the race condition
 
        } catch(error){
            alert(`Failed to update booking status: ${error.response?.data?.message || 'Server error'}`);
            console.error(error);
        }
    }

    if (loading) return <Spinner />;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!dashboardData) return <div>No data available.</div>;

    const { stationName, stats, vehicles, pendingBookings, confirmedBookings, activeRides } = dashboardData;

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
                <StatCard title="Upcoming Rides" value={stats.confirmedBookingsCount} color="text-blue-600" />
                <StatCard title="Active Rides" value={stats.activeRidesCount} color="text-purple-600" />
                <StatCard title="Pending Requests" value={stats.pendingBookingsCount} color="text-orange-600" />
            </div>

            <TableSection title="Pending Booking Requests">
                 {pendingBookings.length > 0 ? (
                    <table className="min-w-full text-sm divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Vehicle</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Duration</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pendingBookings.map(booking => (
                                <tr key={booking._id}>
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="font-medium">{booking.user.name}</div>
                                        <div className="text-gray-500">{booking.user.email}</div>
                                    </td>
                                    <td className="p-4 font-medium">{booking.vehicle.modelName}</td>
                                    <td className="p-4 text-gray-500">
                                        <div>{new Date(booking.startTime).toLocaleString()}</div>
                                        <div>to</div>
                                        <div>{new Date(booking.endTime).toLocaleString()}</div>
                                    </td>
                                    <td className="p-4 space-x-2">
                                        <button 
                                            onClick={() => handleUpdateBooking(booking._id, 'confirmed')}
                                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold hover:bg-green-200"
                                        >
                                            Confirm
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateBooking(booking._id, 'cancelled')}
                                            className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold hover:bg-red-200"
                                        >
                                            Cancel
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 ) : <p className="text-gray-500 py-4">No pending booking requests.</p>}
            </TableSection>

            <TableSection title="Confirmed & Upcoming Rides">
                {confirmedBookings.length > 0 ? (
                    <table className="min-w-full text-sm divide-y">
                         <thead className="bg-gray-50"><tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Vehicle</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Start Time</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                        </tr></thead>
                        <tbody>
                            {confirmedBookings.map(booking => (
                                <tr key={booking._id}>
                                    <td className="p-4">{booking.user.name}</td>
                                    <td className="p-4 font-medium">{booking.vehicle.modelName}</td>
                                    <td className="p-4">{new Date(booking.startTime).toLocaleString()}</td>
                                    <td className="p-4 space-x-2">
                                        <button onClick={() => handleUpdateBooking(booking._id, 'active')} className="px-3 py-1 bg-blue-500 text-white rounded-full font-semibold">Start Ride</button>
                                        <button onClick={() => handleUpdateBooking(booking._id, 'cancelled')} className="text-xs text-red-600 hover:underline">Cancel (Emergency)</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-gray-500 py-4">No upcoming rides.</p>}
            </TableSection>

            {/* Vehicles Table */}
            <TableSection title="Vehicles at this Station">
                    {vehicles.length > 0 ? (
                    <table className="min-w-full text-sm divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Model Name</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Price/Hour</th>
                                {/* Add an Actions column later for "Set to Maintenance", etc. */}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {vehicles.map(v => (
                                <tr key={v._id}>
                                    <td className="p-4 font-medium">{v.modelName}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                                            v.status === 'available' ? 'bg-green-100 text-green-800' :
                                            v.status === 'pending' ? 'bg-orange-100 text-orange-800' : // New 'pending' status
                                            v.status === 'booked' ? 'bg-blue-100 text-blue-800' : // 'booked' is now blue
                                            'bg-red-100 text-red-800' // for 'maintenance'
                                        }`}>
                                            {v.status}
                                        </span>
                                    </td>
                                    <td className="p-4">₹{v.pricePerHour}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-gray-500">No vehicles have been added to this station yet.</p>}
            </TableSection>
            
            <TableSection title="Active Rides">
                {activeRides.length > 0 ? (
                    <table className="min-w-full text-sm divide-y">
                        <thead className="bg-gray-50"><tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Vehicle</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Ends At</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                        </tr></thead>
                        <tbody>
                            {activeRides.map(ride => (
                                <tr key={ride._id}>
                                    <td className="p-4">{ride.user.name}</td>
                                    <td className="p-4 font-medium">{ride.vehicle.modelName}</td>
                                    <td className="p-4">{new Date(ride.endTime).toLocaleString()}</td>
                                    <td className="p-4 space-x-2">
                                        <button onClick={() => handleUpdateBooking(ride._id, 'completed')} className="px-3 py-1 bg-gray-500 text-white rounded-full font-semibold">Complete Ride</button>
                                        <button onClick={() => handleUpdateBooking(ride._id, 'cancelled')} className="text-xs text-red-600 hover:underline">Cancel (Emergency)</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-gray-500 py-4">No rides are currently active.</p>}
            </TableSection>
           
        </div>
    );
};

export default StationMasterDashboard;
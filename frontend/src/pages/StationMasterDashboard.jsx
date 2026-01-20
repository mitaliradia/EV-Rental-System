import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import ChatModal from '../components/ChatModal';

// Reusable component for stat cards
const StatCard = ({ title, value, color }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow`}>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className={`mt-1 text-3xl font-semibold ${color}`}>{value}</p>
    </div>
);

// Reusable component for table sections
const TableSection = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{title}</h3>
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
    const [activeRideSearch,setActiveRideSearch]=useState('');
    const [error, setError] = useState('');
    const [chatModal, setChatModal] = useState(null);

    // Debug chatModal state
    useEffect(() => {
        console.log('ChatModal state changed:', chatModal);
    }, [chatModal]);

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
            await api.put(`/station-master/bookings/${bookingId}`,{status});
            // Refresh data immediately after successful update
            fetchData();
        } catch(error){
            console.error(error);
        }
    }

    if (loading) return <Spinner />;
    if (error) return <div className="text-red-500 dark:text-red-400">{error}</div>;
    if (!dashboardData) return <div className="text-gray-600 dark:text-gray-400">No data available.</div>;

    const { stationName, stats, vehicles, pendingBookings, confirmedBookings, activeRides } = dashboardData;

    const filteredActiveRides=dashboardData.activeRides.filter(ride=>
        ride.user.name.toLowerCase().includes(activeRideSearch.toLowerCase()) ||
        ride.vehicle.modelName.toLowerCase().includes(activeRideSearch.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Station Dashboard</h1>
                <p className="text-xl text-indigo-600 dark:text-indigo-400 font-semibold">{stationName}</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                <StatCard title="Total Vehicles" value={stats.totalVehicles} color="text-gray-900 dark:text-white" />
                <StatCard title="Available Now" value={stats.availableVehicles} color="text-green-600 dark:text-green-400" />
                <StatCard title="Upcoming Rides" value={stats.confirmedBookingsCount} color="text-blue-600 dark:text-blue-400" />
                <StatCard title="Active Rides" value={stats.activeRidesCount} color="text-purple-600 dark:text-purple-400" />
                <StatCard title="Pending Requests" value={stats.pendingBookingsCount} color="text-orange-600 dark:text-orange-400" />
                <StatCard title="Overdue Rides" value={stats.overdueRidesCount || 0} color="text-red-600 dark:text-red-400" />
            </div>

            <TableSection title="Pending Booking Requests">
                 {pendingBookings.length > 0 ? (
                    <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Customer</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Vehicle</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Duration</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {pendingBookings.map(booking => (
                                <tr key={booking._id}>
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900 dark:text-white">{booking.user.name}</div>
                                        <div className="text-gray-500 dark:text-gray-400">{booking.user.email}</div>
                                    </td>
                                    <td className="p-4 font-medium text-gray-900 dark:text-white">{booking.vehicle.modelName}</td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">
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
                                        <button 
                                            onClick={() => {
                                                console.log('Chat button clicked for booking:', booking._id);
                                                setChatModal(booking);
                                            }}
                                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold hover:bg-blue-200"
                                        >
                                            Chat
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 ) : <p className="text-gray-500 dark:text-gray-400 py-4">No pending booking requests.</p>}
            </TableSection>

            <TableSection title="Confirmed & Upcoming Rides">
                {confirmedBookings.length > 0 ? (
                    <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                         <thead className="bg-gray-50 dark:bg-gray-700"><tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Customer</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Vehicle</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Start Time</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Payment</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Actions</th>
                        </tr></thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {confirmedBookings.map(booking => (
                                <tr key={booking._id}>
                                    <td className="p-4 text-gray-900 dark:text-white">{booking.user.name}</td>
                                    <td className="p-4 font-medium text-gray-900 dark:text-white">{booking.vehicle.modelName}</td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">{new Date(booking.startTime).toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            booking.paymentStatus === 'completed' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-orange-100 text-orange-800'
                                        }`}>
                                            {booking.paymentStatus === 'completed' ? 'PAID' : 'PENDING'}
                                        </span>
                                    </td>
                                    <td className="p-4 space-x-2">
                                        <button 
                                            onClick={() => handleUpdateBooking(booking._id, 'active')} 
                                            disabled={booking.paymentStatus !== 'completed'}
                                            className={`px-3 py-1 rounded-full font-semibold ${
                                                booking.paymentStatus === 'completed'
                                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                            title={booking.paymentStatus !== 'completed' ? 'Payment required before starting ride' : ''}
                                        >
                                            Start Ride
                                        </button>
                                        <button onClick={() => handleUpdateBooking(booking._id, 'cancelled')} className="text-xs text-red-600 hover:underline">Cancel (Emergency)</button>
                                        <button 
                                            onClick={() => {
                                                console.log('Chat button clicked for booking:', booking._id);
                                                setChatModal(booking);
                                            }}
                                            className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full font-semibold hover:bg-gray-200"
                                        >
                                            Chat
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-gray-500 dark:text-gray-400 py-4">No upcoming rides.</p>}
            </TableSection>

            {/* Vehicles Table */}
            <TableSection title="Vehicles at this Station">
                    {vehicles.length > 0 ? (
                    <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Model Name</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Status</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Price/Hour</th>
                                {/* Add an Actions column later for "Set to Maintenance", etc. */}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {vehicles.map(v => (
                                <tr key={v._id}>
                                    <td className="p-4 font-medium text-gray-900 dark:text-white">{v.modelName}</td>
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
                                    <td className="p-4 text-gray-600 dark:text-gray-300">₹{v.pricePerHour}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-gray-500 dark:text-gray-400">No vehicles have been added to this station yet.</p>}
            </TableSection>
            
            <TableSection title="Active Rides">
                <div className="mb-4">
                    <input 
                        type="text" 
                        placeholder="Search by customer or vehicle..."
                        value={activeRideSearch}
                        onChange={e => setActiveRideSearch(e.target.value)}
                        className="w-full max-w-xs p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>
                {filteredActiveRides.length > 0 ? (
                    <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700"><tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Customer</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Vehicle</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Ends At</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Actions</th>
                        </tr></thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredActiveRides.map(ride => (
                                <tr key={ride._id} className={ride.isOverdue ? 'bg-red-50 dark:bg-red-900' : ''}>
                                    <td className="p-4 text-gray-900 dark:text-white">
                                        {ride.user.name}
                                        {ride.isOverdue && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">OVERDUE</span>}
                                    </td>
                                    <td className="p-4 font-medium text-gray-900 dark:text-white">{ride.vehicle.modelName}</td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">{new Date(ride.endTime).toLocaleString()}</td>
                                    <td className="p-4 space-x-2">
                                        <button onClick={() => handleUpdateBooking(ride._id, 'completed')} className="px-3 py-1 bg-gray-500 text-white rounded-full font-semibold">Complete Ride</button>
                                        <button onClick={() => handleUpdateBooking(ride._id, 'cancelled')} className="text-xs text-red-600 hover:underline">Emergency Cancel</button>
                                        <button 
                                            onClick={() => {
                                                console.log('Chat button clicked for ride:', ride._id);
                                                setChatModal(ride);
                                            }}
                                            className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full font-semibold hover:bg-gray-200"
                                        >
                                            Chat
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-gray-500 dark:text-gray-400 py-4">No rides match your search.</p>}
            </TableSection>
           
            {chatModal && (
                <ChatModal
                    booking={chatModal}
                    onClose={() => {
                        console.log('Closing chat modal');
                        setChatModal(null);
                    }}
                />
            )}
        </div>
    );
};

export default StationMasterDashboard;
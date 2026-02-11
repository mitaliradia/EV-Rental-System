import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import ChatModal from '../components/ChatModal';

// Enhanced Stat Card with modern styling
const StatCard = ({ title, value, color, icon }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700 group`}>
        <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</div>
            {icon && <div className="text-2xl text-gray-400 group-hover:text-primary-500 transition-colors duration-300">{icon}</div>}
        </div>
        <p className={`text-3xl font-bold ${color} group-hover:scale-105 transition-transform duration-300`}>{value}</p>
        <div className="mt-2 h-1 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
);

// Enhanced Table Section with modern styling
const TableSection = ({ title, children, icon }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3">
                {icon && <div className="text-xl text-primary-500">{icon}</div>}
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
            </div>
        </div>
        <div className="p-6">
            <div className="overflow-x-auto">
                {children}
            </div>
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Modern Hero Header */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-accent-600 px-6 py-12">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center space-y-4">
                        <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">
                            Station Dashboard
                        </h1>
                        <div className="inline-flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <p className="text-xl font-semibold text-white">{stationName}</p>
                        </div>
                        <p className="text-primary-100 max-w-2xl mx-auto">
                            Real-time monitoring and management of your station operations
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Enhanced Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    <StatCard 
                        title="Total Vehicles" 
                        value={stats.totalVehicles} 
                        color="text-gray-900 dark:text-white" 
                        icon="🚗"
                    />
                    <StatCard 
                        title="Available Now" 
                        value={stats.availableVehicles} 
                        color="text-green-600 dark:text-green-400" 
                        icon="✅"
                    />
                    <StatCard 
                        title="Upcoming Rides" 
                        value={stats.confirmedBookingsCount} 
                        color="text-blue-600 dark:text-blue-400" 
                        icon="📅"
                    />
                    <StatCard 
                        title="Active Rides" 
                        value={stats.activeRidesCount} 
                        color="text-purple-600 dark:text-purple-400" 
                        icon="🚀"
                    />
                    <StatCard 
                        title="Pending Requests" 
                        value={stats.pendingBookingsCount} 
                        color="text-orange-600 dark:text-orange-400" 
                        icon="⏳"
                    />
                    <StatCard 
                        title="Overdue Rides" 
                        value={stats.overdueRidesCount || 0} 
                        color="text-red-600 dark:text-red-400" 
                        icon="⚠️"
                    />
                </div>

                <TableSection title="Pending Booking Requests" icon="📝">
                 {pendingBookings.length > 0 ? (
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-600">
                                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Customer</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Vehicle</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Duration</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingBookings.map((booking, index) => (
                                <tr key={booking._id} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors duration-200`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-semibold">
                                                {booking.user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white">{booking.user.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{booking.user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{booking.vehicle.modelName}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            <div className="font-medium">{new Date(booking.startTime).toLocaleDateString()}</div>
                                            <div>{new Date(booking.startTime).toLocaleTimeString()} - {new Date(booking.endTime).toLocaleTimeString()}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-2">
                                            <button 
                                                onClick={() => handleUpdateBooking(booking._id, 'confirmed')}
                                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-md"
                                            >
                                                ✓ Confirm
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateBooking(booking._id, 'cancelled')}
                                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-md"
                                            >
                                                ✕ Cancel
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    console.log('Chat button clicked for booking:', booking._id);
                                                    setChatModal(booking);
                                                }}
                                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md"
                                            >
                                                💬 Chat
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-8">
                        <div className="text-gray-400 text-4xl mb-4">📋</div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No pending booking requests</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">New requests will appear here</p>
                    </div>
                )}
                </TableSection>

                <TableSection title="Confirmed & Upcoming Rides" icon="🚗">
                    {confirmedBookings.length > 0 ? (
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-600">
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Customer</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Vehicle</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Start Time</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Payment</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {confirmedBookings.map((booking, index) => (
                                    <tr key={booking._id} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors duration-200`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {booking.user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="font-semibold text-gray-900 dark:text-white">{booking.user.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{booking.vehicle.modelName}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900 dark:text-white">{new Date(booking.startTime).toLocaleDateString()}</div>
                                                <div className="text-gray-500 dark:text-gray-400">{new Date(booking.startTime).toLocaleTimeString()}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                                booking.paymentStatus === 'completed' 
                                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                                    : 'bg-orange-100 text-orange-800 border border-orange-200'
                                            }`}>
                                                {booking.paymentStatus === 'completed' ? '✅ PAID' : '⏳ PENDING'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => handleUpdateBooking(booking._id, 'active')} 
                                                    disabled={booking.paymentStatus !== 'completed'}
                                                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                                                        booking.paymentStatus === 'completed'
                                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 shadow-md'
                                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    }`}
                                                    title={booking.paymentStatus !== 'completed' ? 'Payment required before starting ride' : ''}
                                                >
                                                    🚀 Start Ride
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateBooking(booking._id, 'cancelled')} 
                                                    className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors duration-200"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        console.log('Chat button clicked for booking:', booking._id);
                                                        setChatModal(booking);
                                                    }}
                                                    className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-200 shadow-md"
                                                >
                                                    💬 Chat
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-gray-400 text-4xl mb-4">📋</div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No upcoming rides</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">Confirmed bookings will appear here</p>
                        </div>
                    )}
                </TableSection>

                {/* Enhanced Vehicles Table */}
                <TableSection title="Fleet Overview" icon="🚗">
                    {vehicles.length > 0 ? (
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-600">
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Vehicle Model</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Pricing</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vehicles.map((v, index) => {
                                    const statusConfig = {
                                        available: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: '✅' },
                                        pending: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', icon: '⏳' },
                                        booked: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: '📅' },
                                        maintenance: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: '🔧' }
                                    };
                                    const config = statusConfig[v.status] || statusConfig.available;
                                    
                                    return (
                                        <tr key={v._id} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors duration-200`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl flex items-center justify-center text-white">
                                                        🚗
                                                    </div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{v.modelName}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text} ${config.border} border`}>
                                                    <span className="mr-1">{config.icon}</span>
                                                    {v.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    ₹{v.pricePerHour.toLocaleString('en-IN')}
                                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">/hour</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-gray-400 text-4xl mb-4">🚗</div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No vehicles assigned</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">Contact super admin to add vehicles to this station</p>
                        </div>
                    )}
                </TableSection>
                
                <TableSection title="Active Rides Monitor" icon="🚀">
                    {/* Enhanced Search */}
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <div className="text-gray-400">🔍</div>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Search by customer or vehicle..."
                                value={activeRideSearch}
                                onChange={e => setActiveRideSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                            />
                        </div>
                    </div>
                    
                    {filteredActiveRides.length > 0 ? (
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-600">
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Customer</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Vehicle</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Ends At</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredActiveRides.map((ride, index) => (
                                    <tr key={ride._id} className={`${ride.isOverdue ? 'bg-red-50 dark:bg-red-900/30' : index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors duration-200`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                                    ride.isOverdue ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-400 to-green-500'
                                                }`}>
                                                    {ride.user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{ride.user.name}</div>
                                                    {ride.isOverdue && (
                                                        <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full border border-red-200">
                                                            ⚠️ OVERDUE
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{ride.vehicle.modelName}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className={`font-medium ${ride.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {new Date(ride.endTime).toLocaleDateString()}
                                                </div>
                                                <div className={`${ride.isOverdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {new Date(ride.endTime).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => handleUpdateBooking(ride._id, 'completed')} 
                                                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-md"
                                                >
                                                    ✓ Complete
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateBooking(ride._id, 'cancelled')} 
                                                    className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors duration-200"
                                                >
                                                    Emergency Cancel
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        console.log('Chat button clicked for ride:', ride._id);
                                                        setChatModal(ride);
                                                    }}
                                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md"
                                                >
                                                    💬 Chat
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-gray-400 text-4xl mb-4">🔍</div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                {activeRideSearch ? 'No rides match your search' : 'No active rides'}
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                {activeRideSearch ? 'Try adjusting your search terms' : 'Active rides will appear here'}
                            </p>
                        </div>
                    )}
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
        </div>
    );
};

export default StationMasterDashboard;
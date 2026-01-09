import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

// --- Reusable Countdown Timer Component ---
const CountdownTimer = ({ expiryTimestamp, onExpire }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(expiryTimestamp) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        // Exit early if timer is over
        if (!timeLeft.minutes && !timeLeft.seconds) {
            onExpire(); // Notify parent that the timer has expired
            return;
        }

        // Save intervalId to clear the interval when the component unmounts
        const intervalId = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        
        // Clear interval on re-render to avoid memory leaks
        return () => clearInterval(intervalId);
    }, [timeLeft]); // Rerun effect when timeLeft changes

    const timerComponents = [];
    if (timeLeft.minutes !== undefined) {
        timerComponents.push(
            <span key="m" className="font-bold text-red-600">
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
        );
    } else {
        timerComponents.push(<span key="exp" className="font-bold text-red-600">Expired</span>);
    }

    return <>{timerComponents}</>;
};

// --- UserInfo Component ---
const UserInfo = () => {
    return (
        <div className="p-6 rounded-lg border bg-green-50 border-green-200">
            <h3 className="text-xl font-semibold text-green-800">Account Ready</h3>
            <p className="mt-2 text-sm text-green-700 mb-4">
                You are ready to book vehicles. Find your next ride!
            </p>
            <Link 
                to="/vehicles" 
                className="inline-block px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 shadow-sm"
            >
                Browse Our Fleet
            </Link>
        </div>
    );
};

// --- MyBookings Component ---
const MyBookings = () => {
    const { authUser } = useAuth();
    const socket = useSocket();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchMyBookings = async () => {
        try {
            const { data } = await api.get('/bookings/mybookings');
            data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by creation time
            setBookings(data);
        } catch (err) {
            setError('Failed to load your bookings.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyBookings();
    }, []);

    // --- NEW EFFECT FOR REAL-TIME UPDATES ---
    useEffect(() => {
        // Do nothing if the socket is not yet connected
        if (!socket) return;

        // Define the event handler
        const handleBookingUpdate = (data) => {
            console.log("Received booking update:", data);
            alert(data.message); // Show a simple alert

            // Update the state of the specific booking in the list
            setBookings(currentBookings => 
                currentBookings.map(booking => 
                    booking._id === data.bookingId 
                        ? { ...booking, status: data.newStatus } 
                        : booking
                )
            );
        };

        // Start listening for the 'booking_update' event
        socket.on('booking_update', handleBookingUpdate);

        // Clean up the listener when the component unmounts
        return () => {
            socket.off('booking_update', handleBookingUpdate);
        }},[socket,setBookings]); //This effect re-runs if the socket connection changes

    const getStatusBadgeColor = (status) => {
        const colors = {
            'pending-confirmation': 'bg-yellow-100 text-yellow-800',
            'confirmed': 'bg-blue-100 text-blue-800',
            'active': 'bg-green-100 text-green-800',
            'completed': 'bg-gray-100 text-gray-800',
            'cancelled': 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) return <div className="mt-8"><p>Loading your bookings...</p></div>;
    if (error) return <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-lg"><p>{error}</p></div>;

    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">My Booking History</h3>
            {bookings.length > 0 ? (
                <div className="space-y-4">
                    {bookings.map((booking) => {
                        
                        return (
                            <div key={booking._id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center bg-white hover:bg-gray-50">
                                <div className="flex items-center mb-4 sm:mb-0">
                                    <img src={booking.vehicle?.imageUrl || 'https://via.placeholder.com/150'} alt={booking.vehicle?.modelName} className="w-24 h-16 object-cover rounded-md mr-4 hidden sm:block" />
                                    <div>
                                        <p className="font-bold text-gray-800">{booking.vehicle?.modelName || 'Vehicle Info Missing'}</p>
                                        <p className="text-sm text-gray-600">{new Date(booking.startTime).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-start sm:items-end">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadgeColor(booking.status)}`}>
                                        {booking.status.replace('-', ' ')}
                                    </span>
                                    
                                    
                                    {booking.status === 'confirmed' && (
                                        <p className="mt-2 text-xs text-gray-500">Payment due at station</p>
                                    )}
                                    <p className="mt-2 text-lg font-bold text-gray-900">₹{booking.totalCost}</p>
                                  
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-4 border-2 border-dashed rounded-lg bg-gray-50 text-center">
                    <p className="text-gray-500">You have no booking history yet.</p>
                </div>
            )}
        </div>
    );
};

// --- Main ProfilePage Component ---
const ProfilePage = () => {
    const { authUser } = useAuth();

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Welcome, {authUser?.name}</h1>
            <div className="space-y-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <UserInfo /> 
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <MyBookings />
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
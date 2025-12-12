import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// --- KycStatus Component (No changes needed, can use the one from the previous answer) ---
const KycStatus = () => {
    // ... all the existing KYC logic ...
    const { authUser, setAuthUser } = useAuth();
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [uploading, setUploading] = useState(false);

    if (!authUser) return null;

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleKycUpload = async (e) => {
        e.preventDefault();
        if (!file) return setMessage({ text: 'Please select a file.', type: 'error' });
        setUploading(true);
        const formData = new FormData();
        formData.append('kycDocument', file);
        try {
            const { data } = await api.post('/users/kyc', formData);
            setAuthUser(data);
            setMessage({ text: 'KYC document uploaded!', type: 'success' });
        } catch (error) {
            setMessage({ text: error.response?.data?.message || 'Upload failed.', type: 'error' });
        } finally { setUploading(false); }
    };
    
    const statusInfo = {
        'not-submitted': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', title: 'Verify Your Identity' },
        'pending': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', title: 'Verification Pending' },
        'approved': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', title: 'You\'re Verified!' },
        'rejected': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', title: 'Verification Rejected' },
    };
    const { status, rejectionReason } = authUser.kyc;
    const styles = statusInfo[status];

    return (
        <div className={`p-6 rounded-lg border ${styles.bg} ${styles.border}`}>
            <h3 className={`text-xl font-semibold ${styles.text}`}>{styles.title}</h3>
            {status === 'not-submitted' && (
                <>
                    <p className="text-sm text-gray-600 mt-2 mb-4">Upload a valid ID to get verified.</p>
                    <form onSubmit={handleKycUpload}><input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700" /><button type="submit" disabled={uploading} className="mt-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">{uploading ? 'Uploading...' : 'Upload for Verification'}</button></form>
                </>
            )}
            {status === 'pending' && <p className="mt-2 text-sm text-yellow-700">Your document is under review.</p>}
            {status === 'approved' && (
                <div className="mt-4">
                    <p className="mt-2 text-sm text-green-700 mb-4">Congratulations! You are now able to book vehicles.</p>
                    <Link to="/vehicles" className="inline-block px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Browse Vehicles</Link>
                </div>
            )}
            {status === 'rejected' && <p className="mt-2 text-sm text-red-700">Reason: {rejectionReason || 'No reason provided.'}</p>}
            {message.text && <p className={`mt-4 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</p>}
        </div>
    );
};

// --- NEW MyBookings Component ---
const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // ... (The fetchMyBookings function is correct)
        const fetchMyBookings = async () => {
            try {
                const { data } = await api.get('/bookings/mybookings');
                data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
                setBookings(data);
            } catch (err) {
                setError('Failed to load your bookings.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyBookings();
    }, []);

    // ... (The getStatusBadgeColor function is correct)
    const getStatusBadgeColor = (status) => { /* ... */ };


    if (loading) return <div className="mt-8"><p>Loading your bookings...</p></div>;
    if (error) return <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-lg"><p>{error}</p></div>;

    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">My Booking History</h3>
            {bookings.length > 0 ? (
                <div className="space-y-4">
                    {/* --- THIS IS THE LINE TO FIX --- */}
                    {bookings.map((booking) => (
                        <div key={booking._id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex items-center mb-4 sm:mb-0">
                                <img 
                                    src={booking.vehicle?.imageUrl || 'https://via.placeholder.com/150'} 
                                    alt={booking.vehicle?.modelName} 
                                    className="w-24 h-16 object-cover rounded-md mr-4 hidden sm:block" 
                                />
                                <div>
                                    <p className="font-bold text-gray-800">{booking.vehicle?.modelName || 'Vehicle Deleted'}</p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(booking.startTime).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(booking.startTime).toLocaleTimeString()} - {new Date(booking.endTime).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-start sm:items-end">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(booking.status)}`}>
                                    {booking.status.replace('-', ' ')}
                                </span>
                                <p className="mt-2 text-lg font-bold text-gray-900">${booking.totalCost}</p>
                            </div>
                        </div>
                    ))}
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
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800">Welcome, {authUser?.name}</h1>
                {/* Add a direct link to the Super Admin panel for convenience */}
                {authUser?.role === 'super-admin' && (
                    <Link to="/super-admin" className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700">
                        Go to Super Admin Panel
                    </Link>
                )}
            </div>
            
            {/* --- THIS IS THE KEY CHANGE --- */}
            {/* Only show KYC and Bookings for 'user' and 'station-master' roles */}
            {authUser?.role !== 'super-admin' ? (
                <div className="space-y-8">
                    {/* KYC Component */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <KycStatus />
                    </div>
                    {/* MyBookings Component */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <MyBookings />
                    </div>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-800">Super Admin Account</h2>
                    <p className="mt-4 text-gray-600">
                        You have the highest level of administrative privileges. Your role does not require KYC verification or personal booking history.
                    </p>
                    <p className="mt-2 text-gray-600">
                        Please use the Super Admin Panel to manage stations and user roles.
                    </p>
                </div>
            )}
        </div>
    );
};
export default ProfilePage;
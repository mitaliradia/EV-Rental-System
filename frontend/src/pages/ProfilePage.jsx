import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import MyBookings from '../components/MyBookings';

const exportToPDF = async () => {
    try {
        const { data } = await api.get('/bookings/mybookings');
        const bookings = data;
        
        // Create HTML content for PDF
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>EV Rental - Booking History</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .booking { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
                .booking-title { font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
                .booking-detail { margin: 5px 0; }
                .status { padding: 3px 8px; border-radius: 3px; font-size: 12px; }
                .confirmed { background: #dbeafe; color: #1e40af; }
                .active { background: #dcfce7; color: #166534; }
                .completed { background: #f3f4f6; color: #374151; }
                .cancelled { background: #fee2e2; color: #dc2626; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>EV RENTAL SYSTEM</h1>
                <h2>Booking History Report</h2>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            ${bookings.map((booking, index) => `
                <div class="booking">
                    <div class="booking-title">${index + 1}. ${booking.vehicle?.modelName || 'Vehicle'}</div>
                    <div class="booking-detail">Status: <span class="status ${booking.status}">${booking.status.toUpperCase()}</span></div>
                    <div class="booking-detail">Start: ${new Date(booking.startTime).toLocaleString()}</div>
                    <div class="booking-detail">End: ${new Date(booking.endTime).toLocaleString()}</div>
                    <div class="booking-detail">Cost: ₹${booking.totalCost?.toLocaleString('en-IN')}</div>
                </div>
            `).join('')}
        </body>
        </html>`;
        
        // Create a new window and print to PDF
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then trigger print
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
        
    } catch (error) {
        alert('Failed to export bookings');
    }
};

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
        <div className="p-6 rounded-lg border bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700">
            <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">Account Ready</h3>
            <p className="mt-2 text-sm text-green-700 dark:text-green-300 mb-4">
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

// --- Main ProfilePage Component ---
const ProfilePage = () => {
    const { authUser } = useAuth();

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-8">Welcome, {authUser?.name}</h1>
            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <UserInfo /> 
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link to="/favorites" className="p-4 bg-red-50 dark:bg-red-900 rounded-lg text-center hover:bg-red-100 dark:hover:bg-red-800">
                            <div className="text-2xl mb-2">❤️</div>
                            <div className="text-sm font-medium text-gray-800 dark:text-white">Favorites</div>
                        </Link>
                        <Link to="/analytics" className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg text-center hover:bg-blue-100 dark:hover:bg-blue-800">
                            <div className="text-2xl mb-2">📊</div>
                            <div className="text-sm font-medium text-gray-800 dark:text-white">Analytics</div>
                        </Link>
                        <button 
                            onClick={exportToPDF}
                            className="p-4 bg-green-50 dark:bg-green-900 rounded-lg text-center hover:bg-green-100 dark:hover:bg-green-800"
                        >
                            <div className="text-2xl mb-2">📄</div>
                            <div className="text-sm font-medium text-gray-800 dark:text-white">Export PDF</div>
                        </button>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">My Bookings</h3>
                    <MyBookings />
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
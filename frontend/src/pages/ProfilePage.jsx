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

// --- Enhanced UserInfo Component ---
const UserInfo = () => {
    return (
        <div className="p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 border-2 border-green-200 dark:border-green-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-green-200 dark:bg-green-700 rounded-full opacity-20"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-emerald-200 dark:bg-emerald-700 rounded-full opacity-10"></div>
            
            <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-green-800 dark:text-green-200">Account Ready</h3>
                </div>
                <p className="text-green-700 dark:text-green-300 mb-6 leading-relaxed">
                    You're all set! Your account is verified and ready to book vehicles. 
                    Start your eco-friendly journey today.
                </p>
                <Link 
                    to="/vehicles" 
                    className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Browse Our Fleet</span>
                </Link>
            </div>
        </div>
    );
};

// --- Enhanced Main ProfilePage Component ---
const ProfilePage = () => {
    const { authUser } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Beautiful Hero Header */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-accent-600 px-6 py-12">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">
                            Welcome, {authUser?.name}!
                        </h1>
                        <p className="text-xl text-primary-100 max-w-2xl mx-auto">
                            Manage your bookings, explore analytics, and continue your sustainable journey
                        </p>
                        <div className="flex items-center justify-center space-x-4 text-indigo-100">
                            <div className="h-1 w-16 bg-primary-300 rounded"></div>
                            <div className="text-sm font-medium">EV Rental Dashboard</div>
                            <div className="h-1 w-16 bg-primary-300 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Account Status Card */}
                <UserInfo /> 
                
                {/* Enhanced Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Quick Actions</h3>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Link 
                                to="/favorites" 
                                className="group p-6 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 rounded-2xl border-2 border-red-100 dark:border-red-800 hover:border-red-200 dark:hover:border-red-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
                            >
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Favorites</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Your saved vehicles</p>
                                </div>
                            </Link>
                            
                            <Link 
                                to="/analytics" 
                                className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl border-2 border-blue-100 dark:border-blue-800 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
                            >
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Analytics</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">View your stats</p>
                                </div>
                            </Link>
                            
                            <button 
                                onClick={exportToPDF}
                                className="group p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl border-2 border-green-100 dark:border-green-800 hover:border-green-200 dark:hover:border-green-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
                            >
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Export PDF</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Download report</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Enhanced Bookings Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">My Bookings</h3>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <MyBookings />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
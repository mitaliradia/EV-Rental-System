import { useState } from 'react';

// Import all the manager components for each tab
import StationManager from '../components/super-admin/StationManager';
import UserManager from '../components/super-admin/UserManager';
import VehicleManager from '../components/super-admin/VehicleManager';
import ActiveRidesManager from '../components/super-admin/ActiveRidesManager';
import CustomerManager from '../components/super-admin/CustomerManager';

const SuperAdminDashboard = () => {
    // Default to the most important tab, 'stations'
    const [activeTab, setActiveTab] = useState('stations');

    // Define the tabs for the navigation
    const tabs = [
        { id: 'stations', label: 'Stations Overview' },
        { id: 'vehicles', label: 'Vehicle Fleet' },
        { id: 'masters', label: 'Staff Management' },
        { id: 'customers', label: 'Customer Management' },
        { id: 'rides', label: 'Active Rides' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Hero Header Section */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-accent-600 px-6 py-12">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center space-y-4">
                        <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">
                            Super Admin Panel
                        </h1>
                        <p className="text-xl text-primary-100 max-w-2xl mx-auto">
                            Complete control and oversight of your EV rental ecosystem
                        </p>
                        <div className="flex items-center justify-center space-x-4 text-primary-100">
                            <div className="h-1 w-16 bg-primary-300 rounded"></div>
                            <div className="text-sm font-medium">
                                {new Date().toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </div>
                            <div className="h-1 w-16 bg-primary-300 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Enhanced Tab Navigation */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 mb-8">
                    <nav className="flex space-x-2" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`${
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg transform scale-105'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                } flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content area with enhanced styling */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {activeTab === 'stations' && <StationManager />}
                    {activeTab === 'vehicles' && <VehicleManager />}
                    {activeTab === 'masters' && <UserManager />}
                    {activeTab === 'customers' && <CustomerManager />}
                    {activeTab === 'rides' && <ActiveRidesManager />}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
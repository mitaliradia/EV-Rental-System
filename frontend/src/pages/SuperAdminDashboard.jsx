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
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Super Admin Panel</h1>
            
            {/* Tab Navigation UI */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content area where the active component is rendered */}
            <div className="mt-8">
                {activeTab === 'stations' && <StationManager />}
                {activeTab === 'vehicles' && <VehicleManager />}
                {activeTab === 'masters' && <UserManager />}
                {activeTab === 'customers' && <CustomerManager />}
                {activeTab === 'rides' && <ActiveRidesManager />}
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
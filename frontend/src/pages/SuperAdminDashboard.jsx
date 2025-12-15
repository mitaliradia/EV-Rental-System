import { useState } from 'react';
import StationManager from '../components/super-admin/StationManager';
import UserRoleManager from '../components/super-admin/UserRoleManager';

const SuperAdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('stations');

    const tabs = [
        { id: 'stations', label: 'Station Management' },
        { id: 'roles', label: 'User Role Assignments' },
    ];

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Super Admin Panel</h1>
            
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div>
                {activeTab === 'stations' && <StationManager />}
                {activeTab === 'roles' && <UserRoleManager />}
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
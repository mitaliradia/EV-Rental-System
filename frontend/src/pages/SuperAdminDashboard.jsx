import { useState, useEffect } from 'react';
import api from '../services/api';
import StationCard from '../components/super-admin/StationCard'; // We will create this
import StationModal from '../components/super-admin/StationModal'; // We will create this
import UserManagement from '../components/super-admin/UserManagement'; // We will create this

const SuperAdminDashboard = () => {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isStationModalOpen, setIsStationModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null); // For editing a station

    const fetchStations = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/super-admin/stations');
            setStations(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStations();
    }, []);

    const handleEditStation = (station) => {
        setSelectedStation(station);
        setIsStationModalOpen(true);
    };

    const handleAddNewStation = () => {
        setSelectedStation(null); // Ensure we're in "add" mode
        setIsStationModalOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800">Super Admin Panel</h1>
                <div className="space-x-4">
                    <button onClick={handleAddNewStation} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                        + Add New Station
                    </button>
                    <button onClick={() => setIsUserModalOpen(true)} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700">
                        Manage Users
                    </button>
                </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Stations Overview</h2>
            {loading ? <p>Loading stations...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stations.map(station => (
                        <StationCard key={station._id} station={station} onEdit={handleEditStation} />
                    ))}
                </div>
            )}
            
            {/* Modals for Editing/Adding */}
            {isStationModalOpen && (
                <StationModal 
                    station={selectedStation}
                    onClose={() => setIsStationModalOpen(false)}
                    onSuccess={fetchStations} // Refresh list on success
                />
            )}

            {isUserModalOpen && (
                <UserManagement 
                    onClose={() => setIsUserModalOpen(false)}
                />
            )}
        </div>
    );
};

export default SuperAdminDashboard;
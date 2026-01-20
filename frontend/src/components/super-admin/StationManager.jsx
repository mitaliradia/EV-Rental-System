import { useEffect, useState } from "react"
import api from "../../services/api";
import StationCard from "../StationCard";
import StationModal from "./StationModal";

const StationManager = () => {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState(''); // managed/unmanaged
    const [vehicleCountFilter, setVehicleCountFilter] = useState('');
    const [revenueRange, setRevenueRange] = useState({ min: '', max: '' });

    const fetchStationsOverview = async () => {
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const params = {
                    sortBy: sortConfig.key,
                    sortOrder: sortConfig.direction,
                    status: statusFilter,
                    vehicleCount: vehicleCountFilter,
                    minRevenue: revenueRange.min,
                    maxRevenue: revenueRange.max
                };
                
                const { data } = await api.get('/super-admin/stations/overview', { params });
                setStations(data);
            } catch(error) {
                console.error("Failed to fetch stations overview", error);
            } finally { 
                setLoading(false); 
            }
        }, 300);
        
        return () => clearTimeout(timer);
    };

    useEffect(() => { fetchStationsOverview(); }, [sortConfig, statusFilter, vehicleCountFilter, revenueRange]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const clearFilters = () => {
        setStatusFilter('');
        setVehicleCountFilter('');
        setRevenueRange({ min: '', max: '' });
    };

    const hasActiveFilters = statusFilter || vehicleCountFilter || revenueRange.min || revenueRange.max;

    const handleEdit = (station) => {
        setSelectedStation(station);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedStation(null);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        fetchStationsOverview();
    };

    if (loading) return <p>Loading stations...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Stations Overview</h3>
                <div className="flex items-center gap-4">
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                            Clear Filters
                        </button>
                    )}
                    <button onClick={handleAdd} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                        + Add Station
                    </button>
                </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-end mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Management Status</label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">All Stations</option>
                        <option value="managed">Managed</option>
                        <option value="unmanaged">Unmanaged</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Count</label>
                    <select 
                        value={vehicleCountFilter} 
                        onChange={(e) => setVehicleCountFilter(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Any Count</option>
                        <option value="0">No Vehicles</option>
                        <option value="1-5">1-5 Vehicles</option>
                        <option value="6-10">6-10 Vehicles</option>
                        <option value="10+">10+ Vehicles</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Revenue Range (₹)</label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">₹</span>
                        <input
                            type="number"
                            placeholder="Min"
                            value={revenueRange.min}
                            onChange={(e) => setRevenueRange(prev => ({ ...prev, min: e.target.value }))}
                            className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">₹</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={revenueRange.max}
                            onChange={(e) => setRevenueRange(prev => ({ ...prev, max: e.target.value }))}
                            className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
                    <select 
                        value={sortConfig.key} 
                        onChange={(e) => setSortConfig(prev => ({ ...prev, key: e.target.value }))}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="name">Name</option>
                        <option value="totalVehicles">Vehicle Count</option>
                        <option value="totalRevenue">Revenue</option>
                        <option value="activeRides">Active Rides</option>
                    </select>
                </div>
                
                <div>
                    <button
                        onClick={() => setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex items-center gap-1"
                    >
                        {sortConfig.direction === 'asc' ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        )}
                        {sortConfig.direction === 'asc' ? 'Asc' : 'Desc'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {stations.length > 0 ? (
                    stations.map(stationWithStats => (
                        <StationCard key={stationWithStats._id} stationData={stationWithStats} onEdit={() => handleEdit(stationWithStats)} />
                    ))
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 col-span-full">
                        {hasActiveFilters ? 'No stations found matching the filters.' : 'No stations have been created yet.'}
                    </p>
                )}
            </div>

            {isModalOpen && (
                <StationModal 
                    station={selectedStation}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}

export default StationManager;
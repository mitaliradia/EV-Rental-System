import { useState, useEffect } from 'react';
import api from '../../services/api';
import VehicleModal from './VehicleModal';

const VehicleManager = () => {
    const [vehicles, setVehicles] = useState([]);
    const [stations, setStations] = useState([]);
    const [masters, setMasters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'modelName', direction: 'asc' });
    
    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [stationFilter, setStationFilter] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    const columns = [
        { key: 'modelName', label: 'Model', sortable: true },
        { key: 'station.name', label: 'Station', sortable: true },
        { key: 'pricePerHour', label: 'Price/Hour', sortable: true },
        { key: 'status', label: 'Status', sortable: true }
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const timer = setTimeout(async () => {
                const params = {
                    sortBy: sortConfig.key,
                    sortOrder: sortConfig.direction,
                    status: statusFilter,
                    station: stationFilter,
                    minPrice: priceRange.min,
                    maxPrice: priceRange.max
                };
                
                const [vehiclesRes, stationsRes, mastersRes] = await Promise.all([
                    api.get('/super-admin/vehicles', { params }),
                    api.get('/super-admin/stations'),
                    api.get('/super-admin/users/masters')
                ]);
                setVehicles(vehiclesRes.data);
                setStations(stationsRes.data);
                setMasters(mastersRes.data);
                setLoading(false);
            }, 300);
            
            return () => clearTimeout(timer);
        } catch(error){
            console.error("Failed to fetch fleet data", error);
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [sortConfig, statusFilter, stationFilter, priceRange]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const clearFilters = () => {
        setStatusFilter('');
        setStationFilter('');
        setPriceRange({ min: '', max: '' });
    };

    const hasActiveFilters = statusFilter || stationFilter || priceRange.min || priceRange.max;

    const managedStationIds = masters.map(master => master.station?._id);
    const managedStations = stations.filter(station => managedStationIds.includes(station._id));

    const handleAddVehicle = () => {
        setSelectedVehicle(null);
        setIsModalOpen(true);
    };

    const handleEditVehicle = (vehicle) => {
        setSelectedVehicle(vehicle);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        fetchData();
    };

    const handleDeleteVehicle = async (vehicleId) => {
        if (!confirm('Are you sure you want to delete this vehicle?')) return;
        try {
            console.log('Attempting to delete vehicle with ID:', vehicleId);
            console.log('Making request to:', `/super-admin/vehicles/${vehicleId}`);
            const response = await api.delete(`/super-admin/vehicles/${vehicleId}`);
            console.log('Delete response:', response);
            fetchData();
        } catch (error) {
            console.error('Delete error details:', error);
            console.error('Error response:', error.response);
            alert('Failed to delete vehicle: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">Vehicle Fleet Management</h3>
                <div className="flex items-center gap-4">
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                            Clear Filters
                        </button>
                    )}
                    <button 
                        onClick={handleAddVehicle} 
                        disabled={managedStations.length === 0} 
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title={managedStations.length === 0 ? "You must assign a master to a station before adding vehicles." : ""}
                    >
                        + Add Vehicle
                    </button>
                </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">All Status</option>
                        <option value="available">Available</option>
                        <option value="in-use">In Use</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Station</label>
                    <select 
                        value={stationFilter} 
                        onChange={(e) => setStationFilter(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">All Stations</option>
                        {stations.map(station => (
                            <option key={station._id} value={station._id}>{station.name}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price Range (₹/hr)</label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">₹</span>
                        <input
                            type="number"
                            placeholder="Min"
                            value={priceRange.min}
                            onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">₹</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="overflow-x-auto">
                    {loading ? <p className="text-gray-600 dark:text-gray-400">Loading vehicles...</p> : (
                        <table className="min-w-full text-sm divide-y">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    {columns.map(column => (
                                        <th key={column.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            <div className="flex items-center space-x-1">
                                                <span>{column.label}</span>
                                                {column.sortable && (
                                                    <button
                                                        onClick={() => handleSort(column.key)}
                                                        className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                                                    >
                                                        {sortConfig.key === column.key ? (
                                                            sortConfig.direction === 'asc' ? (
                                                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            )
                                                        ) : (
                                                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M5 12l5-5 5 5H5z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                                {vehicles.map(v => (
                                    <tr key={v._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{v.modelName}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.station?.name || 'N/A'}</td>
                                        <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">₹{v.pricePerHour?.toLocaleString('en-IN') || '0'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                                                v.status === 'available' ? 'bg-green-100 text-green-800' : 
                                                v.status === 'in-use' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {v.status?.replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleEditVehicle(v)} 
                                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteVehicle(v._id)} 
                                                    className="text-xs font-medium text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <VehicleModal 
                    vehicle={selectedVehicle}
                    stations={managedStations}
                    allStations={stations}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
};

export default VehicleManager;
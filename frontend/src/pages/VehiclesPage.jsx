import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import VehicleCard from '../components/VehicleCard';
import BookingModal from '../components/BookingModal';
import DatePicker from 'react-datepicker';

// It's good practice to have a reusable spinner
const Spinner = () => (
    <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
);

const roundToNext10Min = (date) => {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 10) * 10;
    const newDate = new Date(date);
    if (roundedMinutes >= 60) {
        newDate.setHours(newDate.getHours() + 1, 0, 0, 0);
    } else {
        newDate.setMinutes(roundedMinutes, 0, 0);
    }
    return newDate;
};

const VehiclesPage = () => {
    const [stations, setStations] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    
    const [filters, setFilters] = useState({
        stationId: '',
        startTime: roundToNext10Min(new Date()),
        endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
        search: '',
        minPrice: '',
        maxPrice: '',
        sortBy: 'name'
    });

    // --- MISSING LOGIC (ADDED BACK IN) ---
    const [bookingVehicle, setBookingVehicle] = useState(null);
    const navigate = useNavigate();
    // ------------------------------------

    // Fetch stations on initial load
    useEffect(() => {
        const fetchStations = async () => {
            try {
                const { data } = await api.get('/public/stations');
                setStations(data);
                if (data.length > 0) {
                    setFilters(prev => ({ ...prev, stationId: data[0]._id }));
                }
            } catch (error) {
                console.error("Failed to fetch stations", error);
            }
        };
        fetchStations();
    }, []);

    // --- NEW: Automatically run search on page load ---
    useEffect(() => {
        // Run the search only when the initial stationId is set
        if (filters.stationId) {
            findVehicles();
        }
    }, [filters.stationId]); // This effect runs once when the default station is loaded
    // ----------------------------------------------------

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const findVehicles = async () => {
        if (!filters.stationId || !filters.startTime || !filters.endTime) {
            alert("Please select a station and a time slot.");
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.get('/public/vehicles', {
                params: {
                    stationId: filters.stationId,
                    startTime: filters.startTime.toISOString(),
                    endTime: filters.endTime.toISOString(),
                }
            });
            setVehicles(data);
        } catch (error) {
            console.error("Failed to find vehicles", error);
            setVehicles([]); // Clear vehicles on error
        } finally {
            setLoading(false);
        }
    };

    // --- MISSING HANDLERS (ADDED BACK IN) ---
    const handleOpenBookingModal = (vehicle) => {
        setBookingVehicle(vehicle);
    };

    const handleCloseBookingModal = () => {
        setBookingVehicle(null);
    };

    const handleBookingSuccess = () => {
        alert('Booking request sent! Awaiting confirmation.');
        handleCloseBookingModal();
        navigate('/profile');
    };
    // ---------------------------------------

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Beautiful Hero Header */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-accent-600 px-6 py-12">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center space-y-4">
                        <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">
                            Find Your Perfect Ride
                        </h1>
                        <p className="text-xl text-primary-100 max-w-2xl mx-auto">
                            Discover our eco-friendly fleet and book the perfect electric vehicle for your journey
                        </p>
                        <div className="flex items-center justify-center space-x-4 text-primary-100">
                            <div className="h-1 w-16 bg-primary-300 rounded"></div>
                            <div className="text-sm font-medium">
                                🌱 Sustainable Transportation
                            </div>
                            <div className="h-1 w-16 bg-primary-300 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Enhanced Filter Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-3">
                            <div className="text-xl">🔍</div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Search & Filter</h2>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    📍 Select Station
                                </label>
                                <select 
                                    value={filters.stationId} 
                                    onChange={e => handleFilterChange('stationId', e.target.value)} 
                                    className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                                >
                                    {stations.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    🕰️ Start Time
                                </label>
                                <DatePicker 
                                    selected={filters.startTime} 
                                    onChange={date => handleFilterChange('startTime', date)} 
                                    showTimeSelect 
                                    dateFormat="Pp" 
                                    className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    ⏰ End Time
                                </label>
                                <DatePicker 
                                    selected={filters.endTime} 
                                    onChange={date => handleFilterChange('endTime', date)} 
                                    showTimeSelect 
                                    dateFormat="Pp" 
                                    className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                                />
                            </div>
                            
                            <div className="flex items-end">
                                <button 
                                    onClick={findVehicles} 
                                    disabled={loading}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold rounded-xl hover:from-primary-600 hover:to-accent-600 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:transform-none"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center space-x-2">
                                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            <span>Searching...</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center space-x-2">
                                            <span>🔍</span>
                                            <span>Find Vehicles</span>
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        {/* Secondary Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400">🔍</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search vehicles..."
                                    value={filters.search}
                                    onChange={e => handleFilterChange('search', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                                />
                            </div>
                            
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400">₹</span>
                                </div>
                                <input
                                    type="number"
                                    placeholder="Min price"
                                    value={filters.minPrice}
                                    onChange={e => handleFilterChange('minPrice', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                                />
                            </div>
                            
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400">₹</span>
                                </div>
                                <input
                                    type="number"
                                    placeholder="Max price"
                                    value={filters.maxPrice}
                                    onChange={e => handleFilterChange('maxPrice', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                                />
                            </div>
                            
                            <select
                                value={filters.sortBy}
                                onChange={e => handleFilterChange('sortBy', e.target.value)}
                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                            >
                                <option value="name">🎨 Sort by Name</option>
                                <option value="price">💰 Sort by Price</option>
                                <option value="rating">⭐ Sort by Rating</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center space-y-4">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto"></div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">Finding perfect vehicles for you...</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {vehicles.length > 0 && (
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Available Fleet 🚗
                                </h2>
                                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full">
                                    {vehicles.filter(vehicle => {
                                        const matchesSearch = vehicle.modelName.toLowerCase().includes(filters.search.toLowerCase());
                                        const matchesMinPrice = !filters.minPrice || vehicle.pricePerHour >= parseInt(filters.minPrice);
                                        const matchesMaxPrice = !filters.maxPrice || vehicle.pricePerHour <= parseInt(filters.maxPrice);
                                        return matchesSearch && matchesMinPrice && matchesMaxPrice;
                                    }).length} vehicles found
                                </div>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {vehicles.length > 0 ? (
                                vehicles
                                    .filter(vehicle => {
                                        const matchesSearch = vehicle.modelName.toLowerCase().includes(filters.search.toLowerCase());
                                        const matchesMinPrice = !filters.minPrice || vehicle.pricePerHour >= parseInt(filters.minPrice);
                                        const matchesMaxPrice = !filters.maxPrice || vehicle.pricePerHour <= parseInt(filters.maxPrice);
                                        return matchesSearch && matchesMinPrice && matchesMaxPrice;
                                    })
                                    .sort((a, b) => {
                                        switch (filters.sortBy) {
                                            case 'price':
                                                return a.pricePerHour - b.pricePerHour;
                                            case 'rating':
                                                return 0; // Placeholder for rating sort
                                            default:
                                                return a.modelName.localeCompare(b.modelName);
                                        }
                                    })
                                    .map(vehicle => (
                                        <VehicleCard 
                                            key={vehicle._id} 
                                            vehicle={vehicle}
                                            onBookNow={handleOpenBookingModal}
                                        />
                                    ))
                            ) : (
                                <div className="col-span-full">
                                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                                        <div className="text-6xl text-gray-400 mb-4">🚗</div>
                                        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                            No vehicles available
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                            No vehicles are available for the selected time and station. Please try different criteria or check back later.
                                        </p>
                                        <button 
                                            onClick={() => {
                                                setFilters(prev => ({
                                                    ...prev,
                                                    search: '',
                                                    minPrice: '',
                                                    maxPrice: ''
                                                }));
                                            }}
                                            className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors duration-200"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {bookingVehicle && (
                <BookingModal
                    vehicle={bookingVehicle}
                    onClose={handleCloseBookingModal}
                    onBookingSuccess={handleBookingSuccess}
                />
            )}
        </div>
    );
};

export default VehiclesPage;
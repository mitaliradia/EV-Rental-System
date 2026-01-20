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
        <div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Find Your Ride</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Station</label>
                        <select value={filters.stationId} onChange={e => handleFilterChange('stationId', e.target.value)} className="w-full mt-1 p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                           {stations.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
                        <DatePicker selected={filters.startTime} onChange={date => handleFilterChange('startTime', date)} showTimeSelect dateFormat="Pp" className="w-full mt-1 p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
                        <DatePicker selected={filters.endTime} onChange={date => handleFilterChange('endTime', date)} showTimeSelect dateFormat="Pp" className="w-full mt-1 p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"/>
                    </div>
                    <button onClick={findVehicles} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                        {loading ? 'Searching...' : 'Find Vehicles'}
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Search vehicles..."
                        value={filters.search}
                        onChange={e => handleFilterChange('search', e.target.value)}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <input
                        type="number"
                        placeholder="Min price"
                        value={filters.minPrice}
                        onChange={e => handleFilterChange('minPrice', e.target.value)}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <input
                        type="number"
                        placeholder="Max price"
                        value={filters.maxPrice}
                        onChange={e => handleFilterChange('maxPrice', e.target.value)}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <select
                        value={filters.sortBy}
                        onChange={e => handleFilterChange('sortBy', e.target.value)}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="price">Sort by Price</option>
                        <option value="rating">Sort by Rating</option>
                    </select>
                </div>
            </div>

            <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Available Fleet</h1>
            {loading ? <Spinner /> : (
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
                        <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
                            No vehicles available for the selected time and station. Please try different criteria.
                        </p>
                    )}
                </div>
            )}
            
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
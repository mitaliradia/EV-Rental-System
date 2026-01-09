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

const VehiclesPage = () => {
    const [stations, setStations] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [filters, setFilters] = useState({
        stationId: '',
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000)
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
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                <h2 className="text-xl font-semibold mb-4">Find Your Ride</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Station</label>
                        <select value={filters.stationId} onChange={e => handleFilterChange('stationId', e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                           {stations.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Time</label>
                        <DatePicker selected={filters.startTime} onChange={date => handleFilterChange('startTime', date)} showTimeSelect dateFormat="Pp" className="w-full mt-1 p-2 border rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">End Time</label>
                        <DatePicker selected={filters.endTime} onChange={date => handleFilterChange('endTime', date)} showTimeSelect dateFormat="Pp" className="w-full mt-1 p-2 border rounded-md"/>
                    </div>
                    <button onClick={findVehicles} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                        {loading ? 'Searching...' : 'Find Vehicles'}
                    </button>
                </div>
            </div>

            <h1 className="text-4xl font-bold mb-8">Available Fleet</h1>
            {loading ? <Spinner /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {vehicles.length > 0 ? (
                        vehicles.map(vehicle => (
                            // --- MISSING PROP (ADDED BACK IN) ---
                            <VehicleCard 
                                key={vehicle._id} 
                                vehicle={vehicle}
                                onBookNow={handleOpenBookingModal}
                            />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 py-10">
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
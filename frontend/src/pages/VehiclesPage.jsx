import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import VehicleCard from '../components/VehicleCard';
// A spinner component for loading states
const Spinner = () => <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>;

const VehiclesPage = () => {
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState('');
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        // Fetch all stations for the dropdown
        const fetchStations = async () => {
            const { data } = await api.get('/public/stations');
            setStations(data);
            if (data.length > 0) setSelectedStation(data[0]._id);
        };
        fetchStations();
    }, []);

    useEffect(() => {
        // Fetch vehicles whenever a new station is selected
        if (!selectedStation) return;
        const fetchVehicles = async () => {
            setLoading(true);
            const { data } = await api.get(`/public/vehicles?stationId=${selectedStation}`);
            setVehicles(data);
            setLoading(false);
        };
        fetchVehicles();
    }, [selectedStation]);

    return (
        <div>
            <div className='mb-8'>
                <label htmlFor='station' className='block text-sm font-medium text-gray-700'>Select a Station</label>
                <select id='station' value={selectedStation} onChange={e => setSelectedStation(e.target.value)} className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md'>
                    {stations.map(s => <option key={s._id} value={s._id}> {s.name} - {s.location}</option>)}
                </select>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Our Electric Fleet</h1>
            <p className="text-gray-600 mb-8">Choose from our curated selection of premium electric vehicles.</p>
            {loading ? <Spinner /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {vehicles.map(vehicle => (
                        <VehicleCard 
                            key={vehicle._id} // Use _id from MongoDB
                            vehicle={vehicle} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
export default VehiclesPage;
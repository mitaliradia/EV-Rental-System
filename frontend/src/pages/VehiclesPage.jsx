import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
// A spinner component for loading states
const Spinner = () => <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>;

const VehicleCard = ({ vehicle }) => {
    const { authUser } = useAuth();
    const isKycApproved = authUser?.kyc?.status === 'approved';

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group">
            <div className="relative">
                <img src={vehicle.imageUrl} alt={vehicle.modelName} className="w-full h-56 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                    <h3 className="text-2xl font-bold text-white">{vehicle.modelName}</h3>
                    <p className="text-indigo-200 text-sm">{vehicle.station}</p>
                </div>
            </div>
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <p className="text-2xl font-semibold text-gray-800">${vehicle.pricePerHour}<span className="text-sm font-normal text-gray-500">/hr</span></p>
                    {authUser ? (
                        isKycApproved ? (
                            <button className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105">Book Now</button>
                        ) : (
                            <button disabled className="px-5 py-2 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed" title="Your KYC must be approved to book">Book Now</button>
                        )
                    ) : (
                        <Link to="/login" className="px-5 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Login to Book</Link>
                    )}
                </div>
            </div>
        </div>
    );
};

const VehiclesPage = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const { data } = await api.get('/vehicles');
                setVehicles(data);
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();
    }, []);

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Our Electric Fleet</h1>
            <p className="text-gray-600 mb-8">Choose from our curated selection of premium electric vehicles.</p>
            {loading ? <Spinner /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {vehicles.map(vehicle => (
                        <VehicleCard key={vehicle._id} vehicle={vehicle} />
                    ))}
                </div>
            )}
        </div>
    );
};
export default VehiclesPage;
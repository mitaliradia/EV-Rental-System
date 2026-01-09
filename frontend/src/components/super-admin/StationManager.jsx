import { useEffect, useState } from "react"
import api from "../../services/api";
import StationCard from "../StationCard";
import StationModal from "./StationModal";


const StationManager = () => {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);

    const fetchStationsOverview = async () => {
        setLoading(true);
        try {
            // ONLY ONE API CALL is needed now
            const { data } = await api.get('/super-admin/stations/overview');
            setStations(data);
        } catch(error) {
            console.error("Failed to fetch stations overview",error);
        }
         finally { setLoading(false); }
    };

    useEffect(() => { fetchStationsOverview(); }, []);

    const handleEdit = (station) => {
        setSelectedStation(station);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedStation(null); // Set to null for "Add New" mode
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        fetchStationsOverview(); // Refresh the list after adding/editing
    };

    if (loading) return <p>Loading stations...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Stations Overview</h3>
                <button onClick={handleAdd} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                    + Add Station
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {stations.length > 0 ? (
                    stations.map(stationWithStats => (
                        <StationCard key={stationWithStats._id} stationData={stationWithStats} onEdit={() => handleEdit(stationWithStats)} />
                    ))
                ) : (
                    <p className="text-gray-500 col-span-full">No stations have been created yet.</p>
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
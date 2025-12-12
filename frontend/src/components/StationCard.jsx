import api from "../services/api";

const Stat = ({label,value}) => (
    <div className="text-center">
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
);

const StationCard = ({ station,onEdit }) => {
    const [stats,setStats] = useState(null);
    const [loading,setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try{
                const {data} = await api.get(`/super-admin/stations/${station._id}`);
                setStats(data.stats);
            } catch(error) {
                console.error("Failed to fetch station stats",error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [station._id]);

    return (
       <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{station.name}</h3>
                    <p className="text-sm text-gray-500">{station.location}</p>
                    {stats?.stationMaster ? (
                         <p className="text-xs mt-1 bg-blue-100 text-blue-800 font-medium px-2 py-1 rounded-full inline-block">
                            Master: {stats.stationMaster.name}
                         </p>
                    ) : (
                        <p className="text-xs mt-1 bg-yellow-100 text-yellow-800 font-medium px-2 py-1 rounded-full inline-block">
                            No Master Assigned
                        </p>
                    )}
                </div>
                <button onClick={() => onEdit(station)} className="text-xs text-indigo-600 hover:text-indigo-800">Edit</button>
            </div>
            
            <div className="border-t my-4"></div>

            {loading ? <p>Loading stats...</p> : stats && (
                 <div className="grid grid-cols-3 gap-4">
                    <Stat label="Vehicles" value={`${stats.availableVehicles} / ${stats.totalVehicles}`} />
                    <Stat label="Active Rides" value={stats.activeRides} />
                    <Stat label="Revenue" value={`$${stats.totalRevenue}`} />
                </div>
            )}
        </div> 
    );
};

export default StationCard;
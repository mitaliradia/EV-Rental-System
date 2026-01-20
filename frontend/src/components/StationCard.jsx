import { Link } from 'react-router-dom';

const Stat = ({ label, value, color = 'text-gray-800' }) => (
    <div className="text-center">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
);

const StationCard = ({ stationData, onEdit }) => {
    const { stats, ...station } = stationData;

    // --- THIS IS THE KEY FUNCTION ---
    const handleEditClick = (e) => {
        // 1. Prevent the parent <Link> from navigating
        e.preventDefault();
        
        // 2. Stop the event from bubbling further up if needed (good practice)
        e.stopPropagation();
        
        // 3. Call the parent's onEdit function to open the modal
        onEdit(); 
    };

    return (
        // 1. The entire card is a Link to the detail page
        <Link 
            to={`/super-admin/station/${station._id}`}
            className="block bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl hover:-translate-y-1 transition-all"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{station.name}</h3>
                    <p className="text-sm text-gray-500">{station.location}</p>
                    {stats?.stationMaster?.name ? (
                         <p className="text-xs mt-1 bg-blue-100 text-blue-800 font-medium px-2 py-1 rounded-full inline-block">
                            Master: {stats.stationMaster.name}
                         </p>
                    ) : (
                        <p className="text-xs mt-1 bg-yellow-100 text-yellow-800 font-medium px-2 py-1 rounded-full inline-block">
                            No Master Assigned
                        </p>
                    )}
                </div>
                
                {/* 2. The "Edit" button has its own specific onClick handler */}
                <button 
                    onClick={handleEditClick} 
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline relative z-10"
                >
                    Edit
                </button>
            </div>
            
            <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-4">
                    <Stat label="Vehicles" value={`${stats.availableVehicles} / ${stats.totalVehicles}`} color="text-green-600" />
                    <Stat label="Active Rides" value={stats.activeRides} color="text-blue-600" />
                    <Stat label="Revenue" value={`₹${(stats.totalRevenue || 0).toFixed(2)}`} color="text-purple-600" />
                </div>
            </div>
        </Link>
    );
};

export default StationCard;
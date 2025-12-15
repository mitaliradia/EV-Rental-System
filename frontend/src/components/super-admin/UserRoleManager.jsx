import { useState, useEffect } from 'react';
import api from '../../services/api';

// --- The AssignStationModal Component ---
// This component becomes simpler. It no longer needs to filter anything.
// It just receives the list of available stations.
const AssignStationModal = ({ user, availableStations, onClose, onSuccess }) => {
    const [selectedStation, setSelectedStation] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAssign = async () => {
        if (!selectedStation) return alert('Please select a station.');
        setLoading(true);
        try {
            await api.put(`/super-admin/users/${user._id}/assign`, { stationId: selectedStation });
            onSuccess();
            onClose();
        } catch (error) {
            alert('Failed to assign user.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold">Assign Station for {user.name}</h3>
                </div>
                <div className="p-4 space-y-4">
                    <p>Select an available station to assign this user as a Station Master.</p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Available Stations</label>
                        <select
                            value={selectedStation}
                            onChange={e => setSelectedStation(e.target.value)}
                            className="mt-1 block w-full p-2 border-gray-300 rounded-md"
                        >
                            <option value="">-- Choose a Station --</option>
                            {availableStations.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                        {availableStations.length === 0 && (
                            <p className="text-xs text-yellow-700 mt-2">No stations are currently available to be assigned.</p>
                        )}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                    <button onClick={handleAssign} disabled={loading || availableStations.length === 0} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-400">
                        {loading ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- The Main Manager Component ---
const UserRoleManager = () => {
    const [users, setUsers] = useState([]);
    const [availableStations, setAvailableStations] = useState([]); // State for unassigned stations
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Use the new, combined endpoint
            const { data } = await api.get('/super-admin/assignment-data');
            setUsers(data.users);
            setAvailableStations(data.availableStations);
        } catch (error) {
            console.error("Failed to fetch assignment data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRemoveMaster = async (userId) => {
        if (!window.confirm('Are you sure you want to demote this Station Master?')) return;
        try {
            await api.put(`/super-admin/users/${userId}/remove-master`);
            fetchData(); // Refresh the list
        } catch (error) {
            alert('Failed to demote user.');
        }
    };

    if (loading) return <p>Loading users and stations...</p>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">User Roles</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm divide-y divide-gray-200">
                    {/* ... (table head is the same) ... */}
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user._id}>
                                <td className="px-4 py-3">{user.name} <span className="text-gray-500">({user.email})</span></td>
                                <td className="px-4 py-3">
                                    {user.role === 'station-master' ? (
                                        <span className="font-semibold text-indigo-600">Master @ {user.station?.name || 'Unassigned'}</span>
                                    ) : (
                                        <span className="text-gray-600">User</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {user.role === 'user' ? (
                                        <button 
                                            onClick={() => setSelectedUser(user)} 
                                            className="px-3 py-1 text-xs bg-green-500 text-white font-semibold rounded-full hover:bg-green-600"
                                        >
                                            Promote to Master
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleRemoveMaster(user._id)} 
                                            className="px-3 py-1 text-xs bg-red-500 text-white font-semibold rounded-full hover:bg-red-600"
                                        >
                                            Demote
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {selectedUser && (
                <AssignStationModal 
                    user={selectedUser}
                    availableStations={availableStations} // Pass the filtered list to the modal
                    onClose={() => setSelectedUser(null)}
                    onSuccess={fetchData} // Refresh all data on success
                />
            )}
        </div>
    );
};

export default UserRoleManager;
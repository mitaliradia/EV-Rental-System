import { useState, useEffect } from 'react';
import api from '../../services/api';

const UserManagement = ({ onClose }) => {
    const [users, setUsers] = useState([]);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, stationsRes] = await Promise.all([
                api.get('/super-admin/users'),
                api.get('/super-admin/stations')
            ]);
            setUsers(usersRes.data);
            setStations(stationsRes.data);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);
    
    const handleAssign = async (userId) => {
        const selectedStationId = document.getElementById(`station-select-${userId}`).value;
        if (!selectedStationId) return alert('Please select a station.');
        await api.put(`/super-admin/users/${userId}/assign`, { stationId: selectedStationId });
        fetchData(); // Refresh list
    };

    const handleRemove = async (userId) => {
        if (!window.confirm('Are you sure you want to demote this Station Master?')) return;
        await api.put(`/super-admin/users/${userId}/remove-master`);
        fetchData(); // Refresh list
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start z-50 p-4 pt-20" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold">User & Role Management</h3>
                    <button onClick={onClose}>&times;</button>
                </div>
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                    {loading ? <p>Loading users...</p> : (
                        <table className="min-w-full divide-y">
                            <thead className="bg-gray-50"><tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">User</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Role</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                            </tr></thead>
                            <tbody className="bg-white divide-y">
                                {users.map(user => (
                                    <tr key={user._id}>
                                        <td className="px-4 py-3">{user.name} ({user.email})</td>
                                        <td className="px-4 py-3">
                                            {user.role === 'station-master' ? (
                                                <span className="font-bold text-indigo-600">Master @ {user.station?.name}</span>
                                            ) : 'User'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.role === 'user' ? (
                                                <div className="flex items-center gap-2">
                                                    <select id={`station-select-${user._id}`} className="p-1 text-xs border-gray-300 rounded-md">
                                                        <option value="">Select Station</option>
                                                        {stations.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                                    </select>
                                                    <button onClick={() => handleAssign(user._id)} className="p-1 text-xs bg-green-500 text-white rounded">Promote</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => handleRemove(user._id)} className="p-1 text-xs bg-red-500 text-white rounded">Demote</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
export default UserManagement;
import { useState, useEffect } from 'react';
import api from '../../services/api';

// --- Sub-component: Modal for Editing a Master ---
const MasterEditModal = ({ master, onClose, onSuccess }) => {
    const [form, setForm] = useState({ name: master.name, email: master.email });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.put(`/super-admin/users/masters/${master._id}`, form);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update master.');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b"><h3>Edit Master: {master.name}</h3></div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div><label className="block text-sm font-medium">Full Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="mt-1 w-full p-2 border rounded-md" /></div>
                    <div><label className="block text-sm font-medium">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="mt-1 w-full p-2 border rounded-md" /></div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="pt-2 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md">{loading ? 'Updating...' : 'Update'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Sub-component: Form to CREATE a new Station Master ---
const CreateMasterForm = ({ stations, onSuccess }) => {
    const [form, setForm] = useState({ name: '', email: '', password: '', stationId: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const availableStations = stations.filter(s => s.masterCount < 3);
    
    useEffect(() => {
        if (availableStations.length > 0) {
            setForm(prev => ({ ...prev, stationId: availableStations[0]._id }));
        }
    }, [stations]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            await api.post('/super-admin/users/masters', form);
            setMessage({ text: 'Station Master created!', type: 'success' });
            setForm({ name: '', email: '', password: '', stationId: availableStations[0]?._id || '' });
            onSuccess();
        } catch (error) {
            setMessage({ text: error.response?.data?.message || 'Failed to create account.', type: 'error' });
        } finally { setLoading(false); }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg h-full">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Create New Station Master</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Full Name</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="mt-1 w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="mt-1 w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Set Initial Password</label>
                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required className="mt-1 w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Assign to Station</label>
                    <select value={form.stationId} onChange={e => setForm({ ...form, stationId: e.target.value })} required className="mt-1 w-full p-2 border rounded-md disabled:bg-gray-100" disabled={availableStations.length === 0}>
                        {availableStations.length > 0 ? (
                            availableStations.map(s => (
                                <option key={s._id} value={s._id}>{s.name} ({s.masterCount}/3 Filled)</option>
                            ))
                        ) : (
                            <option value="" disabled>All stations are full</option>
                        )}
                    </select>
                </div>
                <button type="submit" disabled={loading || availableStations.length === 0} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-gray-400">
                    Create Master Account
                </button>
                {message.text && <p className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>}
            </form>
        </div>
    );
};

// --- Sub-component: Table to MANAGE existing Station Masters ---
const MastersList = ({ masters, onDemote, onEdit }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Current Station Masters</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr>
                    <th className="px-3 py-2 text-left font-medium">Master Name</th>
                    <th className="px-3 py-2 text-left font-medium">Assigned Station</th>
                    <th className="px-3 py-2 text-left font-medium">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-200">
                    {masters.length > 0 ? masters.map(master => (
                        <tr key={master._id}>
                            <td className="px-3 py-3">{master.name} <span className="text-gray-500">({master.email})</span></td>
                            <td className="px-3 py-3 font-medium">{master.station?.name || 'Unassigned'}</td>
                            <td className="px-3 py-3 space-x-4">
                                <button onClick={() => onEdit(master)} className="text-xs text-indigo-600 font-medium hover:underline">Edit</button>
                                <button onClick={() => onDemote(master._id)} className="text-xs text-red-500 font-medium hover:underline">Delete</button>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan="3" className="p-4 text-center text-gray-500">No Station Masters created yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);


// --- Sub-component: Table to VIEW regular users ---
const AllUsersList = () => {
    const [data, setData] = useState({ users: [], totalPages: 1, currentPage: 1 });
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchUsers = async (page = 1) => {
            setLoading(true);
            try {
                const { data } = await api.get(`/super-admin/users/regular?page=${page}`);
                setData(data);
            } catch (error) {
                console.error("Failed to fetch regular users", error);
                setData({ users: [], totalPages: 1, currentPage: 1 });
            } finally { setLoading(false); }
        };
        fetchUsers();
    }, []);

    if (loading) return <div className="bg-white p-6 rounded-xl shadow-lg"><h3 className="text-xl font-semibold mb-4">Customer List</h3><p>Loading customers...</p></div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Customer Directory</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm divide-y">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left font-medium">Name</th>
                        <th className="p-3 text-left font-medium">Email</th>
                        <th className="p-3 text-left font-medium">Joined On</th>
                    </tr></thead>
                    <tbody className="divide-y">
                        {data.users?.length > 0 ? (
                            data.users.map(user => (
                                <tr key={user._id}>
                                    <td className="p-3">{user.name}</td>
                                    <td className="p-3">{user.email}</td>
                                    <td className="p-3 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="3" className="p-4 text-center text-gray-500">No registered users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Pagination controls would be added here */}
        </div>
    );
};

// --- Main UserManager Component ---
const UserManager = () => {
    const [masters, setMasters] = useState([]);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedMaster, setSelectedMaster] = useState(null);

    const fetchData = async () => {
        try {
            const { data } = await api.get('/super-admin/staff-data');
            setMasters(data.masters || []);
            setStations(data.stations || []);
        } catch (error) {
            console.error("Failed to fetch staff management data", error);
            setMasters([]);
            setStations([]);
        } finally {
            if(loading) setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleDemote = async (userId) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY DELETE this Station Master account?')) return;
        try {
            await api.delete(`/super-admin/users/masters/${userId}`);
            fetchData();
        } catch (error) { alert('Failed to delete account.'); }
    };

    const handleEditMaster = (master) => {
        setSelectedMaster(master);
        setIsEditModalOpen(true);
    };

    const handleSuccess = () => {
        setIsEditModalOpen(false);
        fetchData();
    };
    
    if (loading) return <p>Loading data...</p>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                    <CreateMasterForm stations={stations} onSuccess={fetchData} />
                </div>
                <div className="lg:col-span-2">
                    <MastersList masters={masters} onDemote={handleDemote} onEdit={handleEditMaster} />
                </div>
            </div>
            <AllUsersList />
            {isEditModalOpen && <MasterEditModal master={selectedMaster} onClose={() => setIsEditModalOpen(false)} onSuccess={handleSuccess} />}
        </div>
    );
};

export default UserManager;
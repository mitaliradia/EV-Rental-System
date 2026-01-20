import { useState } from 'react';
import api from '../../services/api';

const MasterEditModal = ({ master, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        name: master ? master.name : '',
        email: master ? master.email : '',
    });
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b"><h3>Edit Station Master</h3></div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label>Full Name</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label>Email</label>
                        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    {/* Note: Password change would typically be a separate, more secure flow */}
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="pt-2 flex justify-end space-x-2">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Master'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default MasterEditModal;
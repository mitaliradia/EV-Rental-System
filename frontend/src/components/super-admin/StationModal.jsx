import { useState } from "react";
import api from "../../services/api";


const StationModal=({station,onClose,onSuccess}) => {
    const isEditMode=Boolean(station);

    const [form,setForm] = useState({
        name: station?station.name:'',
        location: station?station.location:'',
    });

    const [loading,setLoading] = useState(false);
    const [error,setError] = useState('');

    const handleChange=(e) => {
        setForm({...form,[e.target.name]: e.target.value});
    };

    const handleSubmit=async(e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try{
            if(isEditMode) {
                await api.put(`/super-admin/stations/${station._id}`,form);
            }
            else{
                await api.post('/super-admin/stations',form);
            }
            onSuccess();
            onClose();
        } catch(err) {
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} station`);
        } finally{
            setLoading(false);
        }
    };

    return (
       <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            {/* Modal Content */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {isEditMode ? 'Edit Station' : 'Add New Station'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Station Name</label>
                        <input
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                        <input
                            id="location"
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    
                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="pt-2 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-indigo-400">
                            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Station' : 'Create Station')}
                        </button>
                    </div>
                </form>
            </div>
        </div> 
    )
}

export default StationModal;
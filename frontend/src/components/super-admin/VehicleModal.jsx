import { useState, useEffect } from 'react';
import api from '../../services/api';

const VehicleModal = ({ vehicle, stations, allStations, onClose, onSuccess }) => {
    const isEditMode = Boolean(vehicle);
    const stationListForDropdown = isEditMode ? allStations : stations;

    const [form, setForm] = useState({
        modelName: vehicle ? vehicle.modelName : '',
        pricePerHour: vehicle ? vehicle.pricePerHour : '',
        stationId: vehicle ? vehicle.station._id : (stations[0]?._id || ''),
    });
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            if (isEditMode) {
                if (selectedFile) {
                    const formData = new FormData();
                    formData.append('modelName', form.modelName);
                    formData.append('pricePerHour', form.pricePerHour);
                    formData.append('image', selectedFile);
                    
                    await api.put(`/super-admin/vehicles/${vehicle._id}`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                } else {
                    await api.put(`/super-admin/vehicles/${vehicle._id}`, {
                        modelName: form.modelName,
                        pricePerHour: form.pricePerHour,
                    });
                }
            } else {
                if (!selectedFile) {
                    setError('Please select an image file');
                    setLoading(false);
                    return;
                }
                
                const formData = new FormData();
                formData.append('modelName', form.modelName);
                formData.append('pricePerHour', form.pricePerHour);
                formData.append('stationId', form.stationId);
                formData.append('image', selectedFile);
                
                await api.post('/super-admin/vehicles', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} vehicle.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold">{isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label>Station</label>
                        {/* The station cannot be changed in edit mode */}
                        <select name="stationId" value={form.stationId} onChange={handleChange} required disabled={isEditMode} className="mt-1 w-full p-2 border rounded-md disabled:bg-gray-100">
                            {stationListForDropdown && stationListForDropdown.length > 0 ? (
                                stationListForDropdown.map(s => <option key={s._id} value={s._id}>{s.name}</option>)
                            ) : (
                                <option value="" disabled>No managed stations to add to</option>
                            )}
                        </select>
                            
                        
                        {stationListForDropdown.length === 0 && !isEditMode && (
                            <p className="text-xs text-red-500 mt-1">You must assign a master to a station before you can add vehicles.</p>
                        )}

                    </div>
                    <div>
                        <label>Model Name</label>
                        <input name="modelName" value={form.modelName} onChange={handleChange} required className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label>Vehicle Image</label>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            className="mt-1 w-full p-2 border rounded-md" 
                        />
                        {selectedFile && (
                            <p className="text-sm text-gray-600 mt-1">Selected: {selectedFile.name}</p>
                        )}
                        {isEditMode && vehicle?.imageUrl && (
                            <p className="text-sm text-gray-500 mt-1">Current image will be replaced if new file is selected</p>
                        )}
                    </div>
                    <div>
                        <label>Price Per Hour (₹)</label>
                        <input name="pricePerHour" type="number" value={form.pricePerHour} onChange={handleChange} required className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="pt-2 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-indigo-400">
                            {loading ? 'Saving...' : (isEditMode ? 'Update Vehicle' : 'Add Vehicle')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VehicleModal;
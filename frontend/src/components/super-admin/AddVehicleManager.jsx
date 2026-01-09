

const AddVehicleManager = () => {
    const [stations,setStations] = useState([]);
    const [form,setForm] = useState({modelName:'', imageUrl:'',pricePerHour:'',stationId:''});

    const [message,setMessage] = useState({text:'',type:''});
    const [loading,setLoading] = useState(false);

    useEffect(() => {
        const fetchStations = async() => {
            try{
                const {data} = await api.get('/super-admin/stations');
                setStations(data);
                if(data.length>0){
                    setForm(prev=>({...prev,stationId:data[0]._id}));
                }
            }
            catch(error){
                console.error("Failed to fetch stations",error);
            }
        };
        fetchStations();
    },[]);

    const handleSubmit = async(e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({text:'',type:''});

        try{
            await api.post('/super-admin/vehicles',form);
            setMessage({text:'Vehicle added successfully!',type:'success'});
            setForm({...form,modelName:'',imageUrl:'',pricePerHour:''});
        }
        catch(error){
            setMessage({text:error.reponse?.data?.message || 'Failed to add vehicle.',type: 'error'});
        } finally{
            setLoading(false);
        }
    };

    return(
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Add New Vehicle</h3>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Assign to Station</label>
                    <select
                        value={form.stationId}
                        onChange={e => setForm({...form,stationId: e.target.value})}
                        required
                        className="mt-1 w-full p-2 border rounded-md">
                            <option value="" disabled>Select as station</option>
                            {stations.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Model Name</label>
                    <input value={form.modelName} onChange={e=>setForm({...form,modelName: e.target.value})} required className="mt-1 w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Image URL</label>
                    <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} required className="mt-1 w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Price Per Hour ($)</label>
                    <input type="number" value={form.pricePerHour} onChange={e => setForm({ ...form, pricePerHour: e.target.value })} required className="mt-1 w-full p-2 border rounded-md" />
                </div>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-indigo-400">
                    {loading ? 'Adding...' : 'Add Vehicle'}
                </button>
                {message.text && (
                    <p className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>
                )}
            </form>
        </div>
    )
}
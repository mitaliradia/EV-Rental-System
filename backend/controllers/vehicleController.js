import Vehicle from '../models/Vehicle.js';

export const getAvailableVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ status: 'available' });
        res.status(200).json(vehicles);
    } catch (error) { res.status(500).json({ message: 'Server Error fetching vehicles' }); }
};

// POST /api/super-admin/vehicles
export const addVehicle = async(req,res) => {
    const {modelName,imageUrl,pricePerHour,stationId} = req.body;

    if(!modelName || !imageUrl || !pricePerHour || !stationId){
        return res.status(400).json({message: 'All fields including Station ID are required'});
    }

    try{
        const vehicle=await Vehicle.create({
            modelName,
            imageUrl,
            pricePerHour,
            station: stationId
        });
        res.status(201).json(vehicle);
    } catch(error){
        res.status(500).json({message: 'Server error adding vehicle'});
    }
}
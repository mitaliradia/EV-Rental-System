import Vehicle from '../models/Vehicle.js';
import Station from '../models/Station.js';
import User from '../models/User.js';
import { createNotificationUtil } from './notificationController.js';

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
        
        // Notify station masters about new vehicle
        const [station, stationMasters] = await Promise.all([
            Station.findById(stationId),
            User.find({ station: stationId, role: 'station-master' })
        ]);
        
        for (const master of stationMasters) {
            await createNotificationUtil(
                master._id,
                'New Vehicle Added',
                `${modelName} has been added to ${station.name} by administration.`,
                'system',
                'medium'
            );
        }
        
        res.status(201).json(vehicle);
    } catch(error){
        console.error('Error adding vehicle:', error);
        res.status(500).json({message: 'Server error adding vehicle'});
    }
}
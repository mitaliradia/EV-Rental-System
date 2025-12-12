import Vehicle from '../models/Vehicle.js';

export const getAvailableVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ status: 'available' });
        res.status(200).json(vehicles);
    } catch (error) { res.status(500).json({ message: 'Server Error fetching vehicles' }); }
};
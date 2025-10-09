import Vehicle from '../models/Vehicle.js';

export const addVehicle = async (req, res) => {
    const { modelName, imageUrl, station, pricePerHour } = req.body;
    try {
        const vehicle = new Vehicle({ modelName, imageUrl, station, pricePerHour });
        const createdVehicle = await vehicle.save();
        res.status(201).json(createdVehicle);
    } catch (error) {
        res.status(500).json({ message: 'Server Error adding vehicle' });
    }
};

export const getAvailableVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ status: 'available' });
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching vehicles' });
    }
};
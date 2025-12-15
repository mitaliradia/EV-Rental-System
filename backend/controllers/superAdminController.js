import Booking from "../models/Booking.js";
import Station from "../models/Station.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";

export const createStation = async (req,res) => {
    const {name,location} = req.body;
    if (!name || !location) return res.status(400).json({ message: 'Name and location are required' });
    const station = await Station.create({name,location});
    res.status(201).json(station);
};

export const getAllStations = async (req,res) => res.json(await Station.find({}));

export const getAllUsers = async (req, res) => {
    // Find all users who are not already admins
    const users = await User.find({ role: 'user' }).select('name email');
    res.json(users);
};

// NEW: Get detailed stats for a single station
export const getStationDetails = async (req, res) => {
    try {
        const stationId = req.params.id;
        const station = await Station.findById(stationId);
        if (!station) return res.status(404).json({ message: 'Station not found' });

        // Find the assigned station master
        const master = await User.findOne({ station: stationId, role: 'station-master' }).select('name email');
        
        // Find vehicles at this station
        const vehicles = await Vehicle.find({ station: stationId });
        const availableVehicles = vehicles.filter(v => v.status === 'available').length;

        // Find bookings for this station
        const bookings = await Booking.find({ station: stationId });
        const activeRides = bookings.filter(b => b.status === 'active').length;
        const totalRevenue = bookings.filter(b => b.status === 'completed').reduce((acc, booking) => acc + booking.totalCost, 0);

        res.json({
            station,
            stats: {
                stationMaster: master,
                totalVehicles: vehicles.length,
                availableVehicles,
                totalBookings: bookings.length,
                activeRides,
                totalRevenue: totalRevenue.toFixed(2),
            }
        });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

export const getAllUsersAndMasters = async (req, res) => {
    // Find all users who are not super-admins, and populate their station details if they are a master
    const users = await User.find({ role: { $ne: 'super-admin' } }).populate('station', 'name').select('name email role station');
    res.json(users);
};

export const assignStationMaster = async (req,res) => {
    const {stationId} =req.body;
    const user= await User.findById(req.params.userId);
    if(user && stationId) {
        user.role = 'station-master';
        user.station = stationId;
        await user.save();
        res.json({message: 'User promoted to Station Master'});
    }
    else{
        res.status(404).json({message: 'User or station not found'});
    }
}

export const removeStationMaster = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (user && user.role === 'station-master') {
            user.role = 'user';
            user.station = undefined; // Unassign from station
            await user.save();
            res.json({ message: 'Station Master demoted successfully' });
        } else {
            res.status(400).json({ message: 'User is not a Station Master' });
        }
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// ... (imports: User, Station)

// NEW function to get data specifically for the assignment UI
export const getAssignmentData = async (req, res) => {
    try {
        // 1. Find all stations that are ALREADY assigned to a master
        const assignedStationIds = await User.find({ role: 'station-master' }).distinct('station');

        // 2. Find all stations that are NOT in the assigned list
        const availableStations = await Station.find({ _id: { $nin: assignedStationIds } });

        const allUsers = await User.find({ role: { $ne: 'super-admin' } })
            .populate('station', 'name')
            // Ensure we select ALL necessary fields for EVERY user.
            .select('name email role station');
        // ------------------------------------

        res.json({
            users: allUsers, // Send the complete and correct list
            availableStations,
        });

    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

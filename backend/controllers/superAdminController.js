import Booking from "../models/Booking.js";
import Station from "../models/Station.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";

export const createStation = async (req,res) => {
    try{
        const {name,location} = req.body;
        if (!name || !location) return res.status(400).json({ message: 'Name and location are required' });

        const stationExists=await Station.findOne({name});
        if(stationExists){
            return res.status(400).json({message: 'A station with this name already exists.'})
        }
        const station = await Station.create({name,location});
        res.status(201).json(station);
    }
    catch(error){
        console.error("Error creating station:",error);
        res.status(500).json({message: "Server error"});
    }
};


export const getAllUsers = async (req, res) => {
    // Find all users who are not already admins
    const users = await User.find({ role: 'user' }).select('name email');
    res.json(users);
};

// NEW: Get detailed stats for a single station
export const getStationOverview = async (req, res) => {
    try {
        //Revenue calculation using aggregation
        const revenueData=await Booking.aggregate([
            //Filter for only completed bookings
            {$match: {status: 'completed'}},
            // Group by station and sum up the totalCost for each
            {
                $group: {
                    _id:'$station', // the field to group by (the station ID)
                    totalRevenue: { $sum: '$totalCost' }
                }
            }

        ]);

        //Convert the result into an easy-to-use map: {stationId: totalRevenue}
        const revenueMap = revenueData.reduce((acc,item) => {
            acc[item._id]=item.totalRevenue;
            return acc;
        },{});

        // 1. Get all stations
        const stations = await Station.find({}).lean(); // .lean() makes it faster
        
         // 2. Fetch all relevant data in parallel
        const [masters,vehicles,bookings] = await Promise.all([
            User.find({role: 'station-master'}).select('name station'),
            Vehicle.find({}).select('station status'),
            Booking.find({status: {$in: ['active','completed']}}).select('station status totalCost'),
        ]);
        
        // 3. Process the data into an easy-to-use map for quick lookups
        const statsMap={};
        stations.forEach(s=> {
            statsMap[s._id]={
                stationMaster: null,
                totalVehicles: 0,
                availableVehicles: 0,
                activeRides: 0,
                totalRevenue: 0,
            }
        });

        masters.forEach(m=> {
            if(statsMap[m.station]) statsMap[m.station].stationMaster=m;
        });
        vehicles.forEach(v=> {
            if(statsMap[v.station]){
                statsMap[v.station].totalVehicles++;
                if(v.status==='available') statsMap[v.station].availableVehicles++;
            }
        })

        bookings.forEach(b=> {
            if(statsMap[b.station]) {
                if(b.status==='active') statsMap[b.station].activeRides++;
                if(b.status==='completed') statsMap[b.station].totalRevenue+=b.totalCost;
            }
        });

        // 4. Combine the stations with their calculated stats
        const stationWithStats=stations.map(station=> ({
            ...station,
            stats: statsMap[station._id],
        }))

        res.json(stationWithStats);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

export const getStationDetails = async(req,res) => {
    try{
        const stationId=req.params.id;

        //1. Fetch the primary station document
        const station=await Station.findById(stationId);
        if(!station) {
            return res.status(404).json({message: 'Station not found'});
        }

        //2. Fetch all realted data for this station in parallel for efficiency
        const [master,vehicles,bookings] = await Promise.all([
            //Find the user who is a 'station-master' and assigned to this station
            User.findOne({station: stationId,role: 'station-master'}).select('name email'),

            //Find all vehicles belonging to this station
            Vehicle.find({station: stationId}),

            //Find all bookings related to this station
            Booking.find({station: stationId}).populate('user','name email').populate('vehicle','modelName'),
        ]);

        // 3. Calculate the statistics from the fetched data
        const availableVehicles=vehicles.filter(v=>v.status==='available').length;
        const activeRides=bookings.filter(b=>b.status==='active').length;
        const totalRevenue=bookings
            .filter(b=>b.status==='completed')
            .reduce((acc,booking)=>acc+booking.totalCost,0);

        //4. Assemble the final response object
        res.json({
            station,
            stats: {
                stationMaster: master, //This will be the user object or null if unassigned
                totalVehicles: vehicles.length,
                availableVehicles,
                activeRides,
                totalRevenue: totalRevenue.toFixed(2),
            },
            vehicles,
            bookings,
        })
    } catch(error) {
        console.error("Error in getStationDetails:",error);
        res.status(500).json({message: 'Server Error'});
    }
}

export const removeVehicleFromStation=async(req,res) => {
    try{
        await Vehicle.findByIdAndDelete(req.params.vehicleId);
        res.json({message:'Vehicle removed successfully'});
    } catch(error) {
        res.status(500).json({message:'Server error'});
    }
}

export const updateStation = async(req,res) => {
    try{
        const {name,location} = req.body;
        const stationId = req.params.id;

        if(!name || !location) {
            return res.status(400).json({message: 'Name and location are required'});
        }

        const station=await Station.findById(stationId);

        if(!station) {
            return res.status(404).json({message:'Station not found'});
        }

        //Check if the new name is already taken by another station
        const duplicate=await Station.findOne({name,_id:{$ne: stationId}});
        if(duplicate){
            return res.status(400).json({message:'Another station with this name already exists.'});
        }

        station.name=name;
        station.location=location;

        const updatedStation=await station.save();
        res.json(updatedStation);
    } catch(error){
        console.error("Enter updating station:",error);
        res.status(500).json({message:"Server error"});
    }
}

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

        // Emit notification
        const io=req.io;
        //The user ID of the person being promoted
        const targetUserId=user._id.toString();
        //Send a 'role_changed' event to their specific room
        io.to(targetUserId).emit('role_changed',{
            message: 'Your role has been updated to Station Master. Please re-login to access your dashboard.',
            newRole: 'station-master'
        })
        res.json({message: 'User promoted to successfully'});
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

            const io=req.io;
            const targetUserId=user._id.toString();
            io.to(targetUserId).emit('role_changed',{
                message: 'Your Station Master role has been revoked. You now have standard user access.',
                newRole: 'user'
            })
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

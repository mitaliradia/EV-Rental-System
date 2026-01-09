import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import Station from '../models/Station.js';

const getStationFilter = (user) => {
    return user.role === 'super-admin' ? {} : { station: user.station };
};

// export const getKycRequests = async (req, res) => {
//     const stationFilter = getStationFilter(req.user);
//     const users = await User.find({ ...stationFilter, 'kyc.status': 'pending' }).select('-password');
//     res.json(users);
// };

// export const updateKycStatus = async (req, res) => {
//     const { userId } = req.params;
//     const { status, reason } = req.body;
//     const user = await User.findById(userId);
//     if (user) {
//         user.kyc.status = status;
//         user.kyc.rejectionReason = status === 'rejected' ? reason : '';
//         await user.save();
//         res.json({ message: 'KYC status updated' });
//     } else {
//         res.status(404).json({ message: 'User not found' });
//     }
// };

export const getPendingBookings = async(req,res) => {
    const stationFilter = getStationFilter(req.user);
    const bookings = await Booking.find({ ...stationFilter, status: 'pending-approval' })
        .populate('user', 'name email')
        .populate('vehicle', 'modelName');
    res.json(bookings);
}

export const updateBookingStatus = async (req, res) => {
    try{
    const booking = await Booking.findById(req.params.id);
    if(!booking){
        return res.status(404).json({message:'Booking not found'});
    }
    const newStatus=req.body.status;

    //A master can cancel almost any ride.
    if(newStatus==='cancelled'){
        // Check if the ride isn't already finished
        if(booking.status==='completed'){
            return res.status(400).json({message:'Cannot cancel a completed ride'});
        }
        booking.status='cancelled';
        //Free up the vehicle
        await Vehicle.findByIdAndUpdate(booking.vehicle,{status:'available',availableAfter: null});
    }
    // Only a 'confirmed' booking can become 'active'
    else if(newStatus==='active' && booking.status==='confirmed'){
        booking.status='active';
    }
    // Only an 'active' booking can become 'completed'
    else if(newStatus==='completed' && booking.status==='active'){
        booking.status='completed';

        // Free up the vehicle
        await Vehicle.findByIdAndUpdate(booking.vehicle,{status: 'available',availableAfter:null});
    }
    else if(newStatus==='confirmed' && booking.status==='pending-confirmation'){
        booking.status='confirmed';
    }
    else{
        return res.status(400).json({message:`Invalid status transition from ${booking.status} to ${newStatus}`});
    }
    
   
    await booking.save();

    const io = req.io; // Get the io instance from the request
    const userId = booking.user.toString(); // Get the ID of the user who made the booking
    const stationId = booking.station.toString();

    //Emit an event to this user's specific room
    io.to(userId).emit('booking_update',{
        bookingId: booking._id,
        newStatus: booking.status,
        message: `Your booking status has been updated to ${booking.status}.`
    })

    //Notify all admins connected to this station's room 
    io.to(`station_${stationId}`).emit('dashboard_refresh',{
        message: `A booking was updated at your station. Please refresh.`
    });

    //Notify all connected super admins
    io.to('super_admin_room').emit('dashboard_refresh',{
        message: 'A booking was updated somewhere in the system.'
    });
    
    res.json({ message: `Booking status updated to ${newStatus}` });
    
    } catch(error){
        res.status(500).json({message:'Server Error'});
    }
};

export const addVehicleToStation = async (req, res) => {
    const { modelName, imageUrl, pricePerHour, stationId: stationFromRequest } = req.body;
    // Super-admin can specify a station, station-master is locked to their own.
    const station = req.user.role === 'super-admin' ? stationFromRequest : req.user.station;
    if (!station) return res.status(400).json({ message: 'Station ID is required' });

    const vehicle = await Vehicle.create({ modelName, imageUrl, pricePerHour, station });
    res.status(201).json(vehicle);
};

export const getDashboardData = async (req, res) => {
    try {
        const stationId = req.user.station;
        if (!stationId) return res.status(400).json({ message: 'User is not assigned to a station.' });

        // Fetch all data in parallel for speed
        const [
            station,
            vehicles,
            pendingBookings,
            confirmedBookings,
            activeRides
        ] = await Promise.all([
            Station.findById(stationId),
            Vehicle.find({ station: stationId }),
            Booking.find({ station: stationId, status: 'pending-confirmation' }).populate('user','name email').populate('vehicle','modelName'),
            Booking.find({station:stationId,status:'confirmed'}).populate('user','name email').populate('vehicle','modelName'),
            Booking.find({ station: stationId, status: 'active' }).populate('user','name email').populate('vehicle','modelName'),
        ]);

        if (!station) return res.status(404).json({ message: 'Assigned station not found.' });

        res.json({
            stationName: station.name,
            stats: {
                totalVehicles: vehicles?.length || 0,
                availableVehicles: vehicles?.filter(v => v.status === 'available').length || 0,
                pendingBookingsCount: pendingBookings?.length || 0,
                confirmedBookingsCount: confirmedBookings?.length ?? 0, 
                activeRidesCount: activeRides?.length || 0,
            },
            vehicles: vehicles || [], // Full list of vehicles at the station
            pendingBookings: pendingBookings || [], // Full list of pending bookings
            confirmedBookings: confirmedBookings ?? [],
            activeRides: activeRides || [], // Full list of active rides
        });

    } catch (error) {
        console.error("Dashboard data fetch error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
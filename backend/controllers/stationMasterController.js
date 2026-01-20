import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import Station from '../models/Station.js';
import User from '../models/User.js';
import { sendBookingConfirmationEmail } from './notificationController.js';

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
    const booking = await Booking.findById(req.params.id).populate('user vehicle station');
    if(!booking){
        return res.status(404).json({message:'Booking not found'});
    }
    const newStatus=req.body.status;
    const oldStatus = booking.status;

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
    // Only a 'confirmed' booking with completed payment can become 'active'
    else if(newStatus==='active' && booking.status==='confirmed'){
        // Check if payment is completed before allowing ride to start
        if(booking.paymentStatus !== 'completed'){
            return res.status(400).json({message:'Payment must be completed before starting the ride'});
        }
        booking.status='active';
        // Set vehicle status to 'in-use' when ride becomes active
        await Vehicle.findByIdAndUpdate(booking.vehicle, {status: 'in-use'});
    }
    // Only an 'active' booking can become 'completed'
    else if(newStatus==='completed' && booking.status==='active'){
        booking.status='completed';

        // Free up the vehicle
        await Vehicle.findByIdAndUpdate(booking.vehicle,{status: 'available',availableAfter:null});
    }
    else if(newStatus==='confirmed' && booking.status==='pending-confirmation'){
        booking.status='confirmed';
        // Set 15-minute payment deadline
        booking.paymentDeadline = new Date(Date.now() + 15 * 60 * 1000);
        // Keep vehicle as reserved when confirmed
        await Vehicle.findByIdAndUpdate(booking.vehicle, {status: 'reserved'});
        
        // Send confirmation email
        await sendBookingConfirmationEmail(booking, booking.user);
    }
    else{
        return res.status(400).json({message:`Invalid status transition from ${booking.status} to ${newStatus}`});
    }
    
   
    await booking.save();

    const io = req.io;
    const userId = booking.user._id.toString();
    const stationId = booking.station._id.toString();

    // Send single notification to user
    const getStatusMessage = (status, vehicleModel, paymentStatus) => {
        switch(status) {
            case 'confirmed': return `Your booking for ${vehicleModel} has been confirmed! Please complete payment within 15 minutes to secure your booking.`;
            case 'active': return `Your ride with ${vehicleModel} has started. Enjoy your trip!`;
            case 'completed': return `Your ride with ${vehicleModel} has been completed. Thank you for using our service!`;
            case 'cancelled': 
                if(paymentStatus === 'failed') {
                    return `Your booking for ${vehicleModel} was cancelled due to payment timeout.`;
                }
                return `Your booking for ${vehicleModel} has been cancelled.`;
            default: return `Your booking has been updated.`;
        }
    };

    io.to(userId).emit('notification', {
        title: newStatus === 'confirmed' ? 'Booking Confirmed - Payment Required' : 
               newStatus === 'active' ? 'Ride Started' :
               newStatus === 'completed' ? 'Ride Completed' : 'Booking Cancelled',
        message: getStatusMessage(newStatus, booking.vehicle?.modelName || 'vehicle', booking.paymentStatus),
        type: 'booking',
        priority: newStatus === 'confirmed' ? 'high' : 'medium'
    });

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
        console.error('Error updating booking status:', error);
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

        const now = new Date();
        
        // Fetch all data in parallel for speed with lean queries
        const [
            station,
            vehicles,
            pendingBookings,
            confirmedBookings,
            activeRides
        ] = await Promise.all([
            Station.findById(stationId).lean(),
            Vehicle.find({ station: stationId }).lean(),
            Booking.find({ station: stationId, status: 'pending-confirmation' })
                .populate('user','name email')
                .populate('vehicle','modelName')
                .lean(),
            Booking.find({station:stationId,status:'confirmed'})
                .populate('user','name email')
                .populate('vehicle','modelName')
                .lean(),
            Booking.find({ station: stationId, status: 'active' })
                .populate('user','name email')
                .populate('vehicle','modelName')
                .lean(),
        ]);

        if (!station) return res.status(404).json({ message: 'Assigned station not found.' });

        // Mark overdue rides
        const activeRidesWithOverdue = activeRides.map(ride => ({
            ...ride,
            isOverdue: new Date(ride.endTime) < now
        }));

        res.json({
            stationName: station.name,
            stats: {
                totalVehicles: vehicles?.length || 0,
                availableVehicles: vehicles?.filter(v => v.status === 'available').length || 0,
                pendingBookingsCount: pendingBookings?.length || 0,
                confirmedBookingsCount: confirmedBookings?.length ?? 0, 
                activeRidesCount: activeRides?.length || 0,
                overdueRidesCount: activeRidesWithOverdue.filter(r => r.isOverdue).length || 0
            },
            vehicles: vehicles || [],
            pendingBookings: pendingBookings || [],
            confirmedBookings: confirmedBookings ?? [],
            activeRides: activeRidesWithOverdue || [],
        });

    } catch (error) {
        console.error("Dashboard data fetch error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
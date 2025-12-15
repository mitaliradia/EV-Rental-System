import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Station from '../models/Station.js';

const getStationFilter = (user) => {
    return user.role === 'super-admin' ? {} : { station: user.station };
};

export const getKycRequests = async (req, res) => {
    const stationFilter = getStationFilter(req.user);
    const users = await User.find({ ...stationFilter, 'kyc.status': 'pending' }).select('-password');
    res.json(users);
};

export const updateKycStatus = async (req, res) => {
    const { userId } = req.params;
    const { status, reason } = req.body;
    const user = await User.findById(userId);
    if (user) {
        user.kyc.status = status;
        user.kyc.rejectionReason = status === 'rejected' ? reason : '';
        await user.save();
        res.json({ message: 'KYC status updated' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

export const getPendingBookings = async(req,res) => {
    const stationFilter = getStationFilter(req.user);
    const bookings = await Booking.find({ ...stationFilter, status: 'pending-approval' })
        .populate('user', 'name email')
        .populate('vehicle', 'modelName');
    res.json(bookings);
}

export const updateBookingStatus = async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
        booking.status = req.body.status;
        if (req.body.status === 'completed' || req.body.status === 'cancelled') {
            await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'available', availableAfter: null });
        }
        await booking.save();
        res.json({ message: 'Booking status updated' });
    } else {
        res.status(404).json({ message: 'Booking not found' });
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
            pendingKyc,
            pendingBookings,
            activeRides
        ] = await Promise.all([
            Station.findById(stationId),
            Vehicle.find({ station: stationId }),
            User.countDocuments({ station: stationId, 'kyc.status': 'pending' }),
            Booking.find({ station: stationId, status: 'pending-approval' }).populate('user vehicle'),
            Booking.find({ station: stationId, status: 'active' }).populate('user vehicle'),
        ]);

        if (!station) return res.status(404).json({ message: 'Assigned station not found.' });

        res.json({
            stationName: station.name,
            stats: {
                totalVehicles: vehicles.length,
                availableVehicles: vehicles.filter(v => v.status === 'available').length,
                pendingKycCount: pendingKyc,
                pendingBookingsCount: pendingBookings.length,
                activeRidesCount: activeRides.length,
            },
            vehicles, // Full list of vehicles at the station
            pendingBookings, // Full list of pending bookings
            activeRides, // Full list of active rides
        });

    } catch (error) {
        console.error("Dashboard data fetch error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';

const getStationId = (user) => user.role === 'super-admin' ? null : user.station;

export const getKycRequests = async (req, res) => {
    const stationId = getStationId(req.user);
    const query = {'kyc.status': 'pending'};
    if(stationId) query.station=stationId;
    const users = await User.find(query).select('-password');
    res.json(users);
};

export const updateKycStatus = async (req, res) => {
    const { userId } = req.params;
    const { status, reason } = req.body;
    try {
        const user = await User.findById(userId);
        if (user) {
            user.kyc.status = status;
            user.kyc.rejectionReason = status === 'rejected' ? reason : '';
            await user.save();
            res.status(200).json({ message: `User KYC has been ${status}` });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getPendingBookings = async(req,res) => {
    const stationId = getStationId(req.user);
    const query = {status: 'pending-approval'};
    if(stationId) query.station = stationId;
    const bookings=await Booking.find(query).populate('user','name').populate('vehicle','modelName');
    res.json(bookings);
}

export const updateBookingStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const booking = await Booking.findById(req.params.id);
        if (booking) {
            booking.status = status;
            if (status === 'cancelled' || status === 'completed') {
                await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'available' });
            }
            // If booking is confirmed, vehicle remains 'booked' until 'active' or 'completed'
            await booking.save();
            res.json({ message: 'Booking status updated' });
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        console.error('Error updating booking status:',error);
        res.status(500).json({ message: 'Server Error updating booking' });
    }
};

export const addVehicle = async (req, res) => {
    const { modelName, imageUrl, pricePerHour } = req.body;
    const stationId = req.user.role === 'super-admin' ? req.body.stationId : getStationId(req.user);
    if(!stationId) return res.status(400).json({message: 'Station is required'});
    const vehicle = await Vehicle.create({ modelName, imageUrl, pricePerHour,station: stationId });
    res.status(201).json(vehicle);
};
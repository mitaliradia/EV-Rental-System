import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';

export const createBooking = async (req, res) => {
    const { vehicleId, startTime, endTime, totalCost } = req.body;
    if (req.user.kyc.status !== 'approved') {
        return res.status(403).json({ message: 'KYC not approved. Cannot create booking.' });
    }
    try {
        const booking = new Booking({ user: req.user._id, vehicle: vehicleId, startTime, endTime, totalCost });
        const createdBooking = await booking.save();
        await Vehicle.findByIdAndUpdate(vehicleId, { status: 'booked' });
        res.status(201).json(createdBooking);
    } catch (error) {
        res.status(500).json({ message: 'Server Error creating booking' });
    }
};

export const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id }).populate('vehicle', 'modelName imageUrl');
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching bookings' });
    }
};



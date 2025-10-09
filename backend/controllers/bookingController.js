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

export const getPendingBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ status: 'pending-approval' }).populate('user', 'name email').populate('vehicle', 'modelName');
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching pending bookings' });
    }
};

export const updateBookingStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const booking = await Booking.findById(req.params.id);
        if (booking) {
            booking.status = status;
            if (status === 'cancelled' || status === 'completed') {
                await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'available' });
            }
            await booking.save();
            res.json({ message: 'Booking status updated' });
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error updating booking' });
    }
};
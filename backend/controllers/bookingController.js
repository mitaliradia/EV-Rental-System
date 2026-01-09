import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';

export const createBooking = async (req, res) => {
    
    try {
        const {vehicleId,stationId,startTime,endTime,totalCost}=req.body;
        if (!vehicleId || !stationId || !startTime || !endTime) {
            return res.status(400).json({ message: "Missing required booking details." });
        }

        const requestedStartTime = new Date(startTime);
        const requestedEndTime = new Date(endTime);
        // Before creating the new booking, check if this vehicle has any
        // conflicting bookings for the requested time slot.
        const conflictingBooking = await Booking.findOne({
            vehicle: vehicleId,
            status: { $ne: 'cancelled' }, // Ignore cancelled bookings
            $or: [
                { startTime: { $lt: requestedEndTime }, endTime: { $gt: requestedStartTime } }
            ]
        });

        if (conflictingBooking) {
            return res.status(409).json({ // 409 Conflict is a good status code for this
                message: 'Sorry, this vehicle is not available for the selected time slot. It may have just been booked by another user.' 
            });
        }
        const booking = await Booking.create({ user: req.user._id, vehicle: vehicleId,station: stationId, startTime: requestedStartTime, endTime: requestedEndTime, totalCost,status:'pending-confirmation' });
        res.status(201).json(booking);
    } catch (error) {
        console.error("--- ERROR IN createBookingRequest ---");
        console.error(error);
        console.error("------------------------------------");
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





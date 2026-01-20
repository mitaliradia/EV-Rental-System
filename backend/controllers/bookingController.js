import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';

export const createBooking = async (req, res) => {
    try {
        const {vehicleId,stationId,startTime,endTime,totalCost,emergencyContacts}=req.body;
        if (!vehicleId || !stationId || !startTime || !endTime) {
            return res.status(400).json({ message: "Missing required booking details." });
        }

        const requestedStartTime = new Date(startTime);
        const requestedEndTime = new Date(endTime);
        const now = new Date();
        
        // Real-world validations
        if (requestedStartTime < now) {
            return res.status(400).json({ message: "Cannot book in the past." });
        }
        
        // Minimum 30 minutes lead time
        const minLeadTime = new Date(now.getTime() + 30 * 60 * 1000);
        if (requestedStartTime < minLeadTime) {
            return res.status(400).json({ message: "Bookings must be made at least 30 minutes in advance." });
        }
        
        // Check duration limits (1 hour minimum, 7 days maximum)
        const durationHours = (requestedEndTime - requestedStartTime) / (1000 * 60 * 60);
        if (durationHours < 1) {
            return res.status(400).json({ message: "Minimum booking duration is 1 hour." });
        }
        if (durationHours > 168) { // 7 days
            return res.status(400).json({ message: "Maximum booking duration is 7 days." });
        }
        
        // Check station operating hours (6 AM to 11 PM)
        const startHour = requestedStartTime.getHours();
        const endHour = requestedEndTime.getHours();
        if (startHour < 6 || startHour > 23 || endHour < 6 || (endHour > 23 && requestedEndTime.getMinutes() > 0)) {
            return res.status(400).json({ message: "Station operates from 6 AM to 11 PM only." });
        }

        // Check if station has at least one master
        const stationMasterCount = await User.countDocuments({
            station: stationId,
            role: 'station-master'
        });
        
        if (stationMasterCount === 0) {
            return res.status(400).json({ 
                message: "This station is currently unmanaged and not accepting bookings." 
            });
        }
        
        const conflictingBooking = await Booking.findOne({
            vehicle: vehicleId,
            status: { $ne: 'cancelled' },
            $or: [
                { startTime: { $lt: requestedEndTime }, endTime: { $gt: requestedStartTime } }
            ]
        });

        if (conflictingBooking) {
            return res.status(409).json({
                message: 'Sorry, this vehicle is not available for the selected time slot. It may have just been booked by another user.' 
            });
        }
        
        const booking = await Booking.create({ 
            user: req.user._id, 
            vehicle: vehicleId,
            station: stationId, 
            startTime: requestedStartTime, 
            endTime: requestedEndTime,
            originalEndTime: requestedEndTime,
            totalCost,
            status:'pending-confirmation',
            emergencyContacts: emergencyContacts || []
        });
        
        // Update vehicle status to reserved
        await Vehicle.findByIdAndUpdate(vehicleId, { status: 'reserved' });
        
        // Notify station master dashboard to refresh
        const io = req.io;
        if (io) {
            io.to(`station_${stationId}`).emit('dashboard_refresh', {
                message: 'New booking request received'
            });
            
            // Schedule reminder 1 hour before ride
            const reminderTime = new Date(requestedStartTime.getTime() - 60 * 60 * 1000);
            if (reminderTime > new Date()) {
                setTimeout(() => {
                    io.to(req.user._id.toString()).emit('booking_reminder', {
                        message: 'Your ride starts in 1 hour!',
                        booking: booking._id
                    });
                }, reminderTime.getTime() - Date.now());
            }
        }
        
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

export const getVehicleAvailability = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        
        // Get all non-cancelled bookings for this vehicle
        const bookings = await Booking.find({
            vehicle: vehicleId,
            status: { $in: ['pending-confirmation', 'confirmed', 'active'] }
        }).select('startTime endTime');
        
        // Return the booked time slots
        const bookedSlots = bookings.map(booking => ({
            start: booking.startTime,
            end: booking.endTime
        }));
        
        res.json({ bookedSlots });
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching availability' });
    }
};

export const modifyBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { newEndTime, type } = req.body; // type: 'extend' or 'shorten'
        
        const booking = await Booking.findById(bookingId).populate('vehicle');
        if (!booking || booking.user.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        if (!['pending-confirmation', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({ message: 'Cannot modify active or completed bookings' });
        }
        
        const newEnd = new Date(newEndTime);
        const oldEnd = booking.endTime;
        
        // Check if new time slot is available
        const conflictingBooking = await Booking.findOne({
            vehicle: booking.vehicle._id,
            _id: { $ne: bookingId },
            status: { $ne: 'cancelled' },
            $or: [
                { startTime: { $lt: newEnd }, endTime: { $gt: booking.startTime } }
            ]
        });
        
        if (conflictingBooking) {
            return res.status(409).json({ message: 'Time slot not available for modification' });
        }
        
        // Calculate cost difference
        const oldDuration = (oldEnd - booking.startTime) / (1000 * 60 * 60);
        const newDuration = (newEnd - booking.startTime) / (1000 * 60 * 60);
        const additionalCost = (newDuration - oldDuration) * booking.vehicle.pricePerHour;
        
        // Update booking
        booking.endTime = newEnd;
        booking.totalCost += additionalCost;
        booking.modifications.push({
            type,
            oldEndTime: oldEnd,
            newEndTime: newEnd,
            additionalCost
        });
        
        await booking.save();
        res.json({ message: 'Booking modified successfully', additionalCost });
    } catch (error) {
        res.status(500).json({ message: 'Server Error modifying booking' });
    }
};

export const getUserAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const bookings = await Booking.find({ user: userId }).populate('vehicle');
        
        const totalBookings = bookings.length;
        const totalSpent = bookings.reduce((sum, booking) => sum + (booking.totalCost || 0), 0);
        const totalHours = bookings.reduce((sum, booking) => {
            const duration = (new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60);
            return sum + duration;
        }, 0);
        
        const vehicleCount = {};
        bookings.forEach(booking => {
            const vehicleId = booking.vehicle._id.toString();
            vehicleCount[vehicleId] = (vehicleCount[vehicleId] || 0) + 1;
        });
        
        const topVehicles = Object.entries(vehicleCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([vehicleId, count]) => {
                const booking = bookings.find(b => b.vehicle._id.toString() === vehicleId);
                return {
                    _id: vehicleId,
                    modelName: booking.vehicle.modelName,
                    bookingCount: count
                };
            });
        
        const monthlySpending = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            
            const monthBookings = bookings.filter(booking => {
                const bookingDate = new Date(booking.createdAt);
                return bookingDate >= monthStart && bookingDate <= monthEnd;
            });
            
            const monthAmount = monthBookings.reduce((sum, booking) => sum + (booking.totalCost || 0), 0);
            
            monthlySpending.push({
                month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                amount: monthAmount
            });
        }
        
        res.json({
            totalBookings,
            totalSpent,
            totalHours: Math.round(totalHours),
            avgRating: 4.2,
            topVehicles,
            monthlySpending
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching analytics' });
    }
};





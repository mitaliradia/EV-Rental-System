import cron from 'node-cron';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';

export const startPaymentTimeoutJob = () => {
    // Run every minute to check for expired payments
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            
            // Find confirmed bookings with expired payment deadlines
            const expiredBookings = await Booking.find({
                status: 'confirmed',
                paymentStatus: 'pending',
                paymentDeadline: { $lt: now }
            }).populate('vehicle');

            for (const booking of expiredBookings) {
                // Cancel the booking
                booking.status = 'cancelled';
                booking.paymentStatus = 'failed';
                await booking.save();

                // Free up the vehicle
                await Vehicle.findByIdAndUpdate(booking.vehicle._id, {
                    status: 'available',
                    availableAfter: null
                });

                // Notify user via socket if connected
                if (global.io) {
                    global.io.to(booking.user.toString()).emit('notification', {
                        title: 'Booking Cancelled',
                        message: 'Your booking was cancelled due to payment timeout (15 minutes).',
                        type: 'booking',
                        priority: 'high'
                    });
                }

                console.log(`Auto-cancelled booking ${booking._id} due to payment timeout`);
            }
        } catch (error) {
            console.error('Payment timeout job error:', error);
        }
    });

    console.log('Payment timeout job started - checking every minute');
};
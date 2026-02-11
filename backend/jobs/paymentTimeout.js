import cron from 'node-cron';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';

export const startPaymentTimeoutJob = () => {
    // Run every minute to check for expired payments and send reminders
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const reminderTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes before expiry
            
            // Send payment reminders (5 minutes before expiry)
            const expiringBookings = await Booking.find({
                status: 'confirmed',
                paymentStatus: 'pending',
                paymentDeadline: { $gte: now, $lte: reminderTime },
                paymentReminderSent: { $ne: true }
            }).populate('vehicle user');
            
            for (const booking of expiringBookings) {
                if (global.io) {
                    global.io.to(booking.user._id.toString()).emit('notification', {
                        title: 'Payment Reminder',
                        message: `Only 5 minutes left to complete payment for your ${booking.vehicle.modelName} booking!`,
                        type: 'payment',
                        priority: 'urgent'
                    });
                }
                
                // Mark reminder as sent
                booking.paymentReminderSent = true;
                await booking.save();
                
                console.log(`Sent payment reminder for booking ${booking._id}`);
            }
            
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
                    const timeAllowed = booking.paymentDeadline.getTime() - booking.updatedAt.getTime();
                    const timeText = timeAllowed > (60 * 60 * 1000) ? '2 hours' : '15 minutes';
                    
                    global.io.to(booking.user.toString()).emit('notification', {
                        title: 'Booking Cancelled',
                        message: `Your booking was cancelled due to payment timeout (${timeText}). Please book again and complete payment on time.`,
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
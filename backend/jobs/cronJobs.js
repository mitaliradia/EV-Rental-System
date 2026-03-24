import cron from 'node-cron';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import mongoose from 'mongoose';
import { createNotificationUtil } from '../controllers/notificationController.js';

export const startCronJobs = () => {
    // Check for stuck processing payments every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        if (mongoose.connection.readyState !== 1) {
            console.log('Skipping stuck payment job - MongoDB not connected');
            return;
        }
        
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            
            // Find payments stuck in processing for 5+ minutes
            const stuckPayments = await Booking.find({
                paymentStatus: 'processing',
                updatedAt: { $lt: fiveMinutesAgo }
            });
            
            for (const booking of stuckPayments) {
                console.log(`Found stuck payment for booking ${booking._id}`);

                // Keep payment in processing until Razorpay webhook confirms success/failure.
                // This avoids false failures when webhook delivery is delayed.
                if (global.io) {
                    global.io.to(booking.user.toString()).emit('notification', {
                        title: 'Payment Under Verification',
                        message: 'Your payment is still being verified. Your booking will update automatically once confirmed.',
                        type: 'payment',
                        priority: 'medium'
                    });
                }
            }
            
            console.log(`Processed ${stuckPayments.length} stuck payments`);
        } catch (error) {
            console.error('Error in stuck payment job:', error.message);
        }
    });

    // Check for unlinked payments every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
        if (mongoose.connection.readyState !== 1) {
            console.log('Skipping unlinked payment job - MongoDB not connected');
            return;
        }
        
        try {
            const unlinkedPayments = await Booking.find({
                paymentStatus: 'unlinked',
                failedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } // Failed 5+ min ago
            });
            
            for (const booking of unlinkedPayments) {
                console.log(`Processing unlinked payment for booking ${booking._id}`);
                // Refund will be handled by handleUnlinkedPayment in paymentController
            }
            
            console.log(`Processed ${unlinkedPayments.length} unlinked payments`);
        } catch (error) {
            console.error('Error in unlinked payment job:', error.message);
        }
    });

    // Check for unconfirmed bookings every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        // Skip if MongoDB is not connected
        if (mongoose.connection.readyState !== 1) {
            console.log('Skipping confirmation timeout job - MongoDB not connected');
            return;
        }
        
        try {
            const now = new Date();
            
            // Find bookings that passed confirmation deadline
            const unconfirmedBookings = await Booking.find({
                status: 'pending-confirmation',
                confirmationDeadline: { $lt: now }
            }).populate('user vehicle station');
            
            for (const booking of unconfirmedBookings) {
                // Cancel the booking
                booking.status = 'cancelled';
                await booking.save();
                
                // Free up the vehicle
                await Vehicle.findByIdAndUpdate(booking.vehicle._id, {
                    status: 'available',
                    availableAfter: null
                });
                
                // Notify user
                await createNotificationUtil(
                    booking.user._id,
                    'Booking Cancelled',
                    `Your booking was cancelled as it was not confirmed by the station within the time limit.`,
                    'booking',
                    'high',
                    {},
                    global.io
                );
                
                console.log(`Auto-cancelled unconfirmed booking ${booking._id}`);
            }
            
            console.log(`Processed ${unconfirmedBookings.length} unconfirmed bookings`);
        } catch (error) {
            if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
                console.error('MongoDB connection issue in confirmation timeout job - will retry next cycle');
            } else {
                console.error('Error in confirmation timeout job:', error.message);
            }
        }
    });

    // Issue #6: Overtime billing - Check every 5 minutes for overdue rides
    cron.schedule('*/5 * * * *', async () => {
        // Skip if MongoDB is not connected
        if (mongoose.connection.readyState !== 1) {
            console.log('Skipping overtime billing job - MongoDB not connected');
            return;
        }
        
        try {
            const now = new Date();
            
            // Find overdue active rides
            const overdueRides = await Booking.find({
                status: 'active',
                endTime: { $lt: now }
            }).populate('user vehicle station');
            
            for (const ride of overdueRides) {
                // Calculate overtime with grace period
                const gracePeriodMs = (ride.overtimeCharges?.gracePeriodMinutes || 15) * 60 * 1000;
                const endTimeWithGrace = new Date(ride.endTime.getTime() + gracePeriodMs);
                
                if (now > endTimeWithGrace) {
                    // Calculate overtime hours
                    const overtimeMs = now.getTime() - endTimeWithGrace.getTime();
                    const overtimeHours = Math.ceil(overtimeMs / (1000 * 60 * 60)); // Round up to nearest hour
                    
                    const overtimeRate = ride.overtimeCharges?.overtimeRate || ride.vehicle.pricePerHour * 1.5;
                    const overtimeCost = overtimeHours * overtimeRate;
                    const previousOvertimeHours = ride.overtimeCharges?.overtimeHours || 0;
                    const previousOvertimeCost = ride.overtimeCharges?.overtimeCost || 0;

                    // Recompute planned base cost each run so cron is idempotent after crashes/retries.
                    const plannedDurationHours = Math.max(
                        0,
                        (new Date(ride.endTime).getTime() - new Date(ride.startTime).getTime()) / (1000 * 60 * 60)
                    );
                    const oneWayFee = ride.oneWayFee || 0;
                    const plannedBaseCost = (plannedDurationHours * ride.vehicle.pricePerHour) + oneWayFee;
                    
                    // Update booking with overtime charges
                    ride.overtimeCharges.isOvertime = true;
                    ride.overtimeCharges.overtimeHours = overtimeHours;
                    ride.overtimeCharges.overtimeCost = overtimeCost;
                    ride.overtimeCharges.lastCalculatedAt = now;
                    ride.totalCost = plannedBaseCost + overtimeCost;
                    
                    await ride.save();

                    const overtimeChanged = previousOvertimeHours !== overtimeHours || previousOvertimeCost !== overtimeCost;
                    
                    // Notify station master
                    const stationMaster = await User.findOne({
                        station: ride.station._id,
                        role: 'station-master'
                    });
                    
                    if (stationMaster && overtimeChanged) {
                        await createNotificationUtil(
                            stationMaster._id,
                            'Overdue Ride - Overtime Charges Applied',
                            `${ride.user.name}'s ride with ${ride.vehicle.modelName} is ${overtimeHours}h overdue. ₹${overtimeCost} overtime charges applied. Please contact customer.`,
                            'reminder',
                            'high',
                            {},
                            global.io
                        );
                    }
                    
                    // Notify user about overtime charges
                    if (overtimeChanged) {
                        await createNotificationUtil(
                            ride.user._id,
                            'Overtime Charges Applied',
                            `Your ride is ${overtimeHours} hour(s) overdue. ₹${overtimeCost} overtime charges have been added. Please return the vehicle immediately to avoid further charges.`,
                            'reminder',
                            'urgent',
                            {},
                            global.io
                        );
                    }
                    
                    console.log(`Applied overtime charge of ₹${overtimeCost} to booking ${ride._id}`);
                } else {
                    // Still in grace period, just notify
                    const minutesLeft = Math.ceil((endTimeWithGrace.getTime() - now.getTime()) / (1000 * 60));
                    
                    await createNotificationUtil(
                        ride.user._id,
                        'Grace Period Warning',
                        `Your ride time has expired. You have ${minutesLeft} minutes grace period remaining. Please return the vehicle to avoid overtime charges.`,
                        'reminder',
                        'high',
                        {},
                        global.io
                    );
                }
            }
            
            console.log(`Processed ${overdueRides.length} overdue rides for overtime billing`);
        } catch (error) {
            if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
                console.error('⚠️ MongoDB connection issue in overtime billing job - will retry next cycle');
            } else {
                console.error('Error in overdue rides cron job:', error.message);
            }
        }
    });
    
    console.log('Cron jobs started');
};

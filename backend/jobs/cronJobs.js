import cron from 'node-cron';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { createNotificationUtil } from '../controllers/notificationController.js';

export const startCronJobs = () => {
    // Check for overdue rides every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            const now = new Date();
            
            // Find overdue active rides
            const overdueRides = await Booking.find({
                status: 'active',
                endTime: { $lt: now }
            }).populate('user vehicle station');
            
            for (const ride of overdueRides) {
                // Notify station master
                const stationMaster = await User.findOne({
                    station: ride.station._id,
                    role: 'station-master'
                });
                
                if (stationMaster) {
                    // Create notification for station master
                    await createNotificationUtil(
                        stationMaster._id,
                        'Overdue Ride Alert',
                        `${ride.user.name}'s ride with ${ride.vehicle.modelName} is overdue. Please contact the customer.`,
                        'reminder',
                        'high',
                        {},
                        global.io
                    );
                }
                
                // Notify user
                await createNotificationUtil(
                    ride.user._id,
                    'Ride Overdue',
                    `Your ride is overdue. Please return the vehicle to avoid additional charges.`,
                    'reminder',
                    'high',
                    {},
                    global.io
                );
            }
            
            console.log(`Checked ${overdueRides.length} overdue rides`);
        } catch (error) {
            console.error('Error in overdue rides cron job:', error);
        }
    });
    
    console.log('Cron jobs started');
};
import cron from 'node-cron';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';

// --- JOB 1: Expire unconfirmed booking requests ---
// This job runs every 5 minutes.
const expireUnconfirmedBookings=()=>{
    cron.schedule('*/5 * * * *',async()=>{
        console.log('Running job: Expire Unconfirmed Bookings...');

        // Find bookings that are 'pending-confirmation' and were created more than 15 minutes ago.
        const fifteenMinutesAgo=new Date(Date.now()-15*60*100);
        try{
            const expiredBookings=await Booking.find({
                status:'pending-confirmation',
                createdAt: {$lte:fifteenMinutesAgo}
            });

            if(expiredBookings.length>0){
                console.log(`Found ${expiredBookings.length} unconfirmed bookings to cancel.`);
                for(const booking of expiredBookings){
                    booking.status='cancelled';
                    await booking.save();

                    // Make the vehicle available again
                    await Vehicle.findByIdAndUpdate(booking.vehicle, {
                        status: 'available',
                        availableAfter: null
                    });
                } 
            }
        }catch(error){
            console.error('Error in expireUnconfirmedBookings job:', error);
        }
    })
}


//Function to start all cron jobs
export const startCronJobs=()=>{
    expireUnconfirmedBookings();
    console.log('Cron job for booking expirations have been started.');
}
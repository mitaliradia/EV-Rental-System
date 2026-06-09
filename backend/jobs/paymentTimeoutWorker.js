import { Worker } from 'bullmq';
import Redis from 'ioredis';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

/**
 * Starts the background worker for processing payment timeout jobs.
 * 
 * How it works:
 *  - When a booking is confirmed, a delayed BullMQ job is scheduled 
 *    to fire at the exact paymentDeadline.
 *  - This worker picks up the job at that exact moment.
 *  - It checks if payment is still pending → cancels booking + frees vehicle.
 *  - If payment was already completed → skips safely (idempotent).
 */
export const startPaymentTimeoutWorker = () => {
    let connection = null;

    try {
        connection = new Redis(REDIS_URL, {
            maxRetriesPerRequest: null,
            connectTimeout: 2000,
            retryStrategy: (times) => {
                if (times > 2) {
                    console.warn('⚠️ Redis connection failed for Payment Timeout Worker. Worker disabled.');
                    return null;
                }
                return 1000;
            }
        });

        connection.on('error', () => {
            // Errors handled by retryStrategy
        });

        connection.on('connect', () => {
            console.log('🚀 Payment Timeout Worker Redis connection established!');

            const worker = new Worker('paymentTimeout', async (job) => {
                const { bookingId } = job.data;
                console.log(`⏰ Payment Timeout Worker: Processing timeout for booking ${bookingId}`);

                // Re-fetch fresh booking state from DB
                const booking = await Booking.findById(bookingId).populate('vehicle');

                if (!booking) {
                    console.log(`Payment timeout job: Booking ${bookingId} not found. Skipping.`);
                    return;
                }

                // Idempotency check: if payment was already completed, do nothing
                if (booking.paymentStatus === 'completed') {
                    console.log(`✅ Payment timeout job: Booking ${bookingId} already paid. No action taken.`);
                    return;
                }

                // If booking is already cancelled for another reason, skip
                if (booking.status === 'cancelled') {
                    console.log(`Payment timeout job: Booking ${bookingId} already cancelled. Skipping.`);
                    return;
                }

                // Cancel the booking due to payment timeout
                booking.status = 'cancelled';
                booking.paymentStatus = 'failed';
                booking.failureReason = 'Payment timeout - user did not complete payment within the deadline.';
                booking.failedAt = new Date();
                await booking.save();

                // Free up the vehicle
                if (booking.vehicle) {
                    await Vehicle.findByIdAndUpdate(booking.vehicle._id, {
                        status: 'available',
                        availableAfter: null
                    });
                }

                // Notify user via Socket.IO if connected
                if (global.io) {
                    const timeAllowed = booking.paymentDeadline
                        ? booking.paymentDeadline.getTime() - booking.createdAt.getTime()
                        : null;
                    const timeText = timeAllowed && timeAllowed > 60 * 60 * 1000 ? '2 hours' : '30 minutes';

                    global.io.to(booking.user.toString()).emit('notification', {
                        title: 'Booking Cancelled - Payment Timeout',
                        message: `Your booking was automatically cancelled as payment was not completed within ${timeText}. Please book again.`,
                        type: 'booking',
                        priority: 'high'
                    });

                    // Notify station dashboard to refresh
                    if (booking.station) {
                        global.io.to(`station_${booking.station.toString()}`).emit('dashboard_refresh', {
                            message: `Booking ${bookingId} auto-cancelled due to payment timeout.`
                        });
                    }
                }

                console.log(`✅ Payment Timeout Worker: Booking ${bookingId} auto-cancelled due to payment timeout.`);

            }, {
                connection,
                concurrency: 5
            });

            worker.on('completed', (job) => {
                console.log(`✅ Payment timeout job completed: ${job.id}`);
            });

            worker.on('failed', (job, err) => {
                console.error(`❌ Payment timeout job failed: ${job?.id}. Error: ${err.message}`);
            });

            console.log('⏰ Payment Timeout Worker listening to "paymentTimeout" queue...');
        });

    } catch (error) {
        console.warn('⚠️ Failed to initialize Redis connection for Payment Timeout Worker.', error.message);
    }
};

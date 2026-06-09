import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { sendBookingConfirmationEmail } from '../controllers/notificationController.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let connection = null;
let emailQueue = null;
let useQueue = false;

// 1. Initialize BullMQ Queue if Redis is available
try {
    connection = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null, // BullMQ requires maxRetriesPerRequest: null
        connectTimeout: 2000, // Detect failure quickly
        retryStrategy: (times) => {
            if (times > 2) {
                console.warn('⚠️ BullMQ Redis connection failed. Decoupled job queue disabled. Falling back to inline synchronous tasks.');
                useQueue = false;
                return null; // Stop retrying
            }
            return 1000;
        }
    });

    connection.on('connect', () => {
        console.log('🚀 BullMQ Queue Redis connected successfully!');
        useQueue = true;
        
        // Define the queue
        emailQueue = new Queue('emails', { connection });
    });

    connection.on('error', (err) => {
        if (!useQueue) return;
        console.warn('⚠️ BullMQ Redis Error. Falling back to inline synchronous tasks.', err.message);
        useQueue = false;
    });

} catch (error) {
    console.warn('⚠️ Failed to initialize BullMQ connection. Falling back to inline synchronous tasks.', error.message);
    useQueue = false;
}

// 2. Exported Queue Service Methods
export const queueService = {
    /**
     * Add a booking confirmation email job to the queue
     * @param {object} booking - Booking details
     * @param {object} user - User details
     */
    addEmailJob: async (booking, user) => {
        if (useQueue && emailQueue) {
            try {
                // Add job to BullMQ queue. The backend worker will pick it up and process it.
                await emailQueue.add('booking-confirmation', { booking, user }, {
                    attempts: 3, // Retry up to 3 times if it fails (e.g. SMTP server rate limits)
                    backoff: {
                        type: 'exponential',
                        delay: 5000 // Retry after 5s, 10s, 20s...
                    }
                });
                console.log(`📥 Job Queued: Booking confirmation email for ${user.email} pushed to Redis Queue.`);
                return;
            } catch (err) {
                console.error('Failed to queue email job. Executing inline.', err.message);
                // Fallback: Send email synchronously inline
                await sendBookingConfirmationEmail(booking, user);
            }
        } else {
            console.log(`ℹ️ Queue Disabled: Sending booking confirmation email to ${user.email} inline synchronously.`);
            // Fallback: Send email synchronously inline
            await sendBookingConfirmationEmail(booking, user);
        }
    }
};

// Export raw connection for background worker use
export { connection };

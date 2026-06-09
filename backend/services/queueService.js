import { Queue, Job } from 'bullmq';
import Redis from 'ioredis';
import { sendBookingConfirmationEmail } from '../controllers/notificationController.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let connection = null;
let emailQueue = null;
let paymentTimeoutQueue = null;
let overtimeQueue = null;
let useQueue = false;

// 1. Initialize BullMQ Queue if Redis is available
try {
    connection = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null, // BullMQ requires maxRetriesPerRequest: null
        connectTimeout: 2000,
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

        // Define all queues on connection
        emailQueue = new Queue('emails', { connection });
        paymentTimeoutQueue = new Queue('paymentTimeout', { connection });
        overtimeQueue = new Queue('overtime', { connection });
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
     */
    addEmailJob: async (booking, user) => {
        if (useQueue && emailQueue) {
            try {
                await emailQueue.add('booking-confirmation', { booking, user }, {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 }
                });
                console.log(`📥 Job Queued: Booking confirmation email for ${user.email} pushed to Redis Queue.`);
                return;
            } catch (err) {
                console.error('Failed to queue email job. Executing inline.', err.message);
                await sendBookingConfirmationEmail(booking, user);
            }
        } else {
            console.log(`ℹ️ Queue Disabled: Sending booking confirmation email to ${user.email} inline synchronously.`);
            await sendBookingConfirmationEmail(booking, user);
        }
    },

    /**
     * Schedule a payment timeout job to fire at the exact paymentDeadline.
     * Uses a stable jobId so it can be cancelled later.
     * @param {string} bookingId
     * @param {Date} paymentDeadline
     */
    schedulePaymentTimeoutJob: async (bookingId, paymentDeadline) => {
        if (!useQueue || !paymentTimeoutQueue) {
            console.log(`ℹ️ Queue Disabled: Payment timeout for booking ${bookingId} handled by cron watchdog.`);
            return;
        }

        try {
            const delay = new Date(paymentDeadline).getTime() - Date.now();
            if (delay <= 0) {
                console.warn(`⚠️ Payment deadline for ${bookingId} is already in the past. Skipping job.`);
                return;
            }

            const jobId = `payment-timeout-${bookingId}`;

            // Remove existing job if it was previously scheduled (safety dedup)
            const existingJob = await paymentTimeoutQueue.getJob(jobId);
            if (existingJob) await existingJob.remove();

            await paymentTimeoutQueue.add(
                'payment-timeout',
                { bookingId: bookingId.toString() },
                {
                    jobId,
                    delay,
                    attempts: 3,
                    backoff: { type: 'fixed', delay: 10000 }
                }
            );

            const minutesUntilDeadline = Math.round(delay / 60000);
            console.log(`⏰ Payment timeout job scheduled for booking ${bookingId} in ${minutesUntilDeadline} minutes.`);
        } catch (err) {
            console.error(`Failed to schedule payment timeout job for ${bookingId}.`, err.message);
        }
    },

    /**
     * Cancel the payment timeout job for a booking (e.g. when payment succeeds).
     * @param {string} bookingId
     */
    cancelPaymentTimeoutJob: async (bookingId) => {
        if (!useQueue || !paymentTimeoutQueue) return;

        try {
            const jobId = `payment-timeout-${bookingId}`;
            const job = await paymentTimeoutQueue.getJob(jobId);
            if (job) {
                await job.remove();
                console.log(`✅ Payment timeout job cancelled for booking ${bookingId} (payment received).`);
            }
        } catch (err) {
            console.error(`Failed to cancel payment timeout job for ${bookingId}.`, err.message);
        }
    },

    /**
     * Schedule an overtime job to fire at the exact moment grace period ends.
     * @param {string} bookingId
     * @param {Date} endTime - The booking's scheduled end time
     * @param {number} gracePeriodMinutes - Grace period in minutes (default: 15)
     */
    scheduleOvertimeJob: async (bookingId, endTime, gracePeriodMinutes = 15) => {
        if (!useQueue || !overtimeQueue) {
            console.log(`ℹ️ Queue Disabled: Overtime for booking ${bookingId} handled by cron watchdog.`);
            return;
        }

        try {
            // Fire at endTime + gracePeriod (the first moment overtime officially starts)
            const fireAt = new Date(endTime).getTime() + (gracePeriodMinutes * 60 * 1000);
            const delay = Math.max(fireAt - Date.now(), 100); // minimum 100ms delay

            const jobId = `overtime-${bookingId}`;

            // Remove existing job (handles rescheduling on ride extension)
            const existingJob = await overtimeQueue.getJob(jobId);
            if (existingJob) await existingJob.remove();

            await overtimeQueue.add(
                'overtime-check',
                { bookingId: bookingId.toString() },
                {
                    jobId,
                    delay,
                    attempts: 3,
                    backoff: { type: 'fixed', delay: 10000 }
                }
            );

            const minutesUntilOvertime = Math.round(delay / 60000);
            console.log(`⏰ Overtime job scheduled for booking ${bookingId} in ${minutesUntilOvertime} minutes.`);
        } catch (err) {
            console.error(`Failed to schedule overtime job for ${bookingId}.`, err.message);
        }
    },

    /**
     * Cancel the overtime job for a booking (e.g. when ride is completed or cancelled).
     * @param {string} bookingId
     */
    cancelOvertimeJob: async (bookingId) => {
        if (!useQueue || !overtimeQueue) return;

        try {
            const jobId = `overtime-${bookingId}`;
            const job = await overtimeQueue.getJob(jobId);
            if (job) {
                await job.remove();
                console.log(`✅ Overtime job cancelled for booking ${bookingId} (ride ended).`);
            }
        } catch (err) {
            console.error(`Failed to cancel overtime job for ${bookingId}.`, err.message);
        }
    },

    /**
     * Internal: Re-schedule an overtime recheck job from the worker itself (hourly accumulation).
     * Uses a unique jobId so it doesn't conflict with the original cancellable job.
     * @param {string} bookingId
     * @param {string} uniqueJobId - A unique ID for this recheck job
     * @param {number} delayMs - Delay in milliseconds
     */
    scheduleOvertimeRecheckJob: async (bookingId, uniqueJobId, delayMs) => {
        if (!useQueue || !overtimeQueue) return;

        await overtimeQueue.add(
            'overtime-check',
            { bookingId: bookingId.toString() },
            {
                jobId: uniqueJobId,
                delay: delayMs,
                attempts: 2,
                backoff: { type: 'fixed', delay: 5000 }
            }
        );
    }
};

// Export raw connection for background worker use
export { connection };

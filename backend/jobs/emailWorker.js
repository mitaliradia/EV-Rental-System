import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { sendBookingConfirmationEmail } from '../controllers/notificationController.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

/**
 * Starts the background worker for processing email queue jobs.
 * This runs concurrently in the background.
 */
export const startEmailWorker = () => {
    let connection = null;
    
    try {
        // We initialize a separate Redis connection for the worker.
        // BullMQ requires that queues and workers use separate connections.
        connection = new Redis(REDIS_URL, {
            maxRetriesPerRequest: null, // Required by BullMQ: connection cannot block requests
            connectTimeout: 2000,
            retryStrategy: (times) => {
                if (times > 2) {
                    console.warn('⚠️ Redis connection failed for Email Worker. Background worker disabled.');
                    return null; // Stop retrying
                }
                return 1000;
            }
        });

        connection.on('error', (err) => {
            // Catch error silently since we handled retry exhaustion
        });

        connection.on('connect', () => {
            console.log('🚀 Email Worker Redis connection established!');
            
            // Define the Worker. It listens to the 'emails' queue.
            const worker = new Worker('emails', async (job) => {
                console.log(`👷 Background Worker: Processing job ${job.id} (Type: ${job.name})`);
                
                if (job.name === 'booking-confirmation') {
                    const { booking, user } = job.data;
                    
                    // Call the nodemailer utility directly
                    await sendBookingConfirmationEmail(booking, user);
                }
            }, {
                connection,
                concurrency: 2 // Concurrency controls how many jobs this worker can process in parallel on this core
            });

            worker.on('completed', (job) => {
                console.log(`✅ Job completed successfully: ${job.id}`);
            });

            worker.on('failed', (job, err) => {
                console.error(`❌ Job failed: ${job?.id}. Error: ${err.message}`);
            });

            console.log('👷 Email Worker listening to "emails" queue...');
        });

    } catch (error) {
        console.warn('⚠️ Failed to initialize Redis connection for Email Worker.', error.message);
    }
};

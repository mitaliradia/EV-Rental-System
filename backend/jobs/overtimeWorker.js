import { Worker } from 'bullmq';
import Redis from 'ioredis';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { queueService } from '../services/queueService.js';
import { createNotificationUtil } from '../controllers/notificationController.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

/**
 * Starts the background worker for processing overtime billing jobs.
 * 
 * How it works:
 *  - When a ride goes active, a delayed BullMQ job is scheduled 
 *    to fire exactly when (endTime + gracePeriod) elapses.
 *  - This worker fires at that exact moment and:
 *      1. Calculates the first overtime charge
 *      2. Updates the booking total cost
 *      3. Notifies the user and station master
 *      4. Re-schedules itself to run again in 1 hour if ride is still active
 *  - When ride is completed or cancelled, the job is cancelled via cancelOvertimeJob().
 */
export const startOvertimeWorker = () => {
    let connection = null;

    try {
        connection = new Redis(REDIS_URL, {
            maxRetriesPerRequest: null,
            connectTimeout: 2000,
            retryStrategy: (times) => {
                if (times > 2) {
                    console.warn('⚠️ Redis connection failed for Overtime Worker. Worker disabled.');
                    return null;
                }
                return 1000;
            }
        });

        connection.on('error', () => {
            // Errors handled by retryStrategy
        });

        connection.on('connect', () => {
            console.log('🚀 Overtime Worker Redis connection established!');

            const worker = new Worker('overtime', async (job) => {
                const { bookingId } = job.data;
                const now = new Date();
                console.log(`⏰ Overtime Worker: Checking booking ${bookingId} for overtime.`);

                // Re-fetch fresh booking state
                const booking = await Booking.findById(bookingId).populate('user vehicle station');

                if (!booking) {
                    console.log(`Overtime job: Booking ${bookingId} not found. Skipping.`);
                    return;
                }

                // If ride is no longer active (completed/cancelled) stop processing
                if (booking.status !== 'active') {
                    console.log(`✅ Overtime job: Booking ${bookingId} is no longer active (${booking.status}). No further checks.`);
                    return;
                }

                // Calculate how long the ride has been overdue
                const gracePeriodMs = (booking.overtimeCharges?.gracePeriodMinutes || 15) * 60 * 1000;
                const endTimeWithGrace = new Date(booking.endTime.getTime() + gracePeriodMs);

                if (now <= endTimeWithGrace) {
                    // Still within grace period (edge case: job fired slightly early)
                    console.log(`Overtime job: Booking ${bookingId} still in grace period. Skipping charges.`);
                    return;
                }

                // Calculate overtime duration
                const overtimeMs = now.getTime() - endTimeWithGrace.getTime();
                const overtimeHours = Math.ceil(overtimeMs / (1000 * 60 * 60)); // Round up to nearest hour

                const overtimeRate = booking.overtimeCharges?.overtimeRate ||
                    (booking.vehicle.pricePerHour * 1.5);
                const overtimeCost = overtimeHours * overtimeRate;

                const previousOvertimeHours = booking.overtimeCharges?.overtimeHours || 0;
                const previousOvertimeCost = booking.overtimeCharges?.overtimeCost || 0;

                // Recalculate base cost (idempotent - same formula every run)
                const plannedDurationHours = Math.max(
                    0,
                    (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60)
                );
                const plannedBaseCost = (plannedDurationHours * booking.vehicle.pricePerHour) + (booking.oneWayFee || 0);

                // Update overtime fields
                booking.overtimeCharges.isOvertime = true;
                booking.overtimeCharges.overtimeHours = overtimeHours;
                booking.overtimeCharges.overtimeCost = overtimeCost;
                booking.overtimeCharges.lastCalculatedAt = now;
                booking.totalCost = plannedBaseCost + overtimeCost;
                await booking.save();

                const overtimeChanged = previousOvertimeHours !== overtimeHours || previousOvertimeCost !== overtimeCost;

                if (overtimeChanged) {
                    // Notify the user
                    await createNotificationUtil(
                        booking.user._id,
                        'Overtime Charges Applied',
                        `Your ride is ${overtimeHours} hour(s) overdue. ₹${overtimeCost} overtime charges have been added. Please return the vehicle immediately to avoid further charges.`,
                        'reminder',
                        'urgent',
                        {},
                        global.io
                    );

                    // Notify station master
                    const stationMaster = await User.findOne({
                        station: booking.station._id,
                        role: 'station-master'
                    });

                    if (stationMaster) {
                        await createNotificationUtil(
                            stationMaster._id,
                            'Overdue Ride - Overtime Charges Applied',
                            `${booking.user.name}'s ride with ${booking.vehicle.modelName} is ${overtimeHours}h overdue. ₹${overtimeCost} overtime charges applied.`,
                            'reminder',
                            'high',
                            {},
                            global.io
                        );
                    }

                    console.log(`✅ Overtime Worker: Applied ₹${overtimeCost} overtime charge to booking ${bookingId}.`);
                }

                // Re-schedule itself to run again in 1 hour to accumulate further overtime
                // We use a fresh job (not the same jobId) so cancelling the original has no effect here.
                // Ongoing re-check jobs are cancelled by checking booking.status === 'active' at the top.
                try {
                    const ONE_HOUR_MS = 60 * 60 * 1000;
                    const nextJobId = `overtime-${bookingId}-rechk-${Date.now()}`;
                    await queueService.scheduleOvertimeRecheckJob(bookingId, nextJobId, ONE_HOUR_MS);
                    console.log(`🔁 Overtime Worker: Re-check scheduled in 1 hour for booking ${bookingId}.`);
                } catch (rescheduleErr) {
                    console.warn(`⚠️ Could not re-schedule overtime check for ${bookingId}.`, rescheduleErr.message);
                }

            }, {
                connection,
                concurrency: 5
            });

            worker.on('completed', (job) => {
                console.log(`✅ Overtime job completed: ${job.id}`);
            });

            worker.on('failed', (job, err) => {
                console.error(`❌ Overtime job failed: ${job?.id}. Error: ${err.message}`);
            });

            console.log('⏰ Overtime Worker listening to "overtime" queue...');
        });

    } catch (error) {
        console.warn('⚠️ Failed to initialize Redis connection for Overtime Worker.', error.message);
    }
};

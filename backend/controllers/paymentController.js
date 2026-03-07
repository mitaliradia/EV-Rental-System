import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';

export const createPaymentOrder = async (req, res) => {
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        
        const { bookingId } = req.body;
        
        const booking = await Booking.findById(bookingId).populate('vehicle');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Calculate total including security deposit
        const totalAmount = booking.totalCost + (booking.securityDeposit?.amount || 0);

        const options = {
            amount: Math.round(totalAmount * 100), // Amount in paise
            currency: 'INR',
            receipt: `booking_${bookingId}`,
            notes: {
                bookingId: bookingId,
                userId: req.user._id.toString(),
                vehicleModel: booking.vehicle.modelName,
                bookingCost: booking.totalCost,
                securityDeposit: booking.securityDeposit?.amount || 0
            }
        };

        const order = await razorpay.orders.create(options);
        
        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Payment order creation failed:', error);
        res.status(500).json({ message: 'Payment order creation failed' });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment verified successfully
            const booking = await Booking.findById(bookingId);
            booking.paymentStatus = 'completed';
            booking.paymentId = razorpay_payment_id;
            booking.status = 'confirmed';
            
            // Update security deposit status
            if (booking.securityDeposit?.amount > 0) {
                booking.securityDeposit.status = 'held';
                booking.securityDeposit.heldAt = new Date();
                booking.securityDeposit.transactionId = razorpay_payment_id;
                // Schedule deposit release 24 hours after ride completion
                const estimatedReleaseTime = new Date(booking.endTime);
                estimatedReleaseTime.setHours(estimatedReleaseTime.getHours() + 24);
                booking.securityDeposit.releaseScheduledAt = estimatedReleaseTime;
            }
            
            await booking.save();
            
            // Award loyalty points (Issue #33)
            const user = await User.findById(booking.user);
            const pointsEarned = Math.floor(booking.totalCost / 100); // 1 point per 100 spent
            user.loyaltyPoints += pointsEarned;
            user.totalSpent += booking.totalCost;
            
            // Update loyalty tier based on total spent
            if (user.totalSpent >= 50000) {
                user.loyaltyTier = 'platinum';
            } else if (user.totalSpent >= 25000) {
                user.loyaltyTier = 'gold';
            } else if (user.totalSpent >= 10000) {
                user.loyaltyTier = 'silver';
            }
            
            await user.save();
            
            // Record loyalty transaction
            await LoyaltyTransaction.create({
                user: user._id,
                type: 'earned',
                points: pointsEarned,
                booking: bookingId,
                description: `Earned ${pointsEarned} points for booking`
            });

            res.json({ 
                message: 'Payment verified successfully', 
                success: true,
                loyaltyPoints: pointsEarned
            });
        } else {
            res.status(400).json({ message: 'Invalid payment signature', success: false });
        }
    } catch (error) {
        console.error('Payment verification failed:', error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
};

// Issue #9: Webhook handler for Razorpay payment events
export const handlePaymentWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const webhookSignature = req.headers['x-razorpay-signature'];
        
        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');
        
        if (webhookSignature !== expectedSignature) {
            console.error('Invalid webhook signature');
            return res.status(400).json({ message: 'Invalid signature' });
        }
        
        const event = req.body.event;
        const payload = req.body.payload.payment.entity;
        
        console.log(`Webhook received: ${event}`);
        
        // Handle different payment events
        switch (event) {
            case 'payment.captured':
                await handlePaymentCaptured(payload);
                break;
            case 'payment.failed':
                await handlePaymentFailed(payload);
                break;
            case 'refund.processed':
                await handleRefundProcessed(payload);
                break;
            default:
                console.log(`Unhandled event: ${event}`);
        }
        
        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};

async function handlePaymentCaptured(payment) {
    const bookingId = payment.notes?.bookingId;
    if (!bookingId) return;
    
    const booking = await Booking.findById(bookingId);
    if (booking && booking.paymentStatus !== 'completed') {
        booking.paymentStatus = 'completed';
        booking.paymentId = payment.id;
        booking.status = 'confirmed';
        
        if (booking.securityDeposit?.amount > 0) {
            booking.securityDeposit.status = 'held';
            booking.securityDeposit.heldAt = new Date();
            booking.securityDeposit.transactionId = payment.id;
        }
        
        await booking.save();
        console.log(`Payment captured for booking ${bookingId}`);
    }
}

async function handlePaymentFailed(payment) {
    const bookingId = payment.notes?.bookingId;
    if (!bookingId) return;
    
    const booking = await Booking.findById(bookingId);
    if (booking) {
        booking.paymentStatus = 'failed';
        await booking.save();
        console.log(`Payment failed for booking ${bookingId}`);
    }
}

async function handleRefundProcessed(refund) {
    // Update refund status to completed
    const booking = await Booking.findOne({ 'refund.refundId': refund.id });
    if (booking) {
        booking.refund.status = 'completed';
        await booking.save();
        console.log(`Refund completed for booking ${booking._id}`);
    }
}
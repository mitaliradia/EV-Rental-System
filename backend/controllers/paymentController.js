import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../models/Booking.js';

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

        const options = {
            amount: booking.totalCost * 100, // Amount in paise
            currency: 'INR',
            receipt: `booking_${bookingId}`,
            notes: {
                bookingId: bookingId,
                userId: req.user._id.toString(),
                vehicleModel: booking.vehicle.modelName
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
            await booking.save();

            res.json({ message: 'Payment verified successfully', success: true });
        } else {
            res.status(400).json({ message: 'Invalid payment signature', success: false });
        }
    } catch (error) {
        console.error('Payment verification failed:', error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
};
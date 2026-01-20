import mongoose from 'mongoose';
const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    originalEndTime: { type: Date }, // Track original booking time
    totalCost: { type: Number, required: true },
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    status: { type: String, enum: [ 'confirmed', 'active', 'completed', 'cancelled','pending-confirmation'], default: 'pending-confirmation' },
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paymentId: { type: String },
    paymentDeadline: { type: Date }, // 15 minutes after confirmation
    modifications: [{
        type: { type: String, enum: ['extend', 'shorten'] },
        oldEndTime: Date,
        newEndTime: Date,
        additionalCost: Number,
        timestamp: { type: Date, default: Date.now }
    }],
    emergencyContacts: [{
        name: String,
        phone: String,
        relation: String
    }]
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
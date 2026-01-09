import mongoose from 'mongoose';
const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    totalCost: { type: Number, required: true },
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    status: { type: String, enum: [ 'confirmed', 'active', 'completed', 'cancelled','pending-confirmation'], default: 'pending-confirmation' },
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
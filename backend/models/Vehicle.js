import mongoose from 'mongoose';
const vehicleSchema = new mongoose.Schema({
    modelName: { type: String, required: true },
    imageUrl: { type: String, required: true },
    station: { type: String, required: true, default: 'Main Station' },
    status: { type: String, enum: ['available', 'booked', 'maintenance'], default: 'available' },
    pricePerHour: { type: Number, required: true },
});
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
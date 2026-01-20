import mongoose from 'mongoose';
const vehicleSchema = new mongoose.Schema({
    modelName: { type: String, required: true },
    imageUrl: { type: String, required: true },
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    status: { type: String, enum: ['available', 'reserved', 'in-use', 'maintenance'], default: 'available' },
    pricePerHour: { type: Number, required: true },
    availableAfter: { type: Date, required: false },
});
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;